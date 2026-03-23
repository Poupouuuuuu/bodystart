'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Gift, ArrowLeft, Users, Copy } from 'lucide-react'
import { useCustomer } from '@/context/CustomerContext'

export default function ReferralPage() {
  const router = useRouter()
  const { isLoading, isLoggedIn, customer } = useCustomer()

  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.push('/login')
  }, [isLoading, isLoggedIn, router])

  if (isLoading) return null

  const referralCode = `BS-${customer?.firstName?.toUpperCase().slice(0, 4) ?? 'XXXX'}${Math.floor(Math.random() * 1000)}`

  return (
    <div className="container py-10 max-w-3xl">
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-700 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Mon compte
      </Link>

      <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Programme de parrainage</h1>
      <p className="text-gray-500 mb-8">Invitez vos amis et gagnez des récompenses ensemble.</p>

      {/* Carte code parrainage */}
      <div className="bg-brand-700 text-white rounded-3xl p-8 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold">Votre code parrainage</p>
            <p className="text-brand-200 text-sm">Partagez-le avec vos amis</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <code className="flex-1 bg-white/10 border border-white/20 rounded-xl px-5 py-3 font-mono font-bold text-xl tracking-widest text-center">
            {referralCode}
          </code>
          <button className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors" aria-label="Copier">
            <Copy className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Règles */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-700" /> Comment ça marche ?
        </h2>
        <div className="space-y-4">
          {[
            { step: '1', title: 'Partagez votre code', desc: 'Envoyez votre code à vos amis sportifs.' },
            { step: '2', title: 'Votre ami commande', desc: 'Il utilise votre code et bénéficie de -10% sur sa première commande.' },
            { step: '3', title: 'Vous êtes récompensé', desc: 'Vous recevez un bon d\'achat de 10€ crédité sur votre compte.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4">
              <div className="w-7 h-7 bg-brand-700 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">{step}</div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{title}</p>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-brand-50 rounded-2xl border border-brand-100 p-5 text-center">
        <p className="text-brand-700 font-semibold text-sm">🎉 Programme de parrainage — Bientôt actif</p>
        <p className="text-brand-600/70 text-xs mt-1">Le système de récompenses sera lancé prochainement.</p>
      </div>
    </div>
  )
}
