'use client'

import { useSyncExternalStore, type ComponentType } from 'react'
import type { ThemeSaison } from '@/lib/saison'

/**
 * Titre du panier vide, aux couleurs de la saison (Halloween : citrouille et
 * « Ton panier est vide… pour l’instant », 19/10/2026 ; Noël se branche dans
 * PANIER_VIDE). Hors période : le titre habituel.
 *
 * Le tiroir du panier n'est rendu que côté navigateur (CartDrawerLazy) : le
 * thème est lu sur le bandeau du header ([data-saison], qui bascule à l'heure
 * pile), sans prop à faire descendre.
 */
export default function TitrePanierVide({ className }: { className: string }) {
  const theme = useSyncExternalStore(sansAbonnement, lireTheme, () => null)
  const saison = theme ? PANIER_VIDE[theme as ThemeSaison] : undefined
  if (!saison) return <p className={className}>Ton panier est vide</p>
  const { Illustration } = saison
  return (
    <>
      <Illustration />
      <p className={className}>{saison.titre}</p>
    </>
  )
}

function lireTheme(): string | null {
  return document.querySelector('[data-saison]')?.getAttribute('data-saison') ?? null
}

// Le tiroir se rouvre à chaque ouverture : pas besoin de suivre la bascule.
function sansAbonnement() {
  return () => {}
}

const PANIER_VIDE: Partial<Record<ThemeSaison, { titre: string; Illustration: ComponentType }>> = {
  halloween: { titre: 'Ton panier est vide… pour l’instant', Illustration: CitrouillePanier },
}

/** Citrouille posée (viewBox 48 × 44), décorative. */
function CitrouillePanier() {
  return (
    <svg viewBox="0 0 48 44" width="76" height="70" className="mb-5" aria-hidden="true" focusable="false">
      <ellipse cx="24" cy="40.5" rx="15" ry="2.2" fill="#2D5A2D" opacity=".12" />
      <path fill="#3B7A3F" d="M24.6 9.4c-.5-3 .5-5.6 3-7.2l1 1.3c-1.9 1.3-2.5 3.2-2.1 5.7z" />
      <path fill="#3B7A3F" d="M26.2 6.6c2.4-2.4 5.6-2.8 8-1.6-2 .3-3.6 1.3-4.6 3-.9-.9-2.1-1.4-3.4-1.4z" />
      <path
        fill="#E8711A"
        d="M24 10c-3.4-2-9.4-1.8-12.6 1.4C7.6 15.2 6.6 23 9.6 29c2.6 5.2 8.2 7.2 14.4 6 6.2 1.2 11.8-.8 14.4-6 3-6 2-13.8-1.8-17.6C33.4 8.2 27.4 8 24 10z"
      />
      <path
        fill="none"
        stroke="#B4500E"
        strokeWidth="1.2"
        strokeLinecap="round"
        d="M24 11v23.6M17.2 12c-2.6 6-2.6 16.6 0 22.6M30.8 12c2.6 6 2.6 16.6 0 22.6"
      />
    </svg>
  )
}
