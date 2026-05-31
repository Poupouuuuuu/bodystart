'use client'

import Link from 'next/link'
import { Gift, Users, Copy, MessageCircle, Share2, Loader2, Wallet } from 'lucide-react'
import { useLoyaltyMe } from '@/hooks/useLoyaltyMe'
import { EnrollmentBlock } from './EnrollmentBlock'
import { getSiteUrl, getSiteDomain } from '@/lib/site-url'
import toast from 'react-hot-toast'

function buildWhatsAppText(referralCode: string): string {
  const domain = getSiteDomain() || 'notre site'
  const url = getSiteUrl()
  return `Salut ! Je commande mes compléments sur ${domain}. T'as 5 € de remise sur ta première commande avec mon code ${referralCode} (à partir de 40 € d'achat).${url ? ' Lien direct : ' + url : ''}`
}

export function ReferralPanel() {
  const { state, refresh } = useLoyaltyMe()

  if (state.kind === 'loading') {
    return (
      <div className="bg-white rounded-2xl border border-spruce/10 py-20 text-center">
        <Loader2 className="w-8 h-8 text-fresh animate-spin mx-auto" />
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className="bg-terracotta/10 border border-terracotta/20 rounded-xl px-5 py-4 text-terracotta text-sm font-medium">
        Impossible de charger ton parrainage. Réessaye dans un instant.
      </div>
    )
  }

  if (state.kind === 'logged_out') {
    return (
      <div className="bg-white rounded-2xl border border-spruce/10 p-8 text-center">
        <p className="text-ink-mute text-sm font-medium">
          Connecte-toi pour voir ton code parrain.
        </p>
      </div>
    )
  }

  if (state.kind === 'not_enrolled') {
    return <EnrollmentBlock onEnrolled={refresh} />
  }

  const { customer } = state
  const referralCode = customer.referralCode
  const whatsappText = buildWhatsAppText(referralCode)
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralCode)
      toast.success('Code copié !')
    } catch {
      toast.error('Copie impossible')
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BodyStart',
          text: whatsappText,
        })
      } catch {
        // share annule par l'utilisateur, on ne notifie pas
      }
    } else {
      await handleCopy()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-[28px] font-extrabold tracking-tight text-spruce leading-[1.1] mb-2">
          Parrainage
        </h2>
        <p className="text-ink-mute font-medium text-sm">
          Partage ton code, gagne 5 % à vie sur les achats de tes potes pendant 12 mois.
        </p>
      </div>

      {/* Carte code (claire) */}
      <div className="bg-white border border-spruce/10 rounded-2xl p-8 md:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-sage rounded-full flex items-center justify-center">
            <Gift className="w-6 h-6 text-spruce" />
          </div>
          <div>
            <p className="font-display font-bold text-spruce">Ton code parrain</p>
            <p className="text-ink-mute text-sm font-medium">Partage-le avec tes potes</p>
          </div>
        </div>

        <code className="block w-full bg-sage border border-spruce/10 rounded-xl px-5 py-4 font-mono font-bold text-xl tracking-widest text-center text-spruce mb-4">
          {referralCode}
        </code>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 px-3 py-3 border border-spruce/20 text-spruce hover:bg-spruce/5 rounded-xl transition-colors text-[13px] font-semibold"
          >
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">Copier</span>
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3 py-3 border border-spruce/20 text-spruce hover:bg-spruce/5 rounded-xl transition-colors text-[13px] font-semibold"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 px-3 py-3 border border-spruce/20 text-spruce hover:bg-spruce/5 rounded-xl transition-colors text-[13px] font-semibold"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Partager</span>
          </button>
        </div>
      </div>

      {/* Comment ca marche */}
      <div className="bg-white rounded-2xl border border-spruce/10 p-8">
        <h3 className="font-display font-bold text-spruce mb-6 flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-spruce" /> Comment ça marche
        </h3>
        <div className="space-y-5">
          {[
            { step: '01', title: 'Tu partages ton code à un pote', desc: 'Par DM, WhatsApp, SMS, comme tu veux.' },
            { step: '02', title: 'Il le rentre au panier', desc: 'Sur sa 1ʳᵉ commande, à partir de 40 € d\'achat. Il a 5 € de remise.' },
            { step: '03', title: 'Tu gagnes 5 % pendant 1 an', desc: 'On te crédite 5 % du montant de chacune de ses commandes.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4">
              <div className="w-10 h-10 bg-sage text-spruce rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0">
                {step}
              </div>
              <div className="pt-1.5">
                <p className="font-display font-bold text-ink text-sm">{title}</p>
                <p className="text-ink-mute text-sm font-medium">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lien cagnotte */}
      <div className="bg-sage rounded-2xl p-6 flex items-center justify-between gap-4">
        <p className="text-spruce font-display font-bold text-sm">
          Voir ce que tu as déjà gagné
        </p>
        <Link
          href="/account?tab=cagnotte"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-fresh text-white text-[13px] font-semibold rounded-full hover:bg-fresh-deep transition-colors"
        >
          <Wallet className="w-4 h-4" /> Ma cagnotte
        </Link>
      </div>
    </div>
  )
}
