# SPRINT 1 — RAPPORT DE LIVRAISON

**Branche** : `feat/coaching-platform`
**Date de livraison** : 2026-04-20
**Statut build** : ✅ `next build` passe sans erreur, type-check ✅
**Statut deploy** : 🟡 À déployer après actions manuelles ci-dessous

---

## 1. RÉSUMÉ EXÉCUTIF

Sprint 1 livre les **fondations techniques** complètes de la plateforme coaching :

- ✅ **Supabase** projet EU + 3 clients (browser/server/admin) avec patterns défensifs
- ✅ **Schéma DB** complet (6 tables) + RLS policies + 2 fonctions RGPD
- ✅ **Bridge auth Shopify ↔ Supabase** via JWT custom HS256 signé avec `jose`
- ✅ **CoachingAuthProvider** + hook `useCoachingAuth` wrappés dans le root layout
- ✅ **Middleware étendu** pour protéger `/admin/*` (en plus de `/account/*` existant)
- ✅ **Layout admin** avec vrai check de rôle (whitelist email + `notFound()` furtif)
- ✅ **Page consentement RGPD** `/coaching/consentement` avec double checkbox bloquante
- ✅ **Page confidentialité** `/account/coaching/confidentialite` (export JSON + demande suppression)
- ✅ **Script Stripe cleanup** prêt à exécuter (`--dry-run` puis `--apply`)

Tout est commité, build vert, type-check vert. Prêt pour Checkpoint 1.

---

## 2. CE QUI A ÉTÉ FAIT (en détail)

### 2.1 Configuration

| Fichier | Action |
|---|---|
| `.env.local` | + `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `COACHING_ADMIN_EMAILS` |
| `.env.local.example` | + mêmes vars avec valeurs factices et commentaires |
| `package.json` | + `@supabase/supabase-js@2.103.3`, `@supabase/ssr@0.10.2`, `jose@6.2.2` |

### 2.2 Migrations SQL

| Fichier | Contenu |
|---|---|
| `supabase/migrations/00001_coaching_foundation.sql` | 6 tables (`profiles`, `intakes`, `programs`, `subscriptions`, `weekly_checkins`, `coaching_orders`), indexes, RLS policies, helper `is_current_user_admin()`, trigger `set_updated_at` |
| `supabase/migrations/00002_rgpd_functions.sql` | Fonctions `export_user_data(uuid)` et `anonymize_user(uuid)` avec `SECURITY DEFINER` + checks d'autorisation |

**Contraintes 🔒 enforced au niveau DB** :
- `program_must_be_validated_before_delivery` : CHECK sur `programs` empêche `delivered_at NOT NULL` sans `validated_by_coach_at NOT NULL`
- `profiles.role` : RLS empêche un user de s'auto-promouvoir admin via UPDATE
- Email anonymisé (`anonymized-{id}@deleted.local`) après `anonymize_user`

### 2.3 Bridge auth

| Fichier | Rôle |
|---|---|
| `src/lib/coaching/supabase/client.ts` | Browser Supabase client (anon key, lazy fail-safe) |
| `src/lib/coaching/supabase/server.ts` | Server Supabase client (cookies-aware via `next/headers`) |
| `src/lib/coaching/supabase/admin.ts` | Service-role client lazy + cached (throw explicite si secrets manquent) |
| `src/lib/coaching/auth/jwt.ts` | Sign/verify JWT HS256 avec `jose`. TTL access=1h, refresh=24h |
| `src/lib/coaching/auth/sync-profile.ts` | Upsert idempotent Shopify→Supabase. Détermine `role` depuis whitelist `COACHING_ADMIN_EMAILS` |
| `src/app/api/coaching/auth/shopify-bridge/route.ts` | POST endpoint : valide token Shopify → upsert profile → signe JWT → renvoie `{ access_token, refresh_token, user }` |
| `src/lib/coaching/auth/CoachingAuthProvider.tsx` | Provider client : sync auto au mount, refresh proactif chaque 50min, expose `useCoachingAuth()` |
| `src/lib/coaching/auth/require-admin.ts` | Helper server : `requireAdmin()` redirect/notFound, retourne `AdminContext` |

### 2.4 Modifications minimales du code existant

🔒 **Conformément à la règle "modification minimale du code e-commerce"**, j'ai touché à 2 fichiers existants seulement :

| Fichier | Modification | Justification |
|---|---|---|
| `src/app/layout.tsx` | Ajout import + wrap `<CoachingAuthProvider>` entre `CustomerProvider` et `CartProvider` | Le bridge a besoin d'être disponible dans toute l'app, monté APRÈS CustomerContext (dépendance) |
| `src/middleware.ts` | + `/admin` dans `PROTECTED_PATHS` + matcher | Premier filet de sécu admin (vrai check role dans `(admin)/layout.tsx`) |

Aucun composant nutrition/checkout/cart touché.

### 2.5 Pages et API

| Route | Type | Sprint 1 ? | Description |
|---|---|---|---|
| `POST /api/coaching/auth/shopify-bridge` | API | ✅ | Bridge JWT |
| `POST /api/coaching/consent` | API | ✅ | Marque `rgpd_consent_at` |
| `GET /api/coaching/export` | API | ✅ | Téléchargement JSON RGPD art.20 |
| `POST /api/coaching/delete-request` | API | ✅ | Notif email coach pour anonymisation |
| `/coaching/consentement` | Page | ✅ | Disclaimer + 2 checkboxes bloquantes |
| `/account/coaching/confidentialite` | Page | ✅ | Boutons export + suppression |
| `/admin` | Page | ✅ | Dashboard placeholder fonctionnel (preuve auth admin OK) |
| `/admin/programs`, `/admin/checkins` | Pages | ⏳ | Sprint 3/4 |

### 2.6 Script Stripe cleanup

`scripts/stripe-cleanup.mjs` — exécutable Node ESM (pas besoin de tsx, charge `.env.local` manuellement).

**Étapes** :
1. Liste les 5 anciens price IDs (hardcodés dans le script depuis `src/lib/stripe/types.ts`)
2. Pour chacun : vérifie qu'aucune subscription active n'existe → archive le product (`active: false`)
3. Crée 2 nouveaux products + prices avec `lookup_key` :
   - `coaching_program_oneshot` (49€ EUR one-shot)
   - `coaching_followup_monthly` (89€ EUR mensuel)
4. Vérifie l'idempotence (skip si lookup_key existe déjà, skip si déjà archivé)
5. Génère `scripts/stripe-cleanup-report.json` avec le détail

---

## 3. ACTIONS MANUELLES REQUISES (👤 toi)

### Action 1 — Appliquer les migrations Supabase

1. Va sur https://supabase.com/dashboard → ton projet `oplflaiwvhmsgsaatxuf`
2. Vérifie la **région** : Settings → General → "Region" doit être **`eu-central-1` (Frankfurt)** ou `eu-west-3` (Paris). Si autre région, **stop** et recrée le projet en EU avant tout (RGPD bloquant).
3. Va dans **SQL Editor** (icône `>_` dans le menu latéral) → **New query**
4. **Copie-colle l'intégralité** du fichier `supabase/migrations/00001_coaching_foundation.sql` → **Run**
5. Vérifie : aucune erreur rouge, message "Success. No rows returned"
6. New query → **copie-colle** `supabase/migrations/00002_rgpd_functions.sql` → **Run**
7. Va dans **Database → Tables** → tu dois voir : `profiles`, `intakes`, `programs`, `subscriptions`, `weekly_checkins`, `coaching_orders`
8. Va dans **Database → Functions** → tu dois voir : `export_user_data`, `anonymize_user`, `is_current_user_admin`, `set_updated_at`

### Action 2 — Configurer les variables d'environnement Vercel

Pour que le déploiement Vercel marche, ajoute les 5 nouvelles vars :

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# → https://oplflaiwvhmsgsaatxuf.supabase.co
# → Production + Preview + Development (sensitive: NO car NEXT_PUBLIC_)

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# → la clé eyJ... anon  (sensitive: NO)

vercel env add SUPABASE_SERVICE_ROLE_KEY
# → la clé eyJ... service_role  (sensitive: YES, Production+Preview seulement)

vercel env add SUPABASE_JWT_SECRET
# → la clé brute L7Nl...  (sensitive: YES, Production+Preview seulement)

vercel env add COACHING_ADMIN_EMAILS
# → contact.nexus.developpement@gmail.com  (sensitive: NO, les 3 envs)
```

### Action 3 — Exécuter le script Stripe en dry-run

```bash
node scripts/stripe-cleanup.mjs --dry-run
```

Tu verras :
- Les 5 anciens products qui seraient archivés
- Les 2 nouveaux qui seraient créés
- Aucune modif réelle effectuée
- Un rapport généré dans `scripts/stripe-cleanup-report.json`

**Examine le rapport. Si tout est OK, lance la version réelle :**

```bash
node scripts/stripe-cleanup.mjs --apply
```

### Action 4 — Tests manuels (après déploiement Vercel)

**Test A — Bridge auth (sur le site déployé)** :

1. Va sur https://bodystart.vercel.app, connecte-toi à un compte client Shopify
2. Ouvre les **DevTools** → onglet **Network**
3. Filtre sur "shopify-bridge"
4. Naviguer sur n'importe quelle page → tu dois voir une requête `POST /api/coaching/auth/shopify-bridge` avec status `200`
5. Réponse JSON contient `access_token`, `refresh_token`, `user` avec `app_role: "client"` ou `"admin"`
6. Va dans **Application → Cookies** : un cookie commençant par `sb-oplflaiwvhmsgsaatxuf-auth-token` doit être présent

**Test B — Vérification profile créé** :

Dans Supabase Dashboard → Table Editor → `profiles` → tu dois voir une ligne avec `shopify_customer_id` correspondant + `email` du compte testé + `role: 'admin'` (si tu testes avec `contact.nexus.developpement@gmail.com`) ou `role: 'client'`.

**Test C — Page admin** :

1. Connecte-toi avec `contact.nexus.developpement@gmail.com`
2. Va sur https://bodystart.vercel.app/admin → tu dois voir le dashboard "Bienvenue [prénom]"
3. Déconnecte-toi, connecte-toi avec un autre compte (pas dans la whitelist)
4. Va sur `/admin` → tu dois voir une **404 Not Found** (et non 403 — choix de design pour ne pas révéler l'existence du panel)

**Test D — Consentement** :

1. Va sur `/coaching/consentement`
2. Vérifie le disclaimer santé visible
3. Essaie de cliquer "Je consens" sans cocher → bouton désactivé
4. Coche les 2 cases → clique → toast "Consentement enregistré" → redirection vers `/coaching/intake` (404 Sprint 1, normal — Sprint 2 créera la page)
5. Recharge `/coaching/consentement` → tu dois voir "✅ Votre consentement est déjà enregistré"
6. Vérifie dans Supabase : `profiles.rgpd_consent_at` rempli

**Test E — Export RGPD** :

1. Connecté, va sur `/account/coaching/confidentialite`
2. Clique "Télécharger mes données (JSON)"
3. Tu dois recevoir un fichier `bodystart-coaching-export-{uuid}-{date}.json`
4. Ouvre-le : tu dois voir `profile`, `intakes: []`, `programs: []`, etc.

**Test F — Suppression RGPD (notif coach)** :

1. Va sur `/account/coaching/confidentialite`
2. Clique "Demander la suppression" → écris un motif → "Confirmer la demande"
3. Tu dois voir un toast confirmant
4. Vérifie ta boîte mail `contact.nexus.developpement@gmail.com` : email "[RGPD] Demande de suppression"

---

## 4. DÉCISIONS TECHNIQUES PRISES EN AUTONOMIE

| Décision | Justification |
|---|---|
| **Path naming** : `/account/coaching/*` au lieu de `/dashboard/*` | Le scaffolding existait déjà à cet emplacement, le middleware Shopify customer y est déjà appliqué. Diverger aurait dupliqué la logique de protection d'accès. |
| **Layout admin** : route group `(admin)/admin/*` (pas `/admin` direct) | Cohérence avec l'existant : `(coaching)/coaching/*`, `(nutrition)/account/*`. Layout dédié = header différent, pas de Footer/Cart |
| **`requireAdmin()` ne passe PAS par Supabase** | La whitelist email est la source de vérité. Le sync `profiles.role` se fait depuis l'env var, pas l'inverse. Plus rapide (1 call au lieu de 2) et impossible à corrompre via DB. |
| **404 furtif au lieu de 403 sur `/admin/*`** | Évite de révéler l'existence du panel admin à un user lambda |
| **Suppression manuelle (notif coach) plutôt qu'auto** | Sécurité (anti-vol de session) + délai légal CNIL 1 mois acceptable. Sprint 4 pourra ajouter un flow auto avec lien magique. |
| **JWT TTL = 1h access + 24h refresh + bridge re-callable** | Plus simple que de gérer un endpoint /refresh dédié. Le client rappelle juste le bridge tant que le cookie Shopify est valide. |
| **Refresh proactif client toutes les 50min** | Marge sécurité 10min avant expiration. `setInterval` simple plutôt qu'observer pattern. |
| **Script stripe-cleanup en `.mjs` (Node ESM)** | Pas de devDep `tsx` à installer, fonctionne avec `node` natif. Charge `.env.local` manuellement (pas de dotenv). |
| **`anonymized-{uuid}@deleted.local`** comme email post-anonymisation | Préserve la contrainte UNIQUE sur email + impossible à confondre avec un vrai email + non-routable (TLD `.local`) |
| **Pages servies en `dynamic = 'force-dynamic'`** sur les routes API qui lisent les cookies | Évite les warnings Next.js sur "Dynamic server usage" et garantit qu'elles ne sont jamais cachées |

---

## 5. CE QUI A ÉTÉ DIFFÉRÉ (et pourquoi)

| Fonctionnalité | Différée à | Raison |
|---|---|---|
| Migration `localStorage` → table `workouts` | **Sprint 4** | Décision validée avec toi : pas urgent, sera fait avec les check-ins. Dette technique notée. |
| Page `/coaching/intake` | **Sprint 2** | Hors scope Sprint 1 (qui livre les fondations) |
| Webhooks Stripe `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated` | **Sprint 4** | Nécessaires uniquement à partir de l'abonnement 89€/mois |
| Vraie suppression auto via lien magique signé | **Sprint 4** | Sprint 1 livre la version manuelle (notif coach), conforme délai CNIL 1 mois |
| Cron de rappel hebdo des check-ins | **Sprint 4** | Pas de check-ins avant Sprint 4 |
| Audit `npm audit` (9 vulnérabilités dont 1 critical) | **Fin Sprint 5** | La critical vient probablement de `next@14.2.5` (CVE connue, fix dispo en `14.2.32+`). Mise à jour Next à faire en fin de Sprint 5 pour ne pas casser le build pendant le développement. |

---

## 6. DETTE TECHNIQUE IDENTIFIÉE

- [ ] **Workouts en localStorage** (`/account/coaching/suivi`) — non persistant multi-device. À migrer vers Supabase au Sprint 4.
- [ ] **Mise à jour `next` 14.2.5 → 14.2.32+** — alerte sécu critique. À planifier fin Sprint 5.
- [ ] **`getCustomer()` appelé 2x par requête sur `/admin/*`** — une fois par middleware-effective (cookie check), une fois par `requireAdmin()`. Acceptable car cache HTTP côté Shopify, mais cacheable côté serveur si besoin (Sprint 5).
- [ ] **Pas de tests automatisés** sur les flows auth/RGPD — hors scope Sprint 1, à ajouter quand on aura un setup vitest/playwright (futur sprint optionnel).
- [ ] **Logging d'audit** sur les actions admin (qui valide quoi, quand) — pas implémenté Sprint 1, à ajouter Sprint 3 quand le panel admin commencera à valider des programmes.

---

## 7. BLOCAGES RENCONTRÉS

**Aucun.** Sprint 1 livré conforme au brief.

Note : la docs `@supabase/ssr` est récente et il y a 3-4 patterns possibles pour le client browser/server selon les versions. J'ai choisi le pattern officiel courant (try/catch sur `cookies().set()` car les Server Components purs ne peuvent pas modifier les cookies). C'est le pattern le plus robuste mais peut donner l'impression d'être verbeux.

---

## 8. VALIDATION DU CHECKPOINT 1

Pour valider ce Sprint 1 et passer au Sprint 2 :

- [ ] **Action 1** : migrations Supabase appliquées sans erreur (vérification visuelle des tables)
- [ ] **Action 2** : env vars Vercel configurées
- [ ] **Action 3** : script Stripe cleanup exécuté en `--dry-run` puis `--apply`, rapport JSON examiné
- [ ] **Test A** : bridge auth retourne 200 avec un user connecté Shopify
- [ ] **Test B** : profile créé dans Supabase
- [ ] **Test C** : `/admin` accessible pour ton email, 404 pour les autres
- [ ] **Test D** : consentement enregistré et persistant
- [ ] **Test E** : export JSON téléchargé et lisible
- [ ] **Test F** : email RGPD reçu sur ta boîte

Quand tout est ✅, donne-moi le go pour Sprint 2.

---

## 9. POUR LE SPRINT 2

Pré-requis avant que je démarre Sprint 2 :

1. **Sprint 1 validé** (cf. checklist ci-dessus)
2. **Clé API Anthropic** ajoutée dans `.env.local` :
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
   À créer sur https://console.anthropic.com → API Keys → Create Key
3. **Bucket Supabase Storage `coaching-pdfs`** créé :
   - Dashboard → Storage → New bucket → Name: `coaching-pdfs` → **Private** (jamais public, signed URLs only)
   - RLS policy à créer (je te la donnerai au démarrage du Sprint 2)
4. **Décision** sur le modèle Claude à utiliser : recommandation `claude-sonnet-4-5-20250929` (meilleur rapport qualité/prix), alternative `claude-opus-4-5-20250929` (plus cher mais peut-être surdimensionné pour générer des programmes).

---

## 10. COMMIT FINAL

Voir commit `[Sprint 1] Récap : fondations coaching complètes` sur la branche `feat/coaching-platform`.
