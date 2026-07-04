import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { Gift, Users, ShoppingBag, ArrowRight, ChevronDown } from 'lucide-react'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  path: '/parrainage',
  title: 'Parrainage BodyStart : 10 € pour ton pote, 5 % à vie pour toi',
  description:
    'Partage ton code parrain BodyStart. Ton pote a 10 € dès 60 € sur sa première commande, tu gagnes 5 % de tous ses achats en cagnotte, à vie. Aucune carte, aucune appli.',
})

const STEPS = [
  {
    step: '01',
    title: 'Tu partages ton code',
    desc: 'Ton code BS-XXXXX est dispo dans ton compte. Envoie-le par DM, WhatsApp, SMS, comme tu veux.',
    icon: Users,
  },
  {
    step: '02',
    title: 'Ton pote économise 10 €',
    desc: 'Il rentre ton code au panier sur sa première commande, dès 60 € d\'achat. Non cumulable avec un autre code.',
    icon: ShoppingBag,
  },
  {
    step: '03',
    title: 'Tu gagnes 5 % à vie',
    desc: 'À chaque fois qu\'il commande, on te crédite 5 % du montant payé — sans limite de durée. Ta cagnotte grossit toute seule, utilisable dès 20 €.',
    icon: Gift,
  },
]

const FAQ = [
  {
    q: 'Combien de potes je peux parrainer ?',
    a: 'Autant que tu veux. Plus tu partages, plus ta cagnotte grimpe.',
  },
  {
    q: 'Quand mon pote peut utiliser le code ?',
    a: 'Sur sa première commande, dès 60 € d\'achat (hors frais de port). Une fois par filleul, non cumulable avec un autre code.',
  },
  {
    q: 'Comment j\'utilise ma cagnotte ?',
    a: 'Dès que tu as 20 € ou plus, tu peux l\'utiliser au panier. Tu choisis le montant, jusqu\'à 50 % du total de ta commande.',
  },
  {
    q: 'C\'est cumulable avec d\'autres remises ?',
    a: 'Sur une commande, c\'est un code à la fois. Ta cagnotte s\'applique comme une remise sur ton panier ; tu ne peux pas l\'empiler avec un autre code promo, donc tu prends le plus avantageux. Pareil pour le code parrain : un seul code par commande, le plus avantageux gagne.',
  },
  {
    q: 'Mes 5 % s\'arrêtent quand ?',
    a: 'Jamais : c\'est à vie. Tant que ton pote commande, on te crédite 5 % de chacun de ses achats, sans limite de durée. La cagnotte gagnée reste à toi pour toujours.',
  },
  {
    q: 'Et ma cagnotte expire ?',
    a: 'Jamais. Une fois créditée, c\'est à toi pour la vie.',
  },
]

const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 bg-fresh text-white font-semibold text-[15px] px-7 py-3.5 rounded-full transition-colors hover:bg-fresh-deep'
const BTN_OUTLINE =
  'inline-flex items-center justify-center gap-2 border border-spruce text-spruce font-semibold text-[15px] px-7 py-3.5 rounded-full transition-colors hover:bg-spruce/5'

export default function ParrainagePage() {
  // Detection cote serveur : presence cookie shopify (pas besoin de fetch)
  const isLoggedIn = !!cookies().get('body-start-customer-token')?.value

  return (
    <div className="bg-canvas min-h-screen">
      {/* Hero */}
      <section className="pt-12 md:pt-16 pb-12 md:pb-16">
        <div className="container">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
              <Gift className="w-3.5 h-3.5" /> Programme parrainage
            </p>
            <h1 className="font-display text-[32px] md:text-[40px] font-extrabold text-spruce leading-[1.1] tracking-tight mb-5">
              Tu recommandes, ton pote économise, tu gagnes.
            </h1>
            <p className="text-ink-mute text-[16px] md:text-[18px] leading-[1.6] max-w-2xl mb-8">
              Le programme parrainage BodyStart, c&apos;est simple. Tu partages ton
              code, ton pote a 10 € sur sa première commande dès 60 € d&apos;achat,
              et tu touches 5 % de tous ses achats, à vie. Aucune carte physique,
              aucune appli, ton compte BodyStart suffit.
            </p>
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
          </div>
        </div>
      </section>

      {/* Comment ca marche */}
      <section className="container pb-16 md:pb-20">
        <h2 className="font-display text-[28px] md:text-[36px] font-extrabold text-spruce leading-[1.1] tracking-tight mb-8 md:mb-10 max-w-2xl">
          Comment ça marche
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="bg-white rounded-2xl border border-spruce/10 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 bg-sage text-spruce rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0">
                  {step}
                </div>
                <Icon className="w-5 h-5 text-spruce" />
              </div>
              <h3 className="font-display text-[18px] font-extrabold text-spruce tracking-tight mb-2">
                {title}
              </h3>
              <p className="text-ink-mute text-[14px] leading-[1.65]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container pb-16 md:pb-20">
        <h2 className="font-display text-[28px] md:text-[36px] font-extrabold text-spruce leading-[1.1] tracking-tight mb-8 md:mb-10 max-w-2xl">
          Les questions qu&apos;on nous pose
        </h2>

        <div className="space-y-3 max-w-3xl">
          {FAQ.map(({ q, a }) => (
            <details
              key={q}
              className="group bg-white rounded-2xl border border-spruce/10 px-5 md:px-6"
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden py-4 md:py-5 text-[15px] font-semibold text-ink">
                {q}
                <ChevronDown className="w-4 h-4 text-spruce flex-shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="text-[14px] text-ink-mute leading-[1.65] pb-5">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA bas */}
      <section className="container pb-16 md:pb-24">
        <div className="bg-white rounded-2xl border border-spruce/10 p-8 md:p-14 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
            Aucune carte physique. Aucune appli à installer.
          </p>
          <h2 className="font-display text-[28px] md:text-[36px] font-extrabold text-spruce leading-[1.1] tracking-tight mb-7">
            Ton compte BodyStart fait tout.
          </h2>
          {isLoggedIn ? (
            <Link href="/account?tab=referral" className={BTN_PRIMARY}>
              Voir mon code <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link href="/login" className={BTN_PRIMARY}>
              Connecte-toi pour démarrer <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
