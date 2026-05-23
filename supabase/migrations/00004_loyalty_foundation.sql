-- ============================================================
-- 00004_loyalty_foundation.sql
-- BodyStart Loyalty (V2) — Sprint L1 : fondations Supabase
--
-- Spec : tech-specs/loyalty-system-spec-v2.md
-- Decisions actees (Phase 0) :
--   * Tables loyalty_* dans le schema public (cohabitent avec coaching_*)
--   * Pas de Supabase Auth → matching par email Shopify, colonne shopify_customer_id
--     (au lieu de auth_user_id references auth.users)
--   * Methode A pour la cagnotte en ligne (codes de reduction Admin API)
--   * RLS deny-par-defaut : aucune policy pour anon/authenticated.
--     Toutes les ecritures passent par le service_role cote serveur (bypass RLS).
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- TABLE : loyalty_customers
-- Identite = telephone (E.164). Distinct des customers Shopify.
-- ============================================================
create table public.loyalty_customers (
  id uuid primary key default gen_random_uuid(),

  -- Cles d'identite
  phone text not null unique,                  -- E.164 : +33612345678 (valide cote app via libphonenumber-js)
  email text unique,                           -- email Shopify (peut etre null si import legacy boutique)
  shopify_customer_id text unique,             -- gid://shopify/Customer/... (matching site, peut etre null)

  -- Identite humaine
  first_name text not null,
  last_name text,

  -- Cagnotte
  loyalty_balance_cents integer not null default 0
    check (loyalty_balance_cents >= 0),        -- 🔒 defense-in-depth : jamais de solde negatif

  -- Parrainage
  referral_code text not null unique,          -- format BS-XXXXX (cf. lib/loyalty/calculate.ts)
  referred_by_code text,                       -- code du parrain a l'inscription (null si pas parrain)
  has_first_purchase boolean not null default false,
  first_purchase_at timestamptz,
  referral_commission_until timestamptz,       -- first_purchase_at + 12 mois (fenetre de commission parrain)

  -- Preferences
  email_opt_in boolean not null default false,

  -- Origine du compte (audit)
  source text not null default 'online'
    check (source in ('in_store', 'online', 'import_legacy')),

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_loyalty_customers_phone on public.loyalty_customers(phone);
create index idx_loyalty_customers_email on public.loyalty_customers(email) where email is not null;
create index idx_loyalty_customers_shopify on public.loyalty_customers(shopify_customer_id) where shopify_customer_id is not null;
create index idx_loyalty_customers_referral_code on public.loyalty_customers(referral_code);
create index idx_loyalty_customers_referred_by on public.loyalty_customers(referred_by_code) where referred_by_code is not null;

comment on table public.loyalty_customers is
  'Clients loyalty BodyStart. Identite = telephone (E.164). Lien optionnel avec compte Shopify via shopify_customer_id + email. Pas de Supabase Auth (cf. spec V2 Phase 0).';
comment on column public.loyalty_customers.loyalty_balance_cents is
  'Solde de cagnotte en centimes. Source unique de verite. Modifie uniquement via finalize_order_loyalty (a creer au Sprint L2).';
comment on column public.loyalty_customers.referral_commission_until is
  'Date jusqu''a laquelle un achat du filleul credite 5% au parrain (= first_purchase_at + 12 mois).';

-- ============================================================
-- TABLE : loyalty_transactions
-- Grand livre des mouvements de cagnotte.
-- amount_cents TOUJOURS POSITIF ; le type porte le signe.
-- ============================================================
create table public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.loyalty_customers(id) on delete restrict,

  type text not null check (type in (
    'referral_commission', -- credit parrain sur achat filleul (+)
    'spend',               -- utilisation cagnotte par le client lui-meme (-)
    'adjustment',          -- ajustement manuel admin (+/- selon notes)
    'import_credit'        -- credit d'accueil import legacy (+)
  )),

  amount_cents integer not null check (amount_cents > 0),
  balance_after_cents integer not null check (balance_after_cents >= 0),

  channel text not null check (channel in ('in_store', 'online')),

  -- Tracabilite
  shopify_order_id text,                                          -- si commande en ligne (matche loyalty_processed_orders)
  related_customer_id uuid references public.loyalty_customers(id), -- filleul pour referral_commission
  staff_user_id uuid,                                              -- staff caisse (audit anti-fraude)
  notes text,

  created_at timestamptz not null default now()
);

create index idx_loyalty_tx_customer on public.loyalty_transactions(customer_id, created_at desc);
create index idx_loyalty_tx_type on public.loyalty_transactions(type);
create index idx_loyalty_tx_shopify_order on public.loyalty_transactions(shopify_order_id) where shopify_order_id is not null;
create index idx_loyalty_tx_related_customer on public.loyalty_transactions(related_customer_id) where related_customer_id is not null;

comment on table public.loyalty_transactions is
  'Grand livre append-only de la cagnotte. amount_cents toujours positif (le type porte le signe). balance_after_cents = solde apres application (audit + affichage timeline).';

-- ============================================================
-- TABLE : loyalty_processed_orders
-- Idempotence des webhooks Shopify (evite le double traitement sur retry).
-- ============================================================
create table public.loyalty_processed_orders (
  shopify_order_id text primary key,
  processed_at timestamptz not null default now()
);

comment on table public.loyalty_processed_orders is
  'Registre des commandes Shopify deja traitees par le webhook /api/loyalty/shopify-webhook. Shopify peut rejouer les events ; on bloque ici pour idempotence (cf. spec V2 §4.3).';

-- ============================================================
-- TABLE : loyalty_redemptions
-- Reservations de cagnotte pour le checkout en ligne (methode A : codes Admin API).
-- Pattern : reserve → confirm (ou expire).
-- ============================================================
create table public.loyalty_redemptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.loyalty_customers(id) on delete restrict,
  amount_cents integer not null check (amount_cents > 0),
  discount_code text not null,                  -- code Shopify genere via Admin API (unique, usage unique)
  status text not null default 'reserved'
    check (status in ('reserved', 'applied', 'expired', 'cancelled')),
  shopify_order_id text,                        -- rempli au moment du applied
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index idx_loyalty_redemptions_customer on public.loyalty_redemptions(customer_id, created_at desc);
create index idx_loyalty_redemptions_status_expires on public.loyalty_redemptions(status, expires_at)
  where status = 'reserved';
create unique index idx_loyalty_redemptions_discount_code on public.loyalty_redemptions(discount_code);

comment on table public.loyalty_redemptions is
  'Reservations de cagnotte au checkout en ligne (methode A spec V2 §5). Le code Shopify est cree via Admin API au moment de la reservation, et soit applique (webhook orders/paid), soit expire (cron 1h).';

-- ============================================================
-- TRIGGER : update updated_at on loyalty_customers
-- Reutilise la fonction set_updated_at() creee par la migration 00001
-- (si on la trouve, sinon on la recree).
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_proc
    where proname = 'set_updated_at'
      and pronamespace = (select oid from pg_namespace where nspname = 'public')
  ) then
    create function public.set_updated_at()
    returns trigger
    language plpgsql
    as $func$
    begin
      new.updated_at = now();
      return new;
    end;
    $func$;
  end if;
end $$;

create trigger loyalty_customers_set_updated_at
  before update on public.loyalty_customers
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY — DENY PAR DEFAUT
--
-- Strategie : on active RLS sur toutes les tables loyalty_*, et on
-- NE CREE AUCUNE POLICY pour anon ou authenticated.
-- Resultat : ces deux roles voient 0 ligne et ne peuvent rien ecrire.
-- Seul le service_role (utilise cote serveur uniquement, jamais expose au client)
-- bypass la RLS et peut tout faire — c'est par lui que passent toutes les
-- ecritures (route serveur API + fonction finalize_order_loyalty au Sprint L2).
-- ============================================================
alter table public.loyalty_customers       enable row level security;
alter table public.loyalty_transactions    enable row level security;
alter table public.loyalty_processed_orders enable row level security;
alter table public.loyalty_redemptions     enable row level security;

-- Aucune policy = deny par defaut pour anon/authenticated.
-- (Le service_role bypass RLS, donc pas besoin de policy pour lui.)
-- Le Sprint L4 (UI Mon compte / Parrainage) passera par des routes API
-- qui utilisent le service_role apres avoir verifie l'auth Shopify.

-- ============================================================
-- GRANTS : zero pour anon/authenticated (defense-in-depth)
--
-- La RLS suffit deja, mais on retire explicitement les grants par defaut
-- pour ne pas dependre uniquement de la RLS (ceinture + bretelles).
-- ============================================================
revoke all on public.loyalty_customers       from anon, authenticated;
revoke all on public.loyalty_transactions    from anon, authenticated;
revoke all on public.loyalty_processed_orders from anon, authenticated;
revoke all on public.loyalty_redemptions     from anon, authenticated;

-- Le service_role a deja tous les droits par defaut (membre du superuser-like).
-- On ne touche pas a ses grants.
