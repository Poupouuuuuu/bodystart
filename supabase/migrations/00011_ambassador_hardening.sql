-- ============================================================
-- 00011_ambassador_hardening.sql
-- BodyStart — durcissement du programme ambassadeur.
--
--   1) ANTI AUTO-COMMISSION : un ambassadeur qui commande avec SON PROPRE code
--      (même email que la fiche ambassadeur) ne touche PLUS la commission.
--      Sans ça : -10 % (remise du code) + 10 % (cagnotte) = 20 % de réduction
--      permanente en self-service. Tolérable pour des coachs de confiance, mais
--      on bloque par défaut (le blocage est au niveau SQL = autoritaire, même si
--      un appelant oublie de filtrer). Limite connue : un email différent
--      contourne (inhérent ; le code reste non combinable côté Shopify).
--
--   2) EXPIRATION 12 MOIS RÉELLEMENT PLANIFIÉE : 00010 a DÉFINI
--      expire_ambassador_cagnottes() mais ne l'a jamais SCHEDULÉE → elle ne se
--      déclenchait jamais seule. On la planifie via pg_cron (mensuel).
--      Garde-fou : seulement si pg_cron est disponible (vrai sur Supabase, faux
--      sur le Postgres vanilla de la CI pgTAP, où ce bloc est ignoré pour que la
--      migration reste applicable).
-- ============================================================

-- ------------------------------------------------------------
-- 1. credit_ambassador_commission — réécriture à l'identique de 00010
--    + bloc « 1bis » anti auto-commission. Signature INCHANGÉE.
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

  -- 1bis. ANTI AUTO-COMMISSION : si l'acheteur EST l'ambassadeur (même email),
  --       on ne crédite pas (sinon -10 % remise + 10 % cagnotte = 20 % self-service).
  --       Aucune ligne ambassador_commissions créée → idempotent par nature
  --       (réévalué identiquement à chaque livraison), et un éventuel refund
  --       ultérieur ne trouve rien à reprendre (cohérent).
  if p_buyer_email is not null
     and lower(btrim(p_buyer_email)) = lower(btrim(v_amb.email)) then
    return jsonb_build_object('credited', false, 'reason', 'self_purchase',
                              'order_ref', p_shopify_order_id, 'ambassador_id', v_amb.id);
  end if;

  v_commission_cents := floor(p_eligible_subtotal_cents * v_amb.rate)::integer;

  -- 2. Claim-first : l'INSERT (UNIQUE order_id) sérialise les retries concurrents.
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
-- 2. Planifier l'expiration mensuelle via pg_cron (garde-fou CI).
--    cron.schedule(jobname, ...) est un UPSERT par nom → ré-exécution sûre.
--    1er de chaque mois à 03:00 UTC : balaye les cagnottes inactives ≥ 12 mois.
-- ------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule(
      'ambassador-cagnotte-expiry',
      '0 3 1 * *',
      $cron$ select public.expire_ambassador_cagnottes(); $cron$
    );
  end if;
end $$;
