import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { Gift, Users, ShoppingBag, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Parrainage BodyStart : 5 € pour ton pote, 5 % pour toi',
  description:
    'Partage ton code parrain BodyStart. Ton pote a 5 € sur sa première commande, tu gagnes 5 % de ses achats pendant 12 mois. Aucune carte, aucune appli.',
}

const STEPS = [
  {
    step: '01',
    title: 'Tu partages ton code',
    desc: 'Ton code BS-XXXXX est dispo dans ton compte. Envoie-le par DM, WhatsApp, SMS, comme tu veux.',
    icon: Users,
  },
  {
    step: '02',
    title: 'Ton pote économise 5 €',
    desc: 'Il rentre ton code au panier sur sa première commande, à partir de 40 € d\'achat. Direct, sans condition cachée.',
    icon: ShoppingBag,
  },
  {
    step: '03',
    title: 'Tu gagnes 5 % pendant 1 an',
    desc: 'À chaque fois qu\'il commande, on te crédite 5 % du montant payé. Ta cagnotte grossit toute seule, utilisable dès 20 €.',
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
    a: 'Sur sa première commande, à partir de 40 € d\'achat (hors frais de port). Une fois par filleul.',
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
    a: '12 mois après la première commande de ton pote. Après, il reste ton ami mais plus ton filleul. La cagnotte déjà gagnée, elle, reste à toi.',
  },
  {
    q: 'Et ma cagnotte expire ?',
    a: 'Jamais. Une fois créditée, c\'est à toi pour la vie.',
  },
]

export default function ParrainagePage() {
  // Detection cote serveur : presence cookie shopify (pas besoin de fetch)
  const isLoggedIn = !!cookies().get('body-start-customer-token')?.value

  return (
    <div className="bg-[#f4f6f1] min-h-screen">
      {/* Hero */}
      <section className="bg-[#1a2e23] text-white">
        <div className="container py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/10 rounded-full text-[11px] font-bold uppercase tracking-widest mb-6">
              <Gift className="w-3 h-3" /> Programme parrainage
            </div>
            <h1 className="font-display text-[40px] md:text-[64px] font-black uppercase tracking-tighter leading-[0.95] mb-6">
              Tu recommandes, ton pote économise, tu gagnes.
            </h1>
            <p className="text-white/80 text-lg md:text-xl font-medium leading-relaxed max-w-2xl mb-8">
              Le programme parrainage BodyStart, c&apos;est simple. Tu partages ton
              code, ton pote a 5 € sur sa première commande, et tu touches 5 %
              de ses achats pendant 12 mois. Aucune carte physique, aucune
              appli, ton compte BodyStart suffit.
            </p>
            <div className="flex flex-wrap gap-3">
              {isLoggedIn ? (
                <Link
                  href="/account?tab=referral"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#1a2e23] text-[12px] font-bold uppercase tracking-widest rounded-full hover:bg-white/90 transition-all shadow-lg"
                >
                  Voir mon code <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#1a2e23] text-[12px] font-bold uppercase tracking-widest rounded-full hover:bg-white/90 transition-all shadow-lg"
                  >
                    Connecte-toi pour avoir ton code
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 px-6 py-4 border border-white/20 text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-white/10 transition-all"
                  >
                    Pas encore de compte ? Inscris-toi en 30 secondes
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Comment ca marche */}
      <section className="container py-16 md:py-24">
        <h2 className="font-display text-[32px] md:text-[48px] font-black uppercase tracking-tighter text-[#1a2e23] leading-none mb-12 max-w-2xl">
          Comment ça marche
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#1a2e23] text-white rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0">
                  {step}
                </div>
                <Icon className="w-6 h-6 text-[#89a890]" />
              </div>
              <h3 className="font-display font-black uppercase tracking-tight text-[#1a2e23] text-lg mb-3">
                {title}
              </h3>
              <p className="text-[#4a5f4c] text-sm font-medium leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container pb-16 md:pb-24">
        <h2 className="font-display text-[32px] md:text-[48px] font-black uppercase tracking-tighter text-[#1a2e23] leading-none mb-12 max-w-2xl">
          Les questions qu&apos;on nous pose
        </h2>

        <div className="space-y-4 max-w-3xl">
          {FAQ.map(({ q, a }) => (
            <details
              key={q}
              className="group bg-white rounded-[20px] border border-[#1a2e23]/5 shadow-sm"
            >
              <summary className="cursor-pointer list-none px-6 md:px-8 py-5 flex items-center justify-between gap-4">
                <span className="font-display font-bold text-[#1a2e23] text-base">{q}</span>
                <span className="text-[#89a890] text-2xl font-bold transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="px-6 md:px-8 pb-5 text-[#4a5f4c] text-sm font-medium leading-relaxed">
                {a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA bas */}
      <section className="container pb-16 md:pb-24">
        <div className="bg-[#1a2e23] text-white rounded-[28px] p-10 md:p-16 text-center">
          <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mb-4">
            Aucune carte physique. Aucune appli à installer.
          </p>
          <h2 className="font-display text-[28px] md:text-[40px] font-black uppercase tracking-tighter leading-tight mb-8">
            Ton compte BodyStart fait tout.
          </h2>
          {isLoggedIn ? (
            <Link
              href="/account?tab=referral"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#1a2e23] text-[12px] font-bold uppercase tracking-widest rounded-full hover:bg-white/90 transition-all shadow-lg"
            >
              Voir mon code <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#1a2e23] text-[12px] font-bold uppercase tracking-widest rounded-full hover:bg-white/90 transition-all shadow-lg"
            >
              Connecte-toi pour démarrer <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
