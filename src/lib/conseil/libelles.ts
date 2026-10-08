// Libellés des réponses du guide /conseil (interface, message de rappel).
import { formatPrice } from '@/lib/utils'
import type { Budget, Contrainte, Seances } from './types'

export const LIBELLES_SEANCES: Record<Seances, string> = {
  '0-1': '0 à 1',
  '2-3': '2 à 3',
  '4-plus': '4 et plus',
}

export const LIBELLES_BUDGET: Record<Budget, string> = {
  'moins-40': 'Moins de 40 €',
  '40-90': '40 à 90 €',
  'plus-90': 'Plus de 90 €',
}

export const LIBELLES_CONTRAINTES: Record<Contrainte, string> = {
  'sans-lactose': 'Sans lactose',
  vegan: 'Vegan',
  'sans-cafeine': 'Sans caféine',
}

/** Centimes → « 44,90 € » (via formatPrice, règle du projet). */
export function formatCents(cents: number): string {
  return formatPrice({ amount: (cents / 100).toFixed(2), currencyCode: 'EUR' })
}
