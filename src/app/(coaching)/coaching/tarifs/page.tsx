'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, X as XIcon, Loader2 } from 'lucide-react'
import { COACHING_PRODUCTS, type CoachingProduct } from '@/lib/stripe/types'
import { useCustomer } from '@/context/CustomerContext'
import { cn } from '@/lib/utils'

export default function CoachingTarifsPage() {
  const router = useRouter()
  const { isLoggedIn, isLoading: customerLoading } = useCustomer()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isTestMode = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_')

  const abonnement = COACHING_PRODUCTS.find((p) => p.type === 'abonnement')!
  const others = COACHING_PRODUCTS.filter((p) => p.type !== 'abonnement')

  async function handleCheckout(product: CoachingProduct) {
    // Vérifier la connexion côté client avant d'appeler l'API
    if (!isLoggedIn) {
      router.push('/login?redirect=/coaching/tarifs')
      return
    }

    setLoadingId(product.id)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: product.stripePriceId,
          mode: product.stripeMode,
          productId: product.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        // Si le serveur dit non-authentifié, rediriger
        if (data.code === 'AUTH_REQUIRED') {
          router.push('/login?redirect=/coaching/tarifs')
          return
        }
        setError(data.error || 'Une erreur est survenue lors de la création du paiement.')
        return
      }
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Impossible de contacter le serveur. Vérifiez votre connexion internet.')
    } finally {
      setLoadingId(null)
    }
  }

  // Matrice de comparaison
  const comparisonFeatures = [
    { label: 'Programme personnalisé', keys: ['programme-prise-de-masse', 'programme-perte-de-poids', 'abonnement-mensuel'] },
    { label: 'Plan nutrition', keys: ['programme-prise-de-masse', 'abonnement-mensuel'] },
    { label: 'Suivi hebdomadaire', keys: ['programme-prise-de-masse', 'abonnement-mensuel'] },
    { label: 'Séances individuelles', keys: ['seance-individuelle', 'pack-3-mois', 'abonnement-mensuel'] },
    { label: '-15% compléments', keys: ['programme-prise-de-masse', 'programme-perte-de-poids', 'pack-3-mois', 'abonnement-mensuel'] },
    { label: 'Accès prioritaire nouveautés', keys: ['abonnement-mensuel'] },
    { label: 'Suivi continu illimité', keys: ['abonnement-mensuel'] },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white pt-24 pb-16">
      {isTestMode && (
        <div className="bg-yellow-400 text-black text-center py-2 text-[10px] font-black uppercase tracking-widest">
          MODE TEST — Aucun vrai paiement ne sera effectué
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-red-600 text-white p-4 border-2 border-red-800 rounded-sm shadow-[4px_4px_0_theme(colors.black)] animate-in fade-in slide-in-from-right">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-bold">{error}</p>
            <button onClick={() => setError(null)} className="flex-shrink-0 text-white/80 hover:text-white">
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="container">
        <Link href="/coaching" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors mb-12 group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Retour au coaching
        </Link>

        <div className="mb-16 border-l-4 border-coaching-cyan-500 pl-6">
          <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-2">INVESTISSEZ EN VOUS</span>
          <h1 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tight">
            LES TARIFS <span className="text-coaching-cyan-400">.</span>
          </h1>
        </div>

        {/* ─── Carte abonnement featured ─── */}
        <div id="abonnement-mensuel" className="mb-16 p-8 md:p-12 bg-gray-900 border-2 border-coaching-cyan-500 rounded-sm shadow-[8px_8px_0_#2ab0b0] relative">
          <div className="absolute -top-3 left-6 bg-coaching-cyan-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm">
            Meilleur rapport qualité/prix
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-4">{abonnement.name}</h2>
              <p className="text-gray-400 text-sm font-bold leading-relaxed mb-8">{abonnement.description}</p>
              <ul className="space-y-3">
                {abonnement.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-coaching-cyan-500 flex-shrink-0" />
                    <span className="text-gray-300 font-bold">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center lg:text-right">
              <div className="mb-6">
                <span className="font-display font-black text-6xl md:text-7xl text-coaching-cyan-400">{abonnement.price}€</span>
                <span className="text-gray-500 text-sm font-black uppercase tracking-widest block mt-1">/mois · sans engagement</span>
              </div>
              <button
                onClick={() => handleCheckout(abonnement)}
                disabled={loadingId === abonnement.id}
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-coaching-cyan-500 text-black font-black text-[10px] uppercase tracking-widest rounded-sm border-2 border-coaching-cyan-500 hover:bg-coaching-cyan-400 hover:border-coaching-cyan-400 transition-all shadow-[6px_6px_0_theme(colors.black)] hover:shadow-[8px_8px_0_theme(colors.black)] hover:-translate-y-1 disabled:opacity-60 disabled:pointer-events-none"
              >
                {loadingId === abonnement.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> CHARGEMENT...</>
                ) : (
                  <>S'ABONNER <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Autres offres ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {others.map((p) => (
            <div key={p.id} id={p.id} className="bg-gray-900 border-2 border-gray-800 rounded-sm p-6 flex flex-col hover:border-coaching-cyan-500 transition-colors">
              <span className="text-[10px] font-black uppercase tracking-widest text-coaching-cyan-400 mb-3">
                {p.type === 'programme' ? 'Programme' : p.type === 'seance' ? 'Séance' : 'Pack'}
              </span>
              <h3 className="font-black text-white text-base uppercase tracking-tight mb-2">{p.name}</h3>
              <p className="text-gray-400 text-xs font-bold leading-relaxed mb-6 flex-1">{p.description}</p>

              <ul className="space-y-2 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-coaching-cyan-500 flex-shrink-0" />
                    <span className="text-gray-300 font-bold">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4 border-t-2 border-gray-800 mt-auto">
                <div className="flex items-end justify-between mb-4">
                  <span className="font-display font-black text-3xl text-white">{p.price}€</span>
                  {p.durationDays && (
                    <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">
                      {p.durationDays >= 30 ? `${Math.round(p.durationDays / 7)} sem.` : `${p.durationDays}j`}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleCheckout(p)}
                  disabled={loadingId === p.id}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-coaching-cyan-500 text-black font-black text-[10px] uppercase tracking-widest rounded-sm border-2 border-coaching-cyan-500 hover:bg-coaching-cyan-400 hover:border-coaching-cyan-400 transition-all shadow-[4px_4px_0_theme(colors.black)] disabled:opacity-60 disabled:pointer-events-none"
                >
                  {loadingId === p.id ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> CHARGEMENT...</>
                  ) : (
                    <>CHOISIR <ArrowRight className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Tableau comparatif ─── */}
        <div className="mb-16 border-l-4 border-coaching-cyan-500 pl-6">
          <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-2">EN DÉTAIL</span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">COMPARATIF</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-2 border-gray-800 rounded-sm overflow-hidden">
            <thead>
              <tr className="bg-gray-900 border-b-2 border-gray-800">
                <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Fonctionnalité</th>
                {COACHING_PRODUCTS.map((p) => (
                  <th key={p.id} className={cn(
                    "p-4 text-[10px] font-black uppercase tracking-widest text-center",
                    p.type === 'abonnement' ? "text-coaching-cyan-400 bg-coaching-cyan-500/10" : "text-gray-400"
                  )}>
                    {p.name.split(' ').slice(0, 2).join(' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map(({ label, keys }) => (
                <tr key={label} className="border-b border-gray-800/50 hover:bg-gray-900/50 transition-colors">
                  <td className="p-4 text-sm font-bold text-gray-300">{label}</td>
                  {COACHING_PRODUCTS.map((p) => (
                    <td key={p.id} className={cn("p-4 text-center", p.type === 'abonnement' && "bg-coaching-cyan-500/5")}>
                      {keys.includes(p.id) ? (
                        <CheckCircle2 className="w-5 h-5 text-coaching-cyan-500 mx-auto" />
                      ) : (
                        <XIcon className="w-4 h-4 text-gray-700 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t-2 border-gray-800 bg-gray-900/30">
                <td className="p-4 text-sm font-black text-white uppercase">Prix</td>
                {COACHING_PRODUCTS.map((p) => (
                  <td key={p.id} className={cn(
                    "p-4 text-center font-display font-black text-xl",
                    p.type === 'abonnement' ? "text-coaching-cyan-400 bg-coaching-cyan-500/5" : "text-white"
                  )}>
                    {p.price}€{p.stripeMode === 'subscription' && <span className="text-xs text-gray-500 block">/mois</span>}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* ─── FAQ rapide ─── */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { q: 'Puis-je résilier mon abonnement à tout moment ?', a: 'Oui, l\'abonnement mensuel est sans engagement. Vous pouvez résilier directement depuis votre espace coaching.' },
            { q: 'Comment se passent les séances en visio ?', a: 'Nous utilisons Google Meet. Vous recevez un lien avant chaque séance. Les sessions durent 1h avec un coach certifié.' },
            { q: 'La réduction -15% s\'applique comment ?', a: 'Un code promo unique vous est attribué automatiquement à l\'activation de votre coaching. Il fonctionne sur tous les compléments et vêtements.' },
            { q: 'Puis-je changer de programme en cours ?', a: 'Oui, contactez votre coach qui ajustera votre programme selon votre évolution et vos nouveaux objectifs.' },
          ].map(({ q, a }) => (
            <div key={q} className="p-6 bg-gray-900 border-2 border-gray-800 rounded-sm">
              <h3 className="font-black text-white text-sm uppercase tracking-wider mb-3">{q}</h3>
              <p className="text-gray-400 text-xs font-bold leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
