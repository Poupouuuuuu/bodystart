-- ============================================================
-- 00007_loyalty_staff.sql
-- BodyStart Loyalty — Sprint L5 : table loyalty_staff + helper + RLS
--
-- Spec V2 §7.4 (caisse) + §8 (securite).
--
-- Decision Phase 0 + reponse Adam L5 :
--   - Auth via Supabase Auth (email/password, JWT 7j)
--   - Table loyalty_staff = miroir 1:1 de auth.users avec role + is_active
--   - RLS deny-par-defaut (anon/authenticated lectures bloquees ; service_role OK)
--   - Helper SQL is_current_user_loyalty_staff() pour proteger les RLS futures
--   - staff_user_id reel et auditable dans loyalty_transactions (sur EVERY in_store tx)
--
-- Creation des comptes : MANUELLE en v1 (Supabase Dashboard → Authentication → Add user,
-- puis INSERT dans loyalty_staff). Documente dans SPRINT_L5_REPORT.md.
-- ============================================================

-- ─── Table loyalty_staff ─────────────────────────────────────
create table public.loyalty_staff (
  -- FK vers auth.users.id (Supabase Auth). 1:1 strict.
  id           uuid primary key references auth.users(id) on delete cascade,

  email        text not null unique,
  full_name    text,
  role         text not null default 'cashier'
    check (role in ('cashier', 'admin')),

  -- Permet de desactiver un compte sans le supprimer (audit trail preserve)
  is_active    boolean not null default true,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_loyalty_staff_active_email on public.loyalty_staff(email) where is_active = true;

comment on table public.loyalty_staff is
  'Staff BodyStart autorise sur /staff/caisse. 1:1 avec auth.users (Supabase Auth). Cree manuellement en v1 (cf. SPRINT_L5_REPORT.md).';
comment on column public.loyalty_staff.role is
  'cashier = caisse seulement. admin = peut tout faire (reserve future).';
comment on column public.loyalty_staff.is_active is
  'Permet de desactiver un compte sans le supprimer (preserve l''historique audit loyalty_transactions.staff_user_id).';

-- Trigger updated_at (reutilise la fonction set_updated_at() creee migration 00001/00004)
create trigger loyalty_staff_set_updated_at
  before update on public.loyalty_staff
  for each row execute function public.set_updated_at();

-- ─── Helper SQL : is_current_user_loyalty_staff() ────────────
-- Pattern repris de is_current_user_admin() (coaching), adapte pour staff.
-- SECURITY DEFINER pour pouvoir lire loyalty_staff malgre la RLS deny-par-defaut.
create or replace function public.is_current_user_loyalty_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.loyalty_staff
    where id = auth.uid()
      and is_active = true
  );
$$;

comment on function public.is_current_user_loyalty_staff is
  'Helper RLS — retourne true si auth.uid() correspond a un staff actif. SECURITY DEFINER pour bypass la RLS deny-par-defaut sur loyalty_staff.';

grant execute on function public.is_current_user_loyalty_staff() to authenticated, anon;

-- ─── RLS : deny-par-defaut + lecture self-read ───────────────
alter table public.loyalty_staff enable row level security;

-- Un staff connecte peut LIRE sa propre ligne (pour afficher full_name dans la UI caisse)
create policy "staff_can_read_self"
  on public.loyalty_staff for select
  using (auth.uid() = id);

-- Personne d'autre. Le service_role bypass RLS de toute facon.
-- Pas de policy INSERT/UPDATE/DELETE pour anon/authenticated → tout bloque.

-- REVOKE explicite (defense-in-depth)
revoke all on public.loyalty_staff from anon, authenticated;
-- On re-grant juste le SELECT pour que la policy "self_read" puisse fonctionner
grant select on public.loyalty_staff to authenticated;

-- ─── View utilitaire admin : staff actifs (lecture admin/script) ───
create or replace view public.loyalty_active_staff as
select id, email, full_name, role, created_at
from public.loyalty_staff
where is_active = true
order by created_at;

comment on view public.loyalty_active_staff is
  'Liste lisible des staff actifs. Accessible service_role uniquement.';

revoke all on public.loyalty_active_staff from anon, authenticated;
