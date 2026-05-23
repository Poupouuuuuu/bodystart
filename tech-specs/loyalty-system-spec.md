# Spec technique — Système de fidélité et parrainage BodyStart

> ⚠️ **DESIGN TECHNIQUE INVALIDE (2026-05-23).** Toute la partie implémentation de ce doc (Drizzle, SQLite, schémas `customers/orders`, routes Next.js DB) suppose une stack qui n'existe pas. Stack réelle = **Shopify Storefront API** (commandes compléments côté Shopify) **+ Supabase** (`profiles, intakes, programs, subscriptions, weekly_checkins, coaching_orders`). La **mécanique métier** (tél = carte, parrain 5 % sur achats du filleul 12 mois, filleul −5 €, cagnotte min 20 € / plafond 50 %) **reste valide** ; elle doit être redessinée sur Shopify (webhooks commandes + discount codes) + Supabase (ledger loyalty). Spec V2 à produire après décision coaching.

> **Audience** : Claude Code (et Adam / Théo). Ce document est conçu pour être collé tel quel dans un agent Claude Code dans le dossier `Bodystart_protocole`. L'agent suit ce spec étape par étape.
> 
> **Stack cible** : Next.js (App Router, vu sur le projet existant), TypeScript, Drizzle ORM, SQLite (dev) → PostgreSQL (prod), Tailwind, shadcn/ui (présents dans le projet).

---

## ⚠️ MISE À JOUR 2026-05-22 — DÉCISION FINALE (prioritaire sur tout le reste du doc)

Mécanique simplifiée par Adam. **Ces règles priment** sur les sections 0, 2.1, 2.3 et 3.3 plus bas, à adapter en conséquence.

1. **Pas de cash-back sur ses propres achats.** Un client ne gagne RIEN sur ce qu'il achète pour lui-même. (Suppression de l'auto-cashback 5 %.)
2. **Parrainage = seule source de cagnotte.** Quand un filleul s'inscrit avec le code d'un parrain, le **parrain gagne 5 % de cashback sur les achats du filleul pendant 12 mois** (à compter du 1ᵉʳ achat du filleul), en boutique ET en ligne. Cagnotte utilisable par le parrain sur ses propres achats (redeem inchangé : min 20 €, plafond 50 % du panier).
3. **Filleul : −5 € sur sa 1ʳᵉ commande** (≥ 40 €), pour qu'il ait une raison d'utiliser le code. **Parrain : pas de bonus flat** — sa récompense, ce sont les 5 % récurrents (point 2). (On retire l'ancien −10 €/+10 €.)
4. **Promos / réducs (hors cagnotte, remise directe en caisse) :**
   - −10 % abonnés Instagram (promo de lancement, durée limitée ~1 mois)
   - Avis Google 5★ = −5 % (one-shot)
   - Story Insta avec tag @bodystart_nutrition = −5 % (one-shot)
   - ⚠️ **Plafond d'empilement à confirmer** : reco = non cumulables au-delà de −10 % total (sinon marge whey trop entamée).

**Conséquences schéma / logique :**
- `customers` : ajouter `firstPurchaseAt` (timestamp) et `referralCommissionUntil` (= firstPurchaseAt + 12 mois). Garder `referredByCode`.
- `loyalty_transactions` : type `referral_commission` (les 5 % récurrents crédités au parrain). Abandonner les bonus flat `referral_signup` / `referral_bonus`.
- Pas de transaction `earn` sur les achats perso.
- `finalize` : sur chaque commande d'un filleul dans la fenêtre de 12 mois → créditer le parrain de 5 % du montant. Au 1ᵉʳ achat du filleul : fixer `firstPurchaseAt` + `referralCommissionUntil` et créditer déjà le parrain sur cette commande.

---

## 0. Contexte produit (historique — voir mise à jour ci-dessus)

BodyStart Nutrition est une boutique physique de compléments alimentaires à Coignières (78) avec un e-shop en construction. Système de fidélité unique, boutique ET en ligne.

> ⚠️ Mécanique mise à jour le 2026-05-22 (bloc ci-dessus). L'ancienne version (cash-back 5 % sur tous les achats + parrainage 10 €/10 €) est **caduque**.

Le client est identifié par son **numéro de téléphone** (mobile FR). Pas de carte physique. Le téléphone = la carte.

---

## 1. Modèles de données (Drizzle schema)

Créer / modifier dans `lib/db/schema/`. Si conflit avec schémas existants (le projet a déjà des utilisateurs ?), adapter.

```typescript
// lib/db/schema/customers.ts
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const customers = sqliteTable('customers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Identifiants
  phone: text('phone').notNull().unique(), // format E.164 : +33612345678
  email: text('email').unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name'),
  
  // Loyalty
  loyaltyBalanceCents: integer('loyalty_balance_cents').notNull().default(0),
  referralCode: text('referral_code').notNull().unique(), // format : BS-XXXXX (5 chars alphanum)
  referredByCode: text('referred_by_code'), // code parrain à la création
  hasFirstPurchase: integer('has_first_purchase', { mode: 'boolean' }).notNull().default(false),
  
  // Marketing consents
  emailOptIn: integer('email_opt_in', { mode: 'boolean' }).notNull().default(false),
  smsOptIn: integer('sms_opt_in', { mode: 'boolean' }).notNull().default(false),
  
  // Méta
  source: text('source', { enum: ['in_store', 'online', 'import_legacy'] }).notNull().default('online'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const loyaltyTransactions = sqliteTable('loyalty_transactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: text('customer_id').notNull().references(() => customers.id),
  type: text('type', { enum: ['earn', 'spend', 'referral_bonus', 'referral_signup', 'adjustment', 'expire'] }).notNull(),
  amountCents: integer('amount_cents').notNull(), // toujours positif, le type indique le signe
  orderId: text('order_id').references(() => orders.id),
  source: text('source', { enum: ['in_store', 'online'] }).notNull(),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});
```

Si la table `orders` existe déjà dans le projet, ajouter ces colonnes via migration :

```typescript
// dans la migration ALTER TABLE orders
loyaltyEarnedCents: integer('loyalty_earned_cents').notNull().default(0),
loyaltySpentCents: integer('loyalty_spent_cents').notNull().default(0),
referralAttributedCustomerId: text('referral_attributed_customer_id').references(() => customers.id), // si commande issue d'un parrainage, ID du parrain
```

---

## 2. Règles métier (à coder en pure fonctions testables dans `lib/loyalty/`)

### 2.1 Calcul cash-back à appliquer sur une commande

```typescript
// lib/loyalty/calculate.ts
// MISE À JOUR 2026-05-22 : plus d'auto-cashback. Le 5% va au PARRAIN, pas à l'acheteur.
const REFERRAL_COMMISSION_RATE = 0.05; // 5% → cagnotte du parrain
const MIN_REDEEM_CENTS = 2000; // 20€

// Commission versée au parrain sur une commande de son filleul (dans la fenêtre 12 mois).
// L'acheteur lui-même ne gagne rien sur ses propres achats.
export function calculateReferrerCommissionCents(orderTotalCents: number, spentLoyaltyCents: number): number {
  const cashableAmount = Math.max(0, orderTotalCents - spentLoyaltyCents);
  return Math.floor(cashableAmount * REFERRAL_COMMISSION_RATE);
}

export function maxRedeemableForOrder(orderTotalCents: number, currentBalanceCents: number): number {
  if (currentBalanceCents < MIN_REDEEM_CENTS) return 0;
  // On peut payer au maximum 50% du panier avec la cagnotte
  const cap = Math.floor(orderTotalCents * 0.5);
  return Math.min(currentBalanceCents, cap);
}
```

**Pourquoi le cap à 50 %** : éviter qu'un client utilise toute sa cagnotte sur un petit achat à -100 % (mauvaise marge + risque de fraude). Configurable.

**Pourquoi seuil minimum 20 €** : éviter les transactions à 0,50 € qui polluent le système.

### 2.2 Génération du code parrainage

```typescript
// lib/loyalty/referral.ts
export function generateReferralCode(): string {
  // Format BS-XXXXX (5 chars, alphanum, sans 0/O/1/I/L pour éviter confusion)
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const code = Array.from({ length: 5 }, () => 
    alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join('');
  return `BS-${code}`;
}

// Note : générer en boucle avec check unicité en base avant d'insérer
```

### 2.3 Règles du parrainage

```typescript
// MISE À JOUR 2026-05-22 : plus de 10€/10€. Filleul -5€ 1ère commande + parrain 5% récurrent 12 mois.
const REFERRAL_COMMISSION_RATE = 0.05;       // 5% des achats du filleul → cagnotte du parrain
const REFERRAL_WINDOW_MONTHS = 12;           // fenêtre depuis le 1er achat du filleul
const REFERRAL_FILLEUL_DISCOUNT_CENTS = 500; // -5€ sur la 1ère commande du filleul
const REFERRAL_MIN_ORDER_CENTS = 4000;       // commande filleul ≥ 40€ pour déclencher

// À l'inscription d'un filleul avec code parrain :
//   - Stocker referredByCode
//   - Aucun bonus immédiat (anti-fraude)
//
// 1ère commande du filleul (≥ 40€) :
//   - Appliquer -5€ en réduc directe au checkout (réduc, PAS cagnotte)
//   - Fixer firstPurchaseAt = now, referralCommissionUntil = now + 12 mois, hasFirstPurchase = true
//   - Créditer le parrain de 5% du montant cashable (cette commande compte aussi)
//
// CHAQUE commande suivante du filleul, dans la fenêtre (now <= referralCommissionUntil) :
//   - Créditer le parrain de 5% du montant cashable
//   - Insérer loyalty_transactions type 'referral_commission' côté parrain
```

---

## 3. Routes API (Next.js App Router)

### 3.1 Création / récup customer par téléphone

```
POST /api/customers/upsert
Body: {
  phone: string,          // E.164
  firstName: string,
  lastName?: string,
  email?: string,
  referredByCode?: string,
  emailOptIn?: boolean,
  source: 'in_store' | 'online'
}
Response 200: { customer: Customer, isNew: boolean }
Response 400: { error: 'invalid_phone' | 'phone_already_exists_with_different_name' }
```

Comportements :
- Si phone existe : retour customer existant (`isNew: false`). Ne pas écraser les champs.
- Si phone n'existe pas : créer avec code parrainage généré.
- Si `referredByCode` fourni à la création : valider que ce code existe et stocker.

### 3.2 Application du cash-back / cagnotte à un panier

```
POST /api/loyalty/preview
Body: {
  customerId: string,
  orderSubtotalCents: number,
  requestedRedeemCents?: number  // ce que le client veut utiliser
}
Response 200: {
  currentBalanceCents: number,
  maxRedeemableCents: number,
  appliedRedeemCents: number,
  willEarnCents: number,
  finalAmountCents: number
}
```

### 3.3 Validation d'une commande et écriture des transactions loyalty

```
POST /api/loyalty/finalize
Body: {
  customerId: string,
  orderId: string,
  orderTotalCents: number,    // total panier AVANT redeem
  spentLoyaltyCents: number,  // cagnotte utilisée
  source: 'in_store' | 'online'
}
Response 200: {
  earnedCents: number,
  newBalanceCents: number,
  referralBonusAppliedTo?: { parrainCustomerId: string, parrainBonusCents: number }
}
```

Workflow interne (MISE À JOUR 2026-05-22) :
1. Vérifier que `customerId` (le filleul/acheteur) a bien `currentBalance >= spentLoyaltyCents`. Sinon erreur.
2. Insérer transaction `spend` si spent > 0.
3. **Pas d'auto-cashback** : l'acheteur ne gagne rien sur sa propre commande.
4. Si c'est son tout premier achat (`hasFirstPurchase === false`) :
   - Si `referredByCode` non null ET orderTotal ≥ 40 € : la réduc **−5 € filleul** a été appliquée au checkout (réduc directe, pas cagnotte).
   - Fixer `firstPurchaseAt = now`, `referralCommissionUntil = now + 12 mois`, `hasFirstPurchase = true`.
5. **Commission parrain** : si `referredByCode` non null ET `now <= referralCommissionUntil` :
   - Trouver le parrain via `referredByCode`.
   - Créditer le parrain de `calculateReferrerCommissionCents(orderTotal, spent)` (= 5 %).
   - Insérer une transaction `referral_commission` côté parrain.
6. Tout dans une transaction DB atomique (pas de demi-état possible).

### 3.4 Lecture du solde et historique

```
GET /api/customers/[id]/loyalty
Response 200: {
  customer: { id, phone, firstName, balanceCents, referralCode, hasFirstPurchase },
  recentTransactions: LoyaltyTransaction[],  // 20 dernières
  totalEarned: number,
  totalSpent: number
}
```

---

## 4. UI Web — pages publiques

### 4.1 Page "Mon compte" — `/mon-compte`

Accès : utilisateur connecté (auth à câbler sur l'existant du projet).

Sections :

1. **Header** : photo de profil placeholder + prénom + solde cagnotte en GROS
   ```
   Bonjour Adam 👋
   8,40 € disponibles dans ta cagnotte
   ```

2. **Section parrainage** :
   - Code parrainage en gros encart vert mousse `#6BA84F`
   - Boutons partage : Copier le code / Partager sur WhatsApp / Partager via DM
   - Phrase d'incentive : "Tu fais venir un pote = il a -10€ sur sa première commande, et tu reçois 10€ dans ta cagnotte."
   - Compteur "X amis parrainés" si applicable

3. **Historique transactions** (table simple) :
   - Date · Type · Montant · Solde après
   - Filtre type : Achat / Cagnotte gagnée / Cagnotte utilisée / Parrainage

4. **Tes commandes** (si lié au système orders existant) :
   - Lien vers chaque commande
   - Statut

### 4.2 Page parrainage publique — `/parrainage`

Pour qu'un futur filleul comprenne le programme. SEO target = "parrainage compléments Coignières" et associés.

Contenu :
- Hero : "Tes potes méritent les meilleurs compléments. Pas le pire prix."
- 3 étapes (1. Tu partages ton code · 2. Ton pote a -10€ · 3. Tu reçois 10€ en cagnotte)
- FAQ (combien de parrainages possibles ? Pas de limite. Cumulable avec promo ? Non, on prend la meilleure. Etc.)
- CTA : "Se connecter pour voir mon code" / "Créer un compte" 

### 4.3 Composant CheckoutLoyaltyWidget

Composant à intégrer dans le checkout existant (App Router server component + client component) :

```tsx
// components/checkout/loyalty-widget.tsx
// Affiche : solde dispo, slider "j'utilise X €", recalcule total en live, 
// confirme combien sera gagné après la commande
```

UX :
- Si solde < 20€ : afficher juste "Tu cumules à chaque achat — 5% sur cette commande" (transparence sans bouton)
- Si solde ≥ 20€ : afficher slider + "Tu peux utiliser jusqu'à X € sur cette commande"
- Toujours afficher "Tu gagneras +Y € après cette commande"

---

## 5. UI Caisse boutique — `/staff/caisse`

Page protégée par auth staff (rôle distinct).

Layout pleine page tactile :

```
┌─────────────────────────────────────────────────┐
│  📱 NUMÉRO CLIENT      [ 06 ____ ____ ]        │
│                                                  │
│  → Si existe : "Adam M. — Solde 8,40 €"         │
│  → Sinon : bouton "Créer compte rapide"         │
│                                                  │
│  💰 SOLDE CAGNOTTE        8,40 €                │
│                                                  │
│  🛒 MONTANT VENTE         [____,__] €           │
│                                                  │
│  ☐ Utiliser cagnotte      [_____ €] max 8,40    │
│                                                  │
│  → Total à encaisser :    _,_ €                 │
│  → Cagnotte à créditer après : +__ €            │
│                                                  │
│  [        VALIDER LA VENTE        ]              │
└─────────────────────────────────────────────────┘
```

Workflow :
1. Staff tape les 10 chiffres du téléphone client (ou scan QR code de l'app perso)
2. Système retrouve / propose création
3. Staff tape le montant de vente (input numpad)
4. Optionnel : utilise tout ou partie de la cagnotte
5. Tap "Valider" → POST /api/loyalty/finalize avec source: 'in_store'
6. Affichage confirmation : "Vente validée. Adam vient de gagner +1,25 €."

**Anti-fraude minimale** : log de qui (staff_user_id) a fait quoi (timestamp + amount), pour audit.

---

## 6. Migration des clients legacy

Si Adam récupère une liste papier de clients (cahier comptoir), créer une route admin :

```
POST /api/admin/customers/import
Body: { csv: string } // CSV format : phone, firstName, lastName, email
```

Importe en masse, génère codes parrainage, marque source = 'import_legacy', envoie un email/SMS de bienvenue avec leur solde (s'il y a un crédit d'accueil offert).

**Recommandation** : à l'import, créditer chaque legacy de 5 € de cagnotte = -1,75 € de coût ramené à la marge moyenne sur leur prochain achat. Excellent ratio de réactivation.

---

## 7. Sécurité

- Tous les écrits de transactions loyalty doivent passer par une **fonction serveur unique** (`finalizeOrderLoyalty()` dans `lib/loyalty/finalize.ts`). Aucune écriture directe depuis un endpoint client.
- Pas de modification du solde côté client. Tout via API.
- Caisse staff : auth obligatoire, role 'staff' minimum.
- Rate limiting sur création de comptes (anti-spam via Upstash ou middleware).
- Validation phone format E.164 strict côté API (lib `libphonenumber-js`).

---

## 8. Tests à écrire

```
lib/loyalty/__tests__/
├── calculate.test.ts        // edge cases earnings
├── referral.test.ts          // code generation, validation
└── finalize.integration.test.ts  // happy path + double-spend prevention
```

Minimum 80 % de couverture sur `lib/loyalty/`.

---

## 9. Email transactionnels (Resend recommandé)

3 templates à créer dans `emails/loyalty/`:

1. `welcome.tsx` — création compte (avec code parrainage)
2. `earned.tsx` — après chaque commande (récap : tu as gagné X €, ton nouveau solde est Y €)
3. `referral-success.tsx` — quand le filleul fait son 1er achat (tu as reçu 10 €)

Pas d'email "tu vas perdre ta cagnotte" → on a décidé pas d'expiration.

---

## 10. Ordre d'implémentation suggéré

| Sprint | Tâches | Estim |
|---|---|---|
| Sprint 1 (J1-J2) | Schemas + migrations + fonctions pures + tests unitaires | 1.5 j |
| Sprint 2 (J3-J4) | Routes API + auth + intégration au flow commande existant | 1.5 j |
| Sprint 3 (J5-J6) | Page Mon compte + page parrainage + widget checkout | 1.5 j |
| Sprint 4 (J7) | Page Caisse staff + tests E2E | 1 j |
| Sprint 5 (J8) | Emails transactionnels Resend + finition + déploiement | 1 j |

**Total : 6,5 jours** dev pour un seul dev senior. Réalisable en 1,5 semaine de focus.

---

## 11. Hors-scope V1 (pour plus tard)

- Tier system (Bronze / Silver / Gold)
- Application mobile native
- Système de points (vs cash-back direct)
- Bonus anniversaire
- Push notifications
- Programmes de challenges ("Achète 3 produits ce mois = +5 € bonus")

À discuter après 3 mois d'usage réel.

---

## 12. À demander à Adam avant de coder

- [ ] L'auth existante (NextAuth ? Lucia ? Custom ?) — m'envoyer le fichier de config pour intégration
- [ ] Le système `orders` existant — schéma actuel + workflow checkout
- [ ] Hosting prod (Vercel ? VPS ?) pour Resend + secrets
- [ ] Domaine du site pour les liens dans les emails
- [ ] Couleurs Tailwind dans le tailwind.config (j'utilise la palette brand.md mais vérifier)
