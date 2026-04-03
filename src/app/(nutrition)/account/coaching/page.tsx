'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Dumbbell, CalendarDays, TrendingUp, ChevronRight, Clipboard, Tag, ArrowRight, Loader2, ShieldX } from 'lucide-react'
import { useCustomer } from '@/context/CustomerContext'
import { COACHING_PRODUCTS } from '@/lib/stripe/types'
import { cn } from '@/lib/utils'

function CoachingContent() {
  const router = useRouter()
  const { customer, isLoading, isLoggedIn } = useCustomer()
  const searchParams = useSearchParams()

  const [discountCode, setDiscountCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [coachingActive, setCoachingActive] = useState<boolean | null>(null)
  const [checkingCoaching, setCheckingCoaching] = useState(true)

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login?redirect=/account/coaching')
    }
  }, [isLoading, isLoggedIn, router])

  // Vérifier le statut coaching via API
  useEffect(() => {
    if (!customer?.email) return
    async function checkCoachingStatus() {
      try {
        const res = await fetch(`/api/coaching/status?email=${encodeURIComponent(customer!.email)}`)
        const data = await res.json()
        setCoachingActive(data.active === true)
      } catch {
        setCoachingActive(false)
      } finally {
        setCheckingCoaching(false)
      }
    }
    checkCoachingStatus()
  }, [customer?.email])

  // Récupérer le code promo coaching
  useEffect(() => {
    if (customer?.email && coachingActive) {
      const emailHash = customer.email
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 8)
        .toUpperCase()
      setDiscountCode(`COACH-${emailHash}`)
    }
  }, [customer?.email, coachingActive])

  function copyCode() {
    if (discountCode) {
      navigator.clipboard.writeText(discountCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading || checkingCoaching) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coaching-cyan-500" />
      </div>
    )
  }

  if (!customer) return null

  // Si coaching non actif, afficher un message de redirection
  if (coachingActive === false) {
    return (
      <div className="container py-10 md:py-14">
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="w-16 h-16 bg-gray-100 border-2 border-gray-200 rounded-sm flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0_theme(colors.gray.200)]">
            <ShieldX className="w-7 h-7 text-gray-400" />
          </div>
          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-gray-900 mb-4">
            Aucun coaching actif
          </h1>
          <p className="text-sm text-gray-500 font-bold mb-8">
            Vous n'avez pas encore souscrit à une offre coaching. Découvrez nos programmes et commencez votre transformation.
          </p>
          <Link
            href="/coaching/tarifs"
            className="inline-flex items-center gap-2 px-8 py-4 bg-coaching-cyan-500 text-black font-black text-[10px] uppercase tracking-widest rounded-sm border-2 border-coaching-cyan-500 hover:bg-coaching-cyan-400 transition-colors shadow-[4px_4px_0_theme(colors.gray.900)]"
          >
            DÉCOUVRIR NOS OFFRES <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  const abonnement = COACHING_PRODUCTS.find((p) => p.type === 'abonnement')
  const programmes = COACHING_PRODUCTS.filter((p) => p.type === 'programme')

  return (
    <div className="container py-10 md:py-14">
      {/* En-tête */}
      <div className="mb-12">
        <p className="text-[10px] font-black uppercase tracking-widest text-coaching-cyan-400 border-l-4 border-coaching-cyan-500 pl-2 mb-2">
          Mon coaching
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tight text-gray-900">
          Espace coaching
        </h1>
      </div>

      {/* ─── Bannière promo code ─── */}
      {discountCode && (
        <div className="mb-10 p-6 bg-coaching-cyan-50 border-2 border-coaching-cyan-200 rounded-sm shadow-[4px_4px_0_#99e5e5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Tag className="w-5 h-5 text-coaching-cyan-600 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-coaching-cyan-700 mb-1">
                Votre réduction coaching -15%
              </p>
              <p className="text-xs text-gray-600 font-bold">
                Appliquée automatiquement sur tous les compléments et vêtements.
              </p>
            </div>
          </div>
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-coaching-cyan-300 rounded-sm text-[10px] font-black uppercase tracking-widest text-coaching-cyan-700 hover:bg-coaching-cyan-100 transition-colors flex-shrink-0"
          >
            <Clipboard className="w-3.5 h-3.5" />
            {copied ? 'COPIÉ !' : discountCode}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ─── Navigation coaching ─── */}
        <div className="space-y-6">
          <div className="rounded-sm border-2 border-gray-200 overflow-hidden shadow-[4px_4px_0_theme(colors.gray.200)]">
            {[
              { Icon: Dumbbell, label: 'Mes programmes', href: '/account/coaching/programmes' },
              { Icon: TrendingUp, label: 'Mon suivi', href: '/account/coaching/suivi' },
              { Icon: CalendarDays, label: 'Mes séances', href: '/account/coaching#seances' },
            ].map(({ Icon, label, href }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center justify-between px-6 py-4 transition-colors border-b-2 last:border-0 border-gray-100 hover:bg-gray-50 group"
              >
                <span className="flex items-center gap-3 text-xs font-black uppercase tracking-tight text-gray-900 group-hover:text-coaching-cyan-600">
                  <Icon className="w-4 h-4 text-coaching-cyan-500" />
                  {label}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>

          {/* Lien vers boutique */}
          <Link
            href="/products"
            className="flex items-center justify-between p-4 bg-brand-50 border-2 border-brand-200 rounded-sm text-[10px] font-black uppercase tracking-widest text-brand-700 hover:bg-brand-100 transition-colors group"
          >
            <span>Boutique compléments (-15%)</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* ─── Contenu principal ─── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Programmes actifs */}
          <div className="rounded-sm border-2 border-gray-200 overflow-hidden shadow-[4px_4px_0_theme(colors.gray.200)]">
            <div className="flex items-center justify-between px-6 py-5 bg-gray-50 border-b-2 border-gray-100">
              <h2 className="font-display font-black uppercase tracking-tight text-xl text-gray-900 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-coaching-cyan-500" />
                Mes programmes
              </h2>
              <Link href="/account/coaching/programmes" className="text-[10px] font-black uppercase tracking-widest text-coaching-cyan-600 hover:text-gray-900 transition-colors">
                Voir tout →
              </Link>
            </div>

            <div className="p-6 space-y-4">
              {programmes.map((p) => (
                <Link
                  key={p.id}
                  href={`/account/coaching/programmes/${p.id}`}
                  className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-sm hover:border-coaching-cyan-500 hover:shadow-[4px_4px_0_#99e5e5] transition-all group"
                >
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight text-gray-900">{p.name}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                      {p.durationDays ? `${p.durationDays / 7} semaines` : 'En continu'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-coaching-cyan-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Séances à venir */}
          <div id="seances" className="rounded-sm border-2 border-gray-200 overflow-hidden shadow-[4px_4px_0_theme(colors.gray.200)]">
            <div className="flex items-center justify-between px-6 py-5 bg-gray-50 border-b-2 border-gray-100">
              <h2 className="font-display font-black uppercase tracking-tight text-xl text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-coaching-cyan-500" />
                Séances à venir
              </h2>
            </div>

            <div className="py-16 text-center px-6">
              <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="font-black uppercase tracking-tight text-lg text-gray-900 mb-2">Aucune séance planifiée</p>
              <p className="text-sm text-gray-500 font-medium mb-8">Réservez votre prochaine séance avec un coach.</p>
              <Link
                href="/coaching/tarifs#seance-individuelle"
                className="inline-flex items-center gap-2 px-6 py-3 bg-coaching-cyan-500 text-black font-black text-[10px] uppercase tracking-widest rounded-sm border-2 border-coaching-cyan-500 hover:bg-coaching-cyan-400 transition-colors shadow-[4px_4px_0_theme(colors.gray.200)]"
              >
                RÉSERVER UNE SÉANCE <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Suivi rapide */}
          <Link
            href="/account/coaching/suivi"
            className="flex items-center justify-between p-6 border-2 border-gray-200 rounded-sm shadow-[4px_4px_0_theme(colors.gray.200)] hover:border-coaching-cyan-500 hover:shadow-[6px_6px_0_#99e5e5] transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-coaching-cyan-500 rounded-sm flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-black" />
              </div>
              <div>
                <p className="font-black text-base uppercase tracking-tight text-gray-900">Mon suivi de progression</p>
                <p className="text-xs text-gray-500 font-bold mt-1">Enregistrez vos séances et suivez vos progrès.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-coaching-cyan-500 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AccountCoachingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-coaching-cyan-500" /></div>}>
      <CoachingContent />
    </Suspense>
  )
}
