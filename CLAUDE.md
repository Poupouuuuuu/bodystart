# CLAUDE.md — Body Start

## Projet

Body Start est une plateforme e-commerce headless multi-univers pour une marque de compléments alimentaires sportifs avec des boutiques physiques en Ile-de-France.

- **Stack** : Next.js 14 (App Router) + TypeScript + Tailwind CSS + Shopify Storefront API (GraphQL)
- **Phase actuelle** : Phase 1 — Nutrition (boutique en ligne de compléments alimentaires)
- **Phases futures** : Coaching (mix digital + présentiel), Vêtements
- **Langue du site** : Français (FR)
- **Monnaie** : EUR

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (providers, fonts, metadata)
│   ├── (nutrition)/        # Route group Nutrition — toutes les pages boutique
│   │   ├── layout.tsx      # Header + Footer + CartDrawer + revalidate=3600
│   │   ├── page.tsx        # Homepage
│   │   ├── products/       # Catalogue et fiches produit
│   │   ├── collections/    # Collections Shopify
│   │   ├── objectifs/      # Navigation par objectif fitness
│   │   ├── blog/           # Articles
│   │   ├── account/        # Espace client (non protégé — TODO)
│   │   └── ...             # Pages légales, stores, auth, etc.
│   ├── (coaching)/         # Route group Coaching — placeholders
│   └── api/contact/        # Endpoint formulaire de conseil (Resend)
├── components/
│   ├── layout/             # Header, Footer
│   ├── home/               # Sections de la homepage
│   ├── product/            # ProductCard, ProductActions, ClickAndCollect, Reviews
│   ├── cart/               # CartDrawer
│   └── ui/                 # Button, Badge, SearchBar, BackToTop
├── context/
│   ├── CartContext.tsx      # Panier global (localStorage + Shopify Cart API)
│   └── CustomerContext.tsx  # Auth client (Shopify Customer API)
├── hooks/
│   └── useCart.ts           # Hook wrapper pour CartContext
├── lib/
│   ├── shopify/
│   │   ├── client.ts       # GraphQL client (graphql-request)
│   │   ├── index.ts        # Fonctions API (products, collections, cart, blog)
│   │   ├── customer.ts     # Auth (login, register, token management)
│   │   ├── types.ts        # Interfaces TypeScript + config boutiques physiques
│   │   └── queries/        # Requêtes GraphQL séparées par domaine
│   ├── judgeme/index.ts     # Intégration Judge.me (avis clients)
│   └── utils.ts            # formatPrice, cn, getDiscountPercentage, etc.
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
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=xxx.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxx

# Email (pour /api/contact)
RESEND_API_KEY=re_xxx
CONTACT_EMAIL_TO=contact@bodystart.com

# Site
NEXT_PUBLIC_SITE_URL=https://bodystart.com

# Optionnel
SHOPIFY_ADMIN_API_ACCESS_TOKEN=xxx          # Pour future Inventory API
JUDGEME_PUBLIC_TOKEN=xxx                     # Avis clients
JUDGEME_PRIVATE_TOKEN=xxx
```

## Design System

- **Style** : Neo-brutalist — bordures 2px, box-shadows décalées, uppercase tracking-widest, font-black
- **Palette Nutrition** : Vert (#4B7A22 primary) — classes Tailwind `brand-*`
- **Palette Coaching** : Bleu nuit (#1D3461) + Cyan (#3DC8C8) — classes `coaching-*` et `coaching-cyan-*`
- **Typographie** : Inter (body, var `--font-inter`) + Montserrat (headings, var `--font-montserrat`)
- **Composants CSS** : `.container`, `.section`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.card`, `.badge-*`, `.input`
- **Shadows** : `shadow-[Xpx_Xpx_0_theme(colors.gray.900)]` — systématique
- **Coins** : `rounded-sm` partout (pas de gros arrondis)

## Conventions de code

- Composants en PascalCase, fichiers en PascalCase pour les composants
- Pages et layouts en `page.tsx` / `layout.tsx` (convention Next.js)
- Queries GraphQL dans `src/lib/shopify/queries/` séparées par domaine
- Utiliser `cn()` (clsx + tailwind-merge) pour les classes conditionnelles
- Le thème Coaching/Nutrition est détecté via `pathname.startsWith('/coaching')` ou `searchParams.theme === 'coaching'`
- Les prix sont toujours formatés via `formatPrice()` qui utilise le locale `fr-FR`
- `'use client'` uniquement quand nécessaire (hooks, state, event handlers)

## Boutiques physiques

- **Boutique 1** : Body Start Nutrition — 8 Rue du Pont des Landes, 78310 Coignières — 07 61 84 75 80 — 7j/7 11h-19h
- **Boutique 2** : Ouverture prochaine (emplacement non défini)
- Config dans `src/lib/shopify/types.ts` → `BODY_START_STORES`

## Intégrations externes

- **Shopify Storefront API 2024-04** : Produits, collections, panier, checkout, clients
- **Judge.me** : Avis clients (via API REST)
- **Resend** : Envoi d'emails transactionnels (formulaire de conseil)

## Points d'attention

- Les routes `/account/*` ne sont PAS protégées par un middleware — à corriger avant mise en production
- Le Click & Collect est un placeholder UI — `shopifyLocationId` est vide, pas de requête Inventory API
- La newsletter ne fait rien côté serveur — le toast est déclenché sans appel API
- L'API `/api/contact` n'a pas de rate limiting ni d'échappement HTML des inputs
- Les tokens clients sont en localStorage (pattern Shopify standard mais vulnérable au XSS)
- Pas de cookie consent banner (requis RGPD)
- Pas de structured data JSON-LD
