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
│       ├── jeu/            # Jeu de la roue en boutique (/jeu, QR code) : register puis spin, Admin API 2026-04, limite par IP
│       ├── stock-alert/    # POST « me prévenir quand c'est de retour » (Supabase stock_alerts) + webhook/ inventory_levels/update → email Resend
│       │   └── sweep/      # GET cron Vercel quotidien (07:00 UTC) : rattrape les alertes que le webhook a manquées (Bearer CRON_SECRET)
│       ├── version/        # GET { sha, env } : quel commit sert la prod (skill verif-prod)
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

## Git et mise en production

- Pousser sur `main` = mise en production : Vercel déploie `main` automatiquement.
- **Autorisation permanente d'Adam (25/09/2026), pour ce projet uniquement** : Claude peut faire `git push` sur `main` sans demander, à condition que ces trois commandes passent juste avant, sur l'état exact qui est poussé (arbre de travail propre) :
  - `npm run build`
  - `npm run lint -- --max-warnings=0` (même seuil que la CI)
  - `npm test`
- Si l'une échoue : on corrige ou on s'arrête, pas de push.
- Cette autorisation ne couvre pas `git push --force` ni la réécriture d'un historique déjà poussé : pour ça, on demande toujours.

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

# Cron Vercel (/api/stock-alert/sweep) — défini sur Vercel uniquement, jamais en local
CRON_SECRET=xxx                           # ≥ 32 caractères aléatoires ; Vercel l'envoie en Authorization: Bearer

# Upstash Redis (limites par IP + mémoire du jeu de la roue) : actif en prod depuis le 07/10/2026
# Noms exacts obligatoires (pas les KV_REST_API_* de l'intégration Vercel). Absentes = aucune limite.
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
- **Mobile first (2026-09-05)** : la majorité du trafic est mobile. Règles : zones tactiles **44 px** minimum (`h-11`, `min-h-[44px]`) sur nav, CTA, pastilles, chips, liens de pied de page ; champs de saisie et `select` en **16 px** sous `md` (sinon iOS zoome au focus) ; sur la fiche produit la barre « Ajouter au panier » (avec le prix) suit la visibilité du CTA principal via IntersectionObserver, donc présente dès le premier écran ; galerie 4/3 et vignettes en bande défilante sous `sm` ; intros longues repliées avec `<ReadMore>` ; éléments fixés en bas avec `pb-[max(0.75rem,env(safe-area-inset-bottom))]` (`viewportFit: 'cover'`). Vérifier avec l'audit Playwright 390×844 avant de livrer.

## Performance mobile (règles, 2026-09-05, revues le 08/10/2026)

Mesure de référence : `node .claude/skills/verif-prod/scripts/probe-perf.mjs [--url …] [--runs 5] [route…]` (Playwright, 390×844 ×3, 4G lent + CPU ×4, médiane de 5 chargements, élément LCP et Ko par type ; `CHROMIUM_PATH=/opt/pw-browsers/chromium` en session cloud). Lighthouse en mode simulé varie de ±10 points d'un run à l'autre, ne jamais conclure sur un seul run. Comparer prod et preview dans la même session.
- **Le goulot est la bande passante** : en 4G lente, chaque Ko téléchargé avant l'affichage coûte ~5 ms de LCP. Relevé du 08/10/2026 avant corrections : accueil 3,2 à 3,6 s, `/products` 4,7 s, fiche produit 1,4 s, catégorie 1,0 s.
- **LCP** : tout grand visuel au-dessus du pli est un `<Image priority>` (jamais un `background-image` CSS : découvert tard, non préchargé) **avec `fetchPriority="high"`** : en Next 15, `priority` précharge en priorité réseau basse. Fiche produit : le fond végétal de la galerie est un `<Image priority fill unoptimized>`.
- **Hero accueil** : `sizes` à 70vw sous 640 px, le téléphone prend la variante 828 px (67 Ko au lieu de 128 Ko) ; sur mobile seul le haut de la photo se voit, sous un voile sombre.
- **Fond végétal** : un seul fichier, `/bg-vegetal-800.webp` (800 px, 20 Ko, flou), partagé par les cartes produit (CSS) et la galerie (même URL, un seul téléchargement). `/bg-vegetal.webp` (1200 px, 44 Ko) n'est plus qu'un original de travail.
- **`useSearchParams`** : jamais sans contenu d'attente rendu côté serveur. Un `<Suspense>` vide fait basculer tout son contenu en rendu navigateur (rien avant le JS, pas de liens dans le HTML). Modèle : `/products`, où le contenu d'attente est `<ProductsCatalog searchParams={null}>`, la vraie grille par défaut.
- **Fraunces** (61 Ko, préchargée sur toutes les pages) : l'axe SOFT coûte 25 Ko (36 Ko sans). WONK ne coûte rien. Le retirer change le dessin des titres : décision de design, pas de perf seule.
- **JS initial** : pas de `graphql-request` (client Shopify = `fetch`, `lib/shopify/client.ts`) ; `libphonenumber-js` importé dynamiquement au point d'usage ; toasts via `@/lib/toast` (jamais `react-hot-toast` en import direct, sinon le `<ToasterLazy>` ne se monte pas) ; tiroir panier monté à la demande (`CartDrawerLazy`) ; picker Mondial Relay en `next/dynamic`.
- Le plancher actuel (~3 s de tâche JS au CPU ×4) vient du runtime App Router + React + hydratation : ne s'attaque qu'en réduisant les composants client de la fiche (BuyBoxV2), pas en optimisant des libs.

## Outillage Claude Code (25/09/2026)

Tout est dans `.claude/` (hooks, skills, agents) et documenté dans `.claude/hooks/README.md`.

| Type | Nom | Usage |
| --- | --- | --- |
| Hook | `protect-files.js` (PreToolUse) | refuse l'écriture sur `.env*`, `backups/`, migrations commitées |
| Hook | `no-dash.js` (PostToolUse) | signale « — » / « – » introduits dans du texte client ; `--scan src` pour auditer |
| Hook | `mark-dirty.js` + `stop-check.js` (Stop) | tsc + vitest related si du code a changé dans le tour |
| Skill | `bodystart-voix` (Claude seul) | registre, lexique interdit, zéro tiret long, équité catalogue, allégations |
| Skill | `bodystart-seo-geo` (Claude seul) | SEO / GEO : structure des pages, titles, JSON-LD, local |
| Skill | `/verif-prod [handle]` | après un push : attend le commit sur Vercel, sonde mobile 390×844, captures `qa-shots/` |
| Skill | `/fiche-produit <handle…>` | export, données officielles, écriture contrôlée (sauvegarde + vérification), images |
| Agent | `relecture-fiche` | conformité UE 1924/2006 + voix, verdict Publiable / À corriger |
| Agent | `marque-scraper` | données officielles de marque telles quelles → `changes.json`, pose `texte_reecrit = false` |

- Hooks actifs depuis le 25/09/2026 via `.claude/settings.json` (forme exec : `command: node` + `args`, rechargés à chaud). Pour les couper le temps d'une session : `disableAllHooks: true` dans les réglages.
- Metafield produit `custom.texte_reecrit` (booléen, épinglé, filtrable dans l'admin) : `false` = texte de marque repris tel quel, à personnaliser en priorité ; passer à `true` après réécriture. Initialisé à `false` sur tout le catalogue le 25/09/2026.
- Écritures Shopify par script : app dédiée « BodyStart Scripts » (jeton `SHOPIFY_SCRIPTS_ADMIN_TOKEN`, local uniquement), marche à suivre dans `tech-specs/shopify-app-scripts.md`. Sans ce jeton, `shopify_apply.py --emit` produit les mutations pour le connecteur Shopify MCP. Jamais de `write_products` sur l'app du site.

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

- **Boutique 1** : Body Start Nutrition — 8 Rue du Pont des Landes, 78310 Coignières — 07 61 84 75 80 — du lundi au samedi, 11h-19h sans coupure, fermé le dimanche
  - Location ID Shopify : `gid://shopify/Location/119350657366` (« BodyStart Coignières », celui de `BODY_START_STORES` ; l'ancien 114075795838 n'est plus utilisé)
  - Status : Active (`isActive: true`)
- **Pas de 2ᵉ boutique** (confirmé le 08/10/2026) : aucune mention sur le site.
- Config dans `src/lib/shopify/types.ts` → `BODY_START_STORES`

## Intégrations externes

- **Shopify Storefront API 2024-04** : Produits, collections, panier, checkout, clients
- **Shopify Admin API 2024-04** : Inventory levels par location (Click & Collect), création de codes promo coaching
- **Stripe** : Paiements coaching (Checkout Sessions, subscriptions, webhooks)
- **Judge.me** : Avis clients (via API REST)
- **Resend** : Emails transactionnels (contact, newsletter)
- **Upstash Redis** : limites de requêtes par IP sur les routes publiques + mémoire du jeu de la roue (voir Points d'attention)

## Points d'attention

- Les routes `/account/*` sont protégées par `src/middleware.ts` — vérifie la présence du cookie `body-start-customer-token`
- Click & Collect fonctionnel : stock réel via Admin API, toggle livraison/retrait dans le CartDrawer, attributs panier transmis au checkout
- La newsletter est connectée à `/api/newsletter` (Resend contacts + email de bienvenue avec code promo)
- L'API `/api/contact` échappe le HTML des champs saisis (en plus de la limite par IP ci-dessous)
- **Upstash Redis, état réel** :
  - Actif en prod depuis le 07/10/2026 (variables ajoutées sur Vercel puis redéploiement). Vérifié le jour même : `/api/subscribe` refuse (429) dès la 6ᵉ requête, `/api/jeu` dès la 11ᵉ. Avant cette date, constaté absent en prod (aucune limite ne s'appliquait), depuis quand : inconnu. Preview : vérifiée le 07/10/2026, mêmes résultats.
  - Le code ne lit que `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`. Si elles manquent (ou contiennent `xxx`), chaque route passe **sans limite et sans erreur** : après tout changement de variables, refaire le test ci-dessous.
  - Limites par IP (fenêtre glissante) : `/api/contact`, `/api/subscribe`, `/api/stock-alert`, `/api/loyalty/me/enroll`, `/api/loyalty/customers/upsert` : 5 / 10 min ; `/api/jeu` : 10 / 10 min par étape (register, spin) ; `/api/loyalty/me/redeem-online`, `/api/loyalty/me/ambassador/redeem` : 10 / 1 min ; `/api/inventory`, `/api/loyalty/preview` : 30 / 1 min.
  - Jeu de la roue (`src/lib/jeu-roue/store.ts`) : résultat gardé ~13 mois par e-mail et par téléphone (2ᵉ tentative réaffichée tout de suite, même téléphone reconnu avec un autre e-mail). Le verrou anti double code ne dépend pas de Redis (réservation atomique dans le métachamp Shopify du client). Supprimer une fiche et un code de test dans Shopify n'efface pas cette mémoire : tester avec des e-mails et numéros jetables, jamais ceux d'un vrai client.
  - Tester depuis une session cloud Claude : la sortie Internet tourne sur une quinzaine d'adresses IP, donc des `curl` séparés ne déclenchent jamais la limite. Envoyer toutes les requêtes dans **une seule commande curl** (même connexion, même IP), avec un corps invalide pour ne rien créer : `curl -sS -X POST -H 'Content-Type: application/json' -d '{}' -w '%{http_code} ' $(for i in $(seq 1 8); do printf -- '-o /dev/null https://bodystart-nutrition.fr/api/subscribe '; done)` doit afficher cinq 400 puis des 429.
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
