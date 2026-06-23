-- ============================================================
-- 00012_ambassador_code_trim.sql
-- BodyStart — robustesse matching code ambassadeur.
--
-- Le match était déjà insensible à la CASSE (lower des deux côtés) et le code
-- de la commande est trimé par parseShopifyOrder. Manquait le TRIM du code
-- STOCKÉ côté ambassadeur (défense contre un espace parasite saisi à la main
-- dans Supabase). On normalise donc trim + casse des DEUX côtés, en cohérence
-- avec le webhook (route.ts : a.shopify_discount_code.trim().toLowerCase()).
--
-- Seul changement vs 00011 : la clause WHERE du lookup ambassadeur passe de
-- lower(...) à lower(btrim(...)). Tout le reste est identique (anti
-- auto-commission, claim-first idempotent, ledger, plancher 0).
-- ============================================================

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

  -- 1. Ambassadeur actif ? Match insensible à la casse ET aux espaces (trim).
  select * into v_amb from public.ambassadors
  where lower(btrim(shopify_discount_code)) = lower(btrim(p_discount_code)) and active
  for update;
  if not found then
    return jsonb_build_object('credited', false, 'reason', 'no_active_ambassador', 'code', p_discount_code);
  end if;

  -- 1bis. Anti auto-commission : acheteur == ambassadeur (même email) → pas de crédit.
  if p_buyer_email is not null
     and lower(btrim(p_buyer_email)) = lower(btrim(v_amb.email)) then
    return jsonb_build_object('credited', false, 'reason', 'self_purchase',
                              'order_ref', p_shopify_order_id, 'ambassador_id', v_amb.id);
  end if;

  v_commission_cents := floor(p_eligible_subtotal_cents * v_amb.rate)::integer;

  -- 2. Claim-first : INSERT (UNIQUE order_id) sérialise les retries concurrents.
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
