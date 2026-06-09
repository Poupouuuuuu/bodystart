-- ============================================================
-- 00008_referral_lifetime.sql
-- BodyStart — Parrainage / affiliation À VIE (évolution Sprint L2).
--
-- Change le programme de parrainage existant :
--   AVANT : parrain 5% pendant 12 mois ; filleul -5€ dès 40€.
--   APRÈS : parrain 5% À VIE (aucune limite) ; filleul -10€ dès 60€
--           (le -10€/60€ est cote Shopify : src/lib/shopify/loyalty-discounts.ts).
--
-- Ajoute le modèle de données du spec :
--   * referrals        : lien permanent parrain↔filleul (1 parrain max / filleul).
--   * referral_rewards : 1 ligne par commande de filleul récompensée
--                        (UNIQUE shopify_order_id → idempotent + révocation refund).
--
-- Réutilise loyalty_customers (referral_code, referred_by_code, balance) et le
-- grand livre loyalty_transactions. Réécrit finalize_order_loyalty (même
-- signature) pour créditer à vie + écrire referral_rewards, et ajoute
-- revoke_referral_reward(order_id) pour les remboursements.
-- ============================================================

-- ------------------------------------------------------------
-- 1. loyalty_transactions : nouveau type 'referral_revoke' (débit refund)
-- ------------------------------------------------------------
alter table public.loyalty_transactions drop constraint if exists loyalty_transactions_type_check;
alter table public.loyalty_transactions add constraint loyalty_transactions_type_check
  check (type in (
    'referral_commission', -- crédit parrain sur achat filleul (+)
    'referral_revoke',     -- débit parrain si commande filleul remboursée (-)
    'spend',               -- utilisation cagnotte par le client (-)
    'adjustment',          -- ajustement manuel admin
    'import_credit'        -- crédit d'accueil import legacy (+)
  ));

-- ------------------------------------------------------------
-- 2. TABLE referrals : lien permanent parrain↔filleul
-- ------------------------------------------------------------
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  parrain_customer_id uuid not null references public.loyalty_customers(id) on delete restrict,
  filleul_customer_id uuid not null unique references public.loyalty_customers(id) on delete restrict, -- 1 parrain max / filleul
  code_used text not null,
  status text not null default 'active' check (status in ('active', 'blocked')),
  created_at timestamptz not null default now(),
  constraint referrals_no_self check (parrain_customer_id <> filleul_customer_id)
);
create index if not exists idx_referrals_parrain on public.referrals(parrain_customer_id);
create index if not exists idx_referrals_filleul on public.referrals(filleul_customer_id);

comment on table public.referrals is
  'Lien permanent parrain↔filleul (1 parrain max par filleul via UNIQUE filleul_customer_id). status=blocked coupe la commission manuellement (anti-abus).';

-- ------------------------------------------------------------
-- 3. TABLE referral_rewards : 1 ligne / commande filleul récompensée
-- ------------------------------------------------------------
create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals(id) on delete restrict,
  shopify_order_id text not null unique,          -- idempotence : un order ne crédite qu'une fois
  amount_cents integer not null check (amount_cents >= 0),
  status text not null default 'credited' check (status in ('credited', 'revoked')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists idx_referral_rewards_referral on public.referral_rewards(referral_id);
create index if not exists idx_referral_rewards_status on public.referral_rewards(status);

comment on table public.referral_rewards is
  'Une ligne par commande de filleul ayant crédité le parrain (5% à vie). UNIQUE(shopify_order_id) → idempotent. status revoked + revoked_at au remboursement.';

-- ------------------------------------------------------------
-- 4. RLS deny-par-défaut (comme les autres tables loyalty_*)
-- ------------------------------------------------------------
alter table public.referrals        enable row level security;
alter table public.referral_rewards enable row level security;
revoke all on public.referrals        from anon, authenticated;
revoke all on public.referral_rewards from anon, authenticated;

-- ------------------------------------------------------------
-- 5. Backfill : matérialise les liens existants (referred_by_code → referrals)
-- ------------------------------------------------------------
insert into public.referrals (parrain_customer_id, filleul_customer_id, code_used, status)
select p.id, f.id, f.referred_by_code, 'active'
from public.loyalty_customers f
join public.loyalty_customers p on p.referral_code = f.referred_by_code
where f.referred_by_code is not null
  and p.id <> f.id
on conflict (filleul_customer_id) do nothing;

-- ------------------------------------------------------------
-- 6. finalize_order_loyalty — réécriture (même signature) : commission À VIE
--    + écriture referral_rewards. Tout le reste (idempotence, spend, 1er achat)
--    est préservé à l'identique.
-- ------------------------------------------------------------
create or replace function public.finalize_order_loyalty(
  p_customer_id           uuid,
  p_order_ref             text,
  p_paid_items_cents      integer,
  p_spent_loyalty_cents   integer default 0,
  p_referred_by_code_used text    default null,
  p_channel               text    default 'online',
  p_staff_user_id         uuid    default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer            public.loyalty_customers%rowtype;
  v_parrain             public.loyalty_customers%rowtype;
  v_referral            public.referrals%rowtype;
  v_now                 timestamptz := now();
  v_commission_cents    integer := 0;
  v_is_first_purchase   boolean := false;
  v_new_balance         integer;
  v_parrain_new_balance integer;
  v_referrer_id         uuid    := null;
begin
  -- 0. Validation
  if p_customer_id is null then raise exception 'p_customer_id is required'; end if;
  if p_paid_items_cents is null or p_paid_items_cents < 0 then raise exception 'p_paid_items_cents must be >= 0'; end if;
  if p_spent_loyalty_cents is null or p_spent_loyalty_cents < 0 then raise exception 'p_spent_loyalty_cents must be >= 0'; end if;
  if p_channel not in ('online', 'in_store') then raise exception 'p_channel must be online or in_store'; end if;

  -- 1. Idempotence (online + order_ref)
  if p_channel = 'online' and p_order_ref is not null then
    if exists (select 1 from public.loyalty_processed_orders where shopify_order_id = p_order_ref) then
      return jsonb_build_object('idempotent_skip', true, 'order_ref', p_order_ref, 'customer_id', p_customer_id);
    end if;
    insert into public.loyalty_processed_orders(shopify_order_id, processed_at) values (p_order_ref, v_now);
  end if;

  -- 2. Lock customer
  select * into v_customer from public.loyalty_customers where id = p_customer_id for update;
  if not found then raise exception 'loyalty_customer not found: %', p_customer_id; end if;

  -- 3. Lier le code parrain (1ère commande seulement) + matérialiser referrals
  if v_customer.referred_by_code is null
     and p_referred_by_code_used is not null
     and not v_customer.has_first_purchase
  then
    if exists (
      select 1 from public.loyalty_customers
      where referral_code = p_referred_by_code_used and id <> p_customer_id
    ) then
      update public.loyalty_customers set referred_by_code = p_referred_by_code_used where id = p_customer_id;
      v_customer.referred_by_code := p_referred_by_code_used;
    end if;
  end if;

  -- 4. Spend cagnotte (anti double-spend)
  if p_spent_loyalty_cents > 0 then
    if v_customer.loyalty_balance_cents < p_spent_loyalty_cents then
      raise exception 'insufficient_balance: balance=% requested=%', v_customer.loyalty_balance_cents, p_spent_loyalty_cents;
    end if;
    v_new_balance := v_customer.loyalty_balance_cents - p_spent_loyalty_cents;
    update public.loyalty_customers set loyalty_balance_cents = v_new_balance where id = p_customer_id;
    insert into public.loyalty_transactions(
      customer_id, type, amount_cents, balance_after_cents, channel, shopify_order_id, staff_user_id, notes
    ) values (
      p_customer_id, 'spend', p_spent_loyalty_cents, v_new_balance, p_channel, p_order_ref, p_staff_user_id, 'Utilisation cagnotte sur commande'
    );
    v_customer.loyalty_balance_cents := v_new_balance;
  end if;

  -- 5. 1er achat : flag + first_purchase_at. À VIE → plus d'expiration de commission.
  if not v_customer.has_first_purchase then
    update public.loyalty_customers
    set has_first_purchase = true,
        first_purchase_at = v_now,
        referral_commission_until = null   -- à vie : aucune fenêtre
    where id = p_customer_id;
    v_is_first_purchase := true;
    v_customer.has_first_purchase := true;
    v_customer.first_purchase_at := v_now;
    v_customer.referral_commission_until := null;
  end if;

  -- 6. Commission parrain : 5% À VIE (plus de fenêtre 12 mois)
  if v_customer.referred_by_code is not null then
    select * into v_parrain from public.loyalty_customers
    where referral_code = v_customer.referred_by_code for update;

    if found and v_parrain.id <> p_customer_id then
      -- Matérialiser le lien permanent (idempotent : 1 parrain max / filleul)
      insert into public.referrals (parrain_customer_id, filleul_customer_id, code_used, status)
      values (v_parrain.id, p_customer_id, v_customer.referred_by_code, 'active')
      on conflict (filleul_customer_id) do nothing;

      select * into v_referral from public.referrals where filleul_customer_id = p_customer_id;

      -- Créditer seulement si le parrainage est actif (status 'blocked' = coupé)
      if found and v_referral.status = 'active' then
        v_commission_cents := floor(p_paid_items_cents * 0.05)::integer;

        if v_commission_cents > 0 then
          update public.loyalty_customers
          set loyalty_balance_cents = loyalty_balance_cents + v_commission_cents
          where id = v_parrain.id
          returning loyalty_balance_cents into v_parrain_new_balance;

          insert into public.loyalty_transactions(
            customer_id, type, amount_cents, balance_after_cents,
            channel, shopify_order_id, related_customer_id, staff_user_id, notes
          ) values (
            v_parrain.id, 'referral_commission', v_commission_cents, v_parrain_new_balance,
            p_channel, p_order_ref, p_customer_id, p_staff_user_id, 'Commission 5% a vie sur commande filleul'
          );

          -- Ledger par commande (à vie + base de révocation refund). Online a
          -- toujours un order_ref ; in_store sans ref → pas de ligne reward
          -- (commission déjà créditée ci-dessus).
          if p_order_ref is not null then
            insert into public.referral_rewards(referral_id, shopify_order_id, amount_cents, status)
            values (v_referral.id, p_order_ref, v_commission_cents, 'credited')
            on conflict (shopify_order_id) do nothing;
          end if;

          v_referrer_id := v_parrain.id;
        end if;
      end if;
    end if;
  end if;

  -- 7. Retour
  return jsonb_build_object(
    'customer_id', p_customer_id,
    'order_ref', p_order_ref,
    'channel', p_channel,
    'spent_cents', p_spent_loyalty_cents,
    'commission_to_referrer_cents', v_commission_cents,
    'referrer_id', v_referrer_id,
    'is_first_purchase', v_is_first_purchase,
    'new_balance_cents', v_customer.loyalty_balance_cents,
    'first_purchase_at', v_customer.first_purchase_at,
    'referral_commission_until', v_customer.referral_commission_until,
    'idempotent_skip', false
  );
end;
$$;

revoke execute on function public.finalize_order_loyalty(uuid, text, integer, integer, text, text, uuid) from public, anon, authenticated;
grant execute on function public.finalize_order_loyalty(uuid, text, integer, integer, text, text, uuid) to service_role;

-- ------------------------------------------------------------
-- 7. revoke_referral_reward — débit du parrain au remboursement (total)
--    Idempotent : ne révoque qu'une fois. Plancher 0 (jamais de solde négatif).
-- ------------------------------------------------------------
create or replace function public.revoke_referral_reward(p_shopify_order_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reward      public.referral_rewards%rowtype;
  v_referral    public.referrals%rowtype;
  v_balance     integer;
  v_debit       integer;
  v_new_balance integer;
begin
  if p_shopify_order_id is null then raise exception 'p_shopify_order_id required'; end if;

  select * into v_reward from public.referral_rewards
  where shopify_order_id = p_shopify_order_id for update;

  if not found then
    return jsonb_build_object('revoked', false, 'reason', 'no_reward', 'order_ref', p_shopify_order_id);
  end if;
  if v_reward.status = 'revoked' then
    return jsonb_build_object('revoked', false, 'reason', 'already_revoked', 'order_ref', p_shopify_order_id);
  end if;

  select * into v_referral from public.referrals where id = v_reward.referral_id;

  -- Débiter le parrain, plancher 0
  select loyalty_balance_cents into v_balance
  from public.loyalty_customers where id = v_referral.parrain_customer_id for update;

  v_debit := least(v_reward.amount_cents, greatest(v_balance, 0));
  v_new_balance := v_balance - v_debit;

  if v_debit > 0 then
    update public.loyalty_customers set loyalty_balance_cents = v_new_balance
    where id = v_referral.parrain_customer_id;
    insert into public.loyalty_transactions(
      customer_id, type, amount_cents, balance_after_cents,
      channel, shopify_order_id, related_customer_id, notes
    ) values (
      v_referral.parrain_customer_id, 'referral_revoke', v_debit, v_new_balance,
      'online', p_shopify_order_id, v_referral.filleul_customer_id,
      'Revocation commission (remboursement commande filleul)'
    );
  end if;

  update public.referral_rewards set status = 'revoked', revoked_at = now() where id = v_reward.id;

  return jsonb_build_object(
    'revoked', true, 'order_ref', p_shopify_order_id,
    'debited_cents', v_debit, 'parrain_id', v_referral.parrain_customer_id,
    'parrain_new_balance_cents', v_new_balance
  );
end;
$$;

revoke execute on function public.revoke_referral_reward(text) from public, anon, authenticated;
grant execute on function public.revoke_referral_reward(text) to service_role;
