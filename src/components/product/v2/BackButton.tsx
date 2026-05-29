'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  /** Destination si aucun historique (accès direct / nouvel onglet). */
  fallbackHref: string
}

/**
 * Bouton "← Retour" en tête de fiche produit/pack.
 * Remplace le fil d'ariane. Comportement :
 *  - s'il y a un historique de navigation → revient à la page précédente
 *  - sinon (accès direct, nouvel onglet, lien externe) → va vers fallbackHref
 *    (/packs pour un pack, /products sinon).
 */
export default function BackButton({ fallbackHref }: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
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
