// Guirlande lumineuse pleine largeur (motif répété, styles.ts : nl-guirlande) :
// sous le haut de l'accueil et dans le pied de page. Décorative.
export default function Guirlande({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" data-anim-saison="" className={`nl-guirlande w-full ${className}`} />
}
