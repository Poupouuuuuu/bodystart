# Body Start — Site E-commerce Headless

Écosystème e-commerce sur-mesure pour la marque **Body Start**.
Phase 1 : **Body Start Nutrition** (Compléments alimentaires).

---

## Architecture

```
body-start/
├── src/
│   ├── app/
│   │   ├── (nutrition)/         ← Phase 1 (actuelle) — route group
│   │   │   ├── layout.tsx       ← Header + Footer Nutrition
│   │   │   ├── page.tsx         ← Page d'accueil
│   │   │   ├── products/
│   │   │   │   ├── page.tsx     ← Catalogue produits
│   │   │   │   └── [handle]/    ← Fiche produit (URL dynamique Shopify)
│   │   ├── coaching/            ← Phase 2 (placeholder "Bientôt")
│   │   └── vetements/           ← Phase 3 (placeholder "Bientôt")
│   ├── components/
│   │   ├── layout/              ← Header, Footer
│   │   ├── home/                ← Hero, FeaturedProducts, BrandValues, StoreLocator
│   │   ├── product/             ← ProductCard, ClickAndCollect
│   │   ├── cart/                ← (à développer)
│   │   └── ui/                  ← Button, Badge (composants réutilisables)
│   ├── lib/
│   │   ├── shopify/             ← Client GraphQL + toutes les queries
│   │   │   ├── client.ts        ← Connexion Storefront API
│   │   │   ├── index.ts         ← Fonctions : getProducts, getCart, etc.
│   │   │   ├── types.ts         ← TypeScript types + config boutiques
│   │   │   └── queries/         ← Requêtes GraphQL (products, cart, collections)
│   │   └── utils.ts             ← formatPrice, cn(), getDiscountPercentage
│   ├── context/CartContext.tsx  ← Panier global (state React)
│   └── hooks/useCart.ts         ← Hook pour accéder au panier
├── public/assets/logos/         ← Logos Body Start Nutrition + Coaching
├── .env.local                   ← Clés Shopify (NE PAS committer)
├── tailwind.config.ts           ← Palette couleurs issues des logos
└── README.md
```

## Stack technique

| Outil | Version | Rôle |
|---|---|---|
| Next.js | 14 (App Router) | Framework frontend |
| TypeScript | 5 | Typage statique |
| Tailwind CSS | 3 | Styles utilitaires |
| Shopify Storefront API | 2024-04 | Produits, panier, checkout |
| graphql-request | 6 | Client GraphQL léger |
| Lucide React | — | Icônes |
| React Hot Toast | — | Notifications panier |

## Palette couleurs

### Nutrition (Phase 1)
| Variable | Hex | Usage |
|---|---|---|
| `brand-700` | `#4B7A22` | Couleur principale (texte logo) |
| `brand-500` | `#78A83C` | Accent (feuilles/icône logo) |
| `brand-900` | `#2A4511` | Fonds sombres, footer |
| `brand-50` | `#F0F7E6` | Fonds clairs |

### Coaching (Phase 2 — prêt)
| Variable | Hex | Usage |
|---|---|---|
| `coaching-700` | `#1D3461` | Bleu marine logo |
| `coaching-cyan-400` | `#3DC8C8` | Cyan accent logo |

---

## Installation et lancement en local

### Prérequis
- [Node.js 18+](https://nodejs.org/) installé
- Un terminal (PowerShell ou CMD sur Windows)

### Étapes

**1. Ouvrir le terminal dans le bon dossier**
```
Clic droit sur le dossier body-start → "Ouvrir dans le terminal"
```

**2. Installer les dépendances**
```bash
npm install
```

**3. Vérifier le fichier .env.local**
Le fichier est déjà configuré avec tes credentials Shopify :
```
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=bodystart-dev-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=b0576e0de6b3b42ceb2f9891fc69a36b
```

**4. Lancer le serveur de développement**
```bash
npm run dev
```

**5. Ouvrir dans le navigateur**
```
http://localhost:3000
```

---

## Connexion Shopify — Click & Collect (étape manuelle requise)

Pour activer l'affichage du stock en temps réel par boutique :

1. Dans **Shopify Admin → Paramètres → Emplacements**, note les IDs de :
   - Boutique A
   - Boutique B

2. Ouvre `src/lib/shopify/types.ts`

3. Dans `BODY_START_STORES`, renseigne les `shopifyLocationId` :
```ts
{ id: 'boutique-a', shopifyLocationId: 'gid://shopify/Location/XXXXXX', ... }
{ id: 'boutique-b', shopifyLocationId: 'gid://shopify/Location/YYYYYY', ... }
```

4. Mets aussi à jour les adresses, villes, téléphones et horaires réels.

---

## Déploiement sur Vercel (production)

**1. Créer un compte sur [vercel.com](https://vercel.com) (gratuit)**

**2. Importer le projet**
```
Vercel Dashboard → Add New → Project → importer depuis GitHub
```

**3. Ajouter les variables d'environnement**
Dans Vercel : Settings → Environment Variables → ajouter :
- `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`
- `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`

**4. Déployer** → Vercel génère une URL publique automatiquement.

---

## Feuille de route

| Phase | Univers | Statut |
|---|---|---|
| Phase 1 | Body Start Nutrition | ✅ En cours |
| Phase 2 | Body Start Coaching | 🔜 Prêt (placeholder) |
| Phase 3 | Body Start Vêtements | 🔜 Prêt (placeholder) |

### Prochaines fonctionnalités à développer
- [ ] Drawer panier (CartDrawer.tsx)
- [ ] Filtres produits (par catégorie, prix, dispo)
- [ ] Page Collections
- [ ] Intégration stock temps réel Click & Collect (Shopify Locations API)
- [ ] Page "Nos boutiques" dédiée
- [ ] Blog
- [ ] Avis clients

---

*Projet développé avec Claude Code — Body Start © 2026*
