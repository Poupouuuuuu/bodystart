-- ============================================================
-- supabase/tests/ci_init.sql
-- CI ONLY : stubs Supabase Auth pour permettre l'application des migrations
-- dans un Postgres vanilla (GitHub Actions).
--
-- Dans le projet Supabase reel :
--   - le schema auth est cree par Supabase
--   - auth.users + auth.uid() + auth.jwt() existent nativement
--
-- En CI on les stub avec le minimum vital pour que les migrations passent.
-- Ne PAS appliquer ce fichier en prod (les vrais auth.* sont gérés par Supabase).
-- ============================================================

-- Schema auth si pas deja present (Supabase le cree, Postgres vanilla non)
create schema if not exists auth;

-- auth.users stub : structure minimale pour FK
create table if not exists auth.users (
  id          uuid primary key default gen_random_uuid(),
  email       text unique,
  created_at  timestamptz default now()
);

-- auth.uid() stub : lit la valeur depuis un setting de session.
-- Les tests peuvent faire `SET LOCAL app.current_user_id = '<uuid>'` pour
-- simuler differents users.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid
$$;

-- auth.jwt() stub (pas utilise par nos migrations mais defensif)
create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select '{}'::jsonb
$$;

-- Roles Supabase (anon, authenticated, service_role) — creer s'ils n'existent pas.
-- En prod Supabase ils existent deja. En CI on les cree pour que les GRANT/REVOKE marchent.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role bypassrls;
  end if;
end $$;

-- Permettre a tous d'utiliser le schema public (par defaut Postgres)
grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role;
