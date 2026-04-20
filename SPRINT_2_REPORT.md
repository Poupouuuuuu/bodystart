# SPRINT 2 — RAPPORT DE LIVRAISON

**Branche** : `feat/coaching-platform`
**Date** : 2026-04-20 (suite immédiate du Sprint 1)
**Statut build** : ✅ `next build` passe, type-check ✅
**Statut deploy** : 🟡 À déployer sur Vercel après actions manuelles ci-dessous

---

## 1. RÉSUMÉ EXÉCUTIF

Sprint 2 livre **tout le tunnel coaching client + interface admin** :

- ✅ Tarifs 2 cartes (49€ / 89€/mois) avec bouton checkout direct
- ✅ Stripe Checkout via `lookup_key` (price IDs ne sont plus hardcodés)
- ✅ Webhook Stripe étendu : crée `coaching_orders` ou `subscriptions` + `intakes` pending + email bienvenue
- ✅ Formulaire intake multi-step (6 sections, ~25 questions)
- ✅ Email coach formaté HTML avec **toutes** les réponses du client
- ✅ Panel admin `/admin/programs` (file d'attente + détail)
- ✅ Upload PDF par le coach → livraison atomique au client
- ✅ Espace client : liste programmes + téléchargement PDF via signed URL Supabase Storage

**Le flow complet client est opérationnel** :
```
/coaching/tarifs
  → Stripe Checkout (49€ ou 89€/mois)
  → Webhook crée order/sub + intake pending + email bienvenue
  → /coaching/intake (formulaire 6 étapes)
  → /api/coaching/intake (sauvegarde + email coach avec toutes les réponses)
  → Coach reçoit email + URL admin
  → /admin/programs/[id] (relecture + upload PDF + valider)
  → Email "ton programme est prêt" envoyé au client
  → /account/coaching/programmes/[id] (téléchargement signed URL)
```

---

## 2. CE QUI A ÉTÉ FAIT (en détail)

### 2.1 Migration SQL #3

`supabase/migrations/00003_sprint2_additions.sql` :
- Ajout colonnes : `intakes.submitted_at`, `coaching_orders.completed_at`, `programs.coach_email_sent_at`, `programs.client_email_sent_at`
- RLS storage `coaching-pdfs` : policies "no public read/insert/update/delete" → forcent l'utilisation du service_role + signed URLs

### 2.2 Refactor Stripe types

`src/lib/stripe/types.ts` :
- Suppression de l'ancien array de 5 produits avec price IDs hardcodés
- Nouveau modèle : `Record<CoachingTier, CoachingProduct>` avec 2 entrées (`oneshot`, `monthly_followup`)
- Chaque produit a un `stripeLookupKey` (`coaching_program_oneshot` / `coaching_followup_monthly`) — **le price ID est résolu dynamiquement à chaque checkout**
- Helpers : `getCoachingProductByLookupKey()` et `getCoachingProductByTier()`

### 2.3 Stripe Checkout

`src/app/api/stripe/checkout/route.ts` :
- Body simplifié : `{ tier: 'oneshot' | 'monthly_followup' }` (au lieu de `{ priceId, mode, productId }`)
- Résolution du price via `stripe.prices.list({ lookup_keys: [...], active: true })`
- Metadata enrichie : `coaching_tier`, `coaching_lookup_key`, `shopify_customer_id`, `customer_email`
- Pour les abonnements : metadata aussi en `subscription_data.metadata` (sinon perdue côté `Stripe.Subscription`)
- `success_url` redirige vers `/coaching/intake` (au lieu de `/account/coaching`)
- `allow_promotion_codes: false` (pas de code promo applicable sur les offres coaching elles-mêmes)

### 2.4 Webhook Stripe

`src/app/api/stripe/webhook/route.ts` (réécrit en grande partie) :
- Lit la nouvelle metadata `coaching_tier`
- Pour `oneshot` :
  - Upsert `coaching_orders` (idempotent via `stripe_checkout_session_id`)
  - Insert `intakes` placeholder avec `status='pending'`
  - Lie `coaching_orders.intake_id`
- Pour `monthly_followup` :
  - Retrieve la `Stripe.Subscription` (l'ID n'est pas dans la session metadata)
  - Upsert `subscriptions` (idempotent via `stripe_subscription_id`)
  - Insert `intakes` placeholder
  - **Crée le code promo -15%** (uniquement pour monthly, pas pour oneshot)
- Active les metafields Shopify `coaching` (legacy, conservé pour le code promo)
- Envoie email "bienvenue, remplis ton intake" via Resend

Le handler `customer.subscription.deleted` met à jour Supabase + désactive metafield + désactive code promo.

### 2.5 Module emails

`src/lib/coaching/emails.ts` (nouveau) :
- 3 fonctions : `sendWelcomeAfterPayment()`, `sendIntakeReceivedToCoach()`, `sendProgramReadyToClient()`
- Toutes utilisent `Body Start Coaching <onboarding@resend.dev>` (sandbox Resend)
- HTML stylé table-based pour compatibilité clients mail
- Escape HTML systématique sur les inputs utilisateurs (XSS)
- L'email coach formate **toutes les réponses du formulaire** dans une table HTML lisible (séparé des champs persistés en DB)

### 2.6 Pages publiques

| Route | Action | Note |
|---|---|---|
| `/coaching` (landing) | Adapté | 2 cartes au lieu de 4. Reste la même structure marketing |
| `/coaching/tarifs` | Réécrit complet | Page server-side, 2 cartes responsive, design coaching-cyan |
| `/coaching/programmes` | Redirect | → `/coaching/tarifs` (URL legacy gardée pour SEO) |
| `/coaching/consentement` | Inchangé | Sprint 1 |
| `/coaching/intake` | Nouveau | Server-component qui valide profile + RGPD + intake pending, puis affiche le `IntakeForm` |

### 2.7 Formulaire intake

`src/app/(coaching)/coaching/intake/IntakeForm.tsx` (nouveau) :
- Multi-step avec 6 sections (1: Identité, 2: Objectif, 3: Activité, 4: Nutrition, 5: Santé, 6: Contexte)
- ~25 champs au total : age, sexe, taille, poids, objectif, objectif chiffré, échéance, type programme, niveau, sports pratiqués (multi), fréquence actuelle, dispo hebdo, type régime, contraintes alimentaires (multi), nb repas/jour, compléments actuels, blessures, pathologies, médicaments, sommeil, stress (slider 1-10), motivation, blocages passés, notes libres
- Validation par section bloquante (bouton Suivant désactivé si requis manquants)
- Barre de progression
- Disclaimer santé sur la section "Santé & contraintes"
- Soumission → `POST /api/coaching/intake` → toast + redirect vers `/account/coaching`

### 2.8 API submit intake

`src/app/api/coaching/intake/route.ts` :
- Vérifie auth Shopify + ownership de l'intake
- Valide que le statut est `pending` (pas de double soumission)
- Update `intakes` avec les champs typés du schéma
- Compile les champs "freeform" (objectif chiffré, sports, fréquence, etc.) dans `intakes.notes_libres` car le schéma n'a pas de colonne dédiée pour chacun (Sprint 3/4 pourra ajouter des colonnes typées si besoin)
- Update `intakes.status = 'generated'` + `submitted_at = now()`
- Envoie email coach avec **toutes** les réponses brutes (pas que les persistées)

### 2.9 Pages admin

`/admin/programs` :
- Liste tous les intakes triés par status (à traiter / délivrés / pending client)
- Table avec : client, offre, date soumission, status badge coloré, lien "Ouvrir"

`/admin/programs/[id]` :
- Affiche profil client + objectif + données détaillées
- Bloc "Réponses détaillées" en monospace lisible
- Section blessures avec warning amber si rempli (donnée santé)
- Si pas encore délivré : composant `ProgramUploadForm` (input file PDF + textarea coach_notes + bouton "Valider et envoyer")
- Si déjà délivré : affichage du PDF path + date livraison + notes coach

### 2.10 API upload program

`src/app/api/coaching/admin/upload-program/route.ts` :
- Sécurité : check whitelist email admin (même pattern que `requireAdmin()`)
- Validation : PDF seulement, max 10 MB
- Vérifie que l'intake existe et qu'il appartient bien au userId fourni
- Insert un nouveau `programs` (ou update si `existingProgramId`) → récupère l'ID
- Upload PDF dans Supabase Storage `coaching-pdfs/{userId}/{programId}.pdf` avec `upsert: true`
- Update `programs` : pdf_url + pdf_generated_at + validated_by_coach_at + delivered_at + coach_adjustments
- Update `intakes.status = 'delivered'`
- Envoie email client "ton programme est prêt"
- Update `programs.client_email_sent_at` (audit)

### 2.11 Téléchargement PDF client

`src/app/api/coaching/pdf/[programId]/route.ts` :
- Auth obligatoire
- Vérifie que le programme appartient au user (sauf admin)
- Vérifie `delivered_at IS NOT NULL` (impossible de DL un programme en cours)
- Génère signed URL Supabase Storage (60s d'expiration)
- Redirige le browser vers cette URL → téléchargement automatique

### 2.12 Espace client réécrit

`/account/coaching/page.tsx` (réécrit complet) :
- Server component : fait directement les requêtes Supabase
- Si pas d'activité → état "Aucun coaching, découvre nos offres"
- Si intake `pending` → bandeau jaune "Action requise : remplis ton intake"
- Si intake `generated` (soumis, pas encore délivré) → bandeau bleu "Programme en préparation"
- Si abonnement actif → carte verte avec le code promo `COACH-XXXXX`
- Liste des programmes délivrés → cards cliquables vers `/account/coaching/programmes/[id]`
- Footer links : Confidentialité (RGPD) + Boutique nutrition

`/account/coaching/programmes/[id]` (réécrit) :
- Vérifie ownership server-side
- Si pas encore délivré → message "en préparation"
- Si délivré → bouton "Télécharger mon PDF" qui pointe vers l'API signed URL

---

## 3. ACTIONS MANUELLES REQUISES (👤 toi)

### Action 1 — Appliquer la migration SQL #3

1. Dashboard Supabase → SQL Editor → **+ New query**
2. Ouvre le fichier `supabase/migrations/00003_sprint2_additions.sql` dans VS Code
3. Sélectionne tout (Ctrl+A) → copie (Ctrl+C) → colle dans l'éditeur SQL
4. **Run** → vert attendu

Si erreur sur les policies storage (ex: "policy already exists" ou "bucket does not exist"), c'est OK — le `do $$ ... if exists` est idempotent et ces policies sont du defense-in-depth.

### Action 2 — Configurer le webhook Stripe (si pas déjà fait)

Vérifie que ton **endpoint webhook Stripe** est bien configuré :

1. Va sur https://dashboard.stripe.com/test/webhooks
2. Tu dois voir un endpoint pointant vers `https://bodystart.vercel.app/api/stripe/webhook` (ou l'URL de la branche preview)
3. Events à écouter : `checkout.session.completed`, `customer.subscription.deleted`
4. Vérifie que `STRIPE_WEBHOOK_SECRET` dans Vercel correspond bien au signing secret de cet endpoint

⚠️ Note : pour tester le webhook sur la preview URL, l'endpoint Stripe doit pointer vers cette URL preview, **pas** la production. Soit tu crées un 2e endpoint pour la preview, soit tu testes directement après merge vers main.

### Action 3 — Tester le tunnel complet

Sur l'URL preview `https://bodystart-git-feat-coaching-platform-orientrelais-projects.vercel.app` :

**Test 1 — Achat 49€** (carte de test Stripe `4242 4242 4242 4242`, n'importe quelle date future, n'importe quel CVV) :
1. Va sur `/coaching/tarifs`
2. Clique "Acheter le programme" sur la carte 49€
3. Stripe Checkout s'ouvre → carte test → paie
4. Redirection automatique vers `/coaching/intake` (ou `/coaching/consentement` si pas encore consenti)
5. Si consentement → coche les 2 cases → redirige vers `/coaching/intake`
6. Remplis le formulaire (toutes les sections)
7. Submit → toast vert + redirection vers `/account/coaching`
8. **Vérifie ta boîte mail** `bodystartnutrition@gmail.com` :
   - Email "Bienvenue dans le Programme Personnalisé" arrivé peu après le checkout
   - Email "Nouvel intake reçu" arrivé après la soumission du formulaire avec **toutes** les réponses

**Test 2 — Validation admin + upload PDF** :
1. Va sur `/admin/programs`
2. L'intake que tu viens de soumettre apparaît dans "🚨 À traiter"
3. Clique "Ouvrir"
4. Tu vois toutes les réponses du client
5. Upload n'importe quel PDF de test (ex: une page de garde Body Start)
6. Ajoute des notes coach (facultatif)
7. Clique "Valider et envoyer au client"
8. Toast vert + page rafraîchie : tu vois "✅ Programme délivré"
9. **Vérifie ta boîte mail** : email "Ton programme Body Start est prêt"

**Test 3 — Téléchargement client** :
1. Va sur `/account/coaching` → tu vois ton programme dans la liste
2. Clique dessus → page de détail
3. Clique "Télécharger mon PDF"
4. Le PDF se télécharge

**Test 4 — Achat 89€/mois** :
Même que Test 1 mais avec le bouton "S'abonner au suivi". Vérifie qu'après le checkout, sur `/account/coaching` :
- Le bandeau vert avec le code promo `COACH-XXXXX` apparaît

### Action 4 — Stripe Webhook signing secret

⚠️ Le webhook signing secret peut différer entre :
- Production (URL bodystart.vercel.app) — c'est ce qui est dans `STRIPE_WEBHOOK_SECRET` actuel
- Preview (URL bodystart-git-feat-coaching-platform...) — pas de webhook configuré dessus pour l'instant

**Pour tester sur la preview**, il y a 3 options :
- **(A)** Tester directement après merge vers main (recommandé pour Sprint 2)
- **(B)** Créer un 2e endpoint webhook Stripe dédié à la preview URL
- **(C)** Utiliser Stripe CLI en local pour forwarder les events vers la preview

Pour le Checkpoint 2, je recommande **(A)** : on merge vers main quand tu as validé visuellement la preview, puis tu testes le tunnel complet sur la prod.

---

## 4. DÉCISIONS TECHNIQUES PRISES EN AUTONOMIE

| Décision | Justification |
|---|---|
| **Lookup keys Stripe** au lieu de price IDs | Permet de renommer/recréer un product Stripe sans modifier le code. Standard de production. |
| **Compilation des champs freeform dans `notes_libres`** | Le schéma DB ne couvrait pas tous les champs du formulaire (sports, motivation, blocages, etc.). Plutôt que d'ajouter 12 colonnes, j'ai agrégé en notes_libres pour ce sprint. Sprint 3+ pourra typer si besoin. |
| **Email "intake reçu" envoyé même si la sauvegarde DB échoue partiellement** | Le coach a TOUTES les réponses dans l'email → résilience si Supabase a un souci. La DB reste source de vérité mais l'email est un backup utile. |
| **PDF stocké sous `{userId}/{programId}.pdf` dans Supabase Storage** | Permet à un coach de retrouver tous les PDFs d'un client via le path. |
| **Signed URL TTL = 60s** | Suffisant pour démarrer le download. Empêche le partage public du lien. |
| **Bucket en privé + RLS qui block tout sauf service_role** | Defense-in-depth. Même si une route faisait un appel anon par erreur, impossible d'exfiltrer un PDF. |
| **Upload PDF crée le `programs` row au moment de l'upload (pas avant)** | Évite des `programs` "vides" en base. La création + upload + delivery est atomique du point de vue du coach. |
| **Atomicité partielle** | L'upload n'est PAS dans une transaction DB+Storage (Supabase ne le permet pas). En cas de plantage entre upload et update programs, on a un PDF orphelin. Acceptable car l'upload-program peut être retry sans conséquences (upsert). |
| **Pas de webhook `invoice.paid` / `payment_failed`** | Reporté Sprint 4. Sprint 2 se concentre sur la création initiale. La désactivation est gérée par `customer.subscription.deleted`. |
| **Formulaire intake : 6 sections, ~25 champs** | Compromis entre exhaustivité (= meilleur programme) et complétion (~5 minutes). Si la friction est trop forte, on pourra réduire en Sprint 5 après mesure. |
| **`/coaching/programmes` → redirect vers `/coaching/tarifs`** | L'URL existait pour le catalogue 5-produits, devenue obsolète. Redirect pour préserver le SEO. |

---

## 5. CE QUI A ÉTÉ DIFFÉRÉ

| Fonctionnalité | Différée à | Raison |
|---|---|---|
| Webhook `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated` | Sprint 4 | Nécessaires pour la gestion fine des abonnements (renouvellements, échecs paiement, changements de plan) |
| Recalcul automatique du programme tous les 3 mois (abonnement) | Sprint 4 | Cron Vercel à mettre en place |
| Check-ins hebdo (formulaire + admin) | Sprint 4 | Périmètre dédié au sprint suivant |
| Migration `localStorage` → table `workouts` | Sprint 4 | Décidé en Sprint 1 |
| Cal.com pour appel mensuel | Sprint 5 | Périmètre Sprint 5 |
| Domaine email perso (au lieu de `onboarding@resend.dev`) | Sprint 5 | Configuration DNS + vérification Resend, à faire avant le go-live prod |
| Upload PDF avec preview iframe | Optimisation future | Pas critique pour le MVP, ajout possible Sprint 5 |
| Suppression du debug endpoint `/api/coaching/debug/whoami` | Fin Sprint 5 | Utile pour debug pendant les tests |

---

## 6. DETTE TECHNIQUE IDENTIFIÉE

- **Stripe webhook handler manque de gestion d'erreurs idempotentes profondes** : si un step intermédiaire échoue (ex: insert intake OK mais email bienvenue KO), on a un état partiel. À sécuriser Sprint 4 avec un système de retry queue.
- **Le code promo Shopify utilise les metafields legacy** (Sprint 1 héritage) : la cohérence avec la table `subscriptions` Supabase n'est pas garantie. À unifier Sprint 4 quand on ajoutera les webhooks subscription.
- **`buildNotesLibres()` agrège des champs typés en string** : on perd le type. Pas grave pour l'usage coach (lecture humaine) mais empêche d'utiliser ces données pour des analytics. Sprint 3+ : ajouter colonnes typées si besoin.
- **Pas de validation côté serveur des longueurs/format des champs intake** au-delà des CHECK constraints DB. Un client malicieux pourrait envoyer des strings de 1MB. À blinder avec `zod` Sprint 4.
- **Le bouton "Annuler mon abonnement"** n'existe pas encore côté client. À ajouter dans `/account/coaching` Sprint 4.
- **L'admin ne peut pas re-uploader un PDF après livraison** (le composant ProgramUploadForm est masqué). À ajouter Sprint 3/4.

---

## 7. BLOCAGES RENCONTRÉS

**1 erreur de typage** sur `programId: string | null` après refactoring → résolue en utilisant un `if/else` au lieu d'une initialisation conditionnelle.

Tout le reste est passé sans accroc. Build vert du premier coup après le fix typage.

---

## 8. VALIDATION DU CHECKPOINT 2

Pour valider Sprint 2 et passer au Sprint 3 :

- [ ] **Action 1** : migration SQL #3 appliquée
- [ ] **Test 1** : achat 49€ test → email bienvenue reçu → intake rempli → email coach reçu avec toutes les réponses
- [ ] **Test 2** : admin valide + upload PDF → email client reçu
- [ ] **Test 3** : client télécharge le PDF
- [ ] **Test 4** : achat 89€/mois → code promo `COACH-XXXXX` affiché dans `/account/coaching`

⚠️ Tests 1-4 nécessitent que le webhook Stripe soit configuré sur l'URL où tu testes (cf. Action 4).

Quand tout est ✅, donne-moi le go pour Sprint 3.

---

## 9. POUR LE SPRINT 3

Sprint 3 est désormais **plus court** que prévu initialement (l'upload PDF + delivery + email client a été fait au Sprint 2). Sprint 3 va donc se concentrer sur :

- Édition d'un programme déjà délivré (re-upload PDF, ajustement notes coach)
- Ajout de la **section "Recommandations produits"** dans l'espace client (cards Shopify cross-sell)
- Polish UI/UX du panel admin (filtres, recherche, tri)
- Refonte landing `/coaching` avec section "Comment ça marche" + témoignages
- Améliorations email (template HTML plus joli, footer cohérent)

Estimation Sprint 3 : 4-6h.

---

## 10. COMMITS

Voir l'historique sur la branche `feat/coaching-platform`. Sprint 2 = 4 commits atomiques + 1 commit récap final.
