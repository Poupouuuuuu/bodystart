import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ShopifyMoney } from './shopify/types'

// Utility pour Tailwind classes conditionnelles
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formater un prix Shopify en euros
export function formatPrice(money: ShopifyMoney): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: money.currencyCode,
    minimumFractionDigits: 2,
  }).format(parseFloat(money.amount))
}

// Calculer le pourcentage de réduction
export function getDiscountPercentage(
  price: ShopifyMoney,
  compareAtPrice: ShopifyMoney | null
): number | null {
  if (!compareAtPrice) return null
  const priceNum = parseFloat(price.amount)
  const compareNum = parseFloat(compareAtPrice.amount)
  if (compareNum <= priceNum) return null
  return Math.round(((compareNum - priceNum) / compareNum) * 100)
}

// Disponibilité en stock
export function getAvailabilityStatus(quantity: number): {
  label: string
  color: 'green' | 'yellow' | 'red'
} {
  if (quantity === 0) return { label: 'Rupture de stock', color: 'red' }
  if (quantity <= 5) return { label: `Plus que ${quantity} en stock`, color: 'yellow' }
  return { label: 'En stock', color: 'green' }
}

// Truncate text
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}
