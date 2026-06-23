-- ============================================================
-- 00013_ambassador_redemptions.sql
-- BodyStart — DÉPENSE de la cagnotte ambassadeur (produit-only), calquée sur le
-- mécanisme de redemption fidélité (loyalty_redemptions) mais clé EMAIL.
--
-- Flux : réserver (code Shopify usage-unique AMB-XXXX, -montant fixe, min achat
-- 2× le montant = cap 50%, endsAt 1h) → débiter à l'usage réel (orders/paid) →
-- reprendre au remboursement/annulation. Le solde n'est JAMAIS débité à la
-- réservation (anti-fuite : non-utilisé → expire en 1h, solde intact).
--
-- Règles : min 10 € pour utiliser (AMBASSADOR_REDEEM_MIN_BALANCE_CENTS),
-- cap 50 % du panier (côté route + min-achat du code), idempotent par commande,
-- plancher anti-survente, reprise (spend_reversal) si commande annulée/remboursée.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Nouveau type de mouvement : 'spend_reversal' (re-crédit au remboursement)
-- ------------------------------------------------------------
alter table public.ambassador_transactions drop constraint if exists ambassador_transactions_type_check;
alter table public.ambassador_transactions add constraint ambassador_transactions_type_check
  check (type in (
    'commission',     -- crédit sur commande via le code (+)
    'revoke',         -- reprise commission au remboursement (-)
    'spend',          -- utilisation de la cagnotte (produit-only) (-)
    'spend_reversal', -- reprise d'une dépense (commande annulée/remboursée) (+)
    'adjustment'      -- ajustement manuel / expiration
  ));

-- ------------------------------------------------------------
-- 2. TABLE ambassador_redemptions : 1 réservation = 1 code Shopify usage-unique
--    (miroir de loyalty_redemptions, clé ambassadeur au lieu de customer phone)
-- ------------------------------------------------------------
create table if not exists public.ambassador_redemptions (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid not null references public.ambassadors(id) on delete restrict,
  amount_cents integer not null check (amount_cents > 0),       -- montant réservé (= remise du code)
  discount_code text not null unique,                            -- AMB-XXXX (usage unique côté Shopify)
  shopify_discount_node_id text,
  status text not null default 'reserved'
    check (status in ('reserved', 'applied', 'expired', 'reversed')),
  shopify_order_id text,                                         -- posé à l'application (débit)
  applied_amount_cents integer check (applied_amount_cents is null or applied_amount_cents >= 0), -- remise réellement appliquée (lue sur la commande)
  debited_cents integer check (debited_cents is null or debited_cents >= 0),                       -- montant réellement débité (base de reprise)
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  reversed_at timestamptz
);
create index if not exists idx_amb_redemptions_ambassador on public.ambassador_redemptions(ambassador_id, created_at desc);
create index if not exists idx_amb_redemptions_status on public.ambassador_redemptions(status);
create index if not exists idx_amb_redemptions_order on public.ambassador_redemptions(shopify_order_id);
create unique index if not exists idx_amb_redemptions_code_lower on public.ambassador_redemptions(lower(discount_code));

comment on table public.ambassador_redemptions is
  'Réservations de dépense de cagnotte ambassadeur. 1 code Shopify AMB-XXXX usage-unique. Solde débité à l''usage réel (orders/paid), jamais à la réservation. debited_cents = base de reprise au remboursement.';

-- ------------------------------------------------------------
-- 3. RLS deny-par-défaut (comme les autres tables ambassador_*)
-- ------------------------------------------------------------
alter table public.ambassador_redemptions enable row level security;
revoke all on public.ambassador_redemptions from anon, authenticated;

-- ------------------------------------------------------------
-- 4. spend_ambassador_cagnotte — débit à l'usage (orders/paid)
--    Idempotent : le code est UNIQUE → on le verrouille et on agit selon son
--    statut. Débit = min(montant appliqué sur la commande, montant réservé),
--    plafonné au solde (plancher 0). Le solde n'a pas été débité avant.
-- ------------------------------------------------------------
create or replace function public.spend_ambassador_cagnotte(
  p_shopify_order_id     text,
  p_discount_code        text,
  p_applied_amount_cents integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_red         public.ambassador_redemptions%rowtype;
  v_balance     integer;
  v_debit       integer;
  v_new_balance integer;
begin
  if p_shopify_order_id is null then raise exception 'p_shopify_order_id required'; end if;
  if p_discount_code is null then raise exception 'p_discount_code required'; end if;
  if p_applied_amount_cents is null or p_applied_amount_cents < 0 then
    raise exception 'p_applied_amount_cents must be >= 0';
  end if;

  -- Le code est UNIQUE : on verrouille la réservation correspondante.
  select * into v_red from public.ambassador_redemptions
  where lower(discount_code) = lower(p_discount_code) for update;
  if not found then
    return jsonb_build_object('spent', false, 'reason', 'no_redemption', 'code', p_discount_code);
  end if;

  -- Idempotence / états non réservables.
  if v_red.status = 'applied' then
    if v_red.shopify_order_id is not distinct from p_shopify_order_id then
      return jsonb_build_object('spent', false, 'reason', 'already_applied', 'order_ref', p_shopify_order_id);
    end if;
    return jsonb_build_object('spent', false, 'reason', 'code_already_used', 'order_ref', v_red.shopify_order_id);
  end if;
  if v_red.status <> 'reserved' then
    return jsonb_build_object('spent', false, 'reason', v_red.status); -- expired / reversed
  end if;

  -- Débit = montant réellement appliqué, plafonné au réservé, puis au solde (plancher 0).
  select balance_cents into v_balance from public.ambassadors where id = v_red.ambassador_id for update;
  v_debit := least(least(p_applied_amount_cents, v_red.amount_cents), greatest(v_balance, 0));
  v_new_balance := v_balance - v_debit;

  update public.ambassador_redemptions
  set status = 'applied', shopify_order_id = p_shopify_order_id,
      applied_amount_cents = p_applied_amount_cents, debited_cents = v_debit, applied_at = now()
  where id = v_red.id;

  if v_debit > 0 then
    update public.ambassadors
    set balance_cents = v_new_balance, last_activity_at = now()
    where id = v_red.ambassador_id;

    insert into public.ambassador_transactions(
      ambassador_id, type, amount_cents, balance_after_cents, shopify_order_id, notes
    ) values (
      v_red.ambassador_id, 'spend', v_debit, v_new_balance, p_shopify_order_id,
      'Utilisation cagnotte via code ' || v_red.discount_code
    );
  end if;

  return jsonb_build_object(
    'spent', true, 'order_ref', p_shopify_order_id, 'ambassador_id', v_red.ambassador_id,
    'reserved_cents', v_red.amount_cents, 'applied_cents', p_applied_amount_cents,
    'debited_cents', v_debit, 'new_balance_cents', v_new_balance
  );
end;
$$;

revoke execute on function public.spend_ambassador_cagnotte(text, text, integer) from public, anon, authenticated;
grant execute on function public.spend_ambassador_cagnotte(text, text, integer) to service_role;

-- ------------------------------------------------------------
-- 5. reverse_ambassador_spend — reprise au remboursement/annulation
--    Re-crédite EXACTEMENT le montant débité. Idempotent.
-- ------------------------------------------------------------
create or replace function public.reverse_ambassador_spend(p_shopify_order_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_red         public.ambassador_redemptions%rowtype;
  v_balance     integer;
  v_credit      integer;
  v_new_balance integer;
begin
  if p_shopify_order_id is null then raise exception 'p_shopify_order_id required'; end if;

  select * into v_red from public.ambassador_redemptions
  where shopify_order_id = p_shopify_order_id and status = 'applied' for update;
  if not found then
    return jsonb_build_object('reversed', false, 'reason', 'no_spend', 'order_ref', p_shopify_order_id);
  end if;

  v_credit := greatest(coalesce(v_red.debited_cents, 0), 0);

  update public.ambassador_redemptions
  set status = 'reversed', reversed_at = now()
  where id = v_red.id;

  if v_credit > 0 then
    select balance_cents into v_balance from public.ambassadors where id = v_red.ambassador_id for update;
    v_new_balance := v_balance + v_credit;
    update public.ambassadors
    set balance_cents = v_new_balance, last_activity_at = now()
    where id = v_red.ambassador_id;

    insert into public.ambassador_transactions(
      ambassador_id, type, amount_cents, balance_after_cents, shopify_order_id, notes
    ) values (
      v_red.ambassador_id, 'spend_reversal', v_credit, v_new_balance, p_shopify_order_id,
      'Reprise dépense (commande annulée/remboursée)'
    );
  end if;

  return jsonb_build_object(
    'reversed', true, 'order_ref', p_shopify_order_id, 'ambassador_id', v_red.ambassador_id,
    'recredited_cents', v_credit
  );
end;
$$;

revoke execute on function public.reverse_ambassador_spend(text) from public, anon, authenticated;
grant execute on function public.reverse_ambassador_spend(text) to service_role;
