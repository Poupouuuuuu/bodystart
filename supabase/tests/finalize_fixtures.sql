-- ============================================================
-- supabase/tests/finalize_fixtures.sql
-- Sprint L2 — Fixtures SQL manuelles pour finalize_order_loyalty()
--
-- Mode d'emploi (cf. SPRINT_L2_REPORT.md) :
--   1. Applique d'abord les migrations 00004 et 00005 dans le SQL Editor Supabase.
--   2. Colle ce fichier dans le SQL Editor.
--   3. Run TOUT le bloc en une fois → toutes les assertions doivent passer.
--   4. Si une RAISE EXCEPTION 'ASSERTION FAILED ...' apparait → bug.
--   5. Le bloc final fait un ROLLBACK : aucune donnee n'est laissee en base.
--
-- Couvre les 5 cas critiques :
--   A. Happy path : 1er achat filleul → commission parrain calculee (5%)
--   B. Anti double-spend : un user qui depense plus que son solde est rejete
--   C. Idempotence : meme shopify_order_id rejoue → return early sans mutation
--   D. Commission parrain HORS fenetre 12 mois → 0 commission
--   E. Commission parrain DANS la fenetre, plusieurs commandes → commissions cumulees
--
-- Pour le L5 (avant prod argent reel) : migrer ces fixtures en pgTAP automatise
-- avec supabase local (cf. spec V2 §10).
-- ============================================================

begin;

-- ─── Setup : creer un parrain et un filleul de test ───
insert into public.loyalty_customers (id, phone, first_name, referral_code, loyalty_balance_cents, source)
values
  ('11111111-1111-1111-1111-111111111111', '+33611111111', 'Parrain', 'BS-PRRN1', 0, 'online'),
  ('22222222-2222-2222-2222-222222222222', '+33622222222', 'Filleul', 'BS-FILL2', 0, 'online');

-- Le filleul est rattache au parrain via referred_by_code
update public.loyalty_customers
set referred_by_code = 'BS-PRRN1'
where id = '22222222-2222-2222-2222-222222222222';

-- ============================================================
-- A. HAPPY PATH : 1er achat filleul (100€) → parrain credite 5€
-- ============================================================
do $$
declare
  v_result jsonb;
  v_parrain_balance integer;
  v_filleul record;
begin
  v_result := public.finalize_order_loyalty(
    p_customer_id          := '22222222-2222-2222-2222-222222222222',
    p_order_ref            := 'TEST-ORDER-A1',
    p_paid_items_cents     := 10000,         -- 100€
    p_spent_loyalty_cents  := 0,
    p_referred_by_code_used := null,
    p_channel              := 'online',
    p_staff_user_id        := null
  );

  -- Assertions
  if (v_result->>'is_first_purchase')::boolean is not true then
    raise exception 'ASSERTION FAILED A1 : is_first_purchase devrait etre true (got %)', v_result->>'is_first_purchase';
  end if;
  if (v_result->>'commission_to_referrer_cents')::integer <> 500 then
    raise exception 'ASSERTION FAILED A2 : commission attendue 500 (got %)', v_result->>'commission_to_referrer_cents';
  end if;
  if v_result->>'referrer_id' <> '11111111-1111-1111-1111-111111111111' then
    raise exception 'ASSERTION FAILED A3 : referrer_id incorrect (got %)', v_result->>'referrer_id';
  end if;

  -- Verifier l'etat persiste
  select loyalty_balance_cents into v_parrain_balance
  from public.loyalty_customers
  where id = '11111111-1111-1111-1111-111111111111';
  if v_parrain_balance <> 500 then
    raise exception 'ASSERTION FAILED A4 : parrain balance attendue 500 (got %)', v_parrain_balance;
  end if;

  select * into v_filleul from public.loyalty_customers
  where id = '22222222-2222-2222-2222-222222222222';
  if v_filleul.has_first_purchase is not true then
    raise exception 'ASSERTION FAILED A5 : filleul.has_first_purchase devrait etre true';
  end if;
  if v_filleul.first_purchase_at is null then
    raise exception 'ASSERTION FAILED A6 : first_purchase_at devrait etre defini';
  end if;
  if v_filleul.referral_commission_until is null then
    raise exception 'ASSERTION FAILED A7 : referral_commission_until devrait etre defini';
  end if;

  raise notice '✅ A — Happy path OK : parrain credite 500c, filleul has_first_purchase=true';
end $$;

-- ============================================================
-- C. IDEMPOTENCE : meme shopify_order_id rejoue → no-op
-- ============================================================
do $$
declare
  v_result jsonb;
  v_parrain_balance_after integer;
begin
  -- On rejoue exactement le meme order_ref que dans A
  v_result := public.finalize_order_loyalty(
    p_customer_id          := '22222222-2222-2222-2222-222222222222',
    p_order_ref            := 'TEST-ORDER-A1',
    p_paid_items_cents     := 10000,
    p_spent_loyalty_cents  := 0,
    p_referred_by_code_used := null,
    p_channel              := 'online',
    p_staff_user_id        := null
  );

  if (v_result->>'idempotent_skip')::boolean is not true then
    raise exception 'ASSERTION FAILED C1 : idempotent_skip devrait etre true (got %)', v_result;
  end if;

  -- Verifier que le solde parrain n'a PAS bouge (toujours 500, pas 1000)
  select loyalty_balance_cents into v_parrain_balance_after
  from public.loyalty_customers
  where id = '11111111-1111-1111-1111-111111111111';
  if v_parrain_balance_after <> 500 then
    raise exception 'ASSERTION FAILED C2 : parrain ne devrait pas etre recredite (got % au lieu de 500)', v_parrain_balance_after;
  end if;

  raise notice '✅ C — Idempotence OK : rejouer le webhook ne re-credite pas';
end $$;

-- ============================================================
-- B. ANTI DOUBLE-SPEND : depenser plus que le solde → exception
-- ============================================================
do $$
declare
  v_result jsonb;
  v_caught boolean := false;
begin
  -- Le filleul a un solde de 0 (il n'a pas de cagnotte). On essaie de spend 1000c.
  begin
    v_result := public.finalize_order_loyalty(
      p_customer_id          := '22222222-2222-2222-2222-222222222222',
      p_order_ref            := 'TEST-ORDER-B1',
      p_paid_items_cents     := 5000,
      p_spent_loyalty_cents  := 1000,         -- demande 10€ alors qu'il a 0
      p_referred_by_code_used := null,
      p_channel              := 'in_store',
      p_staff_user_id        := null
    );
  exception
    when others then
      if sqlerrm like '%insufficient_balance%' then
        v_caught := true;
      else
        raise exception 'ASSERTION FAILED B1 : mauvaise exception (%)' , sqlerrm;
      end if;
  end;
  if not v_caught then
    raise exception 'ASSERTION FAILED B2 : devrait throw insufficient_balance';
  end if;

  -- Verifier que l'order_ref de l'echec n'a PAS ete marque comme processed
  -- (channel=in_store donc pas insere dans loyalty_processed_orders de toute facon).
  -- Pas d'assertion supplementaire ici, juste s'assurer qu'aucune transaction n'a ete creee.
  if exists (
    select 1 from public.loyalty_transactions
    where shopify_order_id = 'TEST-ORDER-B1'
  ) then
    raise exception 'ASSERTION FAILED B3 : aucune transaction ne devrait exister pour B1 (rollback de la fonction)';
  end if;

  raise notice '✅ B — Anti double-spend OK : tentative rejetee + rollback complet';
end $$;

-- ============================================================
-- E. COMMISSION CUMULEE DANS LA FENETRE : 2eme achat filleul → 2eme commission
-- ============================================================
do $$
declare
  v_result jsonb;
  v_parrain_balance integer;
begin
  v_result := public.finalize_order_loyalty(
    p_customer_id          := '22222222-2222-2222-2222-222222222222',
    p_order_ref            := 'TEST-ORDER-E1',
    p_paid_items_cents     := 20000,         -- 200€ → commission 10€
    p_spent_loyalty_cents  := 0,
    p_referred_by_code_used := null,
    p_channel              := 'online',
    p_staff_user_id        := null
  );

  if (v_result->>'is_first_purchase')::boolean is not false then
    raise exception 'ASSERTION FAILED E1 : 2eme achat, is_first_purchase devrait etre false';
  end if;
  if (v_result->>'commission_to_referrer_cents')::integer <> 1000 then
    raise exception 'ASSERTION FAILED E2 : commission attendue 1000 (got %)', v_result->>'commission_to_referrer_cents';
  end if;

  -- Solde parrain cumule : 500 (A) + 1000 (E) = 1500
  select loyalty_balance_cents into v_parrain_balance
  from public.loyalty_customers
  where id = '11111111-1111-1111-1111-111111111111';
  if v_parrain_balance <> 1500 then
    raise exception 'ASSERTION FAILED E3 : balance cumulee attendue 1500 (got %)', v_parrain_balance;
  end if;

  raise notice '✅ E — Commission cumulee OK : 500 + 1000 = 1500c sur parrain';
end $$;

-- ============================================================
-- D. PARRAINAGE A VIE : aucune fenetre (00008_referral_lifetime).
--    On force volontairement les anciens champs de fenetre dans le passe ;
--    le modele a vie les ignore et verse quand meme la commission 5%.
-- ============================================================
do $$
declare
  v_result jsonb;
  v_parrain_balance_before integer;
  v_parrain_balance_after integer;
begin
  -- Forcer les anciens champs de fenetre dans le passe (sans effet : a vie)
  update public.loyalty_customers
  set first_purchase_at = now() - interval '13 months',
      referral_commission_until = now() - interval '1 month'
  where id = '22222222-2222-2222-2222-222222222222';

  select loyalty_balance_cents into v_parrain_balance_before
  from public.loyalty_customers
  where id = '11111111-1111-1111-1111-111111111111';

  v_result := public.finalize_order_loyalty(
    p_customer_id          := '22222222-2222-2222-2222-222222222222',
    p_order_ref            := 'TEST-ORDER-D1',
    p_paid_items_cents     := 10000,
    p_spent_loyalty_cents  := 0,
    p_referred_by_code_used := null,
    p_channel              := 'online',
    p_staff_user_id        := null
  );

  if (v_result->>'commission_to_referrer_cents')::integer <> 500 then
    raise exception 'ASSERTION FAILED D1 : commission a vie devrait etre 500 (got %)', v_result->>'commission_to_referrer_cents';
  end if;
  if v_result->>'referrer_id' <> '11111111-1111-1111-1111-111111111111' then
    raise exception 'ASSERTION FAILED D2 : referrer_id devrait rester le parrain a vie (got %)', v_result->>'referrer_id';
  end if;

  select loyalty_balance_cents into v_parrain_balance_after
  from public.loyalty_customers
  where id = '11111111-1111-1111-1111-111111111111';
  if v_parrain_balance_after <> v_parrain_balance_before + 500 then
    raise exception 'ASSERTION FAILED D3 : parrain devrait etre credite a vie (% -> % attendu %)', v_parrain_balance_before, v_parrain_balance_after, v_parrain_balance_before + 500;
  end if;

  raise notice 'D — A vie OK : commission 500 versee meme "hors ancienne fenetre", parrain credite';
end $$;

-- ============================================================
-- ROLLBACK : on ne laisse aucune donnee de test en base
-- ============================================================
rollback;

select '🎉 TOUTES LES FIXTURES PASSENT — rollback effectue, aucune donnee laissee.' as result;
