// Guirlande lumineuse pleine largeur (motif du thème, scene/guirlande.ts) :
// sous le haut de l'accueil et dans la frise du pied de page. Décorative.
export default function Guirlande({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" data-anim-saison="" className={`sz-guirlande w-full ${className}`} />
}
