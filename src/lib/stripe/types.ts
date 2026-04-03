// ============================================================
// TYPES STRIPE — Coaching Body Start
// ============================================================

export type CoachingProductType = 'programme' | 'seance' | 'abonnement' | 'pack'

export interface CoachingProduct {
  id: string
  name: string
  type: CoachingProductType
  description: string
  stripePriceId: string
  /** 'subscription' pour abonnement, 'payment' pour one-shot */
  stripeMode: 'subscription' | 'payment'
  price: number
  /** Durée en jours (programmes/packs) ou null (abonnement = récurrent) */
  durationDays: number | null
  features: string[]
}

export interface CoachingSubscription {
  id: string
  customerId: string
  stripeSubscriptionId: string
  status: 'active' | 'canceled' | 'past_due' | 'incomplete'
  currentPeriodEnd: string
  plan: CoachingProduct
}

export interface CoachingSession {
  id: string
  customerId: string
  date: string
  type: 'visio' | 'presentiel'
  status: 'scheduled' | 'completed' | 'canceled'
  notes?: string
}

// ─── Catalogue coaching (à relier à tes Price IDs Stripe) ────

export const COACHING_PRODUCTS: CoachingProduct[] = [
  {
    id: 'programme-prise-de-masse',
    name: 'Programme Prise de Masse',
    type: 'programme',
    description: 'Plan d\'entraînement + nutrition personnalisé pour la prise de masse avec suivi hebdo.',
    stripePriceId: 'price_1TEIme2zH06v4keUeH709ANN',
    stripeMode: 'payment',
    price: 199,
    durationDays: 84,
    features: [
      'Programme personnalisé',
      'Plan nutrition adapté',
      'Suivi hebdomadaire',
      'Accès app de suivi',
      '-15% sur les compléments',
    ],
  },
  {
    id: 'programme-perte-de-poids',
    name: 'Programme Perte de Poids',
    type: 'programme',
    description: 'Protocole perte de poids intensif avec ajustements bi-hebdomadaires.',
    stripePriceId: 'price_1TEImt2zH06v4keUU3JxqGPg',
    stripeMode: 'payment',
    price: 149,
    durationDays: 56,
    features: [
      'Protocole sèche personnalisé',
      'Ajustements bi-hebdomadaires',
      'Guide des macros',
      '-15% sur les compléments',
    ],
  },
  {
    id: 'seance-individuelle',
    name: 'Séance coaching individuel',
    type: 'seance',
    description: 'Séance d\'1h en visio ou en boutique avec un coach certifié.',
    stripePriceId: 'price_1TEIn62zH06v4keU07YMD66F',
    stripeMode: 'payment',
    price: 59,
    durationDays: null,
    features: [
      '1h avec un coach certifié',
      'Visio ou en boutique',
      'Bilan personnalisé',
      'Plan d\'action post-séance',
    ],
  },
  {
    id: 'abonnement-mensuel',
    name: 'Coaching mensuel illimité',
    type: 'abonnement',
    description: 'Accès illimité : programmes, suivi continu, séances hebdo et -15% permanent.',
    stripePriceId: 'price_1TEInQ2zH06v4keUZh6mc208',
    stripeMode: 'subscription',
    price: 89,
    durationDays: null,
    features: [
      'Programmes illimités',
      'Suivi continu personnalisé',
      '1 séance/semaine incluse',
      '-15% permanent sur les compléments',
      'Accès prioritaire nouveautés',
    ],
  },
  {
    id: 'pack-3-mois',
    name: 'Pack 3 mois',
    type: 'pack',
    description: 'Pack coaching 3 mois complet à utiliser à ton rythme. Économise 15%.',
    stripePriceId: 'price_1TEInk2zH06v4keUUD0OyEqt',
    stripeMode: 'payment',
    price: 499,
    durationDays: 180,
    features: [
      '10 séances d\'1h',
      'Visio ou en boutique',
      '-15% vs séances à l\'unité',
      'Valable 6 mois',
      '-15% sur les compléments',
    ],
  },
]
