'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { hasInternalHistory } from '@/lib/nav-history'

interface BackButtonProps {
  /** Destination si la page précédente n'est pas une page du site. */
  fallbackHref: string
}

/**
 * Bouton "← Retour" en tête de fiche produit/pack.
 * Remplace le fil d'ariane. Comportement :
 *  - navigation INTERNE précédente (traquée par NavigationTracker) → back()
 *  - sinon (arrivée directe depuis Google/Instagram/nouvel onglet) →
 *    fallbackHref (/packs pour un pack, /products sinon).
 * ⚠️ `history.length > 1` seul ne suffit PAS : il est vrai aussi quand la
 * page précédente est Google → back() éjectait le visiteur hors du site
 * depuis nos landing pages SEO.
 */
export default function BackButton({ fallbackHref }: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== 'undefined' && hasInternalHistory() && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-mute hover:text-spruce transition-colors"
      aria-label="Retour à la page précédente"
    >
      <ArrowLeft className="w-4 h-4" />
      Retour
    </button>
  )
}
