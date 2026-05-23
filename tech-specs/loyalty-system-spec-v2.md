# Spec technique V2 — Fidélité & parrainage BodyStart (Shopify + Supabase)

> **Remplace** `loyalty-system-spec.md` (bannie : bâtie sur une stack Drizzle/SQLite inexistante). Ce doc V2 est la **seule source de vérité technique**.
> **Audience** : Claude Code (repo `Bodystart_protocole`) + Adam.
> **Stack réelle** : Next.js App Router + TypeScript · e-commerce compléments sur **Shopify** (Storefront API, commandes côté Shopify) · **Supabase** (Postgres + Auth) · Tailwind custom (pas de shadcn). Les ventes **boutique ne passent PAS par Shopify** (caisse séparée).

---

## 0. Décisions cadre (verrouillées)

**Mécanique** (décision Adam 2026-05-22, inchangée) :
- Identité client = **numéro de téléphone** (E.164). Le téléphone est la carte, pas de carte physique.
- **Pas de cash-back sur ses propres achats.** Un client ne gagne rien sur ce qu'il achète pour lui.
- **Parrainage = seule source de cagnotte** : quand un filleul achète, le **parrain gagne 5 % du montant payé par le filleul**, en ligne ET en boutique, pendant **12 mois** à compter du 1ᵉʳ achat du filleul.
- **Filleul** : **−5 €** sur sa 1ʳᵉ commande (≥ 40 €). Pas de bonus flat pour le parrain (sa récompense = les 5 % récurrents).
- **Cagnotte** utilisable par le parrain sur ses propres achats : **min 20 € de solde** pour pouvoir l'utiliser, **plafond 50 % du panier** par commande.
- **Pas d'expiration** de la cagnotte.

**Architecture cadre** (décisions Adam 2026-05-23) :
- Boutique = **caisse séparée** → on construit `/staff/caisse` qui écrit dans Supabase. Le **ledger loyalty vit dans Supabase**.
- Site = **compte client existant** (auth à confirmer, probablement Supabase Auth vu la table `profiles`).
- Promo "-10 % Insta" : **abandonnée**, ne pas l'intégrer.

---

## ✅ PHASE 0 — Audit pré-build (RÉSOLU 2026-05-23)

> **Synthèse de l'audit Claude Code** :
> 1. **Admin API OK** (`write_discounts`, `read_customers`, `write_customers` actifs). À activer : scope **`read_orders`** + enregistrer le webhook `orders/paid`. Dev store `bodystart-dev-store.myshopify.com`, **pas de Plus** → store credit natif indisponible.
> 2. **Checkout = hébergé Shopify** (`checkoutUrl`). Code de réduction applicable via `cartDiscountCodesUpdate` (Storefront) ou `?discount=CODE`. Pas de checkout custom à construire.
> 3. **Téléphone au checkout = optionnel** par défaut → décision : **le rendre obligatoire** (Settings Shopify) pour fiabiliser l'identité loyalty.
> 4. **Auth site = Shopify Customer Account API** (cookie `body-start-customer-token`), **pas Supabase Auth** sur `main` → matching loyalty par **email Shopify / `shopify_customer_id`** (option B).
> 5. **Supabase** : 0 collision `loyalty_*`, RLS + helper admin + service role déjà en place. Créer les tables dans le schéma `public`.
> 6. **Webhook** : dupliquer le pattern Stripe (`src/app/api/stripe/webhook/route.ts`), raw body + HMAC. Ajouter `SHOPIFY_WEBHOOK_SECRET` (env Vercel, sensitive).
>
> **Décisions** : plan cible **Basic** → **méthode A** (codes de réduction). Auth = **option B** (email). Téléphone checkout = **obligatoire** (à toggler côté Shopify).

Questions d'origine conservées pour historique :

1. **Shopify Admin API** : a-t-on un accès Admin API (app custom + token) en plus du Storefront ? Quels scopes dispo/activables : `read_orders`, `write_discounts`, `read_customers`/`write_customers`, gestion des **webhooks** ? Quel plan Shopify (Basic / Shopify / Advanced / Plus) ? **Le store credit natif Shopify n'est dispo qu'en Plus** — confirme.
2. **Checkout en ligne** : le checkout est-il le **checkout hébergé Shopify** (`*.myshopify.com` / `checkout`) ou un checkout custom dans le Next ? Peut-on **appliquer un code de réduction programmatiquement** (cart attributes / discount code) et où le client saisit-il un code ?
3. **Téléphone au checkout** : le checkout Shopify collecte-t-il le **numéro de téléphone** (obligatoire ?) ? C'est notre clé d'identité. Sinon, comment relie-t-on une commande en ligne à un `loyalty_customer` (email ?).
4. **Auth site** : quel mécanisme (Supabase Auth ? autre) ? Comment lier un user connecté à un `loyalty_customer` (match email ? vérification par téléphone ?).
5. **Schéma Supabase existant** : confirme l'absence de collision avec les tables `loyalty_*` proposées ci-dessous. RLS est-il activé sur le projet ? Existe-t-il une clé **service role** côté serveur (pour les écritures privilégiées) ?
6. **Webhooks** : peut-on exposer une route Next `/api/loyalty/shopify-webhook` et enregistrer le webhook `orders/paid` côté Shopify ? Où stocke-t-on le `SHOPIFY_WEBHOOK_SECRET` ?

Selon les réponses (surtout 1 et 2), on choisit la **méthode de redemption en ligne** (codes de réduction Admin API vs store credit). Le reste de la spec tient quelle que soit la réponse.

---

## 1. Architecture d'ensemble

```
                 ┌─────────────────────────────┐
   Vente EN      │   /staff/caisse (Next)      │
   BOUTIQUE ───▶ │   auth staff                │──┐
                 └─────────────────────────────┘  │
                                                   ▼
   Commande      ┌─────────────────────────────┐  ┌──────────────────────────┐
   EN LIGNE ───▶ │ Shopify (checkout + order)  │  │ finalize_order_loyalty()  │
   (Shopify)     └──────────────┬──────────────┘  │  = fonction Postgres      │
                                │ webhook          │  SECURITY DEFINER,        │
                                │ orders/paid      │  atomique (transaction)   │
                                ▼                  │                           │
                 ┌─────────────────────────────┐  │  - écrit loyalty_trans    │
                 │ /api/loyalty/shopify-webhook │─▶│  - met à jour balance     │
                 │  (vérif HMAC obligatoire)    │  │  - commission parrain     │
                 └─────────────────────────────┘  └─────────────┬─────────────┘
                                                                 ▼
                                                        ┌──────────────────┐
                                                        │ Supabase Postgres │
                                                        │  = source vérité  │
                                                        │  loyalty          │
                                                        └──────────────────┘
```

Principe clé : **toute** mutation du solde passe par **une seule fonction serveur atomique** (`finalize_order_loyalty`). Aucune écriture directe du solde depuis le client. Boutique et en ligne convergent vers cette fonction.

### 1.1 Note POS : GestMag aujourd'hui, Shopify POS visé (stock unifié)

État actuel (Adam, 2026-05-23) : la boutique physique tourne sur **GestMag V2 (2019)**. Objectif à terme : passer la boutique sur **Shopify (POS)** pour **unifier le stock** boutique + en ligne.

Conséquence pour le loyalty : **la cagnotte est custom (Supabase), donc AUCUN logiciel de caisse (ni GestMag ni Shopify POS) ne la gère nativement.** Un écran loyalty dédié est nécessaire dans tous les cas. On conçoit donc `/staff/caisse` comme un **terminal loyalty POS-agnostique** : le staff identifie le client (téléphone), voit/applique la cagnotte, valide → écrit dans Supabase. Le paiement et le stock restent gérés par le logiciel de caisse (GestMag maintenant, Shopify POS plus tard). Quand la migration Shopify POS aura lieu, les ventes boutique pourront aussi remonter via le **même webhook** que l'online, sans rien jeter de ce terminal.

⚠️ **Risque opérationnel à signaler hors loyalty** : tant que la boutique est sur GestMag et l'online sur Shopify, **les deux stocks sont séparés** → risque de survente (vendre en ligne un produit déjà parti en boutique). C'est le vrai argument derrière la migration souhaitée. À traiter dans un chantier dédié (cf. note Adam), indépendant du loyalty.

---

## 2. Modèle de données (Supabase / Postgres)

À créer via migration SQL versionnée. Adapter les noms si collision (cf. Phase 0).

```sql
-- Clients loyalty (identité = téléphone). Distinct des customers Shopify.
create table loyalty_customers (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,                 -- E.164 : +33612345678
  email text unique,
  first_name text not null,
  last_name text,
  shopify_customer_id text unique,            -- lien vers le compte Shopify (auth = Shopify Customer API, pas Supabase Auth)
  loyalty_balance_cents integer not null default 0,
  referral_code text not null unique,         -- BS-XXXXX
  referred_by_code text,                      -- code du parrain à l'inscription
  has_first_purchase boolean not null default false,
  first_purchase_at timestamptz,
  referral_commission_until timestamptz,      -- first_purchase_at + 12 mois
  email_opt_in boolean not null default false,
  source text not null default 'online' check (source in ('in_store','online','import_legacy')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Grand livre des mouvements de cagnotte. amount_cents toujours positif ; le type porte le signe.
create table loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references loyalty_customers(id),
  type text not null check (type in ('referral_commission','spend','adjustment','import_credit')),
  amount_cents integer not null,
  balance_after_cents integer not null,       -- solde après application (audit/affichage)
  channel text not null check (channel in ('in_store','online')),
  shopify_order_id text,                       -- si commande en ligne
  related_customer_id uuid references loyalty_customers(id), -- le filleul, pour une referral_commission
  staff_user_id uuid,                          -- qui a saisi (caisse), pour audit
  notes text,
  created_at timestamptz not null default now()
);

-- Idempotence des webhooks Shopify (évite le double traitement sur retry).
create table loyalty_processed_orders (
  shopify_order_id text primary key,
  processed_at timestamptz not null default now()
);

-- Réservations de cagnotte pour le checkout en ligne (pattern reserve -> confirm).
create table loyalty_redemptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references loyalty_customers(id),
  amount_cents integer not null,
  discount_code text not null,                 -- code Shopify généré
  status text not null default 'reserved' check (status in ('reserved','applied','expired','cancelled')),
  shopify_order_id text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
```

Pas de type `earn` : on ne crédite jamais un achat perso. Le crédit vient uniquement de `referral_commission` (et `import_credit` pour les legacy).

### RLS (Row Level Security) — OBLIGATOIRE

⚠️ Auth site = **Shopify Customer Account API** (pas Supabase Auth). Le navigateur n'a donc **aucun JWT Supabase** : le client ne parle jamais directement à Supabase pour le loyalty.
- RLS = **deny par défaut** pour `anon` et `authenticated`. Aucune lecture/écriture loyalty directe depuis le client.
- Tous les accès passent par des **routes serveur Next** qui : 1) authentifient via le token Shopify customer (cookie `body-start-customer-token`), 2) résolvent le `loyalty_customer` par email / `shopify_customer_id`, 3) lisent/écrivent avec la **clé service role** (jamais exposée au client).
- Les mutations de solde passent par `finalize_order_loyalty` (`SECURITY DEFINER`) ou le service role. Jamais d'écriture client.

---

## 3. Règles métier (fonctions pures testables, `lib/loyalty/`)

```typescript
const REFERRAL_COMMISSION_RATE = 0.05;   // 5% → cagnotte du parrain
const REFERRAL_WINDOW_MONTHS = 12;
const FILLEUL_DISCOUNT_CENTS = 500;      // -5€ 1ère commande filleul
const FILLEUL_MIN_ORDER_CENTS = 4000;    // 40€
const REDEEM_MIN_BALANCE_CENTS = 2000;   // 20€ minimum de solde pour utiliser
const REDEEM_CART_CAP_RATIO = 0.5;       // max 50% du panier

// Commission versée au parrain sur une commande du filleul.
// base = montant produits payé par le filleul (hors livraison, hors taxe, après remises/cagnotte).
export function calcReferrerCommissionCents(filleulPaidCents: number): number {
  return Math.floor(filleulPaidCents * REFERRAL_COMMISSION_RATE);
}

// Cagnotte utilisable par le parrain sur SA commande.
export function maxRedeemableCents(cartSubtotalCents: number, balanceCents: number): number {
  if (balanceCents < REDEEM_MIN_BALANCE_CENTS) return 0;
  const cap = Math.floor(cartSubtotalCents * REDEEM_CART_CAP_RATIO);
  return Math.min(balanceCents, cap);
}

// Code parrainage : BS-XXXXX, alphabet sans 0/O/1/I/L. Boucle + check unicité en base.
export function generateReferralCode(): string {
  const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return 'BS-' + Array.from({length:5}, () => a[Math.floor(Math.random()*a.length)]).join('');
}
```

**Base de la commission** : 5 % du sous-total **produits réellement payé** par le filleul (hors frais de port, hors taxes, après déduction des remises et de sa propre cagnotte éventuelle). À confirmer Adam (cf. §9).

---

## 4. Capture des commandes

### 4.1 En ligne — webhook Shopify `orders/paid`

Route `POST /api/loyalty/shopify-webhook` :
1. **Vérifier la signature HMAC** (`X-Shopify-Hmac-Sha256` + `SHOPIFY_WEBHOOK_SECRET`). Rejeter si invalide. C'est la frontière de confiance, non négociable.
2. Idempotence : si `shopify_order_id` déjà dans `loyalty_processed_orders`, ignorer (les webhooks Shopify peuvent être rejoués).
3. Extraire : téléphone (ou email), sous-total produits payé, codes de réduction utilisés (dont un éventuel **code parrain** et un éventuel **code cagnotte** réservé), montant de cagnotte réservée associée.
4. Appeler `finalize_order_loyalty(...)` (channel `online`).

### 4.2 En boutique — `/staff/caisse`

Route `POST /api/loyalty/finalize` (auth staff) → appelle directement `finalize_order_loyalty(...)` (channel `in_store`). Pas de Shopify impliqué.

### 4.3 Logique de `finalize_order_loyalty` (atomique)

Entrées : `customerId` (acheteur), `orderRef` (shopify_order_id ou id caisse), `paidItemsCents`, `spentLoyaltyCents`, `referralCodeUsed?`, `channel`, `staffUserId?`.

Dans **une seule transaction** :
1. Idempotence (si online) : insérer dans `loyalty_processed_orders`, sinon sortir.
2. Si `spentLoyaltyCents > 0` : vérifier `balance >= spentLoyaltyCents`, écrire transaction `spend`, décrémenter le solde.
3. **Pas d'auto-cashback** sur l'achat perso.
4. Si **1ᵉʳ achat** de l'acheteur (`has_first_purchase = false`) :
   - Si `referred_by_code` présent ET commande ≥ 40 € : le **−5 € filleul** a déjà été appliqué au checkout (remise, pas cagnotte).
   - Fixer `first_purchase_at = now`, `referral_commission_until = now + 12 mois`, `has_first_purchase = true`.
5. **Commission parrain** : si l'acheteur a un `referred_by_code` ET `now <= referral_commission_until` du filleul :
   - Trouver le parrain via `referred_by_code`.
   - Créditer le parrain de `calcReferrerCommissionCents(paidItemsCents)`.
   - Écrire transaction `referral_commission` côté parrain (`related_customer_id` = filleul).
6. Renvoyer earned/spent + nouveau solde.

> Implémentation : privilégier une **fonction Postgres** (`SECURITY DEFINER`) appelée via `supabase.rpc(...)` pour garantir l'atomicité, plutôt qu'une suite de requêtes côté Node. Sinon, route serveur avec transaction explicite via le client service role.

---

## 5. Utilisation de la cagnotte EN LIGNE (le point délicat)

Shopify ne connaît pas la cagnotte Supabase. **Méthode retenue : A** (codes de réduction Admin API), confirmée par l'audit : checkout hébergé Shopify, `cartDiscountCodesUpdate` dispo côté Storefront, Admin API `write_discounts` actif.

**Méthode A — Codes de réduction Admin API (par défaut, marche sur tous les plans)**
1. Au checkout, le widget appelle `POST /api/loyalty/redeem-online` : valide `maxRedeemableCents`, **crée un code de réduction Shopify unique** (montant fixe, usage unique) via Admin API, insère une ligne `loyalty_redemptions` (status `reserved`, `expires_at = now + 1h`), renvoie le code appliqué au panier.
2. Le client paie ; le code réduit le total côté Shopify.
3. Le webhook `orders/paid` voit le code utilisé → `finalize` écrit le `spend`, passe la réservation en `applied`, décrémente le solde.
4. Un job (cron / edge function) **expire** les réservations non payées après 1h et supprime le code Shopify (anti-fuite de solde).

**Méthode B — Store Credit natif Shopify (Plus uniquement)** : ❌ **écartée** (audit 2026-05-23 : dev store, pas de Plus, plan cible Basic).

**Code parrain / −5 € filleul en ligne** : pré-créer (via Admin API, à l'inscription du parrain) un **code de réduction Shopify = le `referral_code`** (montant fixe −5 €, minimum 40 €). Quand le filleul l'applique au checkout, Shopify fait la remise et le webhook lit le code → on rattache le filleul au parrain. Les règles "1ʳᵉ commande / une fois par filleul" sont **réconciliées dans Supabase** (pas la peine que Shopify les garantisse).

---

## 6. Routes API (Next.js App Router)

```
POST /api/loyalty/customers/upsert      -> créer/récupérer par téléphone (E.164), génère referral_code + code Shopify
POST /api/loyalty/preview               -> { balance, maxRedeemable, applied, willEarn(0), finalAmount }
POST /api/loyalty/redeem-online         -> réserve + crée code Shopify (méthode A)
POST /api/loyalty/finalize              -> caisse boutique (auth staff) -> finalize_order_loyalty
POST /api/loyalty/shopify-webhook       -> orders/paid (vérif HMAC) -> finalize_order_loyalty
GET  /api/loyalty/me                    -> solde + 20 dernières transactions (user connecté, RLS)
POST /api/admin/loyalty/import          -> import CSV legacy (auth admin)
```

Validation runtime des inputs avec **Zod**. Téléphone validé en E.164 via **libphonenumber-js**.

---

## 7. UI

### 7.1 `/mon-compte` (user connecté)
- Header : prénom + **solde cagnotte en gros**.
- Bloc parrainage : `referral_code` en évidence (vert mousse), boutons Copier / Partager WhatsApp / DM. Phrase d'incentive **sans tiret cadratin** : "Ton pote a 5 € sur sa première commande, et tu touches 5 % de ses achats pendant 1 an."
- Historique transactions (date, type, montant, solde après), filtrable.
- Lien vers commandes si rattachables.
- **Lien compte ↔ loyalty_customer** : à la 1ʳᵉ visite, matcher par email ou demander le téléphone (vérif légère). Cf. Phase 0 pt 4.

### 7.2 `/parrainage` (page publique, SEO local)
- Explique le programme : 1. tu partages ton code · 2. ton pote a 5 € sur sa 1ʳᵉ commande (dès 40 €) · 3. tu touches 5 % de ses achats pendant 12 mois.
- FAQ (nombre de parrainages illimité ? cumul avec autres remises ? etc.).
- CTA connexion / création de compte. **Aucun tiret cadratin dans le copy.**

### 7.3 Widget checkout `CheckoutLoyaltyWidget`
- Solde < 20 € : message simple, pas de bouton ("Tu cumules grâce au parrainage").
- Solde ≥ 20 € : slider "j'utilise X €" (plafonné à 50 % du panier), recalcul live, appelle `redeem-online`.

### 7.4 `/staff/caisse` (auth staff, plein écran tactile)
- Saisie téléphone client → lookup/création.
- Affiche solde. Saisie montant vente. Option "utiliser cagnotte" (cap 50 %, min 20 €).
- Bouton Valider → `POST /api/loyalty/finalize` (channel `in_store`, `staff_user_id` loggé pour audit).
- Confirmation : "Vente validée." + si le client est un filleul actif, le parrain est crédité automatiquement.

---

## 8. Sécurité

- **HMAC** obligatoire sur le webhook Shopify.
- Écritures de solde **uniquement** via `finalize_order_loyalty` (SECURITY DEFINER) ou routes service-role. **RLS** stricte côté client.
- Pas de modification de solde côté client.
- Caisse : **rôle staff** requis (auth). `staff_user_id` loggé sur chaque transaction in_store (audit anti-fraude).
- Rate limiting sur `customers/upsert` (anti-spam).
- Validation E.164 stricte (libphonenumber-js).
- Idempotence webhook via `loyalty_processed_orders`.

---

## 9. À CONFIRMER Adam (business)

1. **Base de la commission 5 %** : sous-total produits payé hors port/taxes (recommandé) ? OK ?
2. **Crédit d'accueil legacy** : à l'import des clients du cahier comptoir, on offre 5 € de cagnotte chacun (réactivation) ? (Reco V1.)
3. **Comptes staff** : qui a accès à `/staff/caisse` ? Toi, Théo, futurs employés ? Combien de comptes ?
4. **Import legacy** : tu as une liste papier de clients existants à importer (téléphone, prénom) ?

---

## 10. Tests (min 80 % sur `lib/loyalty/`)

- `calculate.test.ts` : commission, plafond redemption, min solde, edge cases.
- `referral.test.ts` : génération code, unicité, fenêtre 12 mois.
- `finalize.integration.test.ts` : happy path + anti double-spend + idempotence webhook (même order_id rejoué) + 1ʳᵉ commande filleul (set des dates) + commission parrain hors fenêtre (ne crédite pas).

---

## 11. Découpage en sprints

| Sprint | Contenu | Estim |
|---|---|---|
| L0 | **Audit Phase 0** (réponses aux 6 points) | 0,5 j |
| L1 | Migration Supabase + RLS + fonctions pures + tests unitaires | 1,5 j |
| L2 | `finalize_order_loyalty` (Postgres) + webhook Shopify (HMAC) + route caisse + upsert customer | 2 j |
| L3 | Redemption en ligne (méthode A : codes Admin API, reserve/confirm + expiration) + code parrain −5 € | 2 j |
| L4 | Page Mon compte + page Parrainage + widget checkout | 1,5 j |
| L5 | `/staff/caisse` + auth staff + tests E2E | 1,5 j |
| L6 | Emails Resend (welcome, commission créditée) + import legacy CSV | 1 j |

Total ≈ 10 jours dev. Le chemin critique est L2/L3 (intégration Shopify).

---

## 12. Hors-scope V2 (plus tard)

Tiers Bronze/Silver/Gold, points (vs cash-back), bonus anniversaire, push, challenges, app mobile. À rediscuter après 3 mois d'usage réel.
