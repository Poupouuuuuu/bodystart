import Link from 'next/link'
import { Search } from 'lucide-react'

/**
 * 404 — déclenchée par notFound() (ex. fiche produit avec handle inexistant)
 * et par toute URL non matchée du groupe (nutrition). Rendue dans le layout
 * (nutrition) → garde Header + Footer. DA claire, message court, retour boutique.
 * La réponse HTTP est un vrai 404 (géré par Next.js via not-found.tsx).
 */
export default function NotFound() {
  return (
    <div className="bg-canvas min-h-[60vh] flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-sage flex items-center justify-center mx-auto mb-6">
          <Search className="w-7 h-7 text-spruce" />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mustard mb-3">Erreur 404</p>
        <h1 className="font-display text-[34px] md:text-[44px] font-extrabold text-spruce leading-[1.1] tracking-tight mb-4">
          Page introuvable
        </h1>
        <p className="text-ink-mute text-[15px] leading-relaxed mb-8">
          Cette page ou ce produit n&apos;existe pas (ou plus). Reviens à la boutique
          pour trouver ton complément.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-fresh text-white text-[14px] font-semibold rounded-full hover:bg-fresh-deep transition-colors"
        >
          Voir tous les produits
        </Link>
      </div>
    </div>
  )
}
