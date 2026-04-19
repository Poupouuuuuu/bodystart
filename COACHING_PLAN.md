# COACHING_PLAN.md

> Plan d'implémentation pour la plateforme coaching Body Start
> Document de planification — aucun code à ce stade
> Date : 2026-04-19

---

## 📋 Synthèse exécutive

Le scaffolding coaching existe déjà à un degré inattendu : **5 produits Stripe configurés, Checkout + Webhook fonctionnels, activation via metafields Shopify, dashboard client `/account/coaching`, code promo -15% auto-généré**. Ce plan ne part donc pas de zéro — il **étend** un socle déjà en place avec les briques manquantes : intake structuré, génération IA, persistance des programmes, panel admin coach, génération PDF.

**Décision architecturale majeure** : ajouter **Supabase** comme base de données. Les métafields Shopify suffisent pour stocker un flag binaire "coaching actif", mais sont inadaptés pour stocker des programmes structurés (3-12 semaines × 4-6 séances), des check-ins hebdomadaires, des révisions, ou une file d'attente de modération.

---

# PHASE 1 — AUDIT TECHNIQUE DU CODEBASE

## 1.1 Arborescence App Router

Next.js 14 **App Router** avec deux route groups :

- **`(nutrition)/`** — boutique nutrition (homepage, products, account, blog…)
- **`(coaching)/`** — pages publiques marketing coaching (landing, programmes, tarifs)

Particularité : les **dashboards client coaching** vivent dans `(nutrition)/account/coaching/` (pas dans `(coaching)/`), pour bénéficier du middleware d'auth déjà appliqué à `/account/*`. À conserver.

API routes (`src/app/api/`) :
- `stripe/checkout` + `stripe/webhook` — paiements coaching (existant)
- `coaching/status` — GET statut coaching par email (existant)
- `coaching/debug/activate-coaching` — activation manuelle dev-only (existant)
- `contact`, `newsletter`, `inventory`, `search` — divers nutrition

## 1.2 Shopify

- **Librairie** : `graphql-request` v6.1.0 (pas le client officiel `@shopify/storefront-api-client`)
- **Deux clients distincts** dans `src/lib/shopify/client.ts` :
  - **Storefront API** 2024-04 : produits, panier, checkout, customer auth
  - **Admin API** 2024-04 : inventory, locations, **metafields**, codes promo
- **Cart** : `src/context/CartContext.tsx` — état global, mutations CREATE/ADD/UPDATE/REMOVE, attributes pour Click & Collect (`fulfillment_type=in_store`)
- **Customer Auth** : Storefront Customer API (`customer.ts` + `customer-server.ts`) — login/register/logout, addresses CRUD, orders. Token en localStorage **+ cookie** (pour middleware).
- **Discounts** : `src/lib/shopify/discounts.ts` — création/désactivation via Admin API, code unique `COACH-{hash8}` valide 1 an

## 1.3 Stripe

- Stripe v20.4.1, API version `2026-02-25.clover`
- **Checkout API** (`/api/stripe/checkout`) supporte **payment** (one-shot) **et subscription** (récurrent) — donc la base 89€/mois est déjà couverte
- **Webhook** (`/api/stripe/webhook`) gère :
  - `checkout.session.completed` → écrit metafields Shopify `coaching.{active,since,type,product_id}` + crée code promo -15%
  - `customer.subscription.deleted` → désactive metafields + désactive le code promo
- **Catalogue** dans `src/lib/stripe/types.ts` — 5 produits hardcodés avec `priceId` Stripe :
  - Programme Prise de Masse — 199€ / Prog. Perte de Poids — 149€ / Séance — 59€ / Abonnement — 89€/mois / Pack 3 mois — 499€
  - **À noter** : ces produits ne correspondent pas exactement aux deux offres décrites dans la mission (49€ + 89€/mois). Décision produit nécessaire — voir Questions critiques.

## 1.4 Authentification client

- **Shopify Customer Account API** via Storefront — pas de système custom
- `CustomerContext` (client) + `CustomerProvider` dans le root layout
- **Token storage** : `localStorage` + cookie miroir `body-start-customer-token` (pour middleware SSR)
- **Middleware** (`src/middleware.ts`) protège `/account/*` — redirection vers `/login?redirect=...` si cookie absent
- Pages `/login`, `/register`, `/forgot-password`, `/account` toutes opérationnelles

## 1.5 Base de données

**🚨 AUCUNE BASE DE DONNÉES.** Aucune trace de Supabase, Prisma, Drizzle, Vercel Postgres. Tout est persisté soit dans **Shopify** (clients, commandes, metafields), soit dans **Stripe** (paiements, subscriptions), soit en **localStorage client** (suivi workouts → données perdues si l'utilisateur change de device !).

## 1.6 Design system

- **Tailwind** v3.4 + tokens custom dans `tailwind.config.ts` :
  - `brand-*` (vert sauge nutrition #2D5A3D)
  - `coaching-*` + `coaching-cyan-*` (cyan #2AB0B0) — donc **palette coaching distincte déjà définie**
  - `cream-*` backgrounds (#F8F4EE)
  - Polices : Inter (`sans`) + Montserrat (`display`) — **PAS DM Sans/Playfair** comme indiqué dans la mission. Voir Questions critiques.
- `src/components/ui/` : `Button`, `Badge`, `BackToTop`, `CookieBanner`, `SearchBar` — minimaliste, pas de shadcn/ui
- Classes utilitaires `@layer` dans `globals.css` : `.btn-primary`, `.btn-secondary`, `.card`, `.input`, `.badge-*`

## 1.7 Variables d'environnement

Déjà configurées (Vercel + `.env.local`) :
```
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
SHOPIFY_ADMIN_API_ACCESS_TOKEN
NEXT_PUBLIC_SITE_URL
RESEND_API_KEY
CONTACT_EMAIL_TO
RESEND_AUDIENCE_ID
UPSTASH_REDIS_REST_URL / _TOKEN
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
JUDGEME_PUBLIC_TOKEN / _PRIVATE_TOKEN  (pas dans .env.example)
```

À ajouter pour le coaching :
```
ANTHROPIC_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
COACHING_ADMIN_EMAILS  (liste d'emails admin séparés par virgule)
```

## 1.8 Déploiement

- **Vercel** (compte `orientrelais' projects`)
- Repo GitHub : `Poupouuuuuu/bodystart`, branche `main` connectée pour auto-deploy
- URL prod : `https://bodystart.vercel.app`
- Preview branches activées par défaut Vercel
- `next/image` Sharp installé pour optimisation

## 1.9 Dépendances clés

```
next 14.2.5         | react 18           | typescript 5
stripe 20.4.1       | graphql-request 6  | resend 6.9.4
tailwindcss 3.4.1   | sharp 0.34.5       | lucide-react 0.400
@upstash/ratelimit + redis (rate limit Resend)
react-hot-toast 2.4 (notifications UI)
```

**À ajouter** : `@anthropic-ai/sdk`, `@supabase/supabase-js`, `@supabase/ssr`, et un générateur PDF (cf. choix Phase 3).

---

# PHASE 2 — IDENTIFICATION DES RÉUTILISATIONS

| Brique | Statut | Détails |
|---|---|---|
| **Authentification client** | ✅ Déjà en place | Shopify Customer API, middleware, CustomerContext — réutilisable tel quel |
| **Formulaire multi-step (intake)** | ➕ À créer | Aucun composant Stepper existant. À builder (probablement avec react-hook-form + zod) |
| **Génération IA Anthropic** | ➕ À créer | SDK absent, route `/api/coaching/generate-program` à créer |
| **Stockage programmes/check-ins** | ➕ À créer | Pas de DB. Supabase à ajouter |
| **Génération PDF** | ➕ À créer | Aucune lib PDF. Choix à faire — voir Phase 3 |
| **Abonnement Stripe récurrent** | ✅ Déjà en place | Mode `subscription` déjà géré dans `/api/stripe/checkout` et webhook |
| **Webhook Stripe (subscription events)** | 🔧 À étendre | Gère `checkout.session.completed` et `customer.subscription.deleted`. Manque : `invoice.payment_failed`, `customer.subscription.updated` (changement de plan), `invoice.paid` (renouvellement mensuel) |
| **Panel admin** | ➕ À créer | Aucune route admin. À créer avec protection par liste d'emails (`COACHING_ADMIN_EMAILS`) ou Supabase RLS |
| **Recommandations produits Shopify** | 🔧 À étendre | `getProducts()` existe. Logique de matching tags/objectifs → IA prompt à créer |
| **Codes promo Shopify dynamiques** | ✅ Déjà en place | `discounts.ts` crée `COACH-{hash}` -15% à 1 an. **À ajuster** : le brief mentionne -10%, code actuel -15%. Décision business |
| **Emails transactionnels** | 🔧 À étendre | Resend installé, utilisé pour `/contact` et `/newsletter`. Templates coaching à créer (intake reçu, programme prêt, check-in confirmé, programme renouvelé) |
| **Landing page coaching** | ✅ Déjà en place | `/coaching/page.tsx` + `/coaching/programmes` + `/coaching/tarifs` opérationnels. À adapter pour les 2 nouvelles offres (49€ + 89€/mois) |
| **Espace client coaching** | 🔧 À étendre | `/account/coaching/page.tsx` affiche statut + code promo. Manque : liste programmes IA, historique check-ins, rendez-vous Cal.com |
| **Suivi workouts** | 🔧 À étendre | localStorage actuellement → migrer vers Supabase pour persistance multi-device |
| **Cal.com integration** | ➕ À créer | Pour l'appel mensuel 30 min de l'offre 89€/mois. Embed iframe ou Cal API |

---

# PHASE 3 — PROPOSITION D'ARCHITECTURE

## 3.1 Structure de fichiers à ajouter

```
src/
├── app/
│   ├── (coaching)/
│   │   └── coaching/
│   │       ├── page.tsx                          [🔧 adapter]
│   │       ├── tarifs/page.tsx                   [🔧 adapter pour 49€ + 89€/mois]
│   │       └── intake/
│   │           ├── page.tsx                      [➕ formulaire multi-step + disclaimer RGPD]
│   │           └── success/page.tsx              [➕ confirmation + redirection /account/coaching]
│   │
│   ├── (nutrition)/
│   │   └── account/
│   │       └── coaching/
│   │           ├── page.tsx                      [🔧 lister programmes Supabase]
│   │           ├── programmes/[id]/page.tsx      [🔧 lire depuis Supabase + bouton PDF]
│   │           ├── checkins/page.tsx             [➕ formulaire check-in hebdo (offre 89€)]
│   │           └── rdv/page.tsx                  [➕ embed Cal.com pour appel mensuel]
│   │
│   ├── (admin)/                                  [➕ NOUVEAU route group]
│   │   ├── layout.tsx                            [➕ vérification email ∈ COACHING_ADMIN_EMAILS]
│   │   └── admin/
│   │       └── coaching/
│   │           ├── page.tsx                      [➕ dashboard : file d'attente]
│   │           ├── programs/[id]/page.tsx        [➕ relecture/édition programme avant envoi client]
│   │           └── checkins/page.tsx             [➕ liste check-ins à répondre]
│   │
│   └── api/
│       ├── coaching/
│       │   ├── intake/route.ts                   [➕ POST : sauvegarde intake → Supabase]
│       │   ├── generate-program/route.ts         [➕ POST : appel Claude → Supabase status=pending_review]
│       │   ├── validate-program/route.ts         [➕ POST admin : passe à status=ready + génère PDF + envoie email]
│       │   ├── checkin/route.ts                  [➕ POST client : nouveau check-in]
│       │   ├── checkin-response/route.ts         [➕ POST admin : réponse coach]
│       │   ├── pdf/[programId]/route.ts          [➕ GET : sert le PDF stocké]
│       │   └── status/route.ts                   [✅ existant — peut rester]
│       └── stripe/
│           └── webhook/route.ts                  [🔧 ajouter handlers : invoice.paid, payment_failed]
│
├── components/
│   └── coaching/                                 [➕ NOUVEAU dossier]
│       ├── intake/
│       │   ├── IntakeStepper.tsx                 [➕ wrapper multi-step]
│       │   ├── steps/Step1_Profile.tsx           [➕ âge, sexe, taille, poids]
│       │   ├── steps/Step2_Goals.tsx             [➕ objectif principal, échéance]
│       │   ├── steps/Step3_Activity.tsx          [➕ niveau actuel, sports pratiqués]
│       │   ├── steps/Step4_Health.tsx            [➕ blessures, médicaments, allergies — RGPD art.9 !]
│       │   ├── steps/Step5_Lifestyle.tsx         [➕ sommeil, stress, dispo hebdo]
│       │   └── HealthDisclaimer.tsx              [➕ checkbox consentement obligatoire]
│       ├── ProgramViewer.tsx                     [➕ affiche un programme structuré]
│       ├── ProductRecommendations.tsx            [➕ cards 2-4 produits Shopify cross-sell]
│       └── CheckinForm.tsx                       [➕ poids, mesures, ressenti, photo facultative]
│
└── lib/
    ├── supabase/                                 [➕ NOUVEAU]
    │   ├── client.ts                             [➕ client browser]
    │   ├── server.ts                             [➕ client serveur (cookies-aware)]
    │   ├── admin.ts                              [➕ service-role pour API routes]
    │   └── types.ts                              [➕ types DB générés]
    ├── coaching/                                 [➕ NOUVEAU]
    │   ├── anthropic.ts                          [➕ wrapper SDK + prompt builder]
    │   ├── prompts.ts                            [➕ system prompt + templates par objectif]
    │   ├── pdf.ts                                [➕ génération PDF d'un programme]
    │   ├── product-matcher.ts                    [➕ map intake → IDs produits Shopify recommandés]
    │   └── emails.ts                             [➕ templates Resend coaching]
    └── stripe/
        └── types.ts                              [🔧 mettre à jour les 2 nouveaux priceIds]

supabase/                                         [➕ NOUVEAU]
└── migrations/
    └── 0001_coaching_schema.sql                  [➕ tables + RLS]
```

## 3.2 Schéma Supabase proposé

**Région d'hébergement : `eu-west-3` (Paris) ou `eu-central-1` (Frankfurt)** — obligatoire pour données santé européennes.

```sql
-- ─── PROFILES : table miroir des clients Shopify ───────────
create table profiles (
  id uuid primary key default gen_random_uuid(),
  shopify_customer_id text unique not null,    -- ID Shopify (ex: gid://shopify/Customer/...)
  email text unique not null,
  first_name text,
  last_name text,
  is_admin boolean default false,              -- pour le coach
  created_at timestamptz default now()
);

-- ─── INTAKES : formulaires d'entrée ────────────────────────
create table intakes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  -- Données structurées du formulaire
  age int,
  sex text check (sex in ('M', 'F', 'NB', 'NSP')),
  height_cm int,
  weight_kg numeric(5,2),
  goal text not null,                          -- 'muscle' | 'fat_loss' | 'recovery' | 'health'
  goal_deadline_weeks int,
  activity_level text,                         -- 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete'
  sports text[],                               -- ['football', 'musculation']
  -- Données santé (RGPD art.9 — chiffrement at-rest activé par défaut Supabase)
  injuries text,
  medications text,
  allergies text,
  -- Lifestyle
  sleep_hours numeric(3,1),
  stress_level int check (stress_level between 1 and 10),
  weekly_availability_hours int,
  -- Consentements
  health_disclaimer_accepted_at timestamptz not null,
  data_processing_consent_at timestamptz not null,
  created_at timestamptz default now()
);

-- ─── PROGRAMS : programmes générés par IA ──────────────────
create table programs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  intake_id uuid references intakes(id),
  type text not null check (type in ('one_shot', 'subscription')),
  status text not null check (status in (
    'generating',          -- IA en cours
    'pending_review',      -- attente validation coach
    'ready',               -- envoyé au client
    'archived'
  )),
  ai_raw_response jsonb,                       -- réponse brute Claude
  content jsonb not null,                      -- structure validée (semaines, séances, exos)
  coach_notes text,                            -- notes ajoutées par le coach
  recommended_product_ids text[],              -- handles Shopify
  pdf_url text,                                -- URL Supabase Storage
  generated_at timestamptz default now(),
  validated_at timestamptz,
  validated_by uuid references profiles(id)
);

-- ─── SUBSCRIPTIONS : miroir Stripe pour offre 89€/mois ─────
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  stripe_subscription_id text unique not null,
  stripe_customer_id text not null,
  status text not null,                        -- active, past_due, canceled, etc.
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  next_program_refresh_at timestamptz,         -- recalcul programme tous les 3 mois
  created_at timestamptz default now()
);

-- ─── WEEKLY_CHECKINS : suivi hebdo offre abonnement ────────
create table weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  subscription_id uuid references subscriptions(id),
  week_number int not null,
  weight_kg numeric(5,2),
  measurements jsonb,                          -- {chest, waist, hips, arms, thighs}
  energy_level int check (energy_level between 1 and 10),
  motivation_level int check (motivation_level between 1 and 10),
  sleep_quality int check (sleep_quality between 1 and 10),
  notes text,
  questions_for_coach text,
  coach_response text,
  coach_responded_at timestamptz,
  created_at timestamptz default now()
);

-- ─── WORKOUTS : log de séances réalisées (remplace localStorage) ─
create table workouts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  program_id uuid references programs(id),
  type text,
  duration_minutes int,
  intensity text check (intensity in ('low', 'medium', 'high')),
  notes text,
  performed_at timestamptz default now()
);

-- ─── RLS POLICIES ──────────────────────────────────────────
alter table profiles enable row level security;
alter table intakes enable row level security;
alter table programs enable row level security;
alter table subscriptions enable row level security;
alter table weekly_checkins enable row level security;
alter table workouts enable row level security;

-- Le client lit/écrit ses propres données
create policy "users read own profile" on profiles for select
  using (auth.jwt() ->> 'email' = email);
create policy "users read own intakes" on intakes for select
  using (profile_id in (select id from profiles where email = auth.jwt() ->> 'email'));
-- (idem pour programs, subscriptions, weekly_checkins, workouts)

-- L'admin (coach) peut tout lire/écrire
create policy "admin all access programs" on programs for all
  using (exists (select 1 from profiles where email = auth.jwt() ->> 'email' and is_admin = true));
-- (idem sur les autres tables)

-- Indexes
create index on intakes (profile_id);
create index on programs (profile_id, status);
create index on programs (status) where status = 'pending_review';
create index on weekly_checkins (profile_id, week_number);
create index on subscriptions (stripe_subscription_id);
```

**⚠️ Auth bridge** : Supabase utilise son propre `auth.users`. Comme l'auth client est déjà chez **Shopify**, deux options :

- **Option A (recommandé)** : ne pas utiliser Supabase Auth. Synchroniser les sessions Shopify → Supabase via JWT custom signé côté serveur, avec `email` comme claim et utiliser `auth.jwt()` dans les RLS. Plus complexe à mettre en place mais ne casse pas le flow d'auth existant.
- **Option B** : double inscription (Shopify + Supabase). Au login Shopify, créer/synchroniser un user Supabase via service role. Plus simple, mais 2 systèmes d'auth à maintenir.

→ **Décision à prendre, voir Questions critiques #2.**

## 3.3 Produits/prices Stripe à créer/ajuster

Catalogue actuel = 5 produits dont les prix ne matchent pas le brief. À aligner :

| Brief | Existant | Action |
|---|---|---|
| Programme Personnalisé 49€ one-shot | Programme Prise de Masse 199€ + Perte de Poids 149€ | **Créer** un nouveau Stripe product `program_personalized` à 49€ — décider si on garde ou archive les 3 anciens programmes |
| Suivi Personnalisé 89€/mois | Abonnement Mensuel 89€/mois ✅ | **Garder le price_id existant** mais renommer le produit et ajuster la description |

Action concrète : créer dans Stripe Dashboard 1 nouveau price + mettre à jour `COACHING_PRODUCTS` dans `src/lib/stripe/types.ts`.

## 3.4 Webhooks Stripe à gérer

Actuellement gérés ✅ :
- `checkout.session.completed`
- `customer.subscription.deleted`

À ajouter 🔧 :
- `invoice.paid` — renouvellement mensuel réussi → mettre à jour `subscriptions.current_period_end` Supabase
- `invoice.payment_failed` — échec paiement → notifier client par email + flag `subscriptions.status = past_due`
- `customer.subscription.updated` — changement de plan ou pause

---

# PHASE 4 — DÉCOUPAGE EN SPRINTS

## Sprint 1 — Fondations Supabase + Bridge Auth (≈ 8-12h)

**Objectif mesurable** : un client connecté sur le site peut voir son profil Supabase synchronisé automatiquement, et un admin peut lire la table `profiles` via le panel admin protégé.

**Fichiers à créer/modifier** :
- `supabase/migrations/0001_coaching_schema.sql` (le schéma complet ci-dessus)
- `src/lib/supabase/{client,server,admin,types}.ts`
- `src/lib/coaching/auth-bridge.ts` — génération JWT custom à partir du token Shopify
- `src/app/(admin)/layout.tsx` — vérif `email ∈ COACHING_ADMIN_EMAILS`
- `src/app/(admin)/admin/coaching/page.tsx` — placeholder dashboard
- Modifs `src/context/CustomerContext.tsx` — au login Shopify, sync vers Supabase
- `.env.local.example` — ajouter les 4 vars Supabase + `COACHING_ADMIN_EMAILS`

**Critères de validation** :
- [ ] Migration appliquée sur projet Supabase EU
- [ ] Login Shopify crée automatiquement une ligne `profiles` côté Supabase
- [ ] L'email admin défini dans `COACHING_ADMIN_EMAILS` accède à `/admin/coaching` ; tout autre user a 403
- [ ] RLS testées : un user A ne peut lire que ses propres données

**Risques** :
- Bridge auth Shopify→Supabase est la partie la plus délicate. Si on n'arrive pas à signer un JWT compatible RLS, fallback Option B (double auth).

---

## Sprint 2 — Intake + Génération IA + PDF (≈ 12-16h)

**Objectif mesurable** : un client paie 49€ via Stripe, est redirigé vers `/coaching/intake`, remplit le formulaire en 5 étapes, voit son programme apparaître en `pending_review` côté admin (mais ne peut pas encore le télécharger).

**Fichiers** :
- `src/app/(coaching)/coaching/intake/page.tsx` + tous les `steps/*`
- `src/components/coaching/intake/{IntakeStepper, HealthDisclaimer}.tsx`
- `src/app/api/coaching/intake/route.ts` — POST → insert `intakes`
- `src/lib/coaching/{anthropic,prompts,product-matcher,pdf}.ts`
- `src/app/api/coaching/generate-program/route.ts` — appel Claude → insert `programs` (status=`pending_review`)
- Choix lib PDF : **`@react-pdf/renderer`** recommandé (rendering pur JS, runtime serverless OK, contrôle UI fin) plutôt que Puppeteer (lourd, fragile sur Vercel serverless, nécessite Chromium)
- 🔧 Modif `src/app/api/stripe/webhook/route.ts` — au `checkout.session.completed` pour `program_personalized`, créer une ligne `programs` vide avec `status=generating` puis rediriger user vers intake

**Critères de validation** :
- [ ] Paiement test 49€ déclenche redirection vers intake
- [ ] Soumission intake déclenche appel Claude avec prompt structuré
- [ ] PDF se génère dans Supabase Storage (URL accessible via signed URL)
- [ ] Le programme apparaît dans `/admin/coaching` avec status `pending_review`
- [ ] Disclaimer santé bloquant (checkbox obligatoire)

**Risques** :
- Latence Claude 5-15s — UX : afficher un état "Génération en cours" + email "votre programme arrive sous 24h" (le coach valide derrière)
- Coût API Claude : ~$0.05-0.15 par programme (Sonnet 4) → marge sur 49€ confortable
- Hallucinations sur les exercices : prompt strict + JSON schema + retry si parsing échoue

---

## Sprint 3 — Validation admin + Envoi client + Espace client (≈ 8-10h)

**Objectif mesurable** : le coach relit un programme depuis `/admin/coaching/programs/[id]`, ajoute des notes, clique "Valider et envoyer", le client reçoit un email avec lien vers son espace `/account/coaching/programmes/[id]` où il télécharge le PDF.

**Fichiers** :
- `src/app/(admin)/admin/coaching/programs/[id]/page.tsx` — viewer + éditeur (textarea pour `coach_notes`, possibilité de modifier le `content` JSON)
- `src/app/api/coaching/validate-program/route.ts` — passe à `status=ready` + envoie email Resend
- 🔧 `src/app/(nutrition)/account/coaching/page.tsx` — lister les programmes Supabase
- `src/app/(nutrition)/account/coaching/programmes/[id]/page.tsx` — viewer + bouton télécharger PDF
- `src/components/coaching/{ProgramViewer, ProductRecommendations}.tsx`
- `src/lib/coaching/emails.ts` — template "Votre programme est prêt"
- `src/app/api/coaching/pdf/[programId]/route.ts` — signed URL Supabase Storage (vérif RLS)

**Critères de validation** :
- [ ] Coach voit la file d'attente triée par `created_at` ASC
- [ ] Validation envoie email + change status
- [ ] Client voit son programme dans `/account/coaching` avec téléchargement PDF
- [ ] Recommandations produits affichent 2-4 cards Shopify avec code promo

**Risques** :
- L'éditeur admin doit valider que le JSON reste bien formé après modification (Zod ou JSONSchema côté API)

---

## Sprint 4 — Abonnement 89€/mois + Check-ins (≈ 10-14h)

**Objectif mesurable** : un client souscrit à l'abonnement, bénéficie immédiatement d'un programme initial (flow Sprint 2-3 réutilisé), et chaque semaine peut soumettre un check-in que le coach voit dans `/admin/coaching/checkins`.

**Fichiers** :
- 🔧 `src/app/api/stripe/webhook/route.ts` — ajouter `invoice.paid`, `invoice.payment_failed`, sync table `subscriptions`
- `src/app/(nutrition)/account/coaching/checkins/page.tsx` — formulaire + historique
- `src/components/coaching/CheckinForm.tsx`
- `src/app/api/coaching/checkin/route.ts` — POST client
- `src/app/api/coaching/checkin-response/route.ts` — POST admin
- `src/app/(admin)/admin/coaching/checkins/page.tsx` — file d'attente
- 🔧 `src/lib/coaching/emails.ts` — templates "Check-in confirmé", "Coach a répondu"
- Cron job (Vercel Cron) — chaque dimanche à 18h, envoyer un rappel email aux abonnés actifs

**Critères de validation** :
- [ ] Souscription Stripe crée ligne `subscriptions` Supabase
- [ ] Renouvellement mensuel met à jour `current_period_end`
- [ ] Client peut soumettre un check-in / semaine max
- [ ] Coach voit les check-ins en attente avec délai depuis soumission
- [ ] Réponse coach → email client

**Risques** :
- Logique de renouvellement programme tous les 3 mois : qui déclenche ? Cron ? Bouton manuel coach ?

---

## Sprint 5 — Cal.com + PDF amélioré + Polish (≈ 6-10h)

**Objectif mesurable** : un abonné peut booker son appel mensuel via Cal.com embed depuis son espace, le coach reçoit la notification, et tout le tunnel est testé end-to-end avec données réelles.

**Fichiers** :
- `src/app/(nutrition)/account/coaching/rdv/page.tsx` — embed `<Cal />` ou iframe
- Webhook Cal.com → log dans Supabase (table `coaching_calls` à ajouter si besoin)
- 🔧 PDF : design final, header logo, branding sage/cream, recommandations produits avec QR code
- 🔧 Emails : templates HTML stylés (cohérent avec la marque)
- Tests E2E : 1 cycle complet 49€ + 1 cycle complet 89€/mois (avec Stripe test cards)
- Documentation `docs/coaching-runbook.md` pour le coach (comment valider un programme, comment voir les check-ins)

**Critères de validation** :
- [ ] Cal.com event triggers webhook → notif Resend
- [ ] PDF final design validé visuellement
- [ ] 2 parcours end-to-end OK en prod

**Risques** :
- Cal.com gratuit limite certaines features. Confirmer plan nécessaire (Free vs Teams).

---

# ⚠️ POINTS D'ATTENTION

## 1. RGPD — Données de santé (art. 9)

Les champs `injuries`, `medications`, `allergies`, `weight_kg`, `measurements` sont des **données de santé** au sens RGPD art. 9. Conséquences :

- **Hébergement EU obligatoire** : projet Supabase en région `eu-west-3` (Paris) ou `eu-central-1`
- **Consentement explicite double** :
  1. Disclaimer santé : *"Body Start n'est pas un professionnel de santé. Les recommandations sont générées par intelligence artificielle puis relues par un coach sportif certifié, mais ne se substituent pas à un avis médical. Consultez votre médecin avant tout changement significatif d'activité physique ou alimentaire, en particulier en cas de pathologie, grossesse, ou traitement médicamenteux en cours."* + checkbox obligatoire
  2. Consentement traitement données santé : checkbox séparée *"J'autorise Body Start à traiter mes données de santé pour la génération et le suivi de mon programme personnalisé. Je peux retirer ce consentement à tout moment via mon espace client."*
- **Durée de conservation** : à définir (recommandation : 3 ans après dernière connexion, puis suppression auto via cron)
- **Droit à l'effacement** : bouton "Supprimer mon compte coaching" dans `/account/coaching` qui supprime toutes les données Supabase liées
- **Mise à jour des CGV / Politique de confidentialité** : ajouter section coaching avec mention RGPD art. 9, liste des sous-traitants (Supabase, Anthropic, Stripe, Resend) et de leur localisation
- **Anthropic et données santé** : par défaut, Anthropic ne stocke PAS les inputs API (zero retention pour les comptes API standard, à confirmer dans le contrat). À documenter dans la politique de confidentialité.
- **Pas de DPO obligatoire** vu la taille de l'activité, mais tenir un **registre des traitements** simple (table dans un Notion suffit)

## 2. Cohérence design / branding

Le brief mentionne "DM Sans + Playfair Display" et "cream/ivory + deep sage green". Le codebase utilise **Inter + Montserrat** et a déjà une palette `coaching-cyan` (cyan, pas sage). Soit :
- (A) On aligne le coaching sur l'esthétique nutrition existante (sage/cream/Inter/Montserrat) — cohérence forte de marque
- (B) On adopte le brief tel quel et on retravaille la palette coaching

→ Question critique pour le gérant.

## 3. Catalogue Stripe désaligné

Les 5 produits Stripe existants (199€/149€/59€/89€/499€) ne correspondent pas aux 2 offres du brief (49€/89€). Il faut décider :
- Archiver les 3 anciens programmes (199€, 149€, 499€)
- Garder la séance unique 59€ ?
- Renommer l'abonnement existant pour matcher "Suivi Personnalisé"

## 4. Auth Supabase ↔ Shopify

Le bridge JWT (Option A) est la solution la plus propre mais demande une session signée côté serveur. Si trop complexe au Sprint 1, fallback sur Option B (double user Shopify+Supabase synchronisé via service-role).

## 5. Coût Anthropic API

Estimation : 50 programmes / mois × $0.10 = $5/mois en Sonnet 4. Négligeable. Si volume × 100 → repasser sur Haiku pour les drafts puis Sonnet pour la version finale validée.

## 6. Click & Collect coaching ?

Les programmes IA peuvent recommander des produits Shopify. Faut-il proposer le retrait en boutique pour ces produits ? La logique Click & Collect existe déjà dans `CartContext` — devrait fonctionner naturellement si le client ajoute les produits recommandés au panier.

---

# ❓ QUESTIONS CRITIQUES POUR LE GÉRANT

Avant de pouvoir coder le Sprint 1, il faut trancher ces 5 points :

1. **Auth bridge Supabase** — On part sur Option A (JWT custom signé, plus propre) ou Option B (double user synchronisé, plus simple mais 2 systèmes à maintenir) ?

2. **Catalogue Stripe** — On archive les 3 anciens programmes (199€/149€/499€) pour ne garder que le nouveau 49€ + l'abonnement 89€/mois + (peut-être) la séance 59€ ? Ou on garde tout et on positionne le 49€ comme "produit d'appel" ?

3. **Branding coaching** — On garde l'esthétique nutrition (sage/cream/Inter/Montserrat) déjà en place, ou on rebascule sur DM Sans/Playfair + sage comme dans le brief initial ? La palette `coaching-cyan` actuelle est-elle conservée ou remplacée ?

4. **Code promo cross-sell** — Le brief dit -10%, le code existant fait -15%. On reste sur -15% (avantage client + déjà déployé) ou on passe à -10% (marge nutrition préservée) ? Et est-ce **un seul code permanent** par client ou **un nouveau code par programme** ?

5. **Validation manuelle obligatoire ?** — Le brief dit que le coach valide chaque programme avant envoi. Confirme : aucun programme n'est jamais envoyé directement au client sans relecture coach (même si délai 24-48h) ? Ou y a-t-il un mode "auto-envoi" possible pour des cas simples ?

---

*Plan rédigé après audit READ-ONLY du codebase. Aucun fichier de code modifié. Prochaine étape : décision du gérant sur les 5 questions ci-dessus, puis démarrage Sprint 1.*
