// ============================================================
// TYPES STRIPE — Coaching Body Start (Sprint 2)
// ============================================================
//
// Architecture : on identifie les produits par leur `lookup_key`
// Stripe (et non par le price ID hardcodé). Permet de renommer
// ou recréer un product Stripe sans modifier le code.
//
// Les 2 lookup_keys utilisés :
//   - coaching_program_oneshot   : 49€ EUR one-shot
//   - coaching_followup_monthly  : 89€ EUR mensuel
// ============================================================

export type CoachingTier = 'oneshot' | 'monthly_followup'

export interface CoachingProduct {
  /** Identifiant interne stable (utilisé dans les tables Supabase). */
  tier: CoachingTier
  /** Lookup key Stripe — résolu en price_id à chaque checkout. */
  stripeLookupKey: string
  name: string
  shortDescription: string
  /** Prix en euros pour affichage UI. La source de vérité reste Stripe. */
  priceEur: number
  /** 'payment' = one-shot ; 'subscription' = récurrent mensuel. */
  stripeMode: 'payment' | 'subscription'
  features: string[]
}

export const COACHING_PRODUCTS: Record<CoachingTier, CoachingProduct> = {
  oneshot: {
    tier: 'oneshot',
    stripeLookupKey: 'coaching_program_oneshot',
    name: 'Programme Personnalisé',
    shortDescription:
      'Un programme sport / nutrition / complet sur-mesure, validé par notre coach et livré en PDF.',
    priceEur: 49,
    stripeMode: 'payment',
    features: [
      'Formulaire d\'intake détaillé (~25 questions)',
      'Programme conçu et validé par notre coach',
      'Programme livré en PDF téléchargeable',
      'Recommandations produits Body Start incluses',
      'Accès à vie à ton programme dans ton espace',
    ],
  },
  monthly_followup: {
    tier: 'monthly_followup',
    stripeLookupKey: 'coaching_followup_monthly',
    name: 'Suivi Personnalisé',
    shortDescription:
      'Tout du Programme Personnalisé + check-in hebdomadaire avec le coach + recalcul tous les 3 mois.',
    priceEur: 89,
    stripeMode: 'subscription',
    features: [
      'Tout ce qui est inclus dans le Programme Personnalisé',
      'Check-in hebdomadaire (poids, mesures, ressenti, questions)',
      'Réponses du coach sous 48h',
      'Recalcul complet du programme tous les 3 mois',
      '🎁 Code promo -15% permanent sur tout le shop',
      'Annulable à tout moment',
    ],
  },
}

export function getCoachingProductByLookupKey(lookupKey: string): CoachingProduct | null {
  return Object.values(COACHING_PRODUCTS).find((p) => p.stripeLookupKey === lookupKey) ?? null
}

export function getCoachingProductByTier(tier: CoachingTier): CoachingProduct {
  return COACHING_PRODUCTS[tier]
}
