# Test du flow paiement Stripe en local

## Prérequis

- Node.js installé
- Stripe CLI installé (`winget install Stripe.StripeCLI`)
- Compte Stripe connecté (`stripe login`)
- Variables `.env.local` renseignées (STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET)

## Étapes

### 1. Lancer le serveur Next.js

```bash
npm run dev
```

Le site est accessible sur http://localhost:3000

### 2. Lancer l'écoute webhook Stripe CLI

Dans un **second terminal** :

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

> La CLI affiche un webhook signing secret temporaire (`whsec_...`).
> Si tu utilises ce secret temporaire, remplace `STRIPE_WEBHOOK_SECRET` dans `.env.local`.
> Sinon, garde le secret configuré dans le dashboard Stripe.

### 3. Déclencher un paiement test

1. Ouvrir http://localhost:3000/coaching/tarifs
2. Cliquer sur un bouton CTA (ex: "CHOISIR" sur Programme Prise de Masse)
3. Tu es redirigé vers Stripe Checkout (mode test)
4. Utiliser la carte test : `4242 4242 4242 4242`
   - Date : n'importe quelle date future (ex: 12/34)
   - CVC : n'importe quel code (ex: 123)
   - Nom/adresse : n'importe quoi
5. Valider le paiement
6. Tu es redirigé vers `/account/coaching?success=true`

### 4. Vérifier le webhook

Dans le terminal Stripe CLI, tu dois voir :

```
--> checkout.session.completed [evt_xxx]
<-- [200] POST http://localhost:3000/api/stripe/webhook
```

### 5. Tester un abonnement

1. Cliquer sur "S'ABONNER" sur le Coaching mensuel illimité (89€/mois)
2. Même procédure avec la carte test `4242 4242 4242 4242`
3. Le webhook `checkout.session.completed` est déclenché
4. Pour tester la résiliation, annuler l'abonnement dans le dashboard Stripe :
   https://dashboard.stripe.com/test/subscriptions
5. Le webhook `customer.subscription.deleted` est déclenché

### 6. Tester les erreurs

- Carte refusée : `4000 0000 0000 0002`
- Fonds insuffisants : `4000 0000 0000 9995`
- Carte expirée : `4000 0000 0000 0069`
- CVC incorrect : `4000 0000 0000 0127`

## Cartes test Stripe utiles

| Numéro               | Scénario                |
| -------------------- | ----------------------- |
| 4242 4242 4242 4242  | Paiement réussi         |
| 4000 0000 0000 0002  | Carte refusée           |
| 4000 0000 0000 9995  | Fonds insuffisants      |
| 4000 0000 0000 3220  | 3D Secure requis        |
| 4000 0000 0000 0069  | Carte expirée           |
