import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Store, Truck, MessageCircle, ShieldCheck, MapPin, Clock, Phone } from 'lucide-react'
import { buildPageMetadata } from '@/lib/seo'

// Page E-E-A-T : qui on est, pourquoi nous faire confiance. Sert aussi de
// page auteur/éditeur pour le blog (Article.author → /about). Uniquement des
// faits vérifiables — aucune stat inventée, aucune fausse équipe.
export const metadata: Metadata = buildPageMetadata({
  path: '/about',
  title: 'Qui est BodyStart Nutrition ? Boutique à Coignières (78)',
  description:
    'BodyStart Nutrition, c’est une vraie boutique de compléments alimentaires à Coignières (ex-BodyFit) et un site e-commerce. Du conseil d’humain, pas du marketing.',
})

const commitments = [
  {
    Icon: MessageCircle,
    title: 'Du conseil d’humain',
    desc: 'On te répond au comptoir, pas avec un chatbot. Objectif, budget, niveau : on te dit ce qui sert vraiment — et parfois, la réponse est « rien de plus que ton assiette ».',
  },
  {
    Icon: ShieldCheck,
    title: 'Des marques qu’on assume',
    desc: 'Eric Favre, Nutrimuscle, MuscleTech, Dedicated, French Nutrition… On choisit des marques établies, avec des compositions affichées noir sur blanc sur chaque fiche.',
  },
  {
    Icon: Store,
    title: 'Une vraie boutique',
    desc: 'Pas un site sans visage : un magasin à Coignières, ouvert 7 jours sur 7, où tu peux toucher les produits, demander un avis et retirer tes commandes en Click & Collect.',
  },
  {
    Icon: Truck,
    title: 'Le web en plus, pas à la place',
    desc: 'Le site livre partout en France (offert dès 85 €), avec les mêmes produits et les mêmes prix qu’en boutique. Tu choisis : chez toi, en point relais ou au comptoir.',
  },
]

export default function AboutPage() {
  return (
    <div className="bg-canvas min-h-screen">
      {/* Hero */}
      <div className="bg-spruce text-white py-24 md:py-32">
        <div className="container max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/60 mb-5">
            Notre histoire
          </p>
          <h1 className="font-display text-[36px] md:text-[56px] font-extrabold tracking-tight mb-6 leading-[1.05]">
            La boutique de nutrition sportive de Coignières
          </h1>
          <p className="text-white/75 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            BodyStart Nutrition, c&apos;est la reprise à 100 % de la boutique BodyFit de
            Coignières (78) — même adresse, même métier, une ambition de plus : faire
            aussi bien en ligne qu&apos;au comptoir.
          </p>
        </div>
      </div>

      <div className="container py-16 md:py-20 max-w-4xl">
        {/* Qui on est — answer-first */}
        <section className="mb-16 max-w-[720px]">
          <h2 className="font-display text-[26px] md:text-[32px] font-extrabold text-spruce tracking-tight mb-5">
            Qui est BodyStart ?
          </h2>
          <p className="text-ink/90 text-[16px] leading-[1.75] mb-4">
            BodyStart Nutrition est une boutique physique de compléments alimentaires
            située au <strong className="font-semibold">8 Rue du Pont des Landes, 78310 Coignières</strong>,
            doublée d&apos;un site e-commerce qui livre partout en France. Anciennement
            BodyFit, la boutique a été reprise à 100 % et continue de servir les
            sportifs du secteur — Coignières, Maurepas, Élancourt, Plaisir et tout le
            sud Yvelines — 7 jours sur 7.
          </p>
          <p className="text-ink/90 text-[16px] leading-[1.75] mb-4">
            Notre métier, c&apos;est le conseil. Whey ou isolate, créatine, prise de
            masse ou sèche : la bonne réponse dépend de ton entraînement, de ton
            assiette et de ton budget. C&apos;est ce qu&apos;on fait au comptoir toute
            la journée, et c&apos;est ce qu&apos;on a posé à l&apos;écrit dans{' '}
            <Link href="/blog" className="font-semibold text-fresh hover:text-fresh-deep underline underline-offset-4 decoration-fresh/40">
              nos guides nutrition
            </Link>
            , signés par Adam, le gérant.
          </p>
          <p className="text-ink/90 text-[16px] leading-[1.75]">
            Un principe simple guide tout le reste : on ne promet jamais ce qu&apos;un
            produit ne peut pas tenir. Les compléments complètent — l&apos;entraînement
            et l&apos;alimentation font le reste.
          </p>
        </section>

        {/* Engagements */}
        <section className="mb-16">
          <h2 className="font-display text-[26px] md:text-[32px] font-extrabold text-spruce tracking-tight mb-8">
            Pourquoi nous faire confiance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {commitments.map(({ Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-spruce/10 p-7">
                <span className="inline-flex w-11 h-11 rounded-full bg-sage items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-spruce" />
                </span>
                <h3 className="font-display font-extrabold text-[17px] text-spruce tracking-tight mb-2">{title}</h3>
                <p className="text-[14px] text-ink-mute leading-[1.65]">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Infos pratiques (NAP strictement identique au reste du site) */}
        <section className="bg-white rounded-2xl border border-spruce/10 p-8 md:p-10 mb-16">
          <h2 className="font-display text-[22px] font-extrabold text-spruce tracking-tight mb-6">
            BodyStart Nutrition, Coignières
          </h2>
          <ul className="space-y-3.5 mb-7">
            <li className="flex items-start gap-3 text-[15px] text-ink">
              <MapPin className="w-4 h-4 text-spruce flex-shrink-0 mt-1" />
              <span>8 Rue du Pont des Landes, 78310 Coignières</span>
            </li>
            <li className="flex items-start gap-3 text-[15px] text-ink">
              <Clock className="w-4 h-4 text-spruce flex-shrink-0 mt-1" />
              <span>Ouvert 7j/7 · 11h – 19h</span>
            </li>
            <li className="flex items-start gap-3 text-[15px] text-ink">
              <Phone className="w-4 h-4 text-spruce flex-shrink-0 mt-1" />
              <a href="tel:+33761847580" className="hover:text-fresh transition-colors">07 61 84 75 80</a>
            </li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/stores"
              className="inline-flex items-center gap-2 bg-fresh text-white font-semibold text-[14px] px-6 py-3 rounded-full hover:bg-fresh-deep transition-colors"
            >
              Venir en boutique <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/conseil"
              className="inline-flex items-center gap-2 border border-spruce text-spruce font-semibold text-[14px] px-6 py-3 rounded-full hover:bg-spruce/5 transition-colors"
            >
              Demander un conseil gratuit
            </Link>
          </div>
        </section>

        {/* Maillage sortie */}
        <section className="text-center">
          <p className="text-ink-mute text-[15px] mb-5">
            Envie de voir ce qu&apos;on propose ? Commence par nos rayons les plus demandés :
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <Link href="/categories/proteines" className="bg-white border border-spruce/15 text-spruce text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-sage transition-colors">Protéines</Link>
            <Link href="/categories/creatine" className="bg-white border border-spruce/15 text-spruce text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-sage transition-colors">Créatine</Link>
            <Link href="/categories/sante" className="bg-white border border-spruce/15 text-spruce text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-sage transition-colors">Santé & bien-être</Link>
            <Link href="/products" className="bg-white border border-spruce/15 text-spruce text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-sage transition-colors">Tout le catalogue</Link>
          </div>
        </section>
      </div>
    </div>
  )
}
