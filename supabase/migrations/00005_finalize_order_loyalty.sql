-- ============================================================
-- 00005_finalize_order_loyalty.sql
-- BodyStart Loyalty — Sprint L2 : fonction atomique finalize_order_loyalty
--
-- Spec V2 §4.3. Cette fonction est LA SEULE voie autorisee pour muter
-- loyalty_balance_cents. Toutes les mutations passent par elle :
--   - webhook Shopify orders/paid → channel='online'
--   - caisse boutique POST /api/loyalty/finalize → channel='in_store'
--
-- Garanties :
--   1. Atomique (1 transaction PL/pgSQL).
--   2. Idempotente (online + order_ref deja traite → return early).
--   3. Anti race-condition (SELECT FOR UPDATE sur le customer + le parrain).
--   4. Anti double-spend (verification balance >= spent_loyalty_cents).
--   5. CHECK constraints DB en defense (balance_after_cents >= 0, etc.).
--
-- SECURITY DEFINER : la fonction s'execute avec les droits du proprietaire
-- (postgres). Le caller (service_role server-only) peut donc l'invoquer
-- meme si la RLS empeche l'acces direct aux tables.
-- GRANT EXECUTE uniquement au service_role : aucune chance qu'anon ou
-- authenticated puisse appeler la fonction.
-- ============================================================

create or replace function public.finalize_order_loyalty(
  p_customer_id           uuid,
  p_order_ref             text,                 -- shopify_order_id (online) ou id caisse (in_store). Nullable pour in_store sans ref.
  p_paid_items_cents      integer,              -- sous-total produits paye (hors port/taxes/cagnotte appliquee). >= 0.
  p_spent_loyalty_cents   integer default 0,    -- cagnotte utilisee par l'acheteur sur SA commande. >= 0.
  p_referred_by_code_used text    default null, -- code parrain saisi au checkout (pour 1er achat sans code prealable). Optional.
  p_channel               text    default 'online',
  p_staff_user_id         uuid    default null  -- staff caisse (audit). NULL pour online.
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer            public.loyalty_customers%rowtype;
  v_parrain             public.loyalty_customers%rowtype;
  v_now                 timestamptz := now();
  v_commission_cents    integer := 0;
  v_is_first_purchase   boolean := false;
  v_new_balance         integer;
  v_referrer_id         uuid    := null;
begin
  -- ============================================================
  -- 0. Validation entrees (defense-in-depth, en plus des CHECK DB)
  -- ============================================================
  if p_customer_id is null then
    raise exception 'p_customer_id is required';
  end if;
  if p_paid_items_cents is null or p_paid_items_cents < 0 then
    raise exception 'p_paid_items_cents must be >= 0';
  end if;
  if p_spent_loyalty_cents is null or p_spent_loyalty_cents < 0 then
    raise exception 'p_spent_loyalty_cents must be >= 0';
  end if;
  if p_channel not in ('online', 'in_store') then
    raise exception 'p_channel must be online or in_store';
  end if;

  -- ============================================================
  -- 1. Idempotence (uniquement online + order_ref present)
  --    Si l'ordre est deja dans loyalty_processed_orders → on sort
  --    tot sans rien faire (les webhooks Shopify peuvent etre rejoues).
  -- ============================================================
  if p_channel = 'online' and p_order_ref is not null then
    if exists (
      select 1 from public.loyalty_processed_orders
      where shopify_order_id = p_order_ref
    ) then
      return jsonb_build_object(
        'idempotent_skip', true,
        'order_ref', p_order_ref,
        'customer_id', p_customer_id
      );
    end if;

    -- Marquer comme traite MAINTENANT. Si la transaction rollback,
    -- l'insert disparait aussi. C'est ce qu'on veut.
    insert into public.loyalty_processed_orders(shopify_order_id, processed_at)
    values (p_order_ref, v_now);
  end if;

  -- ============================================================
  -- 2. Lock le customer pour eviter les races (double-spend).
  --    SELECT FOR UPDATE serialise les transactions concurrentes
  --    sur ce customer.
  -- ============================================================
  select * into v_customer
  from public.loyalty_customers
  where id = p_customer_id
  for update;

  if not found then
    raise exception 'loyalty_customer not found: %', p_customer_id;
  end if;

  -- ============================================================
  -- 3. Si l'acheteur n'a pas encore de referred_by_code et qu'on
  --    fournit un code parrain (p_referred_by_code_used), on l'enregistre
  --    sur le customer. Limite a la 1ere commande (sinon on autoriserait
  --    quelqu'un a se rattacher a un parrain longtemps apres l'inscription).
  -- ============================================================
  if v_customer.referred_by_code is null
     and p_referred_by_code_used is not null
     and not v_customer.has_first_purchase
  then
    -- Verifier que le code existe ET que ce n'est pas le code du customer lui-meme
    if exists (
      select 1 from public.loyalty_customers
      where referral_code = p_referred_by_code_used
        and id != p_customer_id
    ) then
      update public.loyalty_customers
      set referred_by_code = p_referred_by_code_used
      where id = p_customer_id;
      v_customer.referred_by_code := p_referred_by_code_used;
    end if;
  end if;

  -- ============================================================
  -- 4. Spend : utilisation de la cagnotte par l'acheteur.
  --    Verifier balance suffisante AVANT d'ecrire (anti double-spend).
  --    Le CHECK loyalty_balance_cents >= 0 est une 2eme barriere.
  -- ============================================================
  if p_spent_loyalty_cents > 0 then
    if v_customer.loyalty_balance_cents < p_spent_loyalty_cents then
      raise exception 'insufficient_balance: balance=% requested=%',
        v_customer.loyalty_balance_cents, p_spent_loyalty_cents;
    end if;

    v_new_balance := v_customer.loyalty_balance_cents - p_spent_loyalty_cents;

    update public.loyalty_customers
    set loyalty_balance_cents = v_new_balance
    where id = p_customer_id;

    insert into public.loyalty_transactions(
      customer_id, type, amount_cents, balance_after_cents,
      channel, shopify_order_id, staff_user_id, notes
    ) values (
      p_customer_id, 'spend', p_spent_loyalty_cents, v_new_balance,
      p_channel, p_order_ref, p_staff_user_id,
      'Utilisation cagnotte sur commande'
    );

    -- Met a jour notre snapshot local pour les etapes suivantes
    v_customer.loyalty_balance_cents := v_new_balance;
  end if;

  -- ============================================================
  -- 5. 1er achat : positionne has_first_purchase + fenetre 12 mois.
  --    A partir d'ici, le filleul est dans sa fenetre 12 mois ouvrant
  --    droit a commission pour le parrain.
  -- ============================================================
  if not v_customer.has_first_purchase then
    update public.loyalty_customers
    set has_first_purchase       = true,
        first_purchase_at        = v_now,
        referral_commission_until = v_now + interval '12 months'
    where id = p_customer_id;

    v_is_first_purchase := true;
    v_customer.has_first_purchase        := true;
    v_customer.first_purchase_at         := v_now;
    v_customer.referral_commission_until := v_now + interval '12 months';
  end if;

  -- ============================================================
  -- 6. Commission parrain : 5% si l'acheteur a un referred_by_code
  --    ET on est dans la fenetre 12 mois.
  -- ============================================================
  if v_customer.referred_by_code is not null
     and v_customer.referral_commission_until is not null
     and v_now <= v_customer.referral_commission_until
  then
    -- Lookup le parrain (lock pour eviter race si plusieurs filleuls
    -- font une commande simultanee chez le meme parrain).
    select * into v_parrain
    from public.loyalty_customers
    where referral_code = v_customer.referred_by_code
    for update;

    if found and v_parrain.id != p_customer_id then
      -- Calcul commission 5% du paye produits, arrondi a l'inferieur
      -- (cohérent avec calcReferrerCommissionCents() cote TS).
      v_commission_cents := floor(p_paid_items_cents * 0.05)::integer;

      if v_commission_cents > 0 then
        update public.loyalty_customers
        set loyalty_balance_cents = loyalty_balance_cents + v_commission_cents
        where id = v_parrain.id;

        insert into public.loyalty_transactions(
          customer_id, type, amount_cents, balance_after_cents,
          channel, shopify_order_id, related_customer_id, staff_user_id, notes
        ) values (
          v_parrain.id, 'referral_commission', v_commission_cents,
          v_parrain.loyalty_balance_cents + v_commission_cents,
          p_channel, p_order_ref, p_customer_id, p_staff_user_id,
          'Commission 5% sur commande filleul'
        );

        v_referrer_id := v_parrain.id;
      end if;
    end if;
  end if;

  -- ============================================================
  -- 7. Retour JSON pour l'appelant (route API ou tests).
  -- ============================================================
  return jsonb_build_object(
    'customer_id',                p_customer_id,
    'order_ref',                  p_order_ref,
    'channel',                    p_channel,
    'spent_cents',                p_spent_loyalty_cents,
    'commission_to_referrer_cents', v_commission_cents,
    'referrer_id',                v_referrer_id,
    'is_first_purchase',          v_is_first_purchase,
    'new_balance_cents',          v_customer.loyalty_balance_cents,
    'first_purchase_at',          v_customer.first_purchase_at,
    'referral_commission_until',  v_customer.referral_commission_until,
    'idempotent_skip',            false
  );
end;
$$;

-- ============================================================
-- Permissions : SEUL le service_role peut executer cette fonction.
-- (anon/authenticated bloques en plus de la RLS deny-par-defaut.)
-- ============================================================
revoke execute on function public.finalize_order_loyalty(
  uuid, text, integer, integer, text, text, uuid
) from public;
revoke execute on function public.finalize_order_loyalty(
  uuid, text, integer, integer, text, text, uuid
) from anon, authenticated;
grant execute on function public.finalize_order_loyalty(
  uuid, text, integer, integer, text, text, uuid
) to service_role;

comment on function public.finalize_order_loyalty is
  'SEULE voie autorisee pour muter loyalty_balance_cents. Atomique + idempotente + anti race. Spec V2 §4.3.';
