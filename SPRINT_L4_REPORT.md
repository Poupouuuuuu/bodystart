# Sprint L4 : Interface client en ligne (loyalty)

**Branche** : `feat/loyalty` (PAS de merge main, push uniquement)
**Spec source** : `docs/superpowers/specs/2026-05-24-loyalty-L4-client-online-design.md` (commit `a963225`)
**Plan source** : `docs/superpowers/plans/2026-05-24-loyalty-L4-implementation.md` (commit `8e5645b`)
**Status** : livré, en attente revue preview Vercel

---

## Résumé exécutif

L4 livre l'interface client en ligne du programme loyalty BodyStart :

- **Page `/account` enrichie** : nouvel onglet « Cagnotte » + onglet « Parrainage » réécrit avec les vraies données loyalty (le composant local mensonger « -10 % / 10 € / bientôt actif » a été supprimé).
- **Page publique `/parrainage`** : SEO + marketing pour visiteurs non connectés, copy validé Adam (zéro tiret cadratin, voix on/nous, vraie mécanique 5 €/40 €/5 %/12 mois).
- **Widget cagnotte dans `CartDrawer`** : 5 états (logged_out / not_enrolled / balance < 20 € / slider apply / cagnotte appliquée).
- **4 nouvelles routes session-based `/me/*`** : `GET /me`, `POST /me/enroll`, `POST /me/preview`, `POST /me/redeem-online`.
- **Refactor L3** : helpers purs `preview-core.ts` + `redeem-online-core.ts`, fermeture des routes phone-based en staff/M2M only (audit a confirmé zéro consumer public à casser) + rate limit Upstash 30 req/min/IP sur `preview`.
- **Helper `site-url.ts`** : pas d'URL en dur, tout passe par `NEXT_PUBLIC_SITE_URL`.

Aucune migration SQL. Toute la logique métier (5 %, 12 mois, min 20 €, cap 50 %, anti auto-parrainage) reste dans les fonctions L1/L2. `finalize_order_loyalty` n'a pas été touché. Tests pgTAP existants restent valides.

## Métriques de livraison

- **22 commits atomiques** sur `feat/loyalty` (T1 → T18 + 1 fix TS de T3)
- **139/139 tests vitest** verts (5 nouveaux tests `site-url` + 5 nouveaux `preview-core` + 4 nouveaux `redeem-online-core` + 5 nouveaux `session` = 19 ajoutés, 120 existants conservés)
- **`tsc --noEmit` clean** (0 erreur)
- **`npm run build` OK** : 36 pages statiques générées, toutes les routes L4 listées
- **Couverture loyalty maintenue** (helpers purs + helpers d'orchestration tous testés)

## Ce qui a été fait

### Nouveaux fichiers (15)

**Helpers core**
- `src/lib/site-url.ts` + `src/lib/site-url.test.ts` (T1)
- `src/lib/loyalty/preview-core.ts` + `src/lib/loyalty/preview-core.test.ts` (T2)
- `src/lib/loyalty/redeem-online-core.ts` + `src/lib/loyalty/redeem-online-core.test.ts` (T3)
- `src/lib/loyalty/session.ts` + `src/lib/loyalty/session.test.ts` (T6)

**Routes API session-based `/me/*`**
- `src/app/api/loyalty/me/route.ts` (T7, GET)
- `src/app/api/loyalty/me/enroll/route.ts` (T8)
- `src/app/api/loyalty/me/preview/route.ts` (T9)
- `src/app/api/loyalty/me/redeem-online/route.ts` (T10)

**Hook + composants client**
- `src/hooks/useLoyaltyMe.ts` (T11)
- `src/components/account/EnrollmentBlock.tsx` (T12)
- `src/components/account/CagnottePanel.tsx` (T13)
- `src/components/account/ReferralPanel.tsx` (T14, remplace l'ancien local mensonger)

**Pages + widget**
- `src/app/(nutrition)/parrainage/page.tsx` (T16)
- `src/components/cart/CagnotteCartWidget.tsx` (T17)

### Fichiers modifiés (8)

- `src/app/api/loyalty/preview/route.ts` (T4) : wrapper mince + auth staff/M2M + rate limit Upstash 30/min/IP
- `src/app/api/loyalty/redeem-online/route.ts` (T5) : wrapper mince + auth staff/M2M
- `src/app/(nutrition)/account/page.tsx` (T15) : ajout onglet Cagnotte, suppression du `ReferralPanel` local mensonger (~57 lignes), support `?tab=cagnotte` / `?tab=referral`, imports nettoyés (`Copy`, `Users`, `useMemo` retirés car plus utilisés)
- `src/components/cart/CartDrawer.tsx` (T17) : injection du widget
- `src/context/CartContext.tsx` (T17) : ajout helpers `applyDiscountCode` / `removeDiscountCode`
- `src/lib/shopify/index.ts` (T17) : ajout helper `updateCartDiscountCodes`
- `src/lib/shopify/queries/cart.ts` (T17) : ajout mutation `UPDATE_CART_DISCOUNT_CODES` + `discountCodes { code applicable }` dans `CartFragment`
- `src/lib/shopify/types.ts` (T17) : ajout `CartDiscountCode` interface + `discountCodes` field

### Décisions techniques en cours d'exécution

1. **Préfixe code cagnotte = `LY-`, pas `BS-CAGNOTTE-`** : la spec/plan mentionnait `BS-CAGNOTTE-` mais le système réel (héritage L3, `createRedemptionDiscountCode()` dans `src/lib/shopify/loyalty-discounts.ts`) génère des codes `LY-XXXXXXXX`. Le widget utilise `LY-` pour la détection, documenté inline. Aligné avec la production.
2. **T3 test types fix** : le mock `reserveRedemption` initial omettait les champs `id` et `shopifyDiscountNodeId` du type `ReservedRedemption`. Fix dans commit `64894a2` : ajout des 2 champs au mock. Aucune logique modifiée.
3. **`Mes avis` repositionné** : pour cohérence visuelle (vue cagnotte/parrainage adjacentes), `Mes avis` passe après `Parrainage` dans la nav `/account`.

## Actions manuelles toi

### 1. Configurer `NEXT_PUBLIC_SITE_URL` sur Vercel

Pour les liens WhatsApp / partage parrainage (sinon ils sont vides mais la page reste fonctionnelle) :

- Vercel Dashboard → Project Settings → Environment Variables
- Ajouter `NEXT_PUBLIC_SITE_URL` avec la valeur du domaine actuel (ex. `https://bodystart.vercel.app` pour preview, ou ton domaine prod custom une fois tranché)
- Disponible pour **Production + Preview + Development** (les 3 environments)
- Redéployer la branche `feat/loyalty` après ajout pour que la variable soit injectée

### 2. Forcer le téléphone obligatoire au checkout Shopify (URGENT avant prod)

Shopify Admin → Settings → Checkout → Customer information :
- « Phone number is required » → **Required** (pas Optional)

Sans ça, certains clients commanderont sans téléphone, et le webhook ne pourra pas matcher leur `loyalty_customer` par phone. Le fallback email existe (cf. L2) mais il est moins robuste.

### 3. Tester end-to-end sur preview Vercel

URL preview : ton dashboard Vercel → `feat/loyalty` branch → le dernier déploiement (lien direct visible dans Vercel après le push).

Scénarios à valider :

**a. Page publique `/parrainage`** (non connectée) :
- Visite la page sans cookie → CTA « Connecte-toi pour avoir ton code » + sous-CTA « Inscris-toi en 30 secondes »
- Connecté → CTA « Voir mon code » → redirect `/account?tab=referral`
- Visuellement : hero vert sombre, 3 cards « Comment ça marche », 6 FAQ accordéon, CTA bas en card sombre
- Relire le copy à voix haute (ton conseil de pote)

**b. `/account` onglet Cagnotte** (connecté avec compte Shopify existant) :
- Si pas encore enrôlé → bloc `EnrollmentBlock` (form téléphone E.164)
- Entrer un téléphone (format français accepté, normalisé E.164) → toast « Programme activé ! »
- Solde 0,00 €, sous-titre « Tu peux utiliser ta cagnotte dès qu'elle atteint 20 € »
- Historique vide → CTA « Voir mon code »

**c. `/account` onglet Parrainage** :
- Carte code BS-XXXXX en gros, 3 boutons Copier / WhatsApp / Partager
- Click WhatsApp ouvre `wa.me/?text=...` avec le message pré-rempli (qui inclura ton domaine `NEXT_PUBLIC_SITE_URL`)
- Section « Comment ça marche » 3 étapes, link « Voir ma cagnotte » → `/account?tab=cagnotte`

**d. Widget panier (`CartDrawer`)** :
- Pas connecté → rien (widget invisible)
- Connecté + pas enrôlé → encart « Active ton programme fidélité » + bouton « Activer »
- Enrôlé + solde < 20 € → bandeau mini info
- Enrôlé + solde ≥ 20 € + panier > 40 € → carte avec slider 0 → min(solde, 50 % panier) + bouton « Appliquer » → applique le code `LY-...` au cart Shopify, refresh balance via `useLoyaltyMe`
- Cagnotte appliquée → carte verte « Cagnotte appliquée » + bouton « Retirer »

### 4. Vérifier la CI pgTAP

Aller sur https://github.com/Poupouuuuuu/bodystart/actions/workflows/pgtap.yml après le push, le dernier run sur `feat/loyalty` doit être vert (28/28 + 8/8 = 36 assertions). Pas de nouvelle migration SQL en L4, donc ça doit juste re-tourner et passer.

### 5. Ne PAS merger sur `main`

Tu m'as explicitement demandé d'attendre ta revue preview avant de parler déploiement prod. La branche `feat/loyalty` est poussée mais reste isolée de `main`. Quand tu valides, on parlera de la stratégie merge (PR ou fast-forward).

## Décisions techniques (rappel)

| Décision | Justification |
|---|---|
| Helper `resolveLoyaltyForSession` 2 niveaux + auto-upgrade | Couvre tous les cas : compte Shopify direct, compte boutique existant rattaché ensuite, email changé. Stabilise le lien primary via `shopify_customer_id`. |
| Routes phone-based fermées en staff/M2M | Audit grep a confirmé zéro consumer public actuel à casser. Plus de probing anonyme possible. Même pattern auth cascade que `finalize` en L5. |
| Helpers purs `preview-core` + `redeem-online-core` | 1 seule source de vérité métier, testée une fois. Les 2 paires de routes (L3 phone + L4 session) délèguent à ces helpers. |
| Rate limit Upstash sur `preview` L3 (30/min/IP) | Défense en profondeur, même si la route est authentifiée. |
| Widget panier 5 états | Couvre tous les cas UX sans complexité inutile. Détection cagnotte appliquée via préfixe code `LY-`. |
| Page `/parrainage` Server Component | SEO statique (metadata next/metadata), CTA conditionnel via cookie côté serveur, zéro JS bundle pour le visiteur non connecté. |

## Edge cases couverts

- **Téléphone Shopify ≠ téléphone loyalty** : on s'en fout, notre identité loyalty est immuable
- **Token Shopify expiré** : `getCustomer` retourne null → `state: 'logged_out'`
- **2 comptes Shopify pour 1 phone loyalty** : auto-upgrade UPDATE fail silencieusement (try/catch), client garde son ancien lien
- **Slider à 0 € + click Appliquer** : protégé front (bouton disabled) ET back (Zod `min(1)`)
- **Cagnotte appliquée puis cart vidé** : code Shopify reste « réservé » 1h puis expire naturellement via sweep lazy L3
- **Reserve Shopify échoue mais validation OK** : retourne `{ok:false, kind:'reserve'}` avec detail, le widget affiche un toast
- **expireOldRedemptions échoue** : non-bloquant, log warn, on continue le flow
- **Email Shopify changé après enrôlement** : match par `shopify_customer_id` prend la priorité, fonctionne

## Hors-scope L4 (sprint L6)

- Emails Resend (welcome enrôlement, commission créditée)
- Import CSV legacy
- Notifications web push (« tu as gagné X € »)
- Statistiques parrain (« tu as parrainé N personnes »)
- Page publique « top parrains du mois » (gamification)
- App mobile / PWA dédiée

## Garde-fous respectés

- ✅ Tasks 4-5 (refactor L3) : zéro régression, 139/139 tests passent (134 avant T4, 139 après ajout des nouveaux tests core)
- ✅ `finalize_order_loyalty` n'a JAMAIS été touché (ni la fonction Postgres ni le wrapper TS `src/lib/loyalty/finalize.ts`)
- ✅ Pas de merge sur `main` (seul push `feat/loyalty`)
- ✅ CI pgTAP : aucune migration SQL en L4, le workflow doit rester vert
- ⏳ URL preview Vercel : à vérifier sur ton dashboard après le push

---

**Sprint L4 complet. Le programme loyalty BodyStart est now end-to-end côté client : caisse boutique (L5), webhook Shopify (L2), redemption en ligne (L3), compte client + parrainage + widget panier (L4). On est sur la dernière ligne droite avant prod.**
