# SPRINT RECENTRAGE COMPLÉMENTS — RAPPORT FINAL

**Branche** : `feat/recentrage-complements` (créée depuis `main`)
**Date** : 2026-05-23
**Statut build** : ✅ `npm run build` vert · `tsc --noEmit` vert
**Branche coaching** : `feat/coaching-platform` intacte (jamais mergée en main, peut être réactivée plus tard)

---

## 1. RÉSUMÉ EXÉCUTIF

- ✅ **Lot A — naming** : 73 occurrences "Body Start" → "BodyStart" sur 27 fichiers
- ✅ **Lot B1 — coaching impossible à acheter** : `/api/stripe/checkout` retourne 410 Gone, webhook log-only sans action, 2 produits Stripe **archivés** (`coaching_program_oneshot` + `coaching_followup_monthly`)
- ✅ **Lot B2/B3 — coaching invisible** : retiré du Header, de la home (UniversSection mono-Nutrition), du Footer (déjà clean), du sitemap. Middleware redirige `/coaching/*` → `/products` en **301**. Toutes les pages /coaching/* commentées `// STANDBY 2026-05-23`
- ✅ **Lot C — vêtements invisible** : retiré du Header (Bientôt), de la home, redirect 301 `/vetements` → `/products`, page commentée STANDBY
- ✅ **Lot D — copy** : refonte SEO, Hero, marquee réassurance, BrandValues "Notre sélection", FeaturedProducts "Les plus pris en boutique", StoreLocator "Passe nous voir en boutique", Footer trust badges, page Conseil, fiche produit avec nouveau bloc "Le conseil BodyStart"
- ✅ **Lot E — santé visible** : ShopByObjective avec 4 catégories incluant Santé & bien-être (3e), Footer avec Santé en 3e position

---

## 2. RÉSUMÉ DEMANDÉ DANS LE BRIEF

| Item | Valeur |
|---|---|
| Occurrences "Body Start" corrigées | **73 occurrences sur 27 fichiers** |
| Coupure paiement coaching | `/api/stripe/checkout` POST renvoie **410 Gone** (code `COACHING_STANDBY`). Webhook log-only (validate signature, log event, return 200). **2 produits Stripe archivés** (`prod_UMyyFL4tBbXjdr` + `prod_UMyypHCcPc3qH3`). |
| Abonnements coaching payés en base | **0** (cf. `scripts/audit-coaching-report.json` — 0 subscription active sur les 2 lookup_keys coaching). 3 subs test antérieures déjà cancel via `stripe-cleanup.mjs` au Sprint 1. **Aucune action à prendre sur des clients réels.** |
| Fichiers modifiés | cf. §6 ci-dessous (liste exhaustive). 52 fichiers touchés au total sur 4 commits. |
| Points où le copy ne collait pas | cf. §7 ci-dessous |

---

## 3. CE QUI A ÉTÉ FAIT — DÉTAIL PAR LOT

### Lot A — Naming BodyStart (commit `54e6ba6`)
Script Node de find/replace global sur `src/` et `public/`. Le replace étant mécanique, `Body Start Nutrition` est devenu `BodyStart Nutrition` (format attendu pour l'enseigne complète mentions légales).

Couvert :
- `<title>`, meta-description, meta-author, meta-creator, meta-keywords
- `og:site_name`, `og:title`, `og:image:alt`, `twitter:title`, `twitter:description`
- Footer copyright, tagline, alt logo
- Tous les JSX visibles
- Emails Resend (contact + newsletter — domaine sandbox `onboarding@resend.dev` conservé pour ce sprint)

### Lot B1 — Couper le paiement coaching (commit `54e6ba6`, fusionné avec Lot A)
- `src/app/api/stripe/checkout/route.ts` : route entièrement remplacée. POST renvoie 410 Gone avec message `"Le coaching n'est plus proposé pour le moment."`
- `src/app/api/stripe/webhook/route.ts` : route simplifiée. Valide la signature Stripe, log l'event reçu, ne déclenche aucune action côté Shopify (plus de metafields, plus de code promo créé/supprimé). Évite d'avoir des subs orphelines crées pendant la transition.
- **Archive Stripe** : exécuté inline via `node -e ...` qui appelle `stripe.products.update(productId, { active: false })` pour les 2 produits coaching identifiés par lookup_key. Sortie console : 2 produits archivés.

### Lot B2/B3 — Cacher + rediriger coaching (commit `7737973`)
- `src/middleware.ts` : ajout d'un block `STANDBY_PATHS = ['/coaching', '/vetements']` qui redirige en **301** vers `/products`. Le matcher couvre `/coaching`, `/coaching/:path*`, `/vetements`, `/vetements/:path*` (+ `/account/:path*` existant).
- `src/components/layout/Header.tsx` : rewrite complet. Suppression de la "Barre switcher univers" (Nutrition/Coaching/Vêtements), de la constante `COACHING_CATEGORIES`, de toute la logique `isCoaching`, des dropdowns. Logo simplifié (toujours `logo-nutrition.png` avec alt `BodyStart`). Nav simplifiée : Accueil · Tous les produits · Packs & Économies · La boutique · Conseil gratuit.
- `src/components/home/UniversSection.tsx` : transformation en bloc Nutrition pleine largeur. Plus de carte Coaching ni Vêtements. Titre "Ce qu'on fait / Une chose, bien faite".
- `src/app/sitemap.ts` : route `/coaching` retirée (commentaire conservé).
- **STANDBY comments** ajoutés en tête de :
  - `src/app/(coaching)/layout.tsx`
  - `src/app/(coaching)/coaching/page.tsx`
  - `src/app/(coaching)/coaching/tarifs/page.tsx`
  - `src/app/(coaching)/coaching/programmes/page.tsx`
  - `src/app/(coaching)/coaching/resultats/page.tsx`
  - `src/app/(coaching)/coaching/suivi/page.tsx`
  - `src/app/(nutrition)/vetements/page.tsx`

### Lot C — Vêtements standby (commit `7737973`, fusionné avec B)
Mêmes mécanismes que coaching :
- Onglet "Vêtements / Bientôt" retiré du Header
- Carte "VÊTEMENTS" retirée d'UniversSection
- Middleware redirige `/vetements/*` → `/products` en 301
- Page commentée `// STANDBY`

### Lot D — Copy rewrite (commit `f8d0402`)
Tout est appliqué selon `tech-specs/site-rewrite-copy-v1.md` :

- **Root layout** (`src/app/layout.tsx`) : title, description, keywords, OG, Twitter alignés brand.md V2
- **Home metadata** (`src/app/(nutrition)/page.tsx`) : title + description ancrage local
- **HeroSection** : H1 "Les bons compléments. Le bon conseil. Sans bullshit." + sous-titre 50/50 + tutoiement + CTA "Voir les produits" / "Demander conseil" + marquee avec 4 nouvelles puces
- **BrandValues** : "On garde le meilleur, on jette le reste" + texte + "Voir nos marques"
- **ShopByObjective** : 4 catégories (Prise de masse / Récupération / **Santé & bien-être** / Vegan), chacune avec sous-titre
- **FeaturedProducts** : titre "Les plus pris en boutique"
- **StoreLocator** : "Passe nous voir en boutique" + texte conseil de pote + "Une 2ᵉ boutique arrive… Me prévenir"
- **TestimonialsSection** : retirée de la home (commentée dans `(nutrition)/page.tsx`). Composant non supprimé, réutilisable plus tard.
- **Footer** : tagline, copyright, alt, trust badges (4 nouvelles puces), Instagram seul visible, Santé en 3e position
- **Page Conseil** : H1 "Dis-nous ton objectif, on prépare le reste", accents corrigés (Énergie, Récupération, Immunité, défenses, coordonnées), tutoiement
- **Page Livraison** : Click & Collect en premier "souvent prêt en quelques minutes", livraison "Offerte dès 85€ · sinon {{FORFAIT_PORT}}"
- **Fiche produit** :
  - Nouveau bloc `LeConseilBodyStart` créé (`src/components/product/LeConseilBodyStart.tsx`) avec contenu Iso Zero rempli + fallback générique
  - Inséré entre ProductSection et la wave transition (avant la section verte NutritionAndScience)
  - "Une Pureté Inégalée" → "Pourquoi on l'a sélectionné"

### Lot E — Santé visibility (commit `f8d0402`, fusionné avec D)
- ShopByObjective : Santé & bien-être en 3e position sur 4 cartes (catégories home)
- Footer : Santé remontée en 3e position (au-dessus de Protéines/Créatine/Boosters)
- Catalogue (`/products`) : la catégorie Santé est déjà accessible via `?cat=sante` (logique existante, pas modifiée)

---

## 4. RÉSULTATS — COACHING ET VÊTEMENTS NE SONT PLUS NI ACHETABLES NI VISIBLES

### Coaching
- Header : aucune mention "Coaching"
- Home : UniversSection n'a plus que Nutrition
- Footer : zéro lien coaching (déjà le cas avant)
- Sitemap : `/coaching` retiré
- Pages /coaching/* : middleware redirige 301 vers /products **avant rendu**
- API : `/api/stripe/checkout` renvoie 410 Gone → impossible de créer une session Stripe
- Stripe : 2 produits archivés (`active: false`)

### Vêtements
- Header : zéro mention "Vêtements"
- Home : UniversSection n'a plus la carte Vêtements
- Footer : zéro mention (déjà le cas)
- Page /vetements : middleware redirige 301 vers /products

### Aucun lien interne ne renvoie 404
- Tous les liens vers /coaching/* sont redirigés 301 (pas 404)
- Tous les liens vers /vetements sont redirigés 301
- Vérification visuelle : Header + Footer + UniversSection ne référencent plus aucune de ces URLs

---

## 5. POINTS OUVERTS (à traiter par toi)

### 5.1 Placeholder `{{FORFAIT_PORT}}`
Présent à 3 endroits :
- `src/components/layout/Footer.tsx` ligne ~52 (trust badge "Livraison offerte dès 85€")
- `src/app/(nutrition)/livraison/page.tsx` lignes ~17 et 24 (méthodes Colissimo + Mondial Relay)

Une fois le montant tranché, remplacer `{{FORFAIT_PORT}}` par la valeur (ex: `5,90€`).

### 5.2 Variable Vercel webhook Stripe
Le webhook est désormais log-only. Si tu reçois des events pour les anciens products archivés (peu probable car 0 sub active), ils seront loggés mais ignorés. Aucune action.

### 5.3 Comptes sociaux Footer
J'ai conservé Instagram (`https://www.instagram.com/bodystart_nutrition/`) en lien réel. Facebook et TikTok sont **retirés du DOM** (per spec §3.10). Si tu crées ces comptes plus tard, il faudra les remettre dans le Footer.

### 5.4 Image catégorie Vegan
`ShopByObjective` utilise temporairement `category-masse.png` pour la nouvelle carte "Vegan & protéines végétales" (cf. commentaire dans le code). À remplacer par une vraie image vegan quand disponible.

---

## 6. FICHIERS MODIFIÉS (par commit)

### Commit 1 `54e6ba6` — Lot A (rename) + Lot B1 (kill payment) + infra
- `scripts/audit-coaching-state.mjs` (nouveau)
- `scripts/audit-coaching-report.json` (nouveau)
- `tech-specs/site-rewrite-copy-v1.md` (nouveau dans le repo)
- `src/app/api/stripe/checkout/route.ts` (rewrite — 410 Gone)
- `src/app/api/stripe/webhook/route.ts` (rewrite — log-only)
- 27 fichiers avec "Body Start" → "BodyStart"

### Commit 2 `7737973` — Lot B2/B3 + Lot C (standby + redirect)
- `src/middleware.ts` (redirect /coaching et /vetements)
- `src/components/layout/Header.tsx` (rewrite — sans switcher, sans coaching)
- `src/components/home/UniversSection.tsx` (rewrite — bloc Nutrition pleine largeur)
- `src/app/sitemap.ts` (retrait /coaching)
- `src/app/(coaching)/layout.tsx` (STANDBY)
- `src/app/(coaching)/coaching/page.tsx` (STANDBY)
- `src/app/(coaching)/coaching/tarifs/page.tsx` (STANDBY)
- `src/app/(coaching)/coaching/programmes/page.tsx` (STANDBY)
- `src/app/(coaching)/coaching/resultats/page.tsx` (STANDBY)
- `src/app/(coaching)/coaching/suivi/page.tsx` (STANDBY)
- `src/app/(nutrition)/vetements/page.tsx` (STANDBY)

### Commit 3 `f8d0402` — Lot D + Lot E (copy + santé visibility)
- `src/app/layout.tsx` (SEO refonte)
- `src/app/(nutrition)/page.tsx` (metadata + retrait TestimonialsSection)
- `src/components/home/HeroSection.tsx` (rewrite — H1 + marquee)
- `src/components/home/BrandValues.tsx` (rewrite — "Notre sélection")
- `src/components/home/ShopByObjective.tsx` (rewrite — 4 cats incl. Vegan + Santé)
- `src/components/home/FeaturedProducts.tsx` (titre)
- `src/components/home/StoreLocator.tsx` (texte + boutique 2)
- `src/components/layout/Footer.tsx` (rewrite — trust badges + Santé up + social)
- `src/app/(nutrition)/conseil/page.tsx` (H1 + accents + tutoiement)
- `src/app/(nutrition)/livraison/page.tsx` (livraison 85€ + placeholder)
- `src/app/(nutrition)/products/[handle]/page.tsx` (import + insertion LeConseilBodyStart + fix titre)
- `src/components/product/LeConseilBodyStart.tsx` (nouveau)

---

## 7. POINTS OÙ LE COPY NE COLLAIT PAS À LA STRUCTURE RÉELLE

| Point copy spec | Conflit | Décision |
|---|---|---|
| §2 nav : `Nutrition · Coaching · La boutique · Conseil gratuit · Mon compte` | Le brief écrase : "retire Coaching" | Nav finale : Accueil · Tous les produits · Packs & Économies · La boutique · Conseil gratuit (cohérent brief) |
| §3.8 "Nos univers" : 2 cartes Nutrition + Coaching | Le brief écrase : pas de carte coaching | Section transformée en **bloc Nutrition pleine largeur** (titre "Ce qu'on fait / Une chose, bien faite") |
| §5 "Page Coaching réécriture" | Coaching en standby total | **Skip** — la page est redirigée et masquée |
| §4 "Page Produit" — Achat unique uniquement (abonnement -10% retiré) | Le code Sprint 0 a un `ProductActions.tsx` qui ne supporte pas d'abonnement Shopify (vérifié — il n'y a que `buyButton` avec quantity, pas de sélecteur d'offre). **Pas de changement nécessaire**, le sélecteur d'offre n'existe pas dans le code | Aucune action |
| §3.3 "Les plus pris en boutique" — au moins 1 produit santé | Les featured products viennent dynamiquement de Shopify (collection "featured" → fallback first 8). **Pas de filtre code-side** | À ajuster dans Shopify Admin (mettre un produit santé dans la collection "featured") — **action côté toi** |
| §3.10 "Réseaux sociaux : remplacer # par vrais" | Pas de comptes Facebook/TikTok prêts | Facebook + TikTok **retirés du DOM** (vs `href="#"` morts). Instagram link real. |
| §4.4 "Une Pureté Inégalée — supprimer" | Titre hardcodé sur la fiche produit (même pour les autres produits que Iso Zero) | Renommé en **"Pourquoi on l'a sélectionné"** (générique, fonctionne pour tous les produits — vs supprimer ce qui aurait laissé un trou) |
| §4.3 "Le conseil BodyStart" — contenu par produit | Pas de système CMS, juste un map `CONSEILS_BY_HANDLE` dans le composant | Iso Zero rempli + fallback générique. Pour les autres produits, à enrichir progressivement dans le map (ou migrer vers Shopify metafields plus tard) |
| §6 "page conseil — sous-titre OK" + accents | Plusieurs accents manquants effectivement | Tous corrigés (Énergie, Récupération, Immunité, défenses, coordonnées, Coignières) |
| §3.7 "Boutique 2 — coming soon" | Le composant `StoreLocator` lit `COMING_SOON_STORES` depuis `@/lib/shopify/types`. Le composant a été adapté côté texte mais la **data** vient de ce fichier — non modifié dans ce sprint | Texte appliqué via les chaînes JSX (pas via la data). À refacto plus tard si tu veux mettre les chaînes dans la data |
| §3.9 forfait livraison sous 85€ | Pas tranché | Placeholder `{{FORFAIT_PORT}}` partout |

---

## 8. CHECKLIST FINALE

- [x] Branche dédiée `feat/recentrage-complements` (depuis `main`, pas de merge coaching)
- [x] `npm run build` ✅ vert
- [x] `npx tsc --noEmit` ✅ vert
- [x] Aucun lien interne ne renvoie 404 (toutes les anciennes URLs coaching/vetements redirigent en 301)
- [x] Coaching impossible à acheter (API 410 + 2 produits Stripe archivés)
- [x] Coaching invisible (Header + home + footer + sitemap)
- [x] Vêtements invisible
- [x] Naming BodyStart partout (73 occurrences)
- [x] Copy spec appliqué
- [x] Santé visible (3e position nav catégories + footer)
- [x] Code coaching/vêtements **non supprimé** (juste commenté `// STANDBY` + middleware)

---

## 9. POUR RELANCER LE COACHING UN JOUR

1. Retirer `/coaching` (et/ou `/vetements`) de `STANDBY_PATHS` dans `src/middleware.ts`
2. Remettre `Coaching` dans `NAV_CATEGORIES` du Header
3. Restaurer la version 2-cartes de `UniversSection.tsx` depuis l'historique git (commit `b3eaa6` ou antérieur)
4. Restaurer l'API `/api/stripe/checkout` (commit `0407937` sur main d'origine)
5. Désarchiver les 2 produits Stripe (ou en créer des nouveaux avec les mêmes lookup_keys)
6. Retirer les commentaires `// STANDBY 2026-05-23` en tête des fichiers concernés
7. Remettre `/coaching` dans `src/app/sitemap.ts`
8. Si Sprint 1+2 doit être ressuscité : la branche `feat/coaching-platform` est intacte sur GitHub, prête à être mergée

---

**Sprint terminé. Branche prête à pousser.**
