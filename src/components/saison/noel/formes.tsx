// Formes de la déco Noël (SVG en ligne, décoratives) : sapin enneigé et paquet
// cadeau, pour le bas du haut de l'accueil et la frise du pied de page.

export function Sapin({ hauteur, couleur = '#1E4D33' }: { hauteur: number; couleur?: string }) {
  return (
    <svg viewBox="0 0 30 40" width={(hauteur * 3) / 4} height={hauteur} aria-hidden="true" focusable="false">
      <rect x="13" y="33" width="4" height="7" fill="#3A1A10" />
      <path fill={couleur} d="M15 1 4 15h5L2 25h6L0 35h30l-8-10h6l-7-10h5z" />
      <path
        fill="#F4F7FA"
        opacity=".92"
        d="M15 1l-3.6 4.6c1.2.8 2.4.8 3.6.2 1.2.6 2.4.6 3.6-.2zM9 15h12l-1.6-2.2c-2.6 1.4-6.2 1.4-8.8 0zM8 25h14l-1.5-2.1c-3.2 1.5-7.8 1.5-11 0z"
      />
    </svg>
  )
}

const CADEAUX = {
  rouge: { boite: '#C62828', couvercle: '#B3261E', ruban: '#F2D28A' },
  or: { boite: '#E2B44B', couvercle: '#C99A2E', ruban: '#B3261E' },
  vert: { boite: '#2E7D32', couvercle: '#256628', ruban: '#F2D28A' },
} as const

export function Cadeau({ largeur, teinte }: { largeur: number; teinte: keyof typeof CADEAUX }) {
  const c = CADEAUX[teinte]
  return (
    <svg viewBox="0 0 32 30" width={largeur} height={(largeur * 30) / 32} aria-hidden="true" focusable="false">
      <rect x="3" y="11" width="26" height="18" rx="1.5" fill={c.boite} />
      <rect x="1.5" y="7" width="29" height="6" rx="1.2" fill={c.couvercle} />
      <rect x="13.8" y="7" width="4.4" height="22" fill={c.ruban} />
      <path
        fill="none"
        stroke={c.ruban}
        strokeWidth="2"
        strokeLinecap="round"
        d="M16 7c-2.6-4.6-8-5.4-8-2 0 2.2 4.2 2.2 8 2zM16 7c2.6-4.6 8-5.4 8-2 0 2.2-4.2 2.2-8 2z"
      />
    </svg>
  )
}
