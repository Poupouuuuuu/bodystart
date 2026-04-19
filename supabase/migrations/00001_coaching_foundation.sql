-- ============================================================
-- 00001_coaching_foundation.sql
-- Body Start Coaching — Schéma initial + RLS
-- Région cible : eu-central-1 (Frankfurt) — RGPD données santé art. 9
-- ============================================================

-- Activer extensions nécessaires
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLE : profiles
-- Lien entre Shopify customer et Supabase user (via JWT custom)
-- ============================================================
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  shopify_customer_id text unique not null,
  email text not null,
  first_name text,
  last_name text,
  role text not null default 'client' check (role in ('client', 'admin')),
  rgpd_consent_at timestamptz,                 -- consentement explicite données santé
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,                      -- soft delete
  anonymized_at timestamptz                    -- anonymisation RGPD art. 17
);

create index idx_profiles_shopify_customer on public.profiles(shopify_customer_id);
create unique index idx_profiles_email_active on public.profiles(email) where deleted_at is null;

comment on table public.profiles is 'Miroir Supabase des clients Shopify. id = sub du JWT. shopify_customer_id = lien fort.';

-- ============================================================
-- TABLE : intakes
-- Formulaires d'intake remplis par le client après paiement
-- ============================================================
create table public.intakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  objectif text not null check (objectif in ('perte_poids', 'prise_masse', 'performance', 'remise_forme', 'recomposition')),
  niveau text not null check (niveau in ('debutant', 'intermediaire', 'avance')),
  age int check (age >= 14 and age <= 100),
  sexe text check (sexe in ('homme', 'femme', 'autre', 'non_precise')),
  poids_kg numeric(5,2),
  taille_cm int,
  dispo_hebdo int check (dispo_hebdo between 1 and 7),
  materiel text check (materiel in ('maison', 'salle', 'mixte')),
  contraintes_alimentaires jsonb default '[]'::jsonb,
  blessures_antecedents jsonb default '[]'::jsonb,
  notes_libres text,
  type_programme text not null check (type_programme in ('sport', 'nutrition', 'complet')),
  source text not null check (source in ('oneshot_49', 'monthly_89')),
  status text not null default 'pending' check (status in ('pending', 'generated', 'validated', 'delivered', 'rejected')),
  created_at timestamptz not null default now()
);

create index idx_intakes_user on public.intakes(user_id);
create index idx_intakes_status on public.intakes(status);

comment on table public.intakes is 'Données santé sensibles (RGPD art. 9). Anonymisées par anonymize_user().';

-- ============================================================
-- TABLE : programs
-- Programmes générés par IA puis validés par le coach
-- ============================================================
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid not null references public.intakes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('sport', 'nutrition', 'complet')),
  content jsonb not null,                      -- structure détaillée du programme
  ai_model text,                               -- ex: 'claude-sonnet-4-5-20250929'
  ai_generated_at timestamptz,
  ai_raw_response text,                        -- pour debug et amélioration du prompt
  validated_by_coach_at timestamptz,
  validated_by uuid references public.profiles(id),
  coach_adjustments text,                      -- ce que le coach a modifié
  pdf_url text,
  pdf_generated_at timestamptz,
  delivered_at timestamptz,
  product_recommendations jsonb default '[]'::jsonb,  -- shopify_product_ids + justifs
  created_at timestamptz not null default now(),
  -- 🔒 CONTRAINTE BUSINESS NON-NÉGOCIABLE :
  -- Un programme ne peut être livré qu'après validation explicite du coach
  constraint program_must_be_validated_before_delivery
    check (delivered_at is null or validated_by_coach_at is not null)
);

create index idx_programs_user on public.programs(user_id);
create index idx_programs_intake on public.programs(intake_id);
-- Index partiel pour la file d'attente du coach (programmes IA générés en attente de validation)
create index idx_programs_pending_validation on public.programs(ai_generated_at)
  where validated_by_coach_at is null;

comment on constraint program_must_be_validated_before_delivery on public.programs is
  'Garantit que le coach valide chaque programme avant livraison. Contrainte enforced au niveau DB pour empêcher contournement applicatif.';

-- ============================================================
-- TABLE : subscriptions
-- Abonnements 89€/mois (offre suivi personnalisé)
-- ============================================================
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_subscription_id text unique not null,
  stripe_customer_id text not null,
  plan text not null check (plan in ('coaching_followup_monthly')),
  status text not null check (status in ('active', 'past_due', 'canceled', 'incomplete', 'trialing')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_user on public.subscriptions(user_id);
create index idx_subscriptions_status on public.subscriptions(status);

-- ============================================================
-- TABLE : weekly_checkins
-- Suivi hebdomadaire pour les abonnés 89€/mois
-- ============================================================
create table public.weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  week_number int not null,                    -- semaine depuis le début de l'abonnement
  poids_kg numeric(5,2),
  mesures jsonb,                               -- {chest, waist, hips, arms, thighs, ...}
  ressenti int check (ressenti between 1 and 5),
  questions_client text,
  reponse_coach text,
  reponse_coach_at timestamptz,
  programme_ajuste boolean default false,
  created_at timestamptz not null default now()
);

create index idx_checkins_user on public.weekly_checkins(user_id);
-- Index partiel pour la file d'attente du coach
create index idx_checkins_unanswered on public.weekly_checkins(created_at)
  where reponse_coach_at is null;

comment on table public.weekly_checkins is 'Données santé sensibles (RGPD art. 9). Anonymisées par anonymize_user().';

-- ============================================================
-- TABLE : coaching_orders
-- Source de vérité indépendante de Stripe pour les one-shot 49€
-- ============================================================
create table public.coaching_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_payment_intent_id text unique,
  stripe_checkout_session_id text unique,
  product_type text not null check (product_type in ('oneshot_program_49')),
  amount_eur numeric(10,2) not null,
  status text not null check (status in ('pending', 'paid', 'refunded', 'failed')),
  paid_at timestamptz,
  intake_id uuid references public.intakes(id),
  created_at timestamptz not null default now()
);

create index idx_coaching_orders_user on public.coaching_orders(user_id);

comment on table public.coaching_orders is 'Conservée pour comptabilité même après anonymisation utilisateur (RGPD art. 17 ne s''applique pas aux obligations comptables).';

-- ============================================================
-- TRIGGER : update updated_at automatically on profiles, subscriptions
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper : retourne true si le caller est admin
-- (lookup unique sur profiles avec auth.uid())
create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and deleted_at is null
  );
$$;

comment on function public.is_current_user_admin is 'Helper RLS — éviter les sub-selects récursifs dans les policies.';

-- ─── PROFILES ──────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile (limited)"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Empêche un user de s'auto-promouvoir admin
    and role = (select role from public.profiles where id = auth.uid())
  );

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_current_user_admin());

create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_current_user_admin());

-- ─── INTAKES ───────────────────────────────────────────────
alter table public.intakes enable row level security;

create policy "Users can view their own intakes"
  on public.intakes for select
  using (auth.uid() = user_id);

create policy "Users can create their own intakes"
  on public.intakes for insert
  with check (auth.uid() = user_id);

create policy "Admins can view and manage all intakes"
  on public.intakes for all
  using (public.is_current_user_admin());

-- ─── PROGRAMS ──────────────────────────────────────────────
alter table public.programs enable row level security;

-- 🔒 Le client ne voit ses programs QUE s'ils sont delivered
create policy "Users can view their own delivered programs"
  on public.programs for select
  using (auth.uid() = user_id and delivered_at is not null);

create policy "Admins can view and manage all programs"
  on public.programs for all
  using (public.is_current_user_admin());

-- ─── SUBSCRIPTIONS ─────────────────────────────────────────
alter table public.subscriptions enable row level security;

create policy "Users can view their own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Admins can view and manage all subscriptions"
  on public.subscriptions for all
  using (public.is_current_user_admin());

-- ─── WEEKLY CHECKINS ───────────────────────────────────────
alter table public.weekly_checkins enable row level security;

create policy "Users can view their own checkins"
  on public.weekly_checkins for select
  using (auth.uid() = user_id);

create policy "Users can create their own checkins"
  on public.weekly_checkins for insert
  with check (auth.uid() = user_id);

create policy "Admins can view and manage all checkins"
  on public.weekly_checkins for all
  using (public.is_current_user_admin());

-- ─── COACHING ORDERS ───────────────────────────────────────
alter table public.coaching_orders enable row level security;

create policy "Users can view their own orders"
  on public.coaching_orders for select
  using (auth.uid() = user_id);

create policy "Admins can view and manage all orders"
  on public.coaching_orders for all
  using (public.is_current_user_admin());

-- ============================================================
-- GRANT minimal nécessaire pour le rôle 'authenticated'
-- (les RLS policies font le reste du gating)
-- ============================================================
grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.intakes to authenticated;
grant select on public.programs to authenticated;
grant select on public.subscriptions to authenticated;
grant select, insert on public.weekly_checkins to authenticated;
grant select on public.coaching_orders to authenticated;

-- Le service_role bypass déjà la RLS, pas besoin de grant explicite.
