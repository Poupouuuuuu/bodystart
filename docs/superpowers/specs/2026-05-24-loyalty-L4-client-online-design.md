# Sprint L4 : Interface client en ligne (loyalty)

**Date** : 2026-05-24
**Branche** : `feat/loyalty`
**Référence spec** : `tech-specs/loyalty-system-spec-v2.md` §6, §7.1, §7.2, §7.3
**Status** : design (en attente de revue Adam)

---

## 1. Objectif

Donner au client connecté l'accès à son programme fidélité depuis le site :
voir son solde, son code parrain, son historique, utiliser sa cagnotte au
checkout. Et exposer publiquement la mécanique de parrainage (page SEO).

L4 est la couche front qui consomme tout ce que L1/L2/L3 ont posé en backend.
Pas de nouvelle logique métier, juste de l'expérience client et la fermeture
de surface des routes L3.

---

## 2. Périmètre acté (réponses Adam 2026-05-24)

1. **Enrichir `/account`** existant (option A) : ajout d'un onglet « Cagnotte »
   (header solde + historique + bloc enrôlement) + réécriture complète de
   l'onglet « Parrainage » (vraies données loyalty, vraie mécanique). Suppression
   du copy mensonger actuel (« -10 % », « 10 € bon d'achat », « bientôt actif »).
2. **Page publique `/parrainage`** distincte : SEO + marketing pour visiteurs
   non connectés, complète et autonome.
3. **Refactor L3 en helpers purs** : `preview-core.ts` et `redeem-online-core.ts`
   centralisent la logique métier. Routes L3 et L4 deviennent des wrappers minces.
4. **Fermeture L3** : routes phone-based `/api/loyalty/preview` et
   `/api/loyalty/redeem-online` deviennent staff/M2M only (audit a confirmé
   zéro consumer public actuel). Plus de probing anonyme possible.
5. **Rate limit Upstash léger** (30/min/IP) sur preview L3 en défense en
   profondeur, même en mode auth.
6. **Widget cagnotte dans le `CartDrawer`** (pas une page checkout séparée,
   le checkout Shopify est hébergé et on ne le contrôle pas).

Hors-scope L4 : emails Resend (welcome, commission créditée → L6),
import CSV legacy (L6), notification push, app mobile.

---

## 3. Architecture cible

### 3.1 Helper de résolution session → loyalty_customer

**Fichier** : `src/lib/loyalty/session.ts` (nouveau, serveur uniquement).

```typescript
type ShopifyContext = { id: string; email: string; firstName: string }
type ResolveResult =
  | { state: 'logged_out' }
  | { state: 'not_enrolled'; shopify: ShopifyContext }
  | { state: 'enrolled'; shopify: ShopifyContext; customer: LoyaltyCustomerRow }

export async function resolveLoyaltyForSession(): Promise<ResolveResult>
```

**Algorithme** (2 niveaux + auto-upgrade) :

1. Lit le cookie `body-start-customer-token` via `cookies()` Next.
2. Si absent → `{ state: 'logged_out' }`.
3. Appelle `getCustomer(token)` (Shopify Customer Account API). Si null
   (token expiré/invalide) → `{ state: 'logged_out' }`.
4. **Lookup prioritaire** : `loyalty_customers WHERE shopify_customer_id = $shopifyId`.
   Si trouvé → `{ state: 'enrolled', ... }`.
5. **Fallback email** : `loyalty_customers WHERE email = $shopifyEmail`.
   Couvre les cas où le client a été créé en boutique (caisse a noté son
   email) ou via une commande online d'avant que le compte Shopify existe.
6. **Auto-upgrade** : si trouvé via email mais `shopify_customer_id` est
   `NULL`, on `UPDATE loyalty_customers SET shopify_customer_id = $shopifyId
   WHERE id = $foundId`. Stabilise le lien primary, les futures requêtes
   matchent en étape 4 directement (plus rapide, plus robuste).
7. Si rien trouvé → `{ state: 'not_enrolled', shopify }`. Le front affiche
   le bloc « rejoins le programme » qui demande le téléphone E.164.

**Cas d'edge couverts** :

- Compte boutique d'abord, inscription Shopify ensuite avec même email
  → match en étape 5, upgrade en étape 6.
- Email Shopify changé après enrôlement → étape 4 sauve (shopify_customer_id
  ne change pas).
- Téléphone Shopify diffère du téléphone loyalty → on s'en fout, notre
  identité reste immuable côté loyalty.
- Token Shopify révoqué côté Shopify → étape 3 renvoie null, on traite
  comme logged_out.

### 3.2 Refactor L3 en helpers purs

**Fichiers nouveaux** :
- `src/lib/loyalty/preview-core.ts`
- `src/lib/loyalty/redeem-online-core.ts`

**Contrats** :

```typescript
// preview-core.ts
export interface PreviewInput {
  customer: { id: string; loyaltyBalanceCents: number }
  cartSubtotalCents: number
}
export interface PreviewOutput {
  balanceCents: number
  maxRedeemableCents: number
  eligible: boolean
  reason?: 'balance_below_minimum' | 'invalid_cart' | 'no_redeemable_amount'
  config: { minBalanceCents: number; cartCapRatio: number }
}
export function buildPreview(input: PreviewInput): PreviewOutput

// redeem-online-core.ts
export interface RedeemInput {
  supabase: SupabaseClient
  customer: { id: string; phone: string; loyaltyBalanceCents: number }
  cartSubtotalCents: number
  requestedAmountCents: number
}
export interface RedeemResult {
  ok: true
  redemption: { discountCode: string; amountCents: number; expiresAt: string }
}
export type RedeemFailure =
  | { ok: false; kind: 'validation'; reason: string; maxAllowedCents: number }
  | { ok: false; kind: 'shopify'; detail: string }
  | { ok: false; kind: 'db'; detail: string }
export async function executeRedeem(input: RedeemInput): Promise<RedeemResult | RedeemFailure>
```

**Conséquence** : les routes deviennent des wrappers minces (10 lignes :
parser body Zod, résoudre customer, appeler helper, mapper en NextResponse).
Les tests TS L3 existants continuent de passer (les helpers internalisent
la même logique). Si je casse quelque chose, vitest le voit immédiatement.

### 3.3 Fermeture L3 : auth staff/M2M

Les routes `POST /api/loyalty/preview` et `POST /api/loyalty/redeem-online`
adoptent **le même pattern auth cascade que `/api/loyalty/finalize` en L5** :

```typescript
async function authenticate(req: NextRequest): Promise<
  | { kind: 'staff_session'; staff: { id: string; email: string } }
  | { kind: 'm2m_secret' }
  | { kind: 'unauthorized' }
>
```

1. Tente `getStaffFromRequest(req)` (cookie Supabase Auth staff). Si trouvé
   et staff actif → `staff_session`.
2. Sinon, lit header `X-Staff-Token`. Si présent et `=== process.env.LOYALTY_STAFF_SECRET`
   → `m2m_secret`. Log `console.warn('[preview] AUDIT M2M ...')` pour audit.
3. Sinon → `unauthorized`, 401.

**Rate limit Upstash** en plus, prefix `ratelimit:loyalty:preview` (30 req/min
par IP). Skip si Upstash non configuré (dev local).

**Note importante** : ces routes restent disponibles pour des cas futurs
(intégration avec un POS Shopify quand la boutique migrera, scripts admin,
debug). Mais plus jamais consommées par un client web anonyme.

### 3.4 Nouvelles routes session-based `/me/*`

```
GET  /api/loyalty/me
POST /api/loyalty/me/enroll
POST /api/loyalty/me/preview
POST /api/loyalty/me/redeem-online
```

Chacune commence par `const session = await resolveLoyaltyForSession()`. Si
`state === 'logged_out'` → 401. Sinon, comportement spécifique.

#### `GET /api/loyalty/me`

Réponse selon state :

- `logged_out` → 401 `{ error: 'unauthorized' }`
- `not_enrolled` → 200 `{ state: 'not_enrolled', shopify: { email, firstName } }`
- `enrolled` → 200 `{ state: 'enrolled', customer, recentTransactions, totalEarned, totalSpent }`

Détail réponse `enrolled` :

```typescript
{
  state: 'enrolled',
  customer: {
    id: string,
    firstName: string,
    phone: string,            // masqué côté UI (jamais affiché en clair)
    referralCode: string,
    loyaltyBalanceCents: number,
    hasFirstPurchase: boolean,
    referralCommissionUntil: string | null,  // ISO date
  },
  recentTransactions: Array<{
    id: string,
    type: 'referral_commission' | 'spend' | 'adjustment' | 'import_credit',
    amountCents: number,
    balanceAfterCents: number,
    channel: 'in_store' | 'online',
    shopifyOrderId: string | null,
    relatedCustomerFirstName: string | null,  // prénom du filleul pour referral_commission
    createdAt: string,
  }>,  // 20 dernières
  totals: { earnedCents: number, spentCents: number },  // depuis toujours
}
```

#### `POST /api/loyalty/me/enroll`

Body Zod : `{ phone: string }` (E.164 ou format français normalisable).

Si `state !== 'not_enrolled'` → 409 `{ error: 'already_enrolled' }`.

Appelle `upsertLoyaltyCustomer(supabase, { phone, firstName: shopify.firstName,
email: shopify.email, shopifyCustomerId: shopify.id, source: 'online' })`.

- Si un loyalty_customer existe déjà avec ce phone → l'upsert lie email +
  shopify_customer_id au row existant (utile pour les clients boutique qui
  étaient déjà dans la base par téléphone).
- Sinon création.

Retourne `{ ok: true, customer: { id, referralCode, loyaltyBalanceCents } }`.

Erreurs :
- 400 `invalid_phone`
- 429 si rate-limit Upstash déclenche (réutilise le limiter existant
  `ratelimit:loyalty:upsert`, 5 req/10min/IP)

#### `POST /api/loyalty/me/preview`

Body Zod : `{ cartSubtotalCents: number }`. Si `state !== 'enrolled'` → 403.
Résout customer depuis session, appelle `buildPreview` pur, retourne le
résultat. **Pas de phone dans le body** (le navigateur n'a jamais besoin
de connaître son propre phone).

#### `POST /api/loyalty/me/redeem-online`

Body Zod : `{ cartSubtotalCents: number, requestedAmountCents: number }`.
Si `state !== 'enrolled'` → 403. Résout customer, appelle `executeRedeem`
pur, retourne `{ discountCode, amountCents, expiresAt }` ou erreur typée.

Rate limit Upstash (10/min/IP, prefix `ratelimit:loyalty:me:redeem`) car
chaque appel crée un code Shopify (coûteux côté API Shopify).

### 3.5 Page `/account` (enrichie)

Fichier : `src/app/(nutrition)/account/page.tsx` (modifié).

**Changements** :

1. Ajout d'un nouvel onglet **« Cagnotte »** dans `navItems` (icône `Wallet`
   de lucide-react), entre `addresses` et `reviews`.
2. **Réécriture complète** du composant `ReferralPanel` :
   - Plus de génération de code côté client (`useMemo` mensonger supprimé).
   - Fetch initial via `GET /api/loyalty/me` → state local `loyaltyState`.
   - Si `state: 'not_enrolled'` → composant `<EnrollmentBlock>` (bloc téléphone).
   - Si `state: 'enrolled'` → vraies données : referralCode réel, boutons
     Copier / WhatsApp / DM, message pré-rempli, mécanique vraie (5 € filleul,
     5 % parrain 12 mois).
3. Nouveau composant `<CagnottePanel>` (onglet Cagnotte) :
   - Si `not_enrolled` → `<EnrollmentBlock>`.
   - Si `enrolled` → header solde gros, sous-titre conditionnel, historique
     transactions, lien vers `/parrainage` pour rappeler comment cumuler.
4. Nouveau composant `<EnrollmentBlock>` réutilisable (utilisé par Cagnotte
   ET Parrainage si pas enrôlé).

**État partagé** : un hook `useLoyaltyMe()` (nouveau, `src/hooks/useLoyaltyMe.ts`)
qui fetch `/api/loyalty/me` une fois et expose `{ state, customer?,
recentTransactions?, totals?, refresh, isLoading, error }`. Évite de
re-fetch entre onglets.

**URL d'onglet** : on ajoute `?tab=cagnotte` et `?tab=referral` lus depuis
`useSearchParams()` pour permettre les liens directs (depuis `/parrainage`,
depuis le `CartDrawer`).

### 3.6 Page `/parrainage` (nouvelle, publique)

Fichier : `src/app/(nutrition)/parrainage/page.tsx` (nouveau).

Page **Server Component** statique (SSG, pas de fetch). 4 sections :

1. **Hero** : titre + sous-titre + CTA principal (différent selon connecté/non).
2. **Comment ça marche** : 3 étapes en cards (icônes).
3. **FAQ** : 6 questions/réponses (accordéon ou liste statique).
4. **CTA bas de page** : connexion ou voir mon code.

Le check connecté/non-connecté se fait via le cookie `body-start-customer-token`
dans le Server Component (juste sa présence, pas besoin de fetch Shopify).
CTA conditionnels.

**Metadata SEO** :
- title: « Parrainage BodyStart : 5 € pour ton pote, 5 % pour toi »
- description: « Partage ton code parrain BodyStart. Ton pote a 5 € sur sa
  première commande, tu gagnes 5 % de ses achats pendant 12 mois. »

### 3.7 Widget `CagnotteCartWidget`

Fichier : `src/components/cart/CagnotteCartWidget.tsx` (nouveau).

Injecté dans `CartDrawer.tsx` (juste avant la section total/checkout).
Lit `useLoyaltyMe()` + `useCart()` (subtotal).

**5 états d'affichage** :

| Cas | Condition | Rendu |
|---|---|---|
| A | logged_out | Rien (le client doit de toute façon être connecté pour le checkout Shopify, on évite de polluer) |
| B | not_enrolled | Petit encart : « Active ton programme fidélité pour gagner sur tes prochaines commandes. » + bouton « Activer » → `/account?tab=cagnotte` |
| C | enrolled + balance < 20 € | Bandeau mini : « Cagnotte : X,XX € · Utilisable dès 20 € » |
| D | enrolled + balance ≥ 20 € + pas encore appliqué | Carte « Utiliser ta cagnotte » + solde dispo + slider 0 → min(solde, 50 % panier) + bouton « Appliquer » |
| E | enrolled + cagnotte déjà appliquée (code dans `cart.discountCodes`) | « Cagnotte appliquée : -X,XX € » + bouton « Retirer » |

**Flow cas D** :
1. User bouge le slider → recalcul local (pas d'API).
2. Click « Appliquer » → `POST /api/loyalty/me/redeem-online` avec
   `{ cartSubtotalCents, requestedAmountCents }`.
3. Réponse : `{ discountCode }` → on appelle `cart.discountCodesUpdate`
   Shopify (via helper existant `applyDiscountToCart`) pour appliquer le
   code au panier Shopify.
4. Le panier se met à jour, le cart drawer ré-affiche la section avec
   cas E.

**Flow cas E (retirer)** :
1. Click « Retirer » → `cart.discountCodesUpdate` Shopify avec liste
   sans le code loyalty.
2. Côté DB : on **ne touche pas** la `loyalty_redemption` (status `reserved`).
   Elle expirera naturellement après 1h via le sweep lazy (cf. L3). C'est
   acceptable car la commission solde n'est jamais décrémentée tant que
   le code n'est pas effectivement utilisé au checkout (le decrement se
   fait dans `finalize_order_loyalty` via le webhook).
3. Détection « code loyalty » : on identifie un code comme loyalty si
   son préfixe est `BS-CAGNOTTE-` (à confirmer avec les conventions L3,
   sinon adapter).

---

## 4. Contrats API détaillés

### 4.1 `GET /api/loyalty/me`

```
Headers : cookie body-start-customer-token (auto via browser)
Response 200 (enrolled) :
{
  "state": "enrolled",
  "customer": {
    "id": "uuid",
    "firstName": "Adam",
    "referralCode": "BS-PRRN1",
    "loyaltyBalanceCents": 1500,
    "hasFirstPurchase": true,
    "referralCommissionUntil": "2027-05-24T00:00:00Z"
  },
  "recentTransactions": [
    {
      "id": "uuid",
      "type": "referral_commission",
      "amountCents": 500,
      "balanceAfterCents": 1500,
      "channel": "online",
      "shopifyOrderId": "gid://shopify/Order/123",
      "relatedCustomerFirstName": "Théo",
      "createdAt": "2026-05-23T14:30:00Z"
    }
  ],
  "totals": { "earnedCents": 1500, "spentCents": 0 }
}

Response 200 (not_enrolled) :
{
  "state": "not_enrolled",
  "shopify": { "email": "x@y.fr", "firstName": "Adam" }
}

Response 401 :
{ "error": "unauthorized" }
```

### 4.2 `POST /api/loyalty/me/enroll`

```
Body : { "phone": "+33612345678" }
Response 200 :
{
  "ok": true,
  "customer": {
    "id": "uuid",
    "referralCode": "BS-XXXXX",
    "loyaltyBalanceCents": 0
  }
}
Response 400 : { "error": "invalid_phone" }
Response 401 : { "error": "unauthorized" }
Response 409 : { "error": "already_enrolled" }
Response 429 : { "error": "rate_limited" }
```

### 4.3 `POST /api/loyalty/me/preview`

```
Body : { "cartSubtotalCents": 5000 }
Response 200 :
{
  "balanceCents": 2500,
  "maxRedeemableCents": 2500,
  "eligible": true,
  "config": { "minBalanceCents": 2000, "cartCapRatio": 0.5 }
}
Response 401 : { "error": "unauthorized" }
Response 403 : { "error": "not_enrolled" }
```

### 4.4 `POST /api/loyalty/me/redeem-online`

```
Body : { "cartSubtotalCents": 5000, "requestedAmountCents": 2000 }
Response 200 :
{
  "ok": true,
  "redemption": {
    "discountCode": "BS-CAGNOTTE-XXXXX",
    "amountCents": 2000,
    "expiresAt": "2026-05-24T15:30:00Z"
  }
}
Response 400 : { "error": "validation_failed", "reason": "...", "maxAllowedCents": N }
Response 401/403/429/500 : voir L3
```

---

## 5. Copy (à valider AVANT code)

Règles strictes appliquées :
- Voix « on/nous », tutoiement systématique.
- Zéro tiret cadratin (« — »), zéro tiret demi-cadratin (« – »), zéro double tiret (« -- »).
- Zéro « sans bullshit », zéro « -10 % Insta », zéro superlatif creux.
- Ton conseil de pote : clair, direct, utile.

### 5.1 Page `/parrainage` (publique)

**Hero**

```
Titre :       Tu kiffes, ton pote profite, tu gagnes.

Sous-titre :  Le programme parrainage BodyStart, c'est simple. Tu partages
              ton code, ton pote a 5 € sur sa première commande, et tu
              touches 5 % de ses achats pendant 12 mois. Aucune carte
              physique, aucune appli, ton compte BodyStart suffit.
```

CTA principal selon contexte :
- Pas connecté : « Connecte-toi pour avoir ton code » (→ `/login`)
- Pas connecté + pas inscrit : sous-CTA texte « Pas encore de compte ? Inscris-toi en 30 secondes » (→ `/register`)
- Connecté : « Voir mon code » (→ `/account?tab=referral`)

**Section « Comment ça marche »**

```
01. Tu partages ton code
    Ton code BS-XXXXX est dispo dans ton compte. Envoie-le par DM,
    WhatsApp, SMS, comme tu veux.

02. Ton pote économise 5 €
    Il rentre ton code au panier sur sa première commande, à partir
    de 40 € d'achat. Direct, sans condition cachée.

03. Tu gagnes 5 % pendant 1 an
    À chaque fois qu'il commande, on te crédite 5 % du montant payé.
    Ta cagnotte grossit toute seule, utilisable dès 20 €.
```

**Section FAQ**

```
Combien de potes je peux parrainer ?
  Autant que tu veux. Plus tu partages, plus ta cagnotte grimpe.

Quand mon pote peut utiliser le code ?
  Sur sa première commande, à partir de 40 € d'achat (hors frais
  de port). Une fois par filleul.

Comment j'utilise ma cagnotte ?
  Dès que tu as 20 € ou plus, tu peux l'utiliser au panier. Tu
  choisis le montant, jusqu'à 50 % du total de ta commande.

C'est cumulable avec d'autres remises ?
  Ta cagnotte se cumule avec les codes promo classiques. Par
  contre, un code parrain ne se cumule pas avec un autre code
  parrain (le premier rentré gagne).

Mes 5 % s'arrêtent quand ?
  12 mois après la première commande de ton pote. Après, il reste
  ton ami mais plus ton filleul. La cagnotte déjà gagnée, elle,
  reste à toi.

Et ma cagnotte expire ?
  Jamais. Une fois créditée, c'est à toi pour la vie.
```

**Footer mini-rappel**

```
Aucune carte physique. Aucune appli à installer. Ton compte
BodyStart fait tout.
```

### 5.2 Onglet « Parrainage » de `/account` (enrôlé)

**Header**

```
Titre :       Parrainage

Sous-titre :  Partage ton code, gagne 5 % à vie sur les achats de tes
              potes pendant 12 mois.
```

**Carte code (fond sombre #1a2e23)**

```
Label small :  TON CODE PARRAIN
Code big :     BS-XXXXX  (monospace, énorme, tracking)

Boutons :      [Copier]  [Partager WhatsApp]  [Partager]

Message WhatsApp pré-rempli (URL-encoded) :
  "Salut ! Je commande mes compléments sur bodystart.fr. T'as 5 €
  de remise sur ta première commande avec mon code BS-XXXXX (à
  partir de 40 € d'achat). Lien direct : https://bodystart.fr"
```

**Bloc « Comment ça marche » (compact, version courte de la page publique)**

```
01.  Tu partages ton code à un pote.
02.  Il le rentre au panier sur sa 1ʳᵉ commande, à partir de 40 € d'achat. Il a 5 € de remise.
03.  Pendant 12 mois, on te crédite 5 % de ses commandes.
```

**Lien bas**

```
Pour voir ce que tu as déjà gagné, file dans ta cagnotte.
[Voir ma cagnotte] → /account?tab=cagnotte
```

### 5.3 Onglet « Cagnotte » de `/account` (enrôlé)

**Header**

```
Titre :         Ma cagnotte

Solde XL :      [X,XX €]   (gros, font-display, font-black)

Sous-titre conditionnel :
  Si solde < 20 € :
    "Tu peux utiliser ta cagnotte dès qu'elle atteint 20 €. En
    attendant, profites-en pour parrainer tes potes."
  Si solde >= 20 € :
    "Disponible sur ta prochaine commande, jusqu'à 50 % du panier."
```

**Bloc totaux (2 cards côte à côte)**

```
[Total gagné]            [Total utilisé]
  X,XX €                   X,XX €
  depuis ton inscription   sur toutes tes commandes
```

**Historique transactions (liste, 20 dernières)**

```
Tableau (date · libellé · montant · solde après) :

23 mai 2026   Commission parrainage de Théo        +5,00 €    15,00 €
20 mai 2026   Utilisée sur commande #1042           -10,00 €   10,00 €
18 mai 2026   Commission parrainage de Léa         +5,00 €    20,00 €
...

Si liste vide :
  "Ta cagnotte est encore vide. Pour commencer à gagner, partage
  ton code parrain à tes potes."
  [Voir mon code] → /account?tab=referral
```

### 5.4 Bloc « Rejoins le programme » (composant `EnrollmentBlock`)

Affiché dans onglets Cagnotte ET Parrainage si `state === 'not_enrolled'`.

```
Titre :       Rejoins le programme

Body :        Pour gagner et utiliser ta cagnotte, on a juste besoin de
              ton numéro de téléphone. C'est ta carte de fidélité, donc
              pas de carte physique à trimballer.

Input :       [+33 6 12 34 56 78]  (placeholder, accepte +33... ou 0...)

Bouton :      Activer mon programme

Note small :  Ton numéro reste chez nous, on ne le partage pas. Il sert
              à te reconnaître quand tu passes en boutique aussi.

Erreurs possibles affichées en rouge sous l'input :
  - "Numéro invalide. Vérifie le format."
  - "Trop d'essais. Réessaye dans quelques minutes."
```

### 5.5 Widget `CagnotteCartWidget` (dans `CartDrawer`)

**Cas A, pas connecté** : rien.

**Cas B, connecté mais pas enrôlé**

```
Encart petit (fond #f4f6f1, rounded-xl) :
  "Active ton programme fidélité pour gagner sur tes prochaines commandes."
  [Activer] (bouton petit) → /account?tab=cagnotte
```

**Cas C, enrôlé et solde < 20 €**

```
Bandeau mini (1 ligne, fond beige) :
  "Cagnotte : X,XX € · Utilisable dès 20 €"
```

**Cas D, enrôlé et solde ≥ 20 € et pas encore appliquée**

```
Carte (fond blanc, rounded-xl, p-5) :

  Label small :  TA CAGNOTTE
  Solde :        Tu as X,XX € disponibles

  Slider :       [======*=====]  0 € .... [max] €
                 max = min(solde, 50% du panier)

  Affichage live :
    Si slider = 0 :    "Choisis le montant à utiliser"
    Si slider > 0 :    "Tu utilises X,XX € sur cette commande"

  Bouton :       [Appliquer X,XX €]   (disabled si slider = 0)

  Note small :   "Plafond 50 % du panier. Ta cagnotte ne s'utilise pas
                 sur les frais de port."
```

**Cas E, cagnotte déjà appliquée**

```
Carte verte (fond #e8f0e3, rounded-xl, p-5) :

  Check icon ✓  Cagnotte appliquée : -X,XX €

  [Retirer] (bouton ghost, petit)
```

**États de chargement / erreur** : spinner local pendant la requête, toast
d'erreur via `react-hot-toast` si échec API (« Impossible d'appliquer ta
cagnotte, réessaye dans un instant. »).

---

## 6. Tests

### 6.1 Tests TS (vitest)

Nouveaux fichiers :
- `src/lib/loyalty/preview-core.test.ts` : balance < min, balance >= min,
  cap 50 %, cap atteint, eligible vs non.
- `src/lib/loyalty/redeem-online-core.test.ts` : validation OK, validation
  KO (montant > max), creation Shopify OK, creation Shopify KO.
- `src/lib/loyalty/session.test.ts` : logged_out (pas de cookie), logged_out
  (token invalide), not_enrolled, enrolled match shopify_id, enrolled match
  email + upgrade auto. Mock `getCustomer` et le client Supabase.

Tests L3 existants doivent **passer sans modif** (les helpers internalisent
la même logique). C'est la garantie qu'on ne casse rien en prod argent.

Couverture cible loyalty : maintenue >= 80 %.

### 6.2 Tests pgTAP

Pas de nouvelle migration SQL en L4. Les tests pgTAP existants (28 + 8
assertions) restent valides. CI continue de tourner sur push.

### 6.3 Tests manuels

- Création compte Shopify neuf → page `/account` → onglet Cagnotte → bloc
  enrôlement → entrer téléphone → solde 0 affiché, code parrain présent.
- Commande online avec code parrain valide d'un autre user → webhook →
  commission 5 % chez le parrain → onglet Cagnotte du parrain → solde
  mis à jour, transaction visible.
- Panier > 40 € avec cagnotte ≥ 20 € → widget cas D → slider → appliquer
  → code dans le panier Shopify → checkout → webhook → solde décrémenté.
- Page `/parrainage` non connectée → CTA login. Connectée → CTA voir mon code.

---

## 7. Fichiers touchés (récap pour le plan implémentation)

**Nouveaux** :
- `src/lib/loyalty/session.ts`
- `src/lib/loyalty/preview-core.ts`
- `src/lib/loyalty/preview-core.test.ts`
- `src/lib/loyalty/redeem-online-core.ts`
- `src/lib/loyalty/redeem-online-core.test.ts`
- `src/lib/loyalty/session.test.ts`
- `src/hooks/useLoyaltyMe.ts`
- `src/app/api/loyalty/me/route.ts`
- `src/app/api/loyalty/me/enroll/route.ts`
- `src/app/api/loyalty/me/preview/route.ts`
- `src/app/api/loyalty/me/redeem-online/route.ts`
- `src/app/(nutrition)/parrainage/page.tsx`
- `src/components/cart/CagnotteCartWidget.tsx`
- `src/components/account/EnrollmentBlock.tsx`
- `src/components/account/CagnottePanel.tsx`
- `src/components/account/ReferralPanel.tsx` (extrait de account/page.tsx réécrit)

**Modifiés** :
- `src/app/api/loyalty/preview/route.ts` (wrapper mince + auth staff/M2M + rate limit)
- `src/app/api/loyalty/redeem-online/route.ts` (wrapper mince + auth staff/M2M)
- `src/app/(nutrition)/account/page.tsx` (ajout onglet Cagnotte, réécriture ReferralPanel, suppression copy faux)
- `src/components/cart/CartDrawer.tsx` (injection CagnotteCartWidget)

---

## 8. Hors-scope L4 (à traiter plus tard)

- Email transactionnel « ta cagnotte vient d'être créditée » (Resend, sprint L6)
- Email transactionnel « bienvenue dans le programme » (sprint L6)
- Import CSV legacy (sprint L6)
- Notification web push « tu as gagné X € »
- Statistique parrain : « tu as parrainé N personnes »
- Page publique « top parrains du mois » (gamification)
- App mobile / PWA dédiée

---

## 9. Risques connus

1. **Phone Shopify obligatoire au checkout** : la spec dit qu'il faut le
   forcer côté Shopify Settings. Si pas encore fait, certains clients
   pourront commander sans téléphone, et le webhook ne pourra pas matcher
   leur loyalty_customer par phone. **Mitigation** : le matching webhook
   tente d'abord par phone, puis fallback par email (cf. L2). Mais
   recommandation : Adam doit forcer le téléphone obligatoire côté Shopify
   avant L4 prod.
2. **Cas où le client a 2 comptes Shopify avec emails différents pour le
   même téléphone loyalty** : très rare, mais possible. L'auto-upgrade
   crée alors un conflit (`shopify_customer_id` est UNIQUE). On laisse
   l'UPDATE échouer silencieusement (try/catch), le client garde son
   ancien lien shopify_customer_id, le nouveau compte ne sera pas lié.
   Acceptable car cas marginal. À traiter manuellement si Adam le voit.
3. **Slider à 0 € puis applique** : protégé côté front (bouton disabled)
   ET côté back (Zod `requestedAmountCents: z.number().int().min(1)`).
