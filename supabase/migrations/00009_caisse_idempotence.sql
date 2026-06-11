-- ============================================================
-- 00009 — Idempotence caisse (in_store) dans finalize_order_loyalty
-- ============================================================
-- Avant : l'enregistrement loyalty_processed_orders n'était fait que pour
-- p_channel = 'online'. Un double-clic « Valider » en caisse (ou un retry
-- réseau) créait donc DEUX transactions (double crédit/débit cagnotte +
-- double commission parrain).
--
-- Après : idempotence dès que p_order_ref est non-null, quel que soit le
-- canal. Le client caisse (CaisseClient.tsx) génère désormais un orderRef
-- stable par vente (et non par clic) : le doublon est absorbé par le
-- `idempotent_skip` ci-dessous.
--
-- Le reste de la fonction est STRICTEMENT identique à 00008.
-- ============================================================

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

  -- 1. Idempotence (tout canal, dès que order_ref est fourni — 00009)
  if p_order_ref is not null then
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
