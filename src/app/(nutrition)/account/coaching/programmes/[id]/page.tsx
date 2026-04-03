'use client'

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, Calendar, Loader2 } from 'lucide-react'
import { COACHING_PRODUCTS } from '@/lib/stripe/types'

function ProgrammeContent() {
  const params = useParams()
  const id = params?.id as string
  const product = COACHING_PRODUCTS.find((p) => p.id === id)

  if (!product) {
    return (
      <div className="container py-10">
        <Link href="/account/coaching" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Retour au coaching
        </Link>
        <div className="text-center py-20">
          <p className="font-black text-xl uppercase tracking-tight text-gray-900">Programme introuvable</p>
        </div>
      </div>
    )
  }

  const weeks = product.durationDays ? Math.ceil(product.durationDays / 7) : null

  // Exemple de contenu de programme (en production, chargé depuis Shopify metafields ou un CMS)
  const weekPlan = weeks
    ? Array.from({ length: weeks }, (_, i) => ({
        week: i + 1,
        title: i < 2 ? 'Phase d\'adaptation' : i < weeks - 2 ? 'Phase intensive' : 'Phase de consolidation',
        focus: i < 2
          ? 'Mise en place des bases, évaluation du niveau, ajustement nutrition'
          : i < weeks - 2
            ? 'Montée en charge progressive, ajustements hebdomadaires'
            : 'Maintien des acquis, préparation de la transition',
      }))
    : null

  return (
    <div className="container py-10 md:py-14">
      <Link href="/account/coaching" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors mb-10 group">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Retour au coaching
      </Link>

      {/* En-tête programme */}
      <div className="mb-10">
        <span className="text-[10px] font-black uppercase tracking-widest text-coaching-cyan-600 bg-coaching-cyan-50 border-2 border-coaching-cyan-200 px-3 py-1 rounded-sm inline-block mb-4">
          {product.type === 'programme' ? 'Programme' : product.type}
        </span>
        <h1 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tight text-gray-900 mb-4">
          {product.name}
        </h1>
        <p className="text-gray-600 font-medium text-lg max-w-2xl">{product.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-8">
          {/* Inclus */}
          <div className="rounded-sm border-2 border-gray-200 p-6 shadow-[4px_4px_0_theme(colors.gray.200)]">
            <h2 className="font-display font-black text-xl uppercase tracking-tight text-gray-900 mb-6">Ce qui est inclus</h2>
            <ul className="space-y-3">
              {product.features.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-coaching-cyan-500 flex-shrink-0" />
                  <span className="text-gray-700 font-bold">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Plan semaine par semaine */}
          {weekPlan && (
            <div className="rounded-sm border-2 border-gray-200 overflow-hidden shadow-[4px_4px_0_theme(colors.gray.200)]">
              <div className="px-6 py-5 bg-gray-50 border-b-2 border-gray-100">
                <h2 className="font-display font-black text-xl uppercase tracking-tight text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-coaching-cyan-500" />
                  Plan semaine par semaine
                </h2>
              </div>
              <div className="divide-y-2 divide-gray-100">
                {weekPlan.map((w) => (
                  <div key={w.week} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <span className="w-10 h-10 bg-gray-900 text-white rounded-sm flex items-center justify-center font-black text-sm flex-shrink-0">
                        S{w.week}
                      </span>
                      <div>
                        <p className="font-black text-sm uppercase tracking-tight text-gray-900">{w.title}</p>
                        <p className="text-xs text-gray-500 font-bold mt-1">{w.focus}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-sm border-2 border-gray-200 p-6 shadow-[4px_4px_0_theme(colors.gray.200)] sticky top-24">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
              <Clock className="w-3.5 h-3.5" />
              {weeks ? `${weeks} semaines` : 'Durée illimitée'}
            </div>

            <div className="mb-6 pb-6 border-b-2 border-gray-100">
              <span className="font-display font-black text-4xl text-gray-900">{product.price}€</span>
              {product.stripeMode === 'subscription' && (
                <span className="text-gray-500 text-sm font-black uppercase tracking-widest ml-1">/mois</span>
              )}
            </div>

            <Link
              href="/account/coaching/suivi"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-coaching-cyan-500 text-black font-black text-[10px] uppercase tracking-widest rounded-sm border-2 border-coaching-cyan-500 hover:bg-coaching-cyan-400 transition-colors shadow-[4px_4px_0_theme(colors.gray.200)] mb-3"
            >
              ACCÉDER AU SUIVI
            </Link>

            <Link
              href="/account/coaching"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 font-black text-[10px] uppercase tracking-widest rounded-sm border-2 border-gray-200 hover:border-gray-900 transition-colors"
            >
              RETOUR AU DASHBOARD
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProgrammePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-coaching-cyan-500" /></div>}>
      <ProgrammeContent />
    </Suspense>
  )
}
