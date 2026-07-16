'use client'

// Enregistre chaque navigation interne (cf. src/lib/nav-history.ts) —
// consommé par le bouton « ← Retour » des fiches produit pour ne jamais
// renvoyer le visiteur hors du site. Monté une fois dans le layout nutrition.
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { recordNavigation } from '@/lib/nav-history'

export default function NavigationTracker() {
  const pathname = usePathname()

  useEffect(() => {
    recordNavigation(pathname ?? '')
  }, [pathname])

  return null
}
