import type { CSSProperties } from 'react'

// Boules de Noël suspendues à des fils depuis le haut d'un bloc (photo du haut
// de l'accueil, « La sélection de Noël ») : tailles et couleurs différentes,
// léger balancement autour de l'attache (styles.ts : nl-boule). Décoratives.

type Var = CSSProperties & Record<`--${string}`, string>

interface Boule {
  left: string
  /** Longueur du fil (px). */
  fil: number
  /** Diamètre de la boule (px). */
  taille: number
  couleur: string
  /** Durée et départ du balancement. */
  d: string
  r: string
}

const PHOTO: Boule[] = [
  { left: '7%', fil: 24, taille: 26, couleur: '#C62828', d: '5.2s', r: '-1.1s' },
  { left: '24%', fil: 52, taille: 20, couleur: '#E2B44B', d: '6s', r: '-3s' },
  { left: '50%', fil: 16, taille: 30, couleur: '#2E7D32', d: '5.6s', r: '-2.2s' },
  { left: '72%', fil: 40, taille: 22, couleur: '#C62828', d: '6.4s', r: '-.6s' },
  { left: '88%', fil: 28, taille: 18, couleur: '#D9E2E8', d: '5s', r: '-4s' },
]

// Section « La sélection de Noël » : coin haut droit, fils courts sur
// téléphone (le titre occupe toute la largeur sous le haut de la section).
const SECTION: Boule[] = [
  { left: '8%', fil: 10, taille: 20, couleur: '#C62828', d: '5.4s', r: '-2s' },
  { left: '38%', fil: 26, taille: 16, couleur: '#E2B44B', d: '6.2s', r: '-.8s' },
  { left: '64%', fil: 4, taille: 24, couleur: '#2E7D32', d: '5.8s', r: '-3.4s' },
  { left: '88%', fil: 18, taille: 14, couleur: '#C62828', d: '6.6s', r: '-1.6s' },
]

function UneBoule({ b }: { b: Boule }) {
  const t = b.taille
  const haut = b.fil + t * 0.16
  const h = haut + t
  const style: Var = { left: b.left, '--d': b.d, '--r': b.r }
  return (
    <span className="nl-boule absolute top-0 block" style={style}>
      <svg viewBox={`0 0 ${t} ${h}`} width={t} height={h} focusable="false">
        <line x1={t / 2} y1="0" x2={t / 2} y2={b.fil} stroke="#C9A24A" strokeWidth="1" />
        <rect x={t / 2 - t * 0.14} y={b.fil - 0.5} width={t * 0.28} height={t * 0.18} rx={t * 0.04} fill="#C9A24A" />
        <circle cx={t / 2} cy={haut + t / 2} r={t / 2} fill={b.couleur} />
        <path
          d={`M${t * 0.12} ${haut + t * 0.46}q${t * 0.38} ${t * 0.16} ${t * 0.76} 0`}
          fill="none"
          stroke="#F2D28A"
          strokeWidth={Math.max(1, t * 0.06)}
          opacity=".85"
        />
        <ellipse cx={t * 0.34} cy={haut + t * 0.32} rx={t * 0.1} ry={t * 0.14} fill="#fff" opacity=".55" />
      </svg>
    </span>
  )
}

/** Sur la photo du haut de l'accueil (au-dessus de la photo seulement). */
export function BoulesPhoto() {
  return (
    <div aria-hidden="true" data-anim-saison="" className="nl-boules-photo pointer-events-none absolute inset-x-0 top-0 h-full">
      {PHOTO.map((b, i) => (
        <UneBoule key={i} b={b} />
      ))}
    </div>
  )
}

/** En haut à droite de la section « La sélection de Noël ». */
export function BoulesSection() {
  return (
    <div
      aria-hidden="true"
      data-anim-saison=""
      className="nl-boules-section pointer-events-none absolute right-3 top-0 h-[70px] w-[150px] sm:right-8 sm:w-[200px] lg:right-[6%] lg:h-[120px] lg:w-[260px]"
    >
      {SECTION.map((b, i) => (
        <UneBoule key={i} b={b} />
      ))}
    </div>
  )
}
