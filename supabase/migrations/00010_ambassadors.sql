-- ============================================================
-- 00010_ambassadors.sql
-- BodyStart — 2ᵉ type de code : « ambassadeur » (influenceurs / coachs).
--
-- Même mécanique que le parrainage (crédit cagnotte sur orders/paid, reprise
-- sur remboursement total, avoir PRODUIT-ONLY, idempotence par commande), mais :
--   * taux 10 % (vs 5 % parrain), configurable par ambassadeur (rate).
--   * code promo Shopify créé MANUELLEMENT par Adam (-10 %, non combinable) ;
--     pas de génération auto.
--   * bénéficiaire = un ambassadeur (nom + email), PAS un loyalty_customer
--     (qui est clé-téléphone). D'où des tables dédiées plutôt qu'un partage de
--     loyalty_customers (cf. rapport : mutualisation par PATTERN, pas par rows).
--
-- Réutilise à l'identique : la base de commission (subtotal_price après remise,
-- hors port/taxe), le pattern referral_rewards (1 ligne/commande, UNIQUE
-- order_id → idempotent + révocable), le grand livre append-only, la RLS
-- deny-par-défaut, et la nature produit-only de la cagnotte (dépensée via un
-- code de réduction Shopify, jamais en cash).
--
-- Règles cagnotte ambassadeur (spec) : min 10 € pour utiliser (vs 20 € parrain),
-- expiration après 12 mois d'INACTIVITÉ (crédit OU débit) — logique nouvelle
-- (le parrainage n'en a pas ; cf. rapport pour l'alignement éventuel).
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. TABLE ambassadors : mapping code Shopify → ambassadeur + cagnotte
-- ------------------------------------------------------------
create table if not exists public.ambassadors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,                      -- clé d'identité (lien dashboard via email du compte Shopify)
  shopify_discount_code text not null unique,      -- code -10 % créé manuellement dans Shopify (ex. COACHJULIE)
  rate numeric not null default 0.10               -- 10 % par défaut ; ajustable par ambassadeur
    check (rate > 0 and rate <= 1),
  balance_cents integer not null default 0
    check (balance_cents >= 0),                    -- 🔒 jamais négatif (défense en profondeur)
  active boolean not null default true,            -- coupe le crédit sans supprimer l'historique
  last_activity_at timestamptz not null default now(),  -- dernier crédit OU débit → base de l'expiration 12 mois
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ambassadors_code on public.ambassadors(lower(shopify_discount_code));
create index if not exists idx_ambassadors_email on public.ambassadors(lower(email));

comment on table public.ambassadors is
  'Ambassadeurs (influenceurs/coachs). 1 code promo Shopify -10% (créé manuellement) → 1 ambassadeur. rate = taux de cagnotte (10% par défaut). balance_cents = cagnotte produit-only. last_activity_at = base expiration 12 mois inactivité.';

-- ------------------------------------------------------------
-- 2. TABLE ambassador_commissions : 1 ligne / commande créditée
--    (miroir de referral_rewards — UNIQUE order_id → idempotent + révocable)
-- ------------------------------------------------------------
create table if not exists public.ambassador_commissions (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid not null references public.ambassadors(id) on delete restrict,
  shopify_order_id text not null unique,           -- idempotence : un order ne crédite qu'une fois
  order_subtotal_cents integer not null check (order_subtotal_cents >= 0), -- base éligible (= CA attribué, pour le dashboard)
  commission_cents integer not null check (commission_cents >= 0),
  is_new_customer boolean not null default false,  -- 1ʳᵉ commande payée de cet email → vraie acquisition
  buyer_email text,                                -- audit acquisition
  status text not null default 'credited' check (status in ('credited', 'revoked')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists idx_amb_commissions_ambassador on public.ambassador_commissions(ambassador_id, created_at desc);
create index if not exists idx_amb_commissions_status on public.ambassador_commissions(status);

comment on table public.ambassador_commissions is
  'Une ligne par commande ayant utilisé un code ambassadeur. UNIQUE(shopify_order_id) → idempotent. order_subtotal_cents = base éligible (CA attribué). is_new_customer = 1ʳᵉ commande payée de l''email. status revoked au remboursement total.';

-- ------------------------------------------------------------
-- 3. TABLE ambassador_transactions : grand livre cagnotte ambassadeur
--    (miroir de loyalty_transactions — amount_cents toujours positif)
-- ------------------------------------------------------------
create table if not exists public.ambassador_transactions (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid not null references public.ambassadors(id) on delete restrict,
  type text not null check (type in (
    'commission',  -- crédit sur commande via le code (+)
    'revoke',      -- reprise sur remboursement total (-)
    'spend',       -- utilisation de la cagnotte (produit-only) (-)
    'adjustment'   -- ajustement manuel / expiration (le signe est porté par le contexte)
  )),
  amount_cents integer not null check (amount_cents > 0),
  balance_after_cents integer not null check (balance_after_cents >= 0),
  shopify_order_id text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_amb_tx_ambassador on public.ambassador_transactions(ambassador_id, created_at desc);

comment on table public.ambassador_transactions is
  'Grand livre append-only de la cagnotte ambassadeur. amount_cents toujours positif (le type porte le signe).';

-- ------------------------------------------------------------
-- 4. updated_at trigger (réutilise public.set_updated_at de 00004)
-- ------------------------------------------------------------
drop trigger if exists ambassadors_set_updated_at on public.ambassadors;
create trigger ambassadors_set_updated_at
  before update on public.ambassadors
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 5. RLS deny-par-défaut + grants zéro pour anon/authenticated
-- ------------------------------------------------------------
alter table public.ambassadors             enable row level security;
alter table public.ambassador_commissions  enable row level security;
alter table public.ambassador_transactions enable row level security;
revoke all on public.ambassadors             from anon, authenticated;
revoke all on public.ambassador_commissions  from anon, authenticated;
revoke all on public.ambassador_transactions from anon, authenticated;

-- ------------------------------------------------------------
-- 6. credit_ambassador_commission — crédit 10 % sur orders/paid
--    Idempotent (UNIQUE order_id, claim-first contre les retries concurrents).
--    p_eligible_subtotal_cents = base APRÈS remise -10 %, hors port/taxe, et
--    déjà nette des lignes exclues (tag hors-ambassadeur) — calculée côté webhook.
-- ------------------------------------------------------------
create or replace function public.credit_ambassador_commission(
  p_shopify_order_id        text,
  p_discount_code           text,
  p_eligible_subtotal_cents integer,
  p_is_new_customer         boolean default false,
  p_buyer_email             text    default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amb              public.ambassadors%rowtype;
  v_commission_cents integer;
  v_claim_id         uuid;
  v_new_balance      integer;
  v_now              timestamptz := now();
begin
  if p_shopify_order_id is null then raise exception 'p_shopify_order_id required'; end if;
  if p_discount_code is null then raise exception 'p_discount_code required'; end if;
  if p_eligible_subtotal_cents is null or p_eligible_subtotal_cents < 0 then
    raise exception 'p_eligible_subtotal_cents must be >= 0';
  end if;

  -- 1. Le code correspond-il à un ambassadeur actif ? (match insensible à la casse)
  select * into v_amb from public.ambassadors
  where lower(shopify_discount_code) = lower(p_discount_code) and active
  for update;
  if not found then
    return jsonb_build_object('credited', false, 'reason', 'no_active_ambassador', 'code', p_discount_code);
  end if;

  v_commission_cents := floor(p_eligible_subtotal_cents * v_amb.rate)::integer;

  -- 2. Claim-first : l'INSERT (UNIQUE order_id) sérialise les retries concurrents.
  --    Si la ligne existe déjà → déjà traité, on ne crédite pas une 2e fois.
  insert into public.ambassador_commissions(
    ambassador_id, shopify_order_id, order_subtotal_cents, commission_cents, is_new_customer, buyer_email, status
  ) values (
    v_amb.id, p_shopify_order_id, p_eligible_subtotal_cents, v_commission_cents,
    coalesce(p_is_new_customer, false), p_buyer_email, 'credited'
  )
  on conflict (shopify_order_id) do nothing
  returning id into v_claim_id;

  if v_claim_id is null then
    return jsonb_build_object('credited', false, 'reason', 'idempotent_skip',
                              'order_ref', p_shopify_order_id, 'ambassador_id', v_amb.id);
  end if;

  -- 3. Créditer la cagnotte + ledger (si commission > 0)
  if v_commission_cents > 0 then
    update public.ambassadors
    set balance_cents = balance_cents + v_commission_cents, last_activity_at = v_now
    where id = v_amb.id
    returning balance_cents into v_new_balance;

    insert into public.ambassador_transactions(
      ambassador_id, type, amount_cents, balance_after_cents, shopify_order_id, notes
    ) values (
      v_amb.id, 'commission', v_commission_cents, v_new_balance, p_shopify_order_id,
      'Commission ' || round(v_amb.rate * 100) || '% sur commande via code ' || v_amb.shopify_discount_code
    );
  else
    v_new_balance := v_amb.balance_cents;
  end if;

  return jsonb_build_object(
    'credited', true,
    'order_ref', p_shopify_order_id,
    'ambassador_id', v_amb.id,
    'ambassador_name', v_amb.name,
    'rate', v_amb.rate,
    'eligible_subtotal_cents', p_eligible_subtotal_cents,
    'commission_cents', v_commission_cents,
    'is_new_customer', coalesce(p_is_new_customer, false),
    'new_balance_cents', v_new_balance
  );
end;
$$;

revoke execute on function public.credit_ambassador_commission(text, text, integer, boolean, text) from public, anon, authenticated;
grant execute on function public.credit_ambassador_commission(text, text, integer, boolean, text) to service_role;

-- ------------------------------------------------------------
-- 7. revoke_ambassador_commission — reprise au remboursement total
--    Idempotent. Plancher 0 (jamais de solde négatif). Miroir de
--    revoke_referral_reward.
-- ------------------------------------------------------------
create or replace function public.revoke_ambassador_commission(p_shopify_order_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comm        public.ambassador_commissions%rowtype;
  v_balance     integer;
  v_debit       integer;
  v_new_balance integer;
begin
  if p_shopify_order_id is null then raise exception 'p_shopify_order_id required'; end if;

  select * into v_comm from public.ambassador_commissions
  where shopify_order_id = p_shopify_order_id for update;
  if not found then
    return jsonb_build_object('revoked', false, 'reason', 'no_commission', 'order_ref', p_shopify_order_id);
  end if;
  if v_comm.status = 'revoked' then
    return jsonb_build_object('revoked', false, 'reason', 'already_revoked', 'order_ref', p_shopify_order_id);
  end if;

  select balance_cents into v_balance from public.ambassadors where id = v_comm.ambassador_id for update;
  v_debit := least(v_comm.commission_cents, greatest(v_balance, 0));
  v_new_balance := v_balance - v_debit;

  if v_debit > 0 then
    update public.ambassadors
    set balance_cents = v_new_balance, last_activity_at = now()
    where id = v_comm.ambassador_id;
    insert into public.ambassador_transactions(
      ambassador_id, type, amount_cents, balance_after_cents, shopify_order_id, notes
    ) values (
      v_comm.ambassador_id, 'revoke', v_debit, v_new_balance, p_shopify_order_id,
      'Reprise commission (remboursement total de la commande)'
    );
  end if;

  update public.ambassador_commissions set status = 'revoked', revoked_at = now() where id = v_comm.id;

  return jsonb_build_object(
    'revoked', true, 'order_ref', p_shopify_order_id,
    'debited_cents', v_debit, 'ambassador_id', v_comm.ambassador_id,
    'ambassador_new_balance_cents', v_new_balance
  );
end;
$$;

revoke execute on function public.revoke_ambassador_commission(text) from public, anon, authenticated;
grant execute on function public.revoke_ambassador_commission(text) to service_role;

-- ------------------------------------------------------------
-- 8. expire_ambassador_cagnottes — expiration 12 mois d'inactivité
--    Solde > 0 ET aucune activité (crédit/débit) depuis 12 mois → solde = 0,
--    ledger 'adjustment'. À lancer par cron (mensuel). Lazy : tant que non
--    lancé, le dashboard affiche déjà le statut « expirée » côté lecture.
-- ------------------------------------------------------------
create or replace function public.expire_ambassador_cagnottes(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row           public.ambassadors%rowtype;
  v_count         integer := 0;
  v_total_expired integer := 0;
begin
  for v_row in
    select * from public.ambassadors
    where balance_cents > 0 and last_activity_at < p_now - interval '12 months'
    for update
  loop
    insert into public.ambassador_transactions(
      ambassador_id, type, amount_cents, balance_after_cents, notes
    ) values (
      v_row.id, 'adjustment', v_row.balance_cents, 0,
      'Expiration cagnotte (12 mois sans activité)'
    );
    update public.ambassadors set balance_cents = 0 where id = v_row.id;
    v_count := v_count + 1;
    v_total_expired := v_total_expired + v_row.balance_cents;
  end loop;

  return jsonb_build_object('expired_count', v_count, 'expired_total_cents', v_total_expired);
end;
$$;

revoke execute on function public.expire_ambassador_cagnottes(timestamptz) from public, anon, authenticated;
grant execute on function public.expire_ambassador_cagnottes(timestamptz) to service_role;
