# CLAUDE.md — Body Start

## Projet

Body Start est une plateforme e-commerce headless multi-univers pour une marque de compléments alimentaires sportifs avec des boutiques physiques en Ile-de-France.

- **Stack** : Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS + Shopify Storefront API + Admin API (GraphQL)
- **Phase actuelle** : Phase 1 — Nutrition + Phase 2 Click & Collect + Phase 3 Coaching & Stripe (en cours)
- **Phases futures** : Vêtements
- **Langue du site** : Français (FR)
- **Monnaie** : EUR
- **Shopify store** : bodystart-dev-store.myshopify.com

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (providers, fonts, metadata, CookieBanner)
│   ├── error.tsx           # Error boundary root
│   ├── (nutrition)/        # Route group Nutrition — toutes les pages boutique
│   │   ├── layout.tsx      # Header + Footer + CartDrawer + JSON-LD + revalidate=3600
│   │   ├── error.tsx       # Error boundary Nutrition
│   │   ├── page.tsx        # Homepage
│   │   ├── products/       # Catalogue et fiches produit (+ stock en temps réel)
│   │   ├── collections/    # Collections Shopify (+ breadcrumb JSON-LD)
│   │   ├── objectifs/      # Navigation par objectif fitness
│   │   ├── blog/           # Articles (+ loading.tsx)
│   │   ├── account/        # Espace client (protégé par middleware + error.tsx + loading.tsx)
│   │   │   └── coaching/   # Dashboard coaching, programmes/[id], suivi de progression
│   │   ├── stores/         # Boutiques physiques (+ loading.tsx)
│   │   └── ...             # Pages légales, auth, etc.
│   ├── (coaching)/         # Route group Coaching (pages publiques : home, programmes, tarifs)
│   └── api/
│       ├── contact/        # Formulaire de conseil (Resend + rate limit)
│       ├── newsletter/     # Inscription newsletter (Resend contacts)
│       ├── inventory/      # Stock en temps réel par variante/location (Admin API + rate limit)
│       └── stripe/
│           ├── checkout/   # POST — crée une Stripe Checkout Session (coaching)
│           └── webhook/    # POST — gère checkout.completed + subscription.deleted
├── components/
│   ├── layout/             # Header (Suspense-wrapped), Footer
│   ├── home/               # Sections homepage
│   ├── product/            # ProductCardShop (carte catalogue), v2/ (BuyBoxV2, ProductGalleryV2, ReviewsV2…), StarRating
│   ├── cart/               # CartDrawer (avec toggle Click & Collect)
│   └── ui/                 # Button, SearchBar, BackToTop, CookieBanner, Reveal (apparitions au scroll), PhoneField
├── context/
│   ├── CartContext.tsx      # Panier global (+ setCartAttributes pour Click & Collect)
│   └── CustomerContext.tsx  # Auth client (Shopify Customer API)
├── hooks/
│   └── useCart.ts           # Hook wrapper pour CartContext
├── lib/
│   ├── shopify/
│   │   ├── client.ts       # GraphQL clients (Storefront + Admin API)
│   │   ├── index.ts        # Fonctions API (products, collections, cart, blog, inventory)
│   │   ├── customer.ts     # Auth (login, register, token management + cookie sync)
│   │   ├── types.ts        # Interfaces TypeScript + config boutiques physiques
│   │   ├── discounts.ts    # Création/désactivation codes promo coaching -15% (Admin API)
│   │   └── queries/        # Requêtes GraphQL (products, collections, cart, customer, blog, inventory)
│   ├── stripe/
│   │   ├── index.ts        # Client Stripe server-side
│   │   └── types.ts        # CoachingProduct, CoachingSubscription, CoachingSession + catalogue COACHING_PRODUCTS
│   ├── judgeme/index.ts     # Intégration Judge.me (avis clients)
│   └── utils.ts            # formatPrice, cn, getDiscountPercentage, etc.
├── middleware.ts            # Protection routes /account/* (cookie check)
└── styles/globals.css       # Tailwind directives + design system CSS
```

## Commandes

```bash
npm run dev       # Dev server (localhost:3000)
npm run build     # Build production
npm start         # Serveur production
npm run lint      # ESLint
```

## Variables d'environnement requises

```env
# Shopify (obligatoire)
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=bodystart-dev-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxx

# Shopify Admin API (requis pour Inventory/Click & Collect)
SHOPIFY_ADMIN_API_ACCESS_TOKEN=xxx

# Email (pour /api/contact + /api/newsletter)
RESEND_API_KEY=re_xxx
CONTACT_EMAIL_TO=contact@bodystart.com
RESEND_AUDIENCE_ID=xxx                    # Audience Resend pour la newsletter (optionnel)

# Site
NEXT_PUBLIC_SITE_URL=https://bodystart.com

# Upstash Redis (rate limiting — /api/contact, /api/inventory)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Stripe (coaching — paiements + abonnements)
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Optionnel
JUDGEME_PUBLIC_TOKEN=xxx                     # Avis clients
JUDGEME_PRIVATE_TOKEN=xxx
```

## Tests en local

### Webhooks Stripe

Les webhooks Stripe ne sont pas automatiquement routés vers `localhost`. Il faut utiliser **Stripe CLI** pour forwarder les événements :

```bash
# Terminal 1 — serveur Next.js
npm run dev

# Terminal 2 — forwarding webhooks (garder ouvert pendant les tests)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

> ⚠️  Le terminal `stripe listen` doit rester ouvert pendant toute la session de test.
> La CLI affiche un webhook signing secret temporaire — utiliser celui de `.env.local` si déjà configuré.

### Activation coaching manuelle

Le coaching est en **STANDBY** depuis 2026-05-23 (cf. middleware redirect 301).
La route de debug `/api/debug/activate-coaching` a été supprimée le 2026-05-25
pour fermer la surface d'attaque (trou de sécu en prod). Si le coaching est
relancé un jour, il faudra rebâtir un outil admin propre (authentifié staff).

### Cartes test Stripe

| Numéro              | Scénario            |
| ------------------- | ------------------- |
| 4242 4242 4242 4242 | Paiement réussi     |
| 4000 0000 0000 0002 | Carte refusée       |
| 4000 0000 0000 9995 | Fonds insuffisants  |
| 4000 0000 0000 3220 | 3D Secure requis    |

## Design System — Premium V2 « éditorial chaleureux » (refonte 2026-08)

Source de vérité : `tailwind.config.ts` (palette + ombres) et `src/styles/globals.css`.
Direction validée par Adam : registre Ritual / Huel / Aesop. **Ne pas réintroduire les tokens V1.**

- **Surfaces** : `bg-canvas` (#FAF8F3, fond de page), `bg-white` (cartes), `bg-sage` (#EEF4EC, 3ᵉ surface / pastilles)
- **Verts** : `fresh` (#3B7A3F, CTA) → `fresh-deep` au hover ; `spruce` (#2D5A2D, titres, accents). **Règle : jamais de vert en grande surface** (pas de bandeau/hero vert plein)
- **Textes** : `text-ink` (#2A2A2A), `text-ink-mute` (#6B6B66)
- **Accents** (1-2 éléments max par section) : `mustard` / `mustard-ink` (best-seller, étoiles), `terracotta` (promo, stock bas, erreur)
- **Typo** : Inter (corps) + **Fraunces** via `font-display` (serif variable, `SOFT 40` sur tous les titres, `WONK` réservé aux très grands titres via `.display-hero`). Ne jamais piloter `wght` en `font-variation-settings`
- **Ombres teintées vert** : `shadow-soft` / `shadow-card` / `shadow-lift` / `shadow-hero` — jamais d'ombre noire sur le crème
- **Cartes** : `rounded-[20px] bg-white shadow-card hover:shadow-lift`, **sans bordure** ; badges `rounded-lg`, plafonnés à 2 par carte
- **Boutons** : `.btn-primary` / `.btn-secondary` / `.btn-ghost` (pilules) + `.press` (retour tactile)
- **Mouvement** : `<Reveal>` (IntersectionObserver maison, ~0 ko) pour les sections sous la ligne de flottaison — **jamais sur le h1 du hero ni l'image `priority`** (LCP). Grain `.grain-overlay` monté une fois dans le root layout
- **Dépréciés** : `brand-*`, `cream-*`, `gray-*` — ne subsistent que sur les pages coaching (standby, hors périmètre V2)

## Conventions de code

- Composants en PascalCase, fichiers en PascalCase pour les composants
- Pages et layouts en `page.tsx` / `layout.tsx` (convention Next.js)
- Queries GraphQL dans `src/lib/shopify/queries/` séparées par domaine
- Utiliser `cn()` (clsx + tailwind-merge) pour les classes conditionnelles
- Le thème Coaching/Nutrition est détecté via `pathname.startsWith('/coaching')` ou `searchParams.theme === 'coaching'`
- Les prix sont toujours formatés via `formatPrice()` qui utilise le locale `fr-FR`
- `'use client'` uniquement quand nécessaire (hooks, state, event handlers)
- Admin API utilisée uniquement côté serveur (Server Components, API routes)

## Boutiques physiques

- **Boutique 1** : Body Start Nutrition — 8 Rue du Pont des Landes, 78310 Coignières — 07 61 84 75 80 — 7j/7 11h-19h
  - Location ID Shopify : `gid://shopify/Location/114075795838`
  - Status : Active (`isActive: true`)
- **Boutique 2** : Ouverture prochaine (emplacement non défini)
- Config dans `src/lib/shopify/types.ts` → `BODY_START_STORES`

## Intégrations externes

- **Shopify Storefront API 2024-04** : Produits, collections, panier, checkout, clients
- **Shopify Admin API 2024-04** : Inventory levels par location (Click & Collect), création de codes promo coaching
- **Stripe** : Paiements coaching (Checkout Sessions, subscriptions, webhooks)
- **Judge.me** : Avis clients (via API REST)
- **Resend** : Emails transactionnels (contact, newsletter)
- **Upstash Redis** : Rate limiting (contact, inventory)

## Points d'attention

- Les routes `/account/*` sont protégées par `src/middleware.ts` — vérifie la présence du cookie `body-start-customer-token`
- Click & Collect fonctionnel : stock réel via Admin API, toggle livraison/retrait dans le CartDrawer, attributs panier transmis au checkout
- La newsletter est connectée à `/api/newsletter` (Resend contacts + email de bienvenue avec code promo)
- L'API `/api/contact` est protégée par rate limiting Upstash (5 req / 10 min par IP) et échappement HTML des inputs
- L'API `/api/inventory` est protégée par rate limiting Upstash (30 req / 1 min par IP)
- Les tokens clients sont en localStorage + cookie sync (pour le middleware)
- Cookie consent banner RGPD en place (`CookieBanner.tsx`) avec 3 options : accepter / refuser / personnaliser
- JSON-LD en place : Organization + LocalBusiness dans le layout Nutrition, Product + BreadcrumbList sur les pages produit et collection
- Error boundaries sur les routes root, nutrition, et account
- Loading skeletons sur account, blog, stores
- **Phase 3 Coaching** : Stripe Checkout (one-shot + subscription) pour 5 produits coaching, webhook pour activation/désactivation automatique
- Les clients coaching reçoivent automatiquement un code promo -15% (`COACH-XXXXXXXX`) via l'Admin API Shopify (discount codes)
- Espace coaching dans `/account/coaching` : dashboard, détail programme, suivi de progression (formulaire workout logging)
- Pages publiques coaching : `/coaching` (home marketing), `/coaching/programmes` (catalogue détaillé), `/coaching/tarifs` (comparatif + boutons checkout)
- Le catalogue coaching est défini dans `src/lib/stripe/types.ts` → `COACHING_PRODUCTS` avec les vrais Price IDs Stripe
