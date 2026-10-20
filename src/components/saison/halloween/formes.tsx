// Formes de la déco Halloween (SVG en ligne, décoratives) : sol de la scène
// (haut de l'accueil, frise du pied de page) et chauve-souris en vol de la
// frise. Ton élégant, rien d'effrayant : citrouilles souriantes, petites
// pierres arrondies, bonbons, marmite. Couleurs fixes de la direction
// artistique « nuit » (pas du metafield).

/** Chauve-souris ailes ouvertes (viewBox 32 × 16), couleur du texte courant. */
export function ChauveSouris({ largeur, className }: { largeur: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 16"
      width={largeur}
      height={largeur / 2}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M16 4c.7 0 1.2.6 1.4 1.3l.5-1.6.5 1.7c1.6-1.7 4.6-3.1 8.6-2.6-1.4.7-2.3 2-2.3 3.4 1.6-.4 3.4.1 4.8 1.3-1.7-.1-3.2.7-3.9 2.1-1.2-.9-2.9-1-4.2-.2.3 1.3-.1 2.8-1.2 3.9-.8-1.3-2.4-2.1-4.2-2.1s-3.4.8-4.2 2.1c-1.1-1.1-1.5-2.6-1.2-3.9-1.3-.8-3-.7-4.2.2-.7-1.4-2.2-2.2-3.9-2.1 1.4-1.2 3.2-1.7 4.8-1.3 0-1.4-.9-2.7-2.3-3.4 4-.5 7 .9 8.6 2.6l.5-1.7.5 1.6C14.8 4.6 15.3 4 16 4z"
      />
    </svg>
  )
}

const VISAGE = 'M15.5 19.6l3.8-1.3-1 3.8zM32.5 19.6l-3.8-1.3 1 3.8zM16.2 26.4c2.3 2 5 2.9 7.8 2.9s5.5-.9 7.8-2.9c-.9 2.7-4 4.5-7.8 4.5s-6.9-1.8-7.8-4.5z'

/** Citrouille orange ; `allumee` : visage souriant éclairé. */
export function Citrouille({ largeur, allumee = false }: { largeur: number; allumee?: boolean }) {
  return (
    <svg viewBox="0 0 48 40" width={largeur} height={(largeur * 40) / 48} aria-hidden="true" focusable="false">
      <path fill="#3B7A3F" d="M24.6 9.4c-.5-3 .5-5.6 3-7.2l1 1.3c-1.9 1.3-2.5 3.2-2.1 5.7z" />
      <path
        fill="#E8711A"
        d="M24 10c-3.4-2-9.4-1.8-12.6 1.4C7.6 15.2 6.6 23 9.6 29c2.6 5.2 8.2 7.2 14.4 6 6.2 1.2 11.8-.8 14.4-6 3-6 2-13.8-1.8-17.6C33.4 8.2 27.4 8 24 10z"
      />
      <path
        fill="none"
        stroke="#B4500E"
        strokeWidth="1.3"
        d="M24 11v23.6M17.2 12c-2.6 6-2.6 16.6 0 22.6M30.8 12c2.6 6 2.6 16.6 0 22.6"
      />
      <path fill="none" stroke="#FFB46B" strokeWidth="1.4" strokeLinecap="round" opacity=".55" d="M12.6 16.4c-1.4 3.2-1.5 6.8-.4 9.8" />
      {allumee && <path fill="#FFD27A" d={VISAGE} />}
    </svg>
  )
}

/** Citrouille allumée dont la lueur monte et descend doucement (calque HTML hw-lueur, styles.ts). */
export function CitrouilleAllumee({ largeur }: { largeur: number }) {
  return (
    <span className="relative block">
      <Citrouille largeur={largeur} allumee />
      <span className="hw-lueur absolute -inset-[30%] rounded-full" />
    </span>
  )
}

/** Petite pierre tombale arrondie, sans inscription. */
export function Tombe({ hauteur }: { hauteur: number }) {
  return (
    <svg viewBox="0 0 24 30" width={(hauteur * 24) / 30} height={hauteur} aria-hidden="true" focusable="false">
      <path fill="#3A3350" d="M3 30V12a9 9 0 0 1 18 0v18z" />
      <path fill="#4E4669" d="M3 12a9 9 0 0 1 18 0h-2.6a6.4 6.4 0 0 0-12.8 0z" />
      <path fill="none" stroke="#2A2440" strokeWidth="1.2" strokeLinecap="round" d="M8.5 16h7M8.5 20h7M10 24h4" />
    </svg>
  )
}

const BONBONS = {
  orange: { papier: '#E8711A', rayure: '#FFD2A6' },
  violet: { papier: '#6B3FA0', rayure: '#D2B6F0' },
  blanc: { papier: '#F4EFE6', rayure: '#E8711A' },
} as const

/** Bonbon emballé, papier torsadé aux deux bouts. */
export function Bonbon({ largeur, teinte }: { largeur: number; teinte: keyof typeof BONBONS }) {
  const c = BONBONS[teinte]
  return (
    <svg viewBox="0 0 36 16" width={largeur} height={(largeur * 16) / 36} aria-hidden="true" focusable="false">
      <path fill={c.papier} d="M9 8 1.5 2.4v11.2zM27 8l7.5-5.6v11.2z" />
      <ellipse cx="18" cy="8" rx="10" ry="6.4" fill={c.papier} />
      <path fill="none" stroke={c.rayure} strokeWidth="1.6" strokeLinecap="round" d="M13.6 3.2l-2 9.4M18.6 1.9l-2.4 12.2M23.6 3.2l-2 9.4" />
      <ellipse cx="14.5" cy="5.2" rx="2.6" ry="1.1" fill="#fff" opacity=".45" />
    </svg>
  )
}

/** Marmite de sorcière : potion violette et bulles. */
export function Marmite({ largeur }: { largeur: number }) {
  return (
    <svg viewBox="0 0 40 32" width={largeur} height={(largeur * 32) / 40} aria-hidden="true" focusable="false">
      <path fill="#120D1C" d="M10 27.5 7.6 32h4.6zM30 27.5l2.4 4.5h-4.6z" />
      <path fill="#1A1226" d="M5 12.5h30c1.5 0 2.4 1.4 2 2.8C35 23.5 29 29.5 20 29.5S5 23.5 3 15.3c-.4-1.4.5-2.8 2-2.8z" />
      <path fill="none" stroke="#4A4266" strokeWidth="1.4" strokeLinecap="round" d="M8.6 17.4c1.1 4 3.6 7 6.6 8.4" />
      <rect x="2" y="9.4" width="36" height="5" rx="2.5" fill="#2E2540" />
      <ellipse cx="20" cy="10.4" rx="15.6" ry="2.4" fill="#7B4BB8" />
      <g fill="#B48BE0">
        <circle cx="13.5" cy="7.6" r="2.2" />
        <circle cx="21.5" cy="5.6" r="1.6" />
        <circle cx="27" cy="8" r="1.2" />
      </g>
    </svg>
  )
}

/**
 * Chauve-souris ou araignée au bout de son fil (scene/Suspendus) : image de
 * fond SVG (styles.ts, hw-pendu-*), jamais de masque CSS (Safari mobile).
 */
export function Pendu({ objet, taille }: { objet: string; taille: number }) {
  const araignee = objet === 'araignee'
  return (
    <span
      className={`hw-pendu block ${araignee ? 'hw-pendu-araignee' : 'hw-pendu-chauve-souris'}`}
      style={{ width: taille, height: Math.round((taille * (araignee ? 22 : 15)) / (araignee ? 24 : 28)) }}
    />
  )
}
