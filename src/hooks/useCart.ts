'use client'

import { useCartContext } from '@/context/CartContext'

// Hook public simple pour les composants
export function useCart() {
  return useCartContext()
}
