-- ============================================================
-- supabase/tests/finalize.test.sql
-- pgTAP tests automatises de finalize_order_loyalty().
-- Lance en CI via .github/workflows/pgtap.yml
--
-- Couvre les cas critiques (cf. condition Adam L5 : tests automatises
-- AVANT prod argent reel) :
--   A. Happy path : 1er achat filleul → commission parrain 5%
--   B. Anti double-spend : depense > solde → exception
--   C. Idempotence : meme order_ref online → no-op
--   D. Commission hors fenetre 12 mois → 0
--   E. Commission cumulee dans fenetre → cumul correct
--   F. Auto-parrainage : referred_by_code = code du customer → ignore
--   G. Spend valide : decrement solde + transaction inscrite
-- ============================================================

begin;

select plan(28);

-- ─── Setup : 1 parrain + 1 filleul + 1 user sans parrain ───
insert into public.loyalty_customers (id, phone, first_name, referral_code, loyalty_balance_cents, source)
values
  ('11111111-1111-1111-1111-111111111111', '+33611111111', 'Parrain', 'BS-PRRN1', 0, 'online'),
  ('22222222-2222-2222-2222-222222222222', '+33622222222', 'Filleul', 'BS-FILL2', 0, 'online'),
  ('33333333-3333-3333-3333-333333333333', '+33633333333', 'Solo', 'BS-SOLO3', 5000, 'online');

update public.loyalty_customers set referred_by_code = 'BS-PRRN1'
where id = '22222222-2222-2222-2222-222222222222';

-- ============================================================
-- A. HAPPY PATH : 1er achat filleul 100€ → commission 5€ parrain
-- ============================================================
select lives_ok(
  $$ select public.finalize_order_loyalty(
       '22222222-2222-2222-2222-222222222222'::uuid,
       'TEST-A-ORDER1',
       10000, 0, null, 'online', null
     ) $$,
  'A1 : finalize 1er achat filleul ne throw pas'
);

select is(
  (select loyalty_balance_cents from public.loyalty_customers where id = '11111111-1111-1111-1111-111111111111'),
  500,
  'A2 : parrain credite de 500c (5% de 10000)'
);

select is(
  (select has_first_purchase from public.loyalty_customers where id = '22222222-2222-2222-2222-222222222222'),
  true,
  'A3 : filleul.has_first_purchase passe a true'
);

select isnt(
  (select first_purchase_at from public.loyalty_customers where id = '22222222-2222-2222-2222-222222222222'),
  null,
  'A4 : first_purchase_at est defini'
);

select isnt(
  (select referral_commission_until from public.loyalty_customers where id = '22222222-2222-2222-2222-222222222222'),
  null,
  'A5 : referral_commission_until est defini'
);

select is(
  (select count(*)::int from public.loyalty_transactions
   where type = 'referral_commission' and customer_id = '11111111-1111-1111-1111-111111111111'),
  1,
  'A6 : 1 transaction referral_commission cree sur le parrain'
);

select is(
  (select related_customer_id from public.loyalty_transactions
   where type = 'referral_commission' and customer_id = '11111111-1111-1111-1111-111111111111'),
  '22222222-2222-2222-2222-222222222222'::uuid,
  'A7 : related_customer_id = filleul'
);

-- ============================================================
-- C. IDEMPOTENCE : meme order_ref online rejoue → no-op
-- ============================================================
select lives_ok(
  $$ select public.finalize_order_loyalty(
       '22222222-2222-2222-2222-222222222222'::uuid,
       'TEST-A-ORDER1',
       10000, 0, null, 'online', null
     ) $$,
  'C1 : rejouer le meme order_ref ne throw pas'
);

select is(
  (select loyalty_balance_cents from public.loyalty_customers where id = '11111111-1111-1111-1111-111111111111'),
  500,
  'C2 : parrain non re-credite (toujours 500c, pas 1000)'
);

select is(
  (select count(*)::int from public.loyalty_transactions
   where type = 'referral_commission' and customer_id = '11111111-1111-1111-1111-111111111111'),
  1,
  'C3 : toujours 1 seule transaction commission'
);

select is(
  (select count(*)::int from public.loyalty_processed_orders where shopify_order_id = 'TEST-A-ORDER1'),
  1,
  'C4 : un seul enregistrement dans loyalty_processed_orders'
);

-- ============================================================
-- B. ANTI DOUBLE-SPEND : depense > solde → exception
-- ============================================================
select throws_like(
  $$ select public.finalize_order_loyalty(
       '22222222-2222-2222-2222-222222222222'::uuid,
       'TEST-B-ORDER1',
       5000, 1000, null, 'in_store', null
     ) $$,
  '%insufficient_balance%',
  'B1 : filleul (solde 0) qui spend 1000 → insufficient_balance'
);

select is(
  (select count(*)::int from public.loyalty_transactions
   where shopify_order_id = 'TEST-B-ORDER1'),
  0,
  'B2 : aucune transaction creee (rollback de la fonction)'
);

-- ============================================================
-- G. SPEND VALIDE : Solo (5000c) spend 2000c → balance 3000c
-- ============================================================
select lives_ok(
  $$ select public.finalize_order_loyalty(
       '33333333-3333-3333-3333-333333333333'::uuid,
       'TEST-G-ORDER1',
       10000, 2000, null, 'in_store', null
     ) $$,
  'G1 : Solo spend 2000c sur solde 5000c → OK'
);

select is(
  (select loyalty_balance_cents from public.loyalty_customers where id = '33333333-3333-3333-3333-333333333333'),
  3000,
  'G2 : Solo balance = 5000 - 2000 = 3000'
);

select is(
  (select balance_after_cents from public.loyalty_transactions
   where customer_id = '33333333-3333-3333-3333-333333333333' and type = 'spend'),
  3000,
  'G3 : balance_after_cents loggue correctement (3000)'
);

select is(
  (select count(*)::int from public.loyalty_transactions
   where customer_id = '33333333-3333-3333-3333-333333333333' and type = 'referral_commission'),
  0,
  'G4 : pas de commission referral (Solo n''a pas de parrain)'
);

-- ============================================================
-- E. COMMISSION CUMULEE DANS FENETRE : 2eme achat filleul
-- ============================================================
select lives_ok(
  $$ select public.finalize_order_loyalty(
       '22222222-2222-2222-2222-222222222222'::uuid,
       'TEST-E-ORDER1',
       20000, 0, null, 'online', null
     ) $$,
  'E1 : 2eme achat filleul OK'
);

select is(
  (select loyalty_balance_cents from public.loyalty_customers where id = '11111111-1111-1111-1111-111111111111'),
  1500,
  'E2 : parrain solde cumule = 500 + 1000 = 1500'
);

select is(
  (select count(*)::int from public.loyalty_transactions
   where type = 'referral_commission' and customer_id = '11111111-1111-1111-1111-111111111111'),
  2,
  'E3 : 2 transactions referral_commission cumulees'
);

-- ============================================================
-- D. COMMISSION HORS FENETRE : on force referral_commission_until passe
-- ============================================================
update public.loyalty_customers
set first_purchase_at = now() - interval '13 months',
    referral_commission_until = now() - interval '1 month'
where id = '22222222-2222-2222-2222-222222222222';

-- snapshot du solde parrain avant
do $$
declare
  v_balance_before integer;
  v_result jsonb;
begin
  select loyalty_balance_cents into v_balance_before
  from public.loyalty_customers
  where id = '11111111-1111-1111-1111-111111111111';

  v_result := public.finalize_order_loyalty(
    '22222222-2222-2222-2222-222222222222'::uuid,
    'TEST-D-ORDER1',
    10000, 0, null, 'online', null
  );

  perform pg_temp.set_test_meta('d_balance_before', v_balance_before::text);
  perform pg_temp.set_test_meta('d_commission', (v_result->>'commission_to_referrer_cents'));
end $$;

select is(
  (select loyalty_balance_cents from public.loyalty_customers where id = '11111111-1111-1111-1111-111111111111'),
  1500,
  'D1 : parrain non credite (toujours 1500, pas 2000) hors fenetre'
);

select is(
  (select count(*)::int from public.loyalty_transactions
   where type = 'referral_commission' and customer_id = '11111111-1111-1111-1111-111111111111'),
  2,
  'D2 : toujours 2 transactions commission (pas de 3eme)'
);

-- ============================================================
-- F. AUTO-PARRAINAGE : referred_by_code = referral_code du customer lui-meme
-- ============================================================
-- Setup : creer un nouveau user qui se rattacherait a lui-meme (cas absurde mais defense)
insert into public.loyalty_customers (id, phone, first_name, referral_code, referred_by_code, loyalty_balance_cents, source)
values ('44444444-4444-4444-4444-444444444444', '+33644444444', 'Self', 'BS-SELF4', 'BS-SELF4', 0, 'online');

select lives_ok(
  $$ select public.finalize_order_loyalty(
       '44444444-4444-4444-4444-444444444444'::uuid,
       'TEST-F-ORDER1',
       10000, 0, null, 'online', null
     ) $$,
  'F1 : auto-parrainage ne throw pas'
);

select is(
  (select loyalty_balance_cents from public.loyalty_customers where id = '44444444-4444-4444-4444-444444444444'),
  0,
  'F2 : pas de self-credit (anti auto-parrainage)'
);

select is(
  (select count(*)::int from public.loyalty_transactions
   where customer_id = '44444444-4444-4444-4444-444444444444' and type = 'referral_commission'),
  0,
  'F3 : pas de transaction referral_commission sur self'
);

-- ============================================================
-- Validation entrees : negatifs rejetes
-- ============================================================
select throws_like(
  $$ select public.finalize_order_loyalty(
       '33333333-3333-3333-3333-333333333333'::uuid,
       'TEST-NEG-1',
       -100, 0, null, 'in_store', null
     ) $$,
  '%paid_items_cents%',
  'Validation : paidItemsCents negatif → exception'
);

select throws_like(
  $$ select public.finalize_order_loyalty(
       '33333333-3333-3333-3333-333333333333'::uuid,
       'TEST-NEG-2',
       100, 0, null, 'unknown_channel', null
     ) $$,
  '%p_channel%',
  'Validation : channel inconnu → exception'
);

-- ─── Helper temp pour set_test_meta (placeholder, pas critique) ───
-- (utilise dans D pour stocker des valeurs entre blocs ; ignorable)
create or replace function pg_temp.set_test_meta(k text, v text) returns void
language plpgsql as $$ begin perform 1; end $$;

select * from finish();

rollback;
