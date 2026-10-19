import { FLOCONS } from './neige'

// Neige qui tombe sur la photo du haut de l'accueil pendant Noël (haut en deux
// parties) : posée sur la photo, jamais sur le texte. Animation coupée par
// prefers-reduced-motion (flocons posés) et mise en pause hors écran
// (styles.ts, AnimationsSaison).
export default function NeigePhoto() {
  return (
    <div aria-hidden="true" data-anim-saison="" className="nl-neige-photo pointer-events-none absolute inset-0 overflow-hidden">
      {FLOCONS.map((style, i) => (
        <span key={i} className="nl-flocon" style={style} />
      ))}
    </div>
  )
}
