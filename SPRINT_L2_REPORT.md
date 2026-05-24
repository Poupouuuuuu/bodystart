# SPRINT L2 LOYALTY — RAPPORT DE LIVRAISON

**Branche** : `feat/loyalty`
**Commit base** : depuis `abe8c59` (L1)
**Build** : ✅ `next build` vert · `tsc --noEmit` vert · 92/92 tests passent (couverture 89.42%)

---

## 1. RÉSUMÉ EXÉCUTIF

Sprint L2 livre **le moteur loyalty serveur** :
- ✅ Fonction Postgres atomique `finalize_order_loyalty()` (idempotence + lock + anti double-spend + commission parrain dans fenêtre 12 mois)
- ✅ Wrapper TS `finalizeOrderLoyalty()` strict-typed
- ✅ Helpers testables : `parse-shopify-order`, `verify-hmac`, `phone (E.164)`, `upsert-customer`
- ✅ 3 routes API : `customers/upsert`, `shopify-webhook` (HMAC + raw body), `finalize` (auth staff secret)
- ✅ Fixtures SQL critiques pour validation manuelle dans Supabase

**Hors-scope L2** (confirmé) : codes Shopify Admin API (filleul -5€ + redemption méthode A) = **L3** · UI = **L4/L5**.

---

## 2. CE QUI A ÉTÉ FAIT

### 2.1 Dépendances ajoutées
| Package | Version | Pourquoi |
|---|---|---|
| `@supabase/supabase-js` | 2.x | Client admin server-only + appel RPC |
| `zod` | 3.x | Validation runtime des bodies API |
| `libphonenumber-js` | 1.x | Normalisation téléphone E.164 |

### 2.2 Fichiers créés
| Fichier | Rôle |
|---|---|
| `supabase/migrations/00005_finalize_order_loyalty.sql` | **Cœur du sprint** — fonction `SECURITY DEFINER` atomique, ≈180 lignes commentées étape par étape |
| `src/lib/loyalty/supabase-admin.ts` | Client admin lazy + cached (service_role uniquement, server-only) |
| `src/lib/loyalty/finalize.ts` | Wrapper TS de l'rpc `finalize_order_loyalty` |
| `src/lib/loyalty/upsert-customer.ts` | Upsert par téléphone avec retry sur collision `referral_code` |
| `src/lib/loyalty/phone.ts` | `normalizeToE164`, `isValidE164` |
| `src/lib/loyalty/parse-shopify-order.ts` | Parser webhook payload → input finalize |
| `src/lib/loyalty/verify-hmac.ts` | HMAC SHA256 timing-safe |
| `src/app/api/loyalty/customers/upsert/route.ts` | POST endpoint inscription/lookup |
| `src/app/api/loyalty/shopify-webhook/route.ts` | POST webhook orders/paid |
| `src/app/api/loyalty/finalize/route.ts` | POST endpoint caisse boutique |
| `supabase/tests/finalize_fixtures.sql` | 5 fixtures critiques (happy path, idempotence, anti double-spend, commission cumulée, hors fenêtre) |

### 2.3 Tests
```
6 test files · 92 tests passed
- calculate.test.ts        41 tests (Sprint L1, déjà 100%)
- phone.test.ts             9 tests
- verify-hmac.test.ts       9 tests
- parse-shopify-order.test  16 tests
- finalize.test.ts          6 tests (wrapper mocked)
- upsert-customer.test.ts  11 tests (Supabase mocked)

Couverture src/lib/loyalty/ : 89.42% statements · 88.74% branches · 94.11% funcs
Seuil vitest.config.ts : 80% (✅ dépassé sur tous les axes)
```

Détail par fichier :

| Fichier | Stmts | Note |
|---|---|---|
| calculate.ts | 100% | L1 |
| finalize.ts | 100% | Lignes 68/78 = guards défensifs sur réponse anormale |
| parse-shopify-order.ts | 100% | |
| verify-hmac.ts | 88.88% | Lignes 45-46 = catch block timingSafeEqual (très défensif) |
| phone.ts | 90% | Lignes 28-29 = catch parsePhoneNumberFromString (libphonenumber ne throw quasi jamais) |
| upsert-customer.ts | 91.72% | Lignes manquantes = chemin "race condition phone après collision insert" + boucle exhaustion 8 retries |
| supabase-admin.ts | 0% | **Non testable simplement** (createClient au runtime). C'est juste 30 lignes d'init lazy. Le couvrir nécessiterait un mock global de `@supabase/supabase-js` ou un test E2E réel — pas le bon ROI pour L2. Sera couvert indirectement par les tests E2E au L5. |

---

## 3. ACTIONS MANUELLES TOI

### Action 1 — Appliquer la migration SQL #4 (Sprint L1) si pas encore fait
Supabase SQL Editor → New query → coller `supabase/migrations/00004_loyalty_foundation.sql` → Run.
Tu dois voir 4 tables `loyalty_customers / loyalty_transactions / loyalty_processed_orders / loyalty_redemptions`.

### Action 2 — Appliquer la migration SQL #5 (Sprint L2)
Supabase SQL Editor → New query → coller `supabase/migrations/00005_finalize_order_loyalty.sql` → Run.
Vérifier : Database → Functions → `finalize_order_loyalty` apparaît.

### Action 3 — Lancer les fixtures critiques
Supabase SQL Editor → New query → coller `supabase/tests/finalize_fixtures.sql` → Run.

Attendu : 4 messages `RAISE NOTICE '✅ ...'` (A, C, B, E, D) puis le ROLLBACK final + message `🎉 TOUTES LES FIXTURES PASSENT`.
Si une assertion échoue → bug, dis-moi exactement quel `ASSERTION FAILED Xn` est apparu.

### Action 4 — Créer 2 nouvelles vars d'env

#### `SHOPIFY_WEBHOOK_SECRET`
1. **Shopify Admin** (boutique `bodystart-nutrition-2`) → **Settings** → **Notifications** → scroll bas → **Webhooks**
2. **Create webhook** :
   - Event : `Order payment`
   - Format : `JSON`
   - URL : `https://bodystart.vercel.app/api/loyalty/shopify-webhook`
   - API version : `2024-04`
   - **Save**
3. Sur la même page, en bas : "All your webhooks will be signed with [...]" → **Click to reveal** → **copie ce secret**.
4. Coller dans :
   - `.env.local` : `SHOPIFY_WEBHOOK_SECRET=<valeur>`
   - **Vercel** Settings → Environment Variables → Add New :
     - Key : `SHOPIFY_WEBHOOK_SECRET`
     - Value : la valeur
     - Sensitive : ✅
     - Environments : Production + Preview

#### `LOYALTY_STAFF_SECRET`
Génère une valeur aléatoire (≥ 32 chars, ex: 2 UUID concaténés sans tirets).
Coller dans :
- `.env.local` : `LOYALTY_STAFF_SECRET=<ta valeur>`
- **Vercel** : pareil, Sensitive ✅, Production + Preview.

### Action 5 — Redeploy Vercel
Push merge vers main (cf. §5 ci-dessous), ou Redeploy manuel depuis Vercel pour que les nouvelles env vars + le code soient actifs.

### Action 6 — Tester le webhook end-to-end (optionnel L2)
Une fois le merge main + redeploy fait, tu peux :
1. Faire un faux paiement dans Shopify Admin (mode dev/test) → ça déclenche `orders/paid` → ton webhook sur Vercel
2. Vérifier dans Vercel Logs que `[loyalty webhook]` est appelé sans erreur
3. Vérifier dans Supabase Table Editor que `loyalty_processed_orders` a une nouvelle ligne

---

## 4. DÉCISIONS TECHNIQUES PRISES

| Décision | Raison |
|---|---|
| Fonction Postgres en `SECURITY DEFINER` plutôt que transactions Node | Garantie d'atomicité plus forte (Postgres serial transaction). Évite un round-trip + sérialisation Node. |
| `loyalty_processed_orders` inséré **avant** les mutations, dans la même transaction | Si la transaction rollback, le marqueur disparaît avec → idempotence + cohérence garanties par le DB lui-même. |
| Lock du customer via `SELECT FOR UPDATE` | Anti race-condition entre webhook online + caisse in_store simultanés. |
| Lock du parrain aussi via `SELECT FOR UPDATE` | Anti race si plusieurs filleuls font une commande simultanée chez le même parrain. |
| Test du parrain `id != p_customer_id` | Anti auto-parrainage (cas absurde mais défense). |
| `referred_by_code` du filleul stocké à l'inscription | Source de vérité unique. Le webhook n'a pas besoin de re-lire le code dans la commande. |
| `p_referred_by_code_used` param accepté SEULEMENT à la 1ère commande sans code stocké | Évite qu'un user existant change rétroactivement de parrain. |
| Retry max 8 sur collision `referral_code` | 31^5 ≈ 28M combinaisons → collision réelle extrêmement rare. 8 retries = sécurité largement suffisante. |
| Mock Supabase via fabriques de réponses (pas via `vi.mock`) | Plus lisible, force à penser au shape réel des appels (`.from().select().eq().maybeSingle()`). |
| Fixtures SQL manuelles (vs pgTAP automatisé) en L2 | Compromis pragmatique : couvre les cas critiques sans monter un Supabase local. À automatiser au L5 avant prod argent réel (conforme à ta condition (b)). |
| HMAC en `crypto.timingSafeEqual` | Anti-attaque par timing standard. |
| `supabase.rpc` au lieu de raw SQL via PostgREST | Encapsule la logique côté DB ; le wrapper TS ne fait que typer la réponse. |

---

## 5. À FAIRE AVANT MERGE MAIN

Le plan recommandé :
1. **Push `feat/loyalty`** (en cours) → preview Vercel auto-créée
2. **Toi : Action 1-2-3-4-5** (migrations + env vars + redeploy)
3. **Tests des fixtures SQL** + tests des routes API sur preview URL
4. Quand vert : **merge `feat/loyalty` → `main`** (auto-deploy prod)
5. **Création du webhook Shopify** (Action 4 §SHOPIFY_WEBHOOK_SECRET) — peut être fait avant ou après le merge, à ta convenance

**⚠️ Ne pas merger main avant d'avoir validé les fixtures SQL.** C'est de la logique qui touche l'argent, on ne pousse pas en prod sans validation.

---

## 6. HORS-SCOPE L2 (conforme au brief)

- ❌ Création codes Shopify Admin API (filleul -5€ + redemption cagnotte en ligne) → **L3**
- ❌ UI `/mon-compte`, `/parrainage`, widget checkout → **L4**
- ❌ UI `/staff/caisse` + auth staff Supabase → **L5**
- ❌ Tests pgTAP automatisés (CI) → **avant prod L5** (ta condition (b))
- ❌ Webhook `orders/refunded` (réversion commission + restitution cagnotte) → **sprint futur** (modèle append-only le supporte déjà)

---

## 7. DETTE TECHNIQUE NOTÉE

- **`supabase-admin.ts` à 0% coverage** : trivial mais juste un wrapper d'init. Non-bloquant — sera couvert par les tests E2E au L5.
- **Pas de test E2E API en CI** : on a couvert le wrapper de l'rpc, mais pas le flow complet HTTP → finalize → DB. À couvrir au L5 avec un setup Supabase local.
- **Pas de rate limiting sur `customers/upsert`** : noté spec V2 §8, à ajouter au L5.
- **`LOYALTY_STAFF_SECRET` partagé** : suffisant pour le L2 mais auth staff propre (Supabase Auth + role) est obligatoire avant ouverture publique du panel caisse au L5.

---

## 8. COMMIT

`feat(loyalty): L2 - finalize_order_loyalty atomique + 3 routes API + helpers + tests`

Atomique : tout le sprint dans un seul commit pour cohérence.

---

**Sprint L2 livré. Ready pour les actions manuelles + validation fixtures SQL.**
