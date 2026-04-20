'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { COACHING_PRODUCTS, type CoachingTier } from '@/lib/stripe/types'
import { useCustomer } from '@/context/CustomerContext'

export default function CoachingTarifsPage() {
  const router = useRouter()
  const { isLoggedIn, isLoading: customerLoading } = useCustomer()
  const [loadingTier, setLoadingTier] = useState<CoachingTier | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isTestMode = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_')

  const oneshot = COACHING_PRODUCTS.oneshot
  const monthly = COACHING_PRODUCTS.monthly_followup

  async function handleCheckout(tier: CoachingTier) {
    if (!isLoggedIn) {
      router.push('/login?redirect=/coaching/tarifs')
      return
    }
    setLoadingTier(tier)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tier }),
      })
      const json = await res.json()
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }
      window.location.href = json.url
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(msg)
      setLoadingTier(null)
    }
  }

  return (
    <div className="bg-gray-950 text-white min-h-screen pb-24">
      {/* Header */}
      <div className="container py-12">
        <Link
          href="/coaching"
          className="inline-flex items-center gap-2 text-coaching-cyan-400 text-[10px] font-black uppercase tracking-widest hover:text-coaching-cyan-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Retour coaching
        </Link>
        <h1 className="font-display text-5xl md:text-6xl font-black uppercase tracking-tighter mb-4">
          Choisis ton coaching
        </h1>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm max-w-2xl">
          Deux offres simples · Programme sur-mesure validé par notre coach · Sans engagement.
        </p>
        {isTestMode && (
          <div className="mt-6 inline-block px-4 py-2 bg-amber-500/20 border-2 border-amber-500 rounded-sm text-amber-300 text-[10px] font-black uppercase tracking-widest">
            ⚠️ Mode test Stripe — utilise la carte 4242 4242 4242 4242
          </div>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <div className="container">
          <div className="mb-8 p-5 bg-rose-500/20 border-2 border-rose-500 rounded-sm text-rose-300 text-sm font-bold">
            {error}
          </div>
        </div>
      )}

      {/* ─── 2 cartes ─── */}
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* ── ONE-SHOT 49€ ── */}
          <div className="bg-gray-900 border-2 border-gray-800 rounded-sm p-8 flex flex-col">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-coaching-cyan-400 mb-3 block">
                One-shot · Paiement unique
              </span>
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-white mb-3">
                {oneshot.name}
              </h2>
              <p className="text-gray-400 text-sm font-bold leading-relaxed mb-6">
                {oneshot.shortDescription}
              </p>
              <div className="mb-8">
                <span className="font-display text-5xl font-black text-white">
                  {oneshot.priceEur}€
                </span>
                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest ml-2">
                  TTC · Une seule fois
                </span>
              </div>
              <ul className="space-y-3 mb-8">
                {oneshot.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-gray-300 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-coaching-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => handleCheckout('oneshot')}
              disabled={loadingTier !== null || customerLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-white text-gray-900 font-black text-[10px] uppercase tracking-widest rounded-sm border-2 border-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingTier === 'oneshot' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Redirection…
                </>
              ) : (
                'Acheter le programme'
              )}
            </button>
          </div>

          {/* ── MONTHLY 89€/mois ── */}
          <div className="bg-gray-900 border-2 border-coaching-cyan-500 rounded-sm p-8 flex flex-col relative shadow-[8px_8px_0_#2ab0b0]">
            <div className="absolute -top-3 right-4 bg-coaching-cyan-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm">
              Le plus complet
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-coaching-cyan-400 mb-3 block">
                Abonnement mensuel
              </span>
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-white mb-3">
                {monthly.name}
              </h2>
              <p className="text-gray-400 text-sm font-bold leading-relaxed mb-6">
                {monthly.shortDescription}
              </p>
              <div className="mb-8">
                <span className="font-display text-5xl font-black text-coaching-cyan-400">
                  {monthly.priceEur}€
                </span>
                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest ml-2">
                  / mois · Sans engagement
                </span>
              </div>
              <ul className="space-y-3 mb-8">
                {monthly.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-gray-300 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-coaching-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => handleCheckout('monthly_followup')}
              disabled={loadingTier !== null || customerLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-coaching-cyan-500 text-black font-black text-[10px] uppercase tracking-widest rounded-sm border-2 border-coaching-cyan-500 hover:bg-coaching-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[4px_4px_0_theme(colors.gray.950)]"
            >
              {loadingTier === 'monthly_followup' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Redirection…
                </>
              ) : (
                "S'abonner au suivi"
              )}
            </button>
          </div>
        </div>

        {/* ─── Garanties ─── */}
        <div className="mt-16 max-w-5xl mx-auto p-6 bg-gray-900 border-2 border-gray-800 rounded-sm grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <p className="font-display font-black text-coaching-cyan-400 text-sm uppercase tracking-widest mb-1">
              Validation coach 100%
            </p>
            <p className="text-xs text-gray-400 font-medium">
              Tout programme est relu et validé manuellement avant envoi.
            </p>
          </div>
          <div>
            <p className="font-display font-black text-coaching-cyan-400 text-sm uppercase tracking-widest mb-1">
              Données EU
            </p>
            <p className="text-xs text-gray-400 font-medium">
              Stockage Supabase Ireland · RGPD conforme · Données santé chiffrées.
            </p>
          </div>
          <div>
            <p className="font-display font-black text-coaching-cyan-400 text-sm uppercase tracking-widest mb-1">
              Sans engagement
            </p>
            <p className="text-xs text-gray-400 font-medium">
              Annulation de l&apos;abonnement à tout moment depuis ton espace client.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
