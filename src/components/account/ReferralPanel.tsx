'use client'

import Link from 'next/link'
import { Gift, Users, Copy, MessageCircle, Share2, Loader2, Wallet } from 'lucide-react'
import { useLoyaltyMe } from '@/hooks/useLoyaltyMe'
import { EnrollmentBlock } from './EnrollmentBlock'
import { getSiteUrl, getSiteDomain } from '@/lib/site-url'
import { toast } from '@/lib/toast'

function buildWhatsAppText(referralCode: string): string {
  const domain = getSiteDomain() || 'notre site'
  const url = getSiteUrl()
  const link = url ? `${url}/?parrain=${referralCode}` : ''
  return `Salut ! Je commande mes compléments sur ${domain}. T'as 10 € de remise sur ta première commande dès 60 € d'achat avec mon code ${referralCode}.${link ? ' Lien direct : ' + link : ''}`
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
      // Le LIEN complet (il applique le code tout seul via ?parrain=), pas le
      // code nu : collé dans un DM, le filleul n'avait rien d'actionnable.
      const url = getSiteUrl()
      const link = url ? `${url}/?parrain=${referralCode}` : referralCode
      await navigator.clipboard.writeText(link)
      toast.success(url ? 'Lien de parrainage copié !' : 'Code copié !')
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
          Ton pote a 10 € sur sa 1ʳᵉ commande dès 60 € ; toi, tu gagnes 5 % de tous ses achats en cagnotte, à vie.
        </p>
      </div>

      {/* Compteurs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-spruce/10 rounded-2xl p-5">
          <p className="text-[28px] font-display font-extrabold text-spruce leading-none">
            {state.referral.filleulsCount}
          </p>
          <p className="text-[12px] text-ink-mute font-medium mt-1.5">
            filleul{state.referral.filleulsCount > 1 ? 's' : ''} parrainé{state.referral.filleulsCount > 1 ? 's' : ''}
          </p>
        </div>
        <div className="bg-white border border-spruce/10 rounded-2xl p-5">
          <p className="text-[28px] font-display font-extrabold text-fresh leading-none">
            {(state.referral.earnedNetCents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €
          </p>
          <p className="text-[12px] text-ink-mute font-medium mt-1.5">gagnés grâce au parrainage</p>
        </div>
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
          {/* aria-labels : sous sm le texte est masqué (icône seule) — sans
              nom accessible les 3 contrôles étaient anonymes sur mobile */}
          <button
            onClick={handleCopy}
            aria-label="Copier le lien de parrainage"
            className="flex items-center justify-center gap-2 px-3 py-3 border border-spruce/20 text-spruce hover:bg-spruce/5 rounded-xl transition-colors text-[13px] font-semibold"
          >
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">Copier</span>
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Partager sur WhatsApp"
            className="flex items-center justify-center gap-2 px-3 py-3 border border-spruce/20 text-spruce hover:bg-spruce/5 rounded-xl transition-colors text-[13px] font-semibold"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <button
            onClick={handleShare}
            aria-label="Partager mon code parrain"
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
            { step: '01', title: 'Tu partages ton code (ou ton lien)', desc: 'Par DM, WhatsApp, SMS, comme tu veux.' },
            { step: '02', title: 'Ton pote a 10 € de remise', desc: 'Sur sa 1ʳᵉ commande, dès 60 € d\'achat. Non cumulable avec d\'autres codes.' },
            { step: '03', title: 'Tu gagnes 5 % à vie', desc: 'On te crédite 5 % du montant de chacune de ses commandes, sans limite de durée.' },
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
