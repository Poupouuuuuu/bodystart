import type { ThemeSaison } from '@/lib/saison'

/**
 * Petit détail posé sur le logo du header selon la saison (Halloween : une
 * chauve-souris aux ailes ouvertes sur la fin de « BODYSTART »). Absolu,
 * décoratif, ne change pas la mise en page. Suit le thème calculé par le
 * header (bascule à l'heure pile). Noël : à ajouter ici.
 */
export default function LogoSaison({ theme }: { theme: ThemeSaison | null }) {
  if (theme !== 'halloween') return null
  return (
    <span aria-hidden="true" className="pointer-events-none absolute right-[-10px] top-[2px] text-[#241A33]">
      <ChauveSourisLogo />
    </span>
  )
}

/** Chauve-souris ailes ouvertes (viewBox 32 × 16). Ici et pas dans
 * halloween/formes : le header est un composant client, il n'embarque que ça. */
function ChauveSourisLogo() {
  return (
    <svg viewBox="0 0 32 16" width="20" height="10" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M16 4c.7 0 1.2.6 1.4 1.3l.5-1.6.5 1.7c1.6-1.7 4.6-3.1 8.6-2.6-1.4.7-2.3 2-2.3 3.4 1.6-.4 3.4.1 4.8 1.3-1.7-.1-3.2.7-3.9 2.1-1.2-.9-2.9-1-4.2-.2.3 1.3-.1 2.8-1.2 3.9-.8-1.3-2.4-2.1-4.2-2.1s-3.4.8-4.2 2.1c-1.1-1.1-1.5-2.6-1.2-3.9-1.3-.8-3-.7-4.2.2-.7-1.4-2.2-2.2-3.9-2.1 1.4-1.2 3.2-1.7 4.8-1.3 0-1.4-.9-2.7-2.3-3.4 4-.5 7 .9 8.6 2.6l.5-1.7.5 1.6C14.8 4.6 15.3 4 16 4z"
      />
    </svg>
  )
}
