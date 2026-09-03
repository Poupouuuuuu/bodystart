'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw } from 'lucide-react'

/**
 * Erreur racine — PREMIUM V2 (ex-style V1 « brutaliste » : ombres dures
 * 4px, capitales espacées, rouge vif). Ton direct, palette V2, boutons
 * partagés. Le digest reste affiché : c'est ce qu'on demande au client
 * quand il nous écrit.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Root Error]', error)
  }, [error])

  return (
    <main className="bg-canvas">
      <div className="container flex min-h-[70vh] items-center py-16 md:py-24">
        <div className="max-w-[560px]">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta/10 text-terracotta">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">
            Erreur
          </p>
          <h1 className="font-display text-[34px] font-extrabold leading-[1.02] tracking-tight text-spruce md:text-[44px] [text-wrap:balance]">
            Une erreur est survenue.
          </h1>
          <p className="mt-5 text-[17px] leading-[1.65] text-ink-mute">
            Quelque chose s&apos;est mal passé de notre côté. Vous pouvez réessayer, ou
            revenir à l&apos;accueil.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button type="button" onClick={reset} className="btn-primary press">
              <RotateCcw className="h-4 w-4" />
              Réessayer
            </button>
            <Link href="/" className="btn-secondary press">
              Retour à l&apos;accueil
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
