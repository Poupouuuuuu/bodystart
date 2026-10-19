// Décors du mode saison (SVG en ligne, moins de 1 Ko chacun), posés aux deux
// bouts du bandeau d'annonce, jamais sur le contenu. Décoratifs : aria-hidden.
// Une seule animation par thème (classe saison-anim-*, coupée par
// prefers-reduced-motion dans globals.css).

import type { DecorSaison as Decor } from '@/lib/saison'

const COMMUN = { 'aria-hidden': true, focusable: false } as const

function Citrouille() {
  return (
    <svg {...COMMUN} viewBox="0 0 24 24" width="18" height="18">
      <path d="M12 6.4c-.9-1.5-.6-3.2.8-4.1" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path
        fill="currentColor"
        d="M12 6.6c-2-1.3-5.6-1.1-7.3 1.4-1.9 2.8-1.6 8 .8 10.6 1.6 1.8 4.1 2 6.5 1.4 2.4.6 4.9.4 6.5-1.4 2.4-2.6 2.7-7.8.8-10.6C17.6 5.5 14 5.3 12 6.6z"
      />
      <path d="M12 7.4v11.8M8.4 7.8c-1.3 3-1.3 8 0 11M15.6 7.8c1.3 3 1.3 8 0 11" stroke="var(--saison-accent)" strokeWidth="1" fill="none" />
    </svg>
  )
}

function ChauveSouris() {
  return (
    <svg {...COMMUN} viewBox="0 0 32 16" width="26" height="13" className="saison-anim-flotte">
      <path
        fill="currentColor"
        d="M16 4c.7 0 1.2.6 1.4 1.3l.5-1.6.5 1.7c1.6-1.7 4.6-3.1 8.6-2.6-1.4.7-2.3 2-2.3 3.4 1.6-.4 3.4.1 4.8 1.3-1.7-.1-3.2.7-3.9 2.1-1.2-.9-2.9-1-4.2-.2.3 1.3-.1 2.8-1.2 3.9-.8-1.3-2.4-2.1-4.2-2.1s-3.4.8-4.2 2.1c-1.1-1.1-1.5-2.6-1.2-3.9-1.3-.8-3-.7-4.2.2-.7-1.4-2.2-2.2-3.9-2.1 1.4-1.2 3.2-1.7 4.8-1.3 0-1.4-.9-2.7-2.3-3.4 4-.5 7 .9 8.6 2.6l.5-1.7.5 1.6C14.8 4.6 15.3 4 16 4z"
      />
    </svg>
  )
}

function Flocon() {
  return (
    <svg {...COMMUN} viewBox="0 0 24 24" width="16" height="16" className="saison-anim-tourne">
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7" />
        <path d="M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5M3.8 10.4l3.4-.9-.9-3.4M20.2 13.6l-3.4.9.9 3.4M3.8 13.6l3.4.9-.9 3.4M20.2 10.4l-3.4-.9.9-3.4" />
      </g>
    </svg>
  )
}

function Houx() {
  return (
    <svg {...COMMUN} viewBox="0 0 28 20" width="22" height="16">
      <path fill="var(--saison-accent-2)" stroke="currentColor" strokeWidth=".8" d="M13 11C10 6 5 5 1 7c2 1 2 3 1 4 2 0 3 2 2 4 3-2 7-2 9-4z" />
      <path fill="var(--saison-accent-2)" stroke="currentColor" strokeWidth=".8" d="M15 11c3-5 8-6 12-4-2 1-2 3-1 4-2 0-3 2-2 4-3-2-7-2-9-4z" />
      <circle cx="12" cy="13" r="2.2" fill="currentColor" />
      <circle cx="16" cy="13" r="2.2" fill="currentColor" />
      <circle cx="14" cy="9.8" r="2.2" fill="currentColor" />
    </svg>
  )
}

/** Décor aux deux bouts du bandeau (aucun pour la Black Week). */
export default function DecorSaison({ decor }: { decor: Decor }) {
  if (!decor) return null
  const [gauche, droite] = decor === 'halloween' ? [<Citrouille key="g" />, <ChauveSouris key="d" />] : [<Flocon key="g" />, <Houx key="d" />]
  return (
    <>
      <span className="pointer-events-none absolute left-2 top-1/2 flex -translate-y-1/2 items-center sm:left-4">{gauche}</span>
      <span className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center sm:right-4">{droite}</span>
    </>
  )
}
