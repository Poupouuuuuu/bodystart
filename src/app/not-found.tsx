import Link from 'next/link'
import { ArrowRight, Home, Search, ShoppingBag } from 'lucide-react'

const QUICK_LINKS = [
  { label: 'Protéines', href: '/products?cat=proteines' },
  { label: 'Vitamines', href: '/products?cat=sante' },
  { label: 'Performance', href: '/products?obj=muscle' },
  { label: 'FAQ', href: '/faq' },
]

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center bg-white px-4">
      <div className="text-center">
        {/* Grand 404 décoratif */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <span className="font-display font-black text-[10rem] leading-none text-brand-100 select-none">
            404
          </span>
          <span className="absolute top-6 left-1/2 -translate-x-1/2 bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
            Page introuvable
          </span>
        </div>

        {/* Titre */}
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-3">
          Oups, cette page n&apos;existe pas
        </h1>

        {/* Sous-titre */}
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          La page que vous cherchez a peut-être été déplacée ou n&apos;existe plus.
        </p>

        {/* Boutons d'action */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          <Link href="/" className="btn-primary inline-flex items-center gap-2">
            <Home className="w-4 h-4" />
            Retour à l&apos;accueil
          </Link>

          <Link
            href="/search"
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Rechercher un produit
          </Link>

          <Link
            href="/products"
            className="btn-ghost inline-flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Nos produits
          </Link>
        </div>

        {/* Liens rapides */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-brand-600 hover:text-brand-800 font-medium inline-flex items-center gap-1 transition-colors"
            >
              {link.label}
              <ArrowRight className="w-3 h-3" />
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
