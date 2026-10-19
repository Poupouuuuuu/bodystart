// Silhouettes SVG de la déco Halloween (19/10/2026), partagées par le haut de
// l'accueil et la frise du pied de page. Décoratives : aria-hidden.
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

/** Colline douce de l'horizon (viewBox 400 × 40, étirée en largeur). */
export function Colline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 40" preserveAspectRatio="none" className={className} aria-hidden="true" focusable="false">
      <path fill={NUIT_SILHOUETTE} d="M0 40V24C48 15 96 12 150 17s98 13 150 9 70-11 100-8v18z" />
    </svg>
  )
}

/** Touffe d'herbes fines (viewBox 28 × 18), posée sur la colline. */
export function Touffe({ largeur, className }: { largeur: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 28 18"
      width={largeur}
      height={(largeur * 18) / 28}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill={NUIT_SILHOUETTE}
        d="M3 18c1-5 .6-9-1.6-12 3 2.4 4.4 6.6 4.2 12zM8 18c.4-6 2-11 5-14-2 4-3 9-2.6 14zM13 18c0-7 1.4-13 1.2-17 1.6 4.4 1.8 10.6 1.2 17zM18 18c-.2-5.6-2-10.4-5-13.6 4 2.4 6.6 7.4 7.6 13.6zM22 18c.6-4.4 2.4-8 5.4-10.6-2 3.4-2.8 6.8-2.8 10.6z"
      />
    </svg>
  )
}
