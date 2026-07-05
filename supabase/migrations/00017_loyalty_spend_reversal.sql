-- ============================================================
-- 00017_loyalty_spend_reversal.sql
-- BodyStart — GO « parrainage boutique » (2026-07-06) : re-crédit de la
-- cagnotte FIDÉLITÉ dépensée quand la commande est intégralement remboursée.
--
-- Asymétrie corrigée : le webhook refund reprenait la commission parrain
-- (revoke_referral_reward), la commission ambassadeur ET la dépense de
-- cagnotte AMBASSADEUR (reverse_ambassador_spend, 00013) — mais PAS la
-- dépense de cagnotte fidélité (code LY-) : un client qui payait en partie
-- avec sa cagnotte puis était remboursé perdait définitivement ce montant
-- (Shopify ne rembourse que ce qui a été payé en argent).
--
-- Miroir exact de reverse_ambassador_spend : idempotent (statut 'reversed'),
-- re-crédit du montant appliqué, ledger 'spend_reversal'.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Nouveaux états/types
-- ------------------------------------------------------------
alter table public.loyalty_redemptions drop constraint if exists loyalty_redemptions_status_check;
alter table public.loyalty_redemptions add constraint loyalty_redemptions_status_check
  check (status in ('reserved', 'applied', 'expired', 'cancelled', 'reversed'));

alter table public.loyalty_transactions drop constraint if exists loyalty_transactions_type_check;
alter table public.loyalty_transactions add constraint loyalty_transactions_type_check
  check (type in (
    'referral_commission', -- crédit parrain sur achat filleul (+)
    'referral_revoke',     -- débit parrain si commande filleul remboursée (-)
    'spend',               -- utilisation cagnotte par le client (-)
    'spend_reversal',      -- re-crédit de la dépense (commande remboursée) (+)
    'adjustment',          -- ajustement manuel admin
    'import_credit'        -- crédit d'accueil import legacy (+)
  ));

-- ------------------------------------------------------------
-- 2. reverse_loyalty_spend — re-crédit au remboursement TOTAL
--    Idempotent : la redemption passe 'applied' → 'reversed' une seule fois.
-- ------------------------------------------------------------
create or replace function public.reverse_loyalty_spend(p_shopify_order_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_red         public.loyalty_redemptions%rowtype;
  v_balance     integer;
  v_credit      integer;
  v_new_balance integer;
begin
  if p_shopify_order_id is null then raise exception 'p_shopify_order_id required'; end if;

  select * into v_red from public.loyalty_redemptions
  where shopify_order_id = p_shopify_order_id and status = 'applied'
  for update;
  if not found then
    return jsonb_build_object('reversed', false, 'reason', 'no_spend', 'order_ref', p_shopify_order_id);
  end if;

  -- finalize a débité exactement amount_cents (spentLoyaltyCents = montant de
  -- la réservation appliquée) → on re-crédite le même montant.
  v_credit := greatest(coalesce(v_red.amount_cents, 0), 0);

  update public.loyalty_redemptions
  set status = 'reversed'
  where id = v_red.id;

  if v_credit > 0 then
    select loyalty_balance_cents into v_balance
    from public.loyalty_customers where id = v_red.customer_id for update;
    v_new_balance := v_balance + v_credit;

    update public.loyalty_customers
    set loyalty_balance_cents = v_new_balance
    where id = v_red.customer_id;

    insert into public.loyalty_transactions(
      customer_id, type, amount_cents, balance_after_cents, channel, shopify_order_id, notes
    ) values (
      v_red.customer_id, 'spend_reversal', v_credit, v_new_balance,
      'online', p_shopify_order_id, 'Re-crédit cagnotte (commande remboursée)'
    );
  end if;

  return jsonb_build_object(
    'reversed', true, 'order_ref', p_shopify_order_id,
    'customer_id', v_red.customer_id, 'recredited_cents', v_credit
  );
end;
$$;

revoke execute on function public.reverse_loyalty_spend(text) from public, anon, authenticated;
grant execute on function public.reverse_loyalty_spend(text) to service_role;
