import type { ThemeSaison } from '@/lib/saison'

/**
 * Petit détail posé sur le logo du header selon la saison (Halloween : une
 * chauve-souris suspendue au-dessus du « B »). Absolu, décoratif, ne change
 * pas la mise en page. Suit le thème calculé par le header (bascule à l'heure
 * pile). Noël : à ajouter ici.
 */
export default function LogoSaison({ theme }: { theme: ThemeSaison | null }) {
  if (theme !== 'halloween') return null
  return (
    <span aria-hidden="true" className="pointer-events-none absolute left-[13px] top-[1px] text-[#241A33]">
      <ChauveSourisSuspendue />
    </span>
  )
}

/** Chauve-souris suspendue, ailes repliées (viewBox 12 × 16). Ici et pas dans
 * halloween/formes : le header est un composant client, il n'embarque que ça. */
function ChauveSourisSuspendue() {
  return (
    <svg viewBox="0 0 12 16" width="11" height="15" aria-hidden="true" focusable="false">
      <path stroke="currentColor" strokeWidth=".9" strokeLinecap="round" d="M5 1.6 4.6.2M7 1.6 7.4.2" />
      <path fill="currentColor" d="M6 1.2C3.5 1.2 2 3.6 2 6.6c0 3.4 1.6 6.1 4 6.9 2.4-.8 4-3.5 4-6.9 0-3-1.5-5.4-4-5.4z" />
      <path fill="currentColor" d="M4.2 12.9l-.8 2.7 2-2zM7.8 12.9l.8 2.7-2-2z" />
    </svg>
  )
}
