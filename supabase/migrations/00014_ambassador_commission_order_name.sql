-- ============================================================
-- 00014_ambassador_commission_order_name.sql
-- BodyStart — reporting commande par commande (admin) : stocker le NOM de
-- commande Shopify (#1001) sur chaque ligne de commission, capté au webhook.
--
-- Ajoute la colonne shopify_order_name + un paramètre p_shopify_order_name à
-- credit_ambassador_commission (on DROP/CREATE la fonction pour rester sur une
-- seule signature et éviter toute ambiguïté de résolution PostgREST).
-- Tout le reste est identique à 00012 (anti auto-commission, btrim, claim-first
-- idempotent, plancher, enregistrement MÊME à rate 0 / commission 0).
-- ============================================================

-- Autoriser rate = 0 (entrées de SUIVI type BODYSTART15) : l'ancien check
-- imposait rate > 0. On passe à rate >= 0 (et toujours <= 1).
alter table public.ambassadors drop constraint if exists ambassadors_rate_check;
alter table public.ambassadors add constraint ambassadors_rate_check check (rate >= 0 and rate <= 1);

alter table public.ambassador_commissions add column if not exists shopify_order_name text;
comment on column public.ambassador_commissions.shopify_order_name is
  'Nom de commande Shopify (#1001), capté au webhook orders/paid pour le reporting admin.';

drop function if exists public.credit_ambassador_commission(text, text, integer, boolean, text);

create or replace function public.credit_ambassador_commission(
  p_shopify_order_id        text,
  p_discount_code           text,
  p_eligible_subtotal_cents integer,
  p_is_new_customer         boolean default false,
  p_buyer_email             text    default null,
  p_shopify_order_name      text    default null
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

  -- 1. Ambassadeur actif ? Match insensible casse + espaces.
  select * into v_amb from public.ambassadors
  where lower(btrim(shopify_discount_code)) = lower(btrim(p_discount_code)) and active
  for update;
  if not found then
    return jsonb_build_object('credited', false, 'reason', 'no_active_ambassador', 'code', p_discount_code);
  end if;

  -- 1bis. Anti auto-commission : acheteur == ambassadeur (même email) → pas de crédit.
  --       (Sans effet pour une entrée de SUIVI : son email marqueur n'est jamais
  --        un acheteur → toutes les commandes sont enregistrées.)
  if p_buyer_email is not null
     and lower(btrim(p_buyer_email)) = lower(btrim(v_amb.email)) then
    return jsonb_build_object('credited', false, 'reason', 'self_purchase',
                              'order_ref', p_shopify_order_id, 'ambassador_id', v_amb.id);
  end if;

  -- commission = floor(base * rate). À rate 0 → 0 (mais la ligne est QUAND MÊME
  -- enregistrée ci-dessous : c'est ce qui permet le tracking d'un code 0 %).
  v_commission_cents := floor(p_eligible_subtotal_cents * v_amb.rate)::integer;

  -- 2. Claim-first : INSERT (UNIQUE order_id) sérialise les retries. La ligne
  --    de commission est créée même si commission = 0 (tracking).
  insert into public.ambassador_commissions(
    ambassador_id, shopify_order_id, shopify_order_name, order_subtotal_cents,
    commission_cents, is_new_customer, buyer_email, status
  ) values (
    v_amb.id, p_shopify_order_id, p_shopify_order_name, p_eligible_subtotal_cents,
    v_commission_cents, coalesce(p_is_new_customer, false), p_buyer_email, 'credited'
  )
  on conflict (shopify_order_id) do nothing
  returning id into v_claim_id;

  if v_claim_id is null then
    return jsonb_build_object('credited', false, 'reason', 'idempotent_skip',
                              'order_ref', p_shopify_order_id, 'ambassador_id', v_amb.id);
  end if;

  -- 3. Créditer la cagnotte + ledger UNIQUEMENT si commission > 0 (rate 0 → on saute).
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

revoke execute on function public.credit_ambassador_commission(text, text, integer, boolean, text, text) from public, anon, authenticated;
grant execute on function public.credit_ambassador_commission(text, text, integer, boolean, text, text) to service_role;
