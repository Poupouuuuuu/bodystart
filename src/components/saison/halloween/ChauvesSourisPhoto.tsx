import type { CSSProperties } from 'react'
import { ChauveSouris } from './formes'

// 3 chauves-souris qui traversent la photo du haut de l'accueil pendant
// Halloween (haut en deux parties, 19/10/2026) : posées sur la photo, jamais
// sur le texte. Animation coupée par prefers-reduced-motion et mise en pause
// hors écran (styles.ts, AnimationsSaison).

type Var = CSSProperties & Record<`--${string}`, string>

// top : hauteur de vol dans la zone ; d : durée de la traversée ; r : départ
// décalé (déjà en vol au chargement) ; f : battement d'ailes ; x : position
// sans animation (mouvement réduit).
const VOLS: { top: string; largeur: number; style: Var }[] = [
  { top: '18%', largeur: 40, style: { '--d': '30s', '--r': '-9s', '--f': '.85s', '--x': '58%' } },
  { top: '48%', largeur: 26, style: { '--d': '40s', '--r': '-27s', '--f': '.7s', '--x': '22%' } },
  { top: '6%', largeur: 20, style: { '--d': '48s', '--r': '-16s', '--f': '.6s', '--x': '80%' } },
]

export default function ChauvesSourisPhoto() {
  return (
    <div
      aria-hidden="true"
      data-anim-saison=""
      className="pointer-events-none absolute inset-x-0 top-0 h-[70%] overflow-hidden lg:h-[55%]"
    >
      {VOLS.map((v, i) => (
        <span key={i} className="hw-vol-zone" style={{ ...v.style, top: v.top }}>
          <ChauveSouris largeur={v.largeur} className="hw-silhouette" />
        </span>
      ))}
    </div>
  )
}
