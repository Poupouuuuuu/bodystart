// Silhouettes SVG de la déco Halloween (19/10/2026), partagées par le haut de
// l'accueil, la frise du pied de page et le logo. Décoratives : aria-hidden.
// Couleurs fixes de la direction artistique « nuit » (pas du metafield).

/** Nuit la plus sombre : silhouettes. */
export const NUIT_SILHOUETTE = '#0A0710'

/** Chauve-souris ailes ouvertes (viewBox 32 × 16). */
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

/** Citrouille en silhouette, côtes à peine marquées ; visage lumineux en option. */
export function Citrouille({ largeur, visage = false }: { largeur: number; visage?: boolean }) {
  return (
    <svg viewBox="0 0 48 40" width={largeur} height={(largeur * 40) / 48} aria-hidden="true" focusable="false">
      <path fill={NUIT_SILHOUETTE} d="M24.6 9.4c-.5-3 .5-5.6 3-7.2l1 1.3c-1.9 1.3-2.5 3.2-2.1 5.7z" />
      <path
        fill={NUIT_SILHOUETTE}
        d="M24 10c-3.4-2-9.4-1.8-12.6 1.4C7.6 15.2 6.6 23 9.6 29c2.6 5.2 8.2 7.2 14.4 6 6.2 1.2 11.8-.8 14.4-6 3-6 2-13.8-1.8-17.6C33.4 8.2 27.4 8 24 10z"
      />
      <path
        fill="none"
        stroke="#251A36"
        strokeWidth="1"
        d="M24 11v23.6M17.2 12c-2.6 6-2.6 16.6 0 22.6M30.8 12c2.6 6 2.6 16.6 0 22.6"
      />
      {visage && (
        <g fill="#F7A050" className="hw-visage">
          <path d="M15 19.5l4.6-1.4-1.2 4.4zM33 19.5l-4.6-1.4 1.2 4.4zM22.6 23.6h2.8L24 26z" />
          <path d="M13.8 27.2c3.2 2.6 7 3.6 10.2 3.6s7-1 10.2-3.6c-1 2.8-4.6 5-10.2 5s-9.2-2.2-10.2-5z" />
        </g>
      )}
    </svg>
  )
}

/** Branche nue qui entre par la droite, posée devant la lune (viewBox 300 × 130). */
export function Branche({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 130"
      className={className}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMaxYMid meet"
    >
      <g fill={NUIT_SILHOUETTE}>
        <path d="M300 34c-38 6-72 18-104 36-26 15-50 26-78 32-16 4-30 4-44 2v-3c16 0 30-2 44-6 28-7 50-19 74-33 32-18 68-32 108-36z" />
        <path d="M196 70c-6-14-12-24-20-32l-2 1c7 9 13 20 18 33z" />
        <path d="M150 92c-4 12-10 22-18 30l2 1c8-8 15-18 20-30z" />
        <path d="M118 99c-10-11-18-17-28-21l-1 2c10 5 18 12 26 21z" />
        <path d="M74 104c-8 2-16 6-22 12l1 2c7-6 14-10 22-12z" />
        <path d="M240 50c-2-10-6-18-12-24l-2 1c5 6 9 14 11 24z" />
      </g>
    </svg>
  )
}

/**
 * Bande d'herbes hautes (viewBox 400 × 40, étirée en largeur). Tracé calculé
 * une fois au chargement du module, identique à chaque rendu.
 */
const HERBES = (() => {
  const r = (n: number) => Math.round(n * 10) / 10
  let d = 'M0 40V34'
  let x = 0
  let i = 0
  while (x < 400) {
    const h = 8 + ((i * 37) % 22)
    const w = 4 + ((i * 13) % 5)
    const pointe = x + w / 2 + (((i * 7) % 5) - 2)
    d += `Q${r(x + w * 0.25)} ${r(34 - h * 0.5)} ${r(pointe)} ${34 - h}Q${r(x + w * 0.75)} ${r(34 - h * 0.45)} ${x + w} 34`
    x += w
    i++
  }
  return `${d}V40z`
})()

export function Herbes({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 40" preserveAspectRatio="none" className={className} aria-hidden="true" focusable="false">
      <path fill={NUIT_SILHOUETTE} d={HERBES} />
    </svg>
  )
}
