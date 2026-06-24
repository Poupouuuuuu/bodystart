-- ============================================================
-- 00015_ambassador_phone_selfmatch.sql
-- BodyStart — anti-triche : étendre le blocage self_purchase à email OU TÉLÉPHONE.
--
-- Faille : un ambassadeur crée un 2e compte (autre email) + commande avec son
-- propre code → l'email ne matche plus → il touche 10 % EN PLUS du -10 %.
-- Fix : on stocke (optionnellement) le téléphone de l'ambassadeur (E.164) et on
-- bloque aussi si le téléphone de la commande == celui de l'ambassadeur.
--
-- Téléphones comparés en E.164 (normalisés CÔTÉ APP avant stockage/appel —
-- create route + webhook via normalizeToE164/parseShopifyOrder). Pas de
-- normalisation en SQL (les deux côtés arrivent déjà en E.164).
--
-- No-regression : ambassadeur SANS téléphone (phone null) → condition tél jamais
-- vraie → comportement email-only inchangé.
-- ============================================================

alter table public.ambassadors add column if not exists phone text;
comment on column public.ambassadors.phone is
  'Téléphone E.164 (optionnel) de l''ambassadeur, pour l''anti auto-commission (match email OU tél). Normalisé côté app.';

-- Recréation de credit_ambassador_commission avec p_buyer_phone (drop l'ancienne
-- signature 00014 pour rester sur une seule fonction sans ambiguïté PostgREST).
drop function if exists public.credit_ambassador_commission(text, text, integer, boolean, text, text);

create or replace function public.credit_ambassador_commission(
  p_shopify_order_id        text,
  p_discount_code           text,
  p_eligible_subtotal_cents integer,
  p_is_new_customer         boolean default false,
  p_buyer_email             text    default null,
  p_shopify_order_name      text    default null,
  p_buyer_phone             text    default null
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

  -- 1. Ambassadeur actif ? Match code insensible casse + espaces.
  select * into v_amb from public.ambassadors
  where lower(btrim(shopify_discount_code)) = lower(btrim(p_discount_code)) and active
  for update;
  if not found then
    return jsonb_build_object('credited', false, 'reason', 'no_active_ambassador', 'code', p_discount_code);
  end if;

  -- 1bis. Anti auto-commission : acheteur == ambassadeur sur EMAIL **OU** TÉLÉPHONE.
  --       (Téléphones en E.164. phone null d'un côté → on ne matche pas dessus →
  --        ambassadeur sans tél = email-only, pas de régression.)
  if (p_buyer_email is not null and lower(btrim(p_buyer_email)) = lower(btrim(v_amb.email)))
     or (v_amb.phone is not null and p_buyer_phone is not null
         and btrim(p_buyer_phone) = btrim(v_amb.phone)) then
    return jsonb_build_object('credited', false, 'reason', 'self_purchase',
                              'order_ref', p_shopify_order_id, 'ambassador_id', v_amb.id);
  end if;

  v_commission_cents := floor(p_eligible_subtotal_cents * v_amb.rate)::integer;

  -- 2. Claim-first (UNIQUE order_id). Ligne créée même si commission = 0 (tracking 0 %).
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

  -- 3. Créditer la cagnotte + ledger uniquement si commission > 0.
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

revoke execute on function public.credit_ambassador_commission(text, text, integer, boolean, text, text, text) from public, anon, authenticated;
grant execute on function public.credit_ambassador_commission(text, text, integer, boolean, text, text, text) to service_role;
