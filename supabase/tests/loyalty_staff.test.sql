-- ============================================================
-- supabase/tests/loyalty_staff.test.sql
-- pgTAP tests pour la table loyalty_staff et le helper
-- is_current_user_loyalty_staff().
-- ============================================================

begin;

select plan(8);

-- ─── Setup : 1 user dans auth.users + 1 staff actif + 1 inactif ───
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'staff1@bodystart.local'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'staff2@bodystart.local'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'random@bodystart.local');

insert into public.loyalty_staff (id, email, full_name, role, is_active) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'staff1@bodystart.local', 'Staff Actif', 'cashier', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'staff2@bodystart.local', 'Staff Desactive', 'cashier', false);

-- ─── Helper : test is_current_user_loyalty_staff() ───

-- 1. Aucun auth.uid() defini → false
set local app.current_user_id = '';
select is(
  public.is_current_user_loyalty_staff(),
  false,
  'is_current_user_loyalty_staff retourne false sans auth.uid()'
);

-- 2. auth.uid() = staff actif → true
set local app.current_user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select is(
  public.is_current_user_loyalty_staff(),
  true,
  'is_current_user_loyalty_staff retourne true pour un staff actif'
);

-- 3. auth.uid() = staff inactif → false
set local app.current_user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
select is(
  public.is_current_user_loyalty_staff(),
  false,
  'is_current_user_loyalty_staff retourne false pour un staff is_active=false'
);

-- 4. auth.uid() = user random (pas dans loyalty_staff) → false
set local app.current_user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
select is(
  public.is_current_user_loyalty_staff(),
  false,
  'is_current_user_loyalty_staff retourne false pour un user pas dans loyalty_staff'
);

-- 5. Contrainte CHECK role : 'invalid' rejete
select throws_ok(
  $$ insert into public.loyalty_staff (id, email, role) values
     ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'x@y.fr', 'invalid_role') $$,
  '23514',
  null,
  'role CHECK rejette les valeurs hors (cashier, admin)'
);

-- 6. UNIQUE email
select throws_ok(
  $$ insert into auth.users (id, email) values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'staff1@bodystart.local');
     insert into public.loyalty_staff (id, email) values
     ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'staff1@bodystart.local') $$,
  '23505',
  null,
  'email UNIQUE rejette les doublons'
);

-- 7. View loyalty_active_staff : doit contenir 1 row (staff1, pas staff2 inactif)
select is(
  (select count(*)::int from public.loyalty_active_staff),
  1,
  'view loyalty_active_staff filtre is_active=false'
);

-- 8. View loyalty_active_staff : contient staff1
select is(
  (select email from public.loyalty_active_staff),
  'staff1@bodystart.local',
  'view loyalty_active_staff retourne le bon staff'
);

select * from finish();

rollback;
