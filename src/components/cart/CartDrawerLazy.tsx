'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useCart } from '@/hooks/useCart'

/**
 * PERF : le tiroir panier (CartDrawer + cagnotte + point relais) était monté et
 * hydraté sur TOUTES les pages alors qu'il ne sert qu'à l'ouverture. Sur mobile
 * (CPU x4), chaque Ko de JS au chargement retarde l'interactivité et le score
 * Lighthouse. Ici :
 *  - rien n'est chargé tant que le panier est fermé ET vide ;
 *  - le morceau est préchargé quand le navigateur est inactif (ouverture
 *    instantanée ensuite) ;
 *  - dès qu'un article est au panier ou qu'on l'ouvre, le tiroir est monté.
 * L'état du panier vit dans CartProvider (root layout), pas ici : rien n'est
 * perdu en différant l'interface.
 */
const CartDrawer = dynamic(() => import('./CartDrawer'), { ssr: false })

export default function CartDrawerLazy() {
  const { isOpen, totalQuantity } = useCart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isOpen || totalQuantity > 0) setMounted(true)
  }, [isOpen, totalQuantity])

  useEffect(() => {
    const preload = () => {
      void import('./CartDrawer')
    }
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(preload, { timeout: 5000 })
      return
    }
    const t = setTimeout(preload, 3500)
    return () => clearTimeout(t)
  }, [])

  return mounted ? <CartDrawer /> : null
}
