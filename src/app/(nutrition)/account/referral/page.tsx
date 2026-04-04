'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Gift, ArrowLeft, Users, Copy } from 'lucide-react'
import { useCustomer } from '@/context/CustomerContext'
import toast from 'react-hot-toast'

export default function ReferralPage() {
  const router = useRouter()
  const { isLoading, isLoggedIn, customer } = useCustomer()

  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.push('/login')
  }, [isLoading, isLoggedIn, router])

  if (isLoading) return null

  const referralCode = `BS-${customer?.firstName?.toUpperCase().slice(0, 4) ?? 'XXXX'}${Math.floor(Math.random() * 1000)}`

  function copyCode() {
    navigator.clipboard.writeText(referralCode)
    toast.success('Code copié !')
  }

  return (
    <div className="bg-[#f4f6f1] min-h-screen">
      <div className="container py-12 md:py-16 max-w-3xl">
        <Link href="/account" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#89a890] hover:text-[#1a2e23] mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Mon compte
        </Link>

        <h1 className="font-display text-[35px] md:text-[42px] font-black uppercase tracking-tighter text-[#1a2e23] leading-none mb-3">
          Parrainage
        </h1>
        <p className="text-[#4a5f4c] font-medium text-sm mb-10">Invitez vos amis et gagnez des récompenses ensemble.</p>

        {/* Carte code parrainage */}
        <div className="bg-[#1a2e23] text-white rounded-[28px] p-8 md:p-10 mb-6 relative overflow-hidden">
          {/* Grid background */}
          <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#4a5f4c 1px, transparent 1px), linear-gradient(90deg, #4a5f4c 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <p className="font-display font-black uppercase tracking-tight">Votre code parrainage</p>
                <p className="text-white/50 text-sm font-medium">Partagez-le avec vos amis</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-white/10 border border-white/10 rounded-2xl px-5 py-4 font-mono font-bold text-xl tracking-widest text-center">
                {referralCode}
              </code>
              <button onClick={copyCode} className="p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-colors" aria-label="Copier">
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Règles */}
        <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-8 mb-6 shadow-sm">
          <h2 className="font-display font-black uppercase tracking-tight text-[#1a2e23] mb-6 flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-[#89a890]" /> Comment ça marche ?
          </h2>
          <div className="space-y-5">
            {[
              { step: '01', title: 'Partagez votre code', desc: 'Envoyez votre code à vos amis sportifs.' },
              { step: '02', title: 'Votre ami commande', desc: 'Il utilise votre code et bénéficie de -10% sur sa première commande.' },
              { step: '03', title: 'Vous êtes récompensé', desc: "Vous recevez un bon d'achat de 10€ crédité sur votre compte." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <div className="w-10 h-10 bg-[#1a2e23] text-white rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0">{step}</div>
                <div className="pt-1.5">
                  <p className="font-display font-bold text-[#1a2e23] text-sm uppercase tracking-tight">{title}</p>
                  <p className="text-[#4a5f4c] text-sm font-medium">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1a2e23]/5 rounded-[20px] p-6 text-center">
          <p className="text-[#1a2e23] font-display font-bold text-sm uppercase tracking-tight">🎉 Programme de parrainage — Bientôt actif</p>
          <p className="text-[#4a5f4c] text-[12px] mt-1 font-medium">Le système de récompenses sera lancé prochainement.</p>
        </div>
      </div>
    </div>
  )
}
