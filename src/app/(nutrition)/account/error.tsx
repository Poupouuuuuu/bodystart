'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw, Home, LogIn } from 'lucide-react'

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Account Error]', error)
  }, [error])

  return (
    <main className="min-h-[60vh] flex items-center justify-center bg-canvas px-4 py-16">
      <div className="bg-white rounded-2xl border border-spruce/10 p-8 md:p-12 text-center max-w-lg w-full">
        <div className="w-20 h-20 rounded-full bg-terracotta/10 flex items-center justify-center mx-auto mb-8">
          <AlertTriangle className="w-9 h-9 text-terracotta" />
        </div>

        <h1 className="font-display text-[28px] md:text-[34px] font-extrabold text-spruce leading-[1.1] tracking-tight mb-4">
          Erreur espace client
        </h1>
        <p className="text-[15px] text-ink-mute leading-relaxed mb-8">
          Impossible de charger ton espace client. Ta session a peut-être expiré.
          Reconnecte-toi ou réessaie.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-fresh text-white text-[14px] font-semibold rounded-full hover:bg-fresh-deep transition-colors"
          >
            {/* Boutons à l'infinitif (convention UI fr), tutoiement dans le corps. */}
            <RotateCcw className="w-4 h-4" />
            Réessayer
          </button>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-spruce text-spruce text-[14px] font-semibold rounded-full hover:bg-spruce/5 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Se reconnecter
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-semibold text-ink-mute rounded-full hover:text-spruce transition-colors"
          >
            <Home className="w-4 h-4" />
            Accueil
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 text-[11px] font-medium text-ink-mute">
            Code : {error.digest}
          </p>
        )}
      </div>
    </main>
  )
}
