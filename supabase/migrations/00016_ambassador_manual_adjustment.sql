-- ============================================================
-- 00016_ambassador_manual_adjustment.sql
-- BodyStart — ajustement MANUEL de la cagnotte ambassadeur par l'admin (Adam).
--
-- Cas d'usage : un ambassadeur dépense X € en CAISSE (POS) → Adam fait une remise
-- manuelle au POS et DÉDUIT X € de la cagnotte ici (−). Le « + » sert de rattrapage
-- (créditer un gain POS non capté automatiquement, cf. enquête POS du 2026-06-24).
--
-- Garanties : plancher 0 AUTORITAIRE en SQL (jamais négatif, déduction plafonnée),
-- delta = 0 rejeté, cap anti-fat-finger ±1 000 €, idempotence NON requise (action
-- volontaire ponctuelle), audit complet via une ligne ambassador_transactions
-- dédiée 'manual_adjustment' (distincte de 'adjustment' = expiration).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Nouveau type de mouvement : 'manual_adjustment' (ajustement admin +/−)
--    On garde 'adjustment' pour l'expiration (00010) → audit non mélangé.
-- ------------------------------------------------------------
alter table public.ambassador_transactions drop constraint if exists ambassador_transactions_type_check;
alter table public.ambassador_transactions add constraint ambassador_transactions_type_check
  check (type in (
    'commission',       -- crédit sur commande via le code (+)
    'revoke',           -- reprise commission au remboursement (-)
    'spend',            -- utilisation de la cagnotte (produit-only) (-)
    'spend_reversal',   -- reprise d'une dépense (commande annulée/remboursée) (+)
    'adjustment',       -- expiration (cron) / ajustement legacy (le signe est porté par le contexte)
    'manual_adjustment' -- ajustement manuel admin (+/−), motif obligatoire dans notes
  ));

-- ------------------------------------------------------------
-- 2. adjust_ambassador_cagnotte — ajustement manuel admin (+/−)
--    Plancher 0 autoritaire : v_new = greatest(0, solde + delta).
--    Le débit/crédit RÉELLEMENT appliqué (v_applied) peut être < demandé si
--    plafonné par le plancher. amount_cents > 0 (contrainte) → on stocke abs(),
--    le motif + le sens vivent dans notes. Cap ±1 000 €. Pas de ligne si v_applied = 0.
--    Gating ADMIN = côté route (requireAdmin) + client service_role, comme les autres RPC.
-- ------------------------------------------------------------
create or replace function public.adjust_ambassador_cagnotte(
  p_ambassador_id text,
  p_delta_cents   integer,
  p_reason        text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amb         public.ambassadors%rowtype;
  v_new_balance integer;
  v_applied     integer;
  v_capped      boolean;
  v_abs         integer;
  v_reason      text := btrim(coalesce(p_reason, ''));
  v_sign        text;
  v_note        text;
  c_max_cents   constant integer := 100000; -- cap anti-fat-finger : ±1 000 €
begin
  if p_ambassador_id is null then raise exception 'p_ambassador_id required'; end if;
  if p_delta_cents is null or p_delta_cents = 0 then
    return jsonb_build_object('ok', false, 'reason', 'zero_delta');
  end if;
  if abs(p_delta_cents) > c_max_cents then
    return jsonb_build_object('ok', false, 'reason', 'exceeds_cap', 'max_cents', c_max_cents);
  end if;
  if v_reason = '' then
    return jsonb_build_object('ok', false, 'reason', 'reason_required');
  end if;

  -- Verrou ligne ambassadeur (cohérence solde concurrent).
  select * into v_amb from public.ambassadors where id = p_ambassador_id::uuid for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'ambassador_not_found');
  end if;

  -- Plancher 0 autoritaire.
  v_new_balance := greatest(0, v_amb.balance_cents + p_delta_cents);
  v_applied     := v_new_balance - v_amb.balance_cents;            -- signé (peut être 0)
  v_capped      := (v_applied <> p_delta_cents);                   -- déduction plafonnée par le plancher

  if v_applied = 0 then
    -- Rien à appliquer (ex. déduction alors que le solde est déjà à 0).
    -- amount_cents > 0 contraint → aucune ligne écrite.
    return jsonb_build_object(
      'ok', true, 'reason', 'no_change', 'ambassador_id', v_amb.id,
      'requested_delta_cents', p_delta_cents, 'applied_delta_cents', 0,
      'new_balance_cents', v_amb.balance_cents, 'capped', v_capped
    );
  end if;

  v_abs  := abs(v_applied);
  v_sign := case when v_applied > 0 then '+' else '−' end;
  v_note := 'Ajustement manuel ' || v_sign || to_char(v_abs / 100.0, 'FM999990.00') || ' € — ' || v_reason;
  if v_capped then
    v_note := v_note || ' (demandé ' || (case when p_delta_cents > 0 then '+' else '−' end)
              || to_char(abs(p_delta_cents) / 100.0, 'FM999990.00') || ' €, plafonné par le solde)';
  end if;

  update public.ambassadors
  set balance_cents = v_new_balance, last_activity_at = now()
  where id = v_amb.id;

  insert into public.ambassador_transactions(
    ambassador_id, type, amount_cents, balance_after_cents, shopify_order_id, notes
  ) values (
    v_amb.id, 'manual_adjustment', v_abs, v_new_balance, null, v_note
  );

  return jsonb_build_object(
    'ok', true, 'reason', 'applied', 'ambassador_id', v_amb.id,
    'requested_delta_cents', p_delta_cents, 'applied_delta_cents', v_applied,
    'new_balance_cents', v_new_balance, 'capped', v_capped
  );
end;
$$;

revoke execute on function public.adjust_ambassador_cagnotte(text, integer, text) from public, anon, authenticated;
grant execute on function public.adjust_ambassador_cagnotte(text, integer, text) to service_role;
