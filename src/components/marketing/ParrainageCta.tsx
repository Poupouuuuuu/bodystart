'use client'

/**
 * CTA du hero /parrainage — extrait en composant CLIENT (sprint perf
 * 2026-07-04) : la page appelait cookies() côté serveur juste pour ce booléen,
 * ce qui la forçait en rendu dynamique complet (TTFB ~490 ms pour du contenu
 * statique). La page est désormais en ISR ; l'état connecté vient de
 * useCustomer() (déjà monté dans le root layout). Comportement identique :
 * connecté → « Voir mon code », sinon → login + register.
 */
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useCustomer } from '@/context/CustomerContext'

const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 bg-fresh text-white font-semibold text-[15px] px-7 py-3.5 rounded-full transition-colors hover:bg-fresh-deep'
const BTN_OUTLINE =
  'inline-flex items-center justify-center gap-2 border border-spruce text-spruce font-semibold text-[15px] px-7 py-3.5 rounded-full transition-colors hover:bg-spruce/5'

export default function ParrainageCta({ variant = 'hero' }: { variant?: 'hero' | 'footer' }) {
  const { isLoggedIn } = useCustomer()

  if (variant === 'footer') {
    // CTA bas de page : un seul bouton, libellé « démarrer ».
    return isLoggedIn ? (
      <Link href="/account?tab=referral" className={BTN_PRIMARY}>
        Voir mon code <ArrowRight className="w-4 h-4" />
      </Link>
    ) : (
      <Link href="/login" className={BTN_PRIMARY}>
        Connecte-toi pour démarrer <ArrowRight className="w-4 h-4" />
      </Link>
    )
  }

  return (
    <div className="flex flex-wrap gap-3">
      {isLoggedIn ? (
        <Link href="/account?tab=referral" className={BTN_PRIMARY}>
          Voir mon code <ArrowRight className="w-4 h-4" />
        </Link>
      ) : (
        <>
          <Link href="/login" className={BTN_PRIMARY}>
            Connecte-toi pour avoir ton code
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/register" className={BTN_OUTLINE}>
            Pas encore de compte ? Inscris-toi en 30 secondes
          </Link>
        </>
      )}
    </div>
  )
}
