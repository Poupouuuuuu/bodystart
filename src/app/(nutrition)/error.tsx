'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw, Home, ShoppingBag } from 'lucide-react'

export default function NutritionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Nutrition Error]', error)
  }, [error])

  return (
    <main className="min-h-[60vh] flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 bg-red-50 border-2 border-red-200 rounded-sm flex items-center justify-center mx-auto mb-8 shadow-[4px_4px_0_theme(colors.red.200)]">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 mb-4">
          Erreur de chargement
        </h1>
        <p className="text-gray-500 font-medium mb-8 leading-relaxed">
          Impossible de charger cette page. Le probleme peut venir de notre connexion avec Shopify. Reessayez dans quelques instants.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-4 bg-brand-700 text-white font-black uppercase tracking-widest text-xs rounded-sm border-2 border-transparent shadow-[4px_4px_0_theme(colors.gray.900)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_theme(colors.gray.900)] transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reessayer
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-4 bg-white text-brand-700 font-black uppercase tracking-widest text-xs rounded-sm border-2 border-brand-700 shadow-[4px_4px_0_theme(colors.gray.900)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_theme(colors.gray.900)] transition-all"
          >
            <Home className="w-4 h-4" />
            Accueil
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 font-bold uppercase tracking-wider text-xs rounded-sm hover:bg-gray-100 hover:text-gray-900 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            Nos produits
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 text-[10px] font-black uppercase tracking-widest text-gray-300">
            Code : {error.digest}
          </p>
        )}
      </div>
    </main>
  )
}
