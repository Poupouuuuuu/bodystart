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
    <main className="min-h-[60vh] flex items-center justify-center bg-[#f4f6f1] px-4">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="font-display text-[32px] md:text-[40px] font-black uppercase tracking-tighter text-[#1a2e23] mb-4 leading-none">
          Erreur espace client
        </h1>
        <p className="text-[#4a5f4c] font-medium mb-8 leading-relaxed text-sm">
          Impossible de charger votre espace client. Votre session a peut-être expiré. Reconnectez-vous ou réessayez.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#1a2e23] text-white font-bold uppercase tracking-widest text-[11px] rounded-full hover:bg-[#2e4f3c] transition-all shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            Réessayer
          </button>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-[#1a2e23] font-bold uppercase tracking-widest text-[11px] rounded-full border border-[#1a2e23]/10 hover:bg-[#1a2e23]/5 transition-all"
          >
            <LogIn className="w-4 h-4" />
            Se reconnecter
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-[#89a890] font-bold uppercase tracking-wider text-[11px] rounded-full hover:text-[#1a2e23] transition-all"
          >
            <Home className="w-4 h-4" />
            Accueil
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 text-[10px] font-bold uppercase tracking-widest text-[#89a890]">
            Code : {error.digest}
          </p>
        )}
      </div>
    </main>
  )
}
