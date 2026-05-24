# SPRINT L3 LOYALTY — RAPPORT DE LIVRAISON

**Branche** : `feat/loyalty` · **Commit base** : `f3ec043` (L2)
**Build** : ✅ `next build` vert · `tsc --noEmit` vert · **118/118 tests** · couverture **83.52%** (>80% requis)

---

## 1. RÉSUMÉ EXÉCUTIF

Sprint L3 livre la **couche Shopify Admin API** de la cagnotte + code parrain :
- ✅ Migration 00006 : 3 colonnes (`shopify_referral_discount_id` + `last_error` + `last_attempt_at` sur `loyalty_customers`, `shopify_discount_node_id` sur `loyalty_redemptions`) + view `loyalty_customers_with_failed_referral_code` pour réparation manuelle
- ✅ 3 fonctions Shopify : `createReferralDiscountCode`, `createRedemptionDiscountCode` (endsAt 1h), `deleteDiscountCode`
- ✅ Helpers loyalty : `validateRedemptionRequest` (pure), `expireOldRedemptions` (sweep lazy), `reserveRedemption` (orchestre Shopify + DB)
- ✅ Parser pur `interpretDiscountCodes` (testable exhaustivement)
- ✅ 2 nouvelles routes API : `POST /api/loyalty/preview`, `POST /api/loyalty/redeem-online`
- ✅ Extension `customers/upsert` : best-effort code parrain Shopify + **traçabilité d'échec** dans la DB
- ✅ Extension webhook : interprétation des codes + alimentation `referredByCodeUsed` + `spentLoyaltyCents` + marquage `redemptions.status='applied'`

**Stratégie d'expiration validée** : `endsAt = now + 1h` côté Shopify (barrière dure) + sweep lazy DB. Zéro infra cron.

---

## 2. CE QUI A ÉTÉ FAIT

### 2.1 Migration 00006 — Tracking Shopify
| Colonne ajoutée | Table | Rôle |
|---|---|---|
| `shopify_referral_discount_id` | `loyalty_customers` | GID Shopify du code parrain (NULL = pas créé) |
| `shopify_referral_discount_last_error` | `loyalty_customers` | Dernier message d'erreur Shopify (traçabilité réparation) |
| `shopify_referral_discount_last_attempt_at` | `loyalty_customers` | Timestamp dernière tentative |
| `shopify_discount_node_id` | `loyalty_redemptions` | GID Shopify du code cagnotte |

+ Index partiel sur les customers à réparer (`shopify_referral_discount_id IS NULL AND last_error IS NOT NULL`).
+ View `loyalty_customers_with_failed_referral_code` accessible service_role uniquement → utilisable plus tard pour un dashboard admin ou un script de retry.

### 2.2 Helpers Shopify (`src/lib/shopify/loyalty-discounts.ts`)

**3 fonctions** :

| Fonction | Spec |
|---|---|
| `createReferralDiscountCode({ referralCode, parrainEmail })` | `discountAmount: 5 EUR`, `minimumRequirement.subtotal ≥ 40 EUR`, **pas d'endsAt** (code valide tant que parrain a un compte), `appliesOncePerCustomer: true`, `usageLimit: null`, `combinesWith.shipping: true` (le reste false) |
| `createRedemptionDiscountCode({ customerHint, amountCents, expiresAt, cartSubtotalCents })` | `discountAmount = amountCents/100`, **`endsAt = expiresAt`** (now+1h), `usageLimit: 1`, `appliesOncePerCustomer: true`, code généré `LY-{8 hex chars}`, defensive minimum subtotal |
| `deleteDiscountCode(shopifyDiscountNodeId)` | Suppression `discountCodeDelete`, idempotent, log au lieu de throw pour ne pas casser un batch de cleanup |

⚠️ Fichier **distinct** de `src/lib/shopify/discounts.ts` (helpers coaching legacy) pour ne pas mélanger les 2 contextes métier.

### 2.3 Helpers loyalty (`src/lib/loyalty/redemption.ts`)

| Fonction | Rôle |
|---|---|
| `validateRedemptionRequest(req)` | **Pure**, testable. Retourne `{ ok: true, appliedCents }` ou `{ ok: false, reason, maxAllowedCents }` (4 raisons) |
| `expireOldRedemptions(supabase, customerId)` | Sweep lazy : passe les `reserved` expirées en `expired` (sans toucher Shopify — `endsAt` Shopify gère lui-même) |
| `reserveRedemption(supabase, input)` | **Orchestre Shopify + DB** : crée d'abord le code Shopify (avec `endsAt = now + 1h`), puis insert `loyalty_redemptions`. Si DB échoue après Shopify : code orphelin qui expirera dans 1h → **aucune fuite possible** |

`REDEMPTION_TTL_MS = 1h` (constante exportée).

### 2.4 Parser pur (`src/lib/loyalty/interpret-discount-codes.ts`)

Fonction **100% pure et testable** qui prend en entrée :
- Les codes du payload Shopify
- L'ID de l'acheteur
- Les lookups parrains (déjà fetchés)
- Les lookups redemptions (déjà fetchés)

Et retourne :
- `referredByCodeUsed` (code parrain à passer à `finalize`)
- `spentLoyaltyCents` (montant cagnotte à débiter)
- `appliedRedemptionId` (id de la redemption à marquer `applied`)
- `diagnostics[]` (audit log)

**Règles** :
- Priorité **redemption > parrain** si collision théorique
- Anti auto-parrainage : ignore le code si `referral.ownerId === buyerCustomerId`
- Premier code de chaque type pris (autres ignorés avec diagnostic)
- Validation format `BS-XXXXX` via `isValidReferralCode` (réutilise L1)
- Codes vides/whitespace → ignorés silencieusement

### 2.5 Routes API

#### `POST /api/loyalty/preview`
- Body : `{ phone, cartSubtotalCents }`
- Réponse : `{ balanceCents, maxRedeemableCents, eligible, reason?, config }`
- Lecture seule (pas d'effet). Pas d'auth (le solde n'est révélé qu'à qui connaît le phone E.164).

#### `POST /api/loyalty/redeem-online`
- Body : `{ phone, cartSubtotalCents, requestedAmountCents }`
- Flow : lookup → sweep lazy → validate → reserve (Shopify + DB)
- Réponse : `{ ok, redemption: { discountCode, amountCents, expiresAt } }`
- Erreurs typées : `invalid_body`, `invalid_phone`, `customer_not_found`, `validation_failed` (+reason+maxAllowed), `reserve_failed`

### 2.6 Extensions

#### `customers/upsert` (extension L3)
Après upsert, si `isNew === true` → appelle `tryCreateReferralCodeShopify` qui :
- Tente la création du code Shopify (best-effort)
- En cas d'échec : **log clair** + persiste `shopify_referral_discount_last_error` + `last_attempt_at` dans la DB
- **N'échoue jamais l'inscription** (l'utilisateur peut toujours s'inscrire si Shopify down)
- Le customer en échec apparaîtra automatiquement dans la view `loyalty_customers_with_failed_referral_code` pour réparation manuelle

#### `shopify-webhook` (extension L3)
- Pour chaque code du payload : lookup parallèle parrains (`loyalty_customers WHERE referral_code IN (...)`) et redemptions (`loyalty_redemptions WHERE customer_id = buyer AND discount_code IN (...)`)
- Appel `interpretDiscountCodes` → résultat injecté dans `finalize`
- Si redemption appliquée + finalize OK + non-idempotent : `UPDATE loyalty_redemptions SET status='applied', shopify_order_id=...`
- Diagnostics loggés pour audit

### 2.7 Tests

```
8 test files · 118 tests passed
- calculate.test.ts                41 tests (L1)
- phone.test.ts                     9 tests (L2)
- verify-hmac.test.ts               9 tests (L2)
- parse-shopify-order.test.ts      16 tests (L2)
- finalize.test.ts                  6 tests (L2)
- upsert-customer.test.ts          11 tests (L2)
- interpret-discount-codes.test.ts 13 tests (L3 nouveau)
- redemption.test.ts               13 tests (L3 nouveau)

Couverture src/lib/loyalty/ : 83.52% statements · 91.30% branches · 90% funcs
(supabase-admin.ts exclu — wrapper d'init sans logique métier, testable E2E au L5)
```

| Fichier | Stmts | Note |
|---|---|---|
| calculate.ts | 100% | L1 |
| finalize.ts | 100% | L2 |
| parse-shopify-order.ts | 100% | L2 |
| **interpret-discount-codes.ts** | **100%** | **L3** — 13 cas couverts |
| verify-hmac.ts | 88.88% | L2 |
| phone.ts | 90% | L2 |
| upsert-customer.ts | 91.72% | L2 |
| **redemption.ts** | **23.68%** | **L3** — seul `validateRedemptionRequest` (pure) couvert à 100%. Les fonctions I/O (`expireOldRedemptions`, `reserveRedemption`) seront testées E2E au L5 avec pgTAP + Supabase local (ta condition (b)). |

---

## 3. ACTIONS MANUELLES TOI

### Action 1 — Appliquer la migration SQL 00006
Supabase SQL Editor → New query → coller `supabase/migrations/00006_loyalty_l3_shopify_codes.sql` → Run.
Vérifier : `loyalty_customers` a 3 nouvelles colonnes, `loyalty_redemptions` en a 1, la view `loyalty_customers_with_failed_referral_code` apparaît dans Database → Views.

### Action 2 — Vérifier les scopes Admin API
Le code utilise `discountCodeBasicCreate` et `discountCodeDelete` (Admin API). Ces 2 mutations sont sous le scope **`write_discounts`** (déjà actif d'après l'audit Phase 0). Si tu vois une erreur "access denied" en testant, vérifier que `write_discounts` est bien coché dans Shopify Admin → Apps → BodyStart Site → Configuration → Admin API.

### Action 3 — Tester end-to-end (preview Vercel)
Une fois le push fait + Vercel preview prête :

```bash
# 1. Crée un customer test
curl -X POST https://<preview>.vercel.app/api/loyalty/customers/upsert \
  -H "Content-Type: application/json" \
  -d '{"phone":"+33612345678","firstName":"Test"}'
# → vérifier la réponse : customer.referralCode = BS-XXXXX
# → vérifier dans Shopify Admin > Discounts qu'un code BS-XXXXX existe avec -5€/40€ min
# → vérifier en base : loyalty_customers.shopify_referral_discount_id != null
```

(Pour redeem-online, faudra d'abord avoir un solde > 20€ via une commission parrain — testable en simulant 2 commandes du filleul.)

---

## 4. DÉCISIONS TECHNIQUES PRISES

| Décision | Raison |
|---|---|
| Fichier `loyalty-discounts.ts` séparé de `discounts.ts` (coaching legacy) | 2 contextes métier différents, éviter le couplage |
| `appliesOncePerCustomer: true` sur les 2 types de code | Défense partielle contre la réutilisation par un compte Shopify connecté. Edge case guest checkout traité côté Supabase via `has_first_purchase` (cf. §5) |
| `combinesWith: { shipping: true, rest: false }` | Cohérent helper coaching existant. Pas besoin de cumul car les 2 cas (filleul 1ère commande / parrain avec cagnotte) ne se cumulent jamais |
| Code Shopify créé **avant** insert DB dans `reserveRedemption` | Si DB échoue : orphelin avec `endsAt 1h` → zéro fuite. Si Shopify échoue : rien en DB |
| Traçabilité erreur dans 2 colonnes (`last_error` + `last_attempt_at`) | Ta demande : pouvoir réparer les codes manquants plus tard. La view utilitaire `loyalty_customers_with_failed_referral_code` automatise le listing |
| `appliedRedemptionId` marqué `applied` **uniquement si finalize n'est pas idempotent_skip** | Évite de mettre à jour 2x sur un retry webhook |
| Lookups parrains + redemptions en parallèle dans le webhook | Optimisation : 2 requêtes en parallèle vs séquentiel |
| Code redemption au format `LY-{hex8}` | Préfixe `LY` ≠ `BS` → discriminable visuellement et techniquement |
| Pure parser `interpretDiscountCodes` | Permet de tester exhaustivement les 13 scénarios d'interprétation sans Supabase. C'est la logique critique L3 |
| Pas de test E2E sur `reserveRedemption` | Coût mock élevé pour faible valeur (le wrapper appelle 2 APIs externes). Sera couvert E2E au L5 |

---

## 5. EDGE CASES NOTÉS

### Code parrain réutilisable en guest checkout
**Risque** : un filleul peut commander en invité (sans compte Shopify) et réutiliser le code -5€ plusieurs fois. Shopify n'a pas de moyen de l'empêcher sans compte connecté.

**Mitigation actuelle** :
- Commission parrain : **protégée** par `has_first_purchase` côté Supabase (la 2e commande du filleul ne re-crédite jamais le parrain)
- Remise -5€ filleul : **non protégée** côté Shopify si guest

**Action future (hors L3)** : configurer Shopify pour exiger un compte client au checkout. À trancher quand tu auras du recul utilisateur réel.

### Codes morts dans Shopify Admin
**Stratégie** : les codes redemption expirés (`endsAt < now`) restent visibles dans Shopify Admin mais ne fonctionnent plus. Sur le long terme (mois/années) → pollution cosmétique de l'interface.

**Action future (hors L3)** : script npm one-shot `npm run loyalty:cleanup-shopify-codes` qui supprime les codes Shopify dont l'expiration date de > 7 jours et le status DB est `expired`. À lancer manuellement tous les 3-6 mois.

### Codes parrain ratés à la création
Si Shopify timeout/erreur pendant `createReferralDiscountCode`, le customer existe en DB mais son code Shopify n'existe pas. Le filleul qui essaiera ce code recevra "code invalide" côté Shopify checkout.

**Détection** : la view `loyalty_customers_with_failed_referral_code` les liste automatiquement.
**Réparation** : pour l'instant manuelle (re-call de la fonction depuis le SQL Editor ou un futur endpoint admin). Hors scope L3, mais traçable.

---

## 6. HORS-SCOPE L3 (conforme au brief)

- ❌ UI widget checkout (`CheckoutLoyaltyWidget`) → **L4**
- ❌ Page `/mon-compte` (historique transactions + code parrain affiché) → **L4**
- ❌ Page `/parrainage` (landing) → **L4**
- ❌ `/staff/caisse` + auth staff Supabase → **L5**
- ❌ Script cleanup codes Shopify morts → **futur cleanup périodique manuel**
- ❌ Endpoint admin de réparation des codes parrain ratés → **futur si volume**
- ❌ Webhook `orders/refunded` (réversion commission/cagnotte) → **sprint futur**
- ❌ pgTAP automatisé (CI) → **avant prod L5** (condition (b))

---

## 7. COMMIT

`feat(loyalty): L3 - codes Shopify methode A + interpretation webhook + redemption cagnotte`

Atomique : tout L3 dans un commit (migration + helpers + routes + tests + report).

---

## 8. SUITE

Quand tu auras :
1. Appliqué la migration 00006
2. Testé un upsert customer → vérifié la création du code Shopify
3. Validé que tout est OK sur preview

→ **Merger `feat/loyalty` → `main`** (Sprint L4 ou L5 pourra continuer depuis `feat/loyalty-v2` ou rebrancher après).
