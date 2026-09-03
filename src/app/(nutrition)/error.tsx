'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw } from 'lucide-react'

/**
 * Erreur du groupe nutrition — PREMIUM V2 (même langage que error.tsx
 * racine). Message spécifique : la cause la plus fréquente ici est un
 * appel Shopify en échec, on le dit sans jargon.
 */
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
    <main className="bg-canvas">
      <div className="container flex min-h-[60vh] items-center py-16 md:py-24">
        <div className="max-w-[560px]">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta/10 text-terracotta">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">
            Erreur de chargement
          </p>
          <h1 className="font-display text-[34px] font-extrabold leading-[1.02] tracking-tight text-spruce md:text-[44px] [text-wrap:balance]">
            Impossible de charger cette page.
          </h1>
          <p className="mt-5 text-[17px] leading-[1.65] text-ink-mute">
            Le problème vient probablement de notre connexion avec la boutique. Réessayez
            dans quelques instants — vos articles au panier sont conservés.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button type="button" onClick={reset} className="btn-primary press">
              <RotateCcw className="h-4 w-4" />
              Réessayer
            </button>
            <Link href="/" className="btn-secondary press">
              Accueil
            </Link>
            <Link href="/products" className="btn-ghost press">
              Nos produits
            </Link>
          </div>

          {error.digest && (
            <p className="mt-8 text-[12px] text-ink-mute">
              Référence : <span className="font-medium tabular-nums text-ink">{error.digest}</span>
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
