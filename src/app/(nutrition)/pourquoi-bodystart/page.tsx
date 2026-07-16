import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  MessageCircle,
  Store,
  BadgeCheck,
  FlaskConical,
  Clock,
  Truck,
  ArrowRight,
} from 'lucide-react'
import { buildPageMetadata } from '@/lib/seo'

/**
 * /pourquoi-bodystart — page de RÉASSURANCE/DÉCISION.
 * Intention de recherche : « pourquoi acheter chez BodyStart / boutique
 * compléments fiable Coignières » (comparaison, pré-achat) — distincte de
 * /about (« qui est BodyStart » : l'histoire) : une page = une intention.
 * Gabarit GEO : réponse directe en tête, arguments factuels, FAQ + schema
 * FAQPage, date de mise à jour visible, maillage entrant/sortant.
 */

export const metadata: Metadata = buildPageMetadata({
  path: '/pourquoi-bodystart',
  title: 'Pourquoi BodyStart ? 13 ans de conseil nutrition à Coignières',
  description:
    "13 ans de conseil en nutrition sportive à Coignières (78). Marques sélectionnées, produits testés en boutique, Click & Collect gratuit, ouvert 7j/7.",
})

// Date FIGÉE (convention du projet : maintenir manuellement à chaque édition).
const LAST_UPDATED = '16 juillet 2026'

const REASONS = [
  {
    icon: Clock,
    title: '13 ans de conseil, pas 13 mois',
    desc: "La boutique conseille des sportifs à Coignières depuis 13 ans (d'abord sous le nom BodyFit, reprise à 100 % en 2026). On a vu passer les modes, les bonnes formules et les arnaques — et on te dit la différence.",
  },
  {
    icon: MessageCircle,
    title: 'Un conseil personnalisé et gratuit',
    desc: "Ton objectif, ton entraînement, ton budget : on te construit une routine qui tient, au comptoir ou via le formulaire conseil. Et parfois, le bon conseil c'est de ne PAS acheter un produit.",
  },
  {
    icon: Store,
    title: 'Une vraie boutique, ouverte 7j/7',
    desc: "8 Rue du Pont des Landes à Coignières, de 11h à 19h tous les jours. Tu touches les produits, tu poses tes questions, tu repars avec — ou tu retires ta commande en Click & Collect en quelques minutes.",
  },
  {
    icon: BadgeCheck,
    title: 'Des marques sélectionnées, pas un catalogue infini',
    desc: "On ne référence pas tout le marché : on choisit des marques dont on connaît la composition et la traçabilité (Eric Favre, Nutrimuscle, Mutant, Corgenic…). Si c'est en rayon, c'est qu'on l'assume.",
  },
  {
    icon: FlaskConical,
    title: 'Des produits testés par des pratiquants',
    desc: "On s'entraîne aussi. Les produits qu'on met en avant, on les a goûtés, dosés et utilisés — les fiches produit donnent les compositions et valeurs nutritionnelles exactes des fabricants.",
  },
  {
    icon: Truck,
    title: 'Le web en plus, pas à la place',
    desc: 'Livraison partout en France (offerte dès 85 €), point relais Mondial Relay, retrait gratuit en boutique. Le site suit le vrai stock du magasin.',
  },
] as const

const FAQ = [
  {
    q: 'Pourquoi acheter chez BodyStart plutôt que sur une grande marketplace ?',
    a: "Parce que tu n'achètes pas qu'un pot : tu repars avec le bon produit pour TON objectif, dosé correctement, choisi parmi des marques qu'on connaît vraiment. En cas de doute ou de souci, tu as un interlocuteur humain à Coignières — pas un chatbot. Et si un produit ne te convient pas, on en parle en boutique.",
  },
  {
    q: 'Les prix sont-ils plus chers qu\'en ligne ?',
    a: "On travaille avec les tarifs des fabricants et on reste alignés sur le marché. Le programme de parrainage (ton filleul a 10 € dès 60 €, tu gagnes 5 % de ses achats en cagnotte à vie) et la livraison offerte dès 85 € complètent l'équation.",
  },
  {
    q: 'Le conseil est-il vraiment gratuit ?',
    a: "Oui, sans condition d'achat. Au comptoir 7j/7 de 11h à 19h, ou via le formulaire conseil en ligne — on te répond avec une vraie recommandation personnalisée, pas un copier-coller.",
  },
  {
    q: 'Où se trouve la boutique ?',
    a: 'BodyStart Nutrition, 8 Rue du Pont des Landes, 78310 Coignières — à 2 minutes de la N10, parking gratuit. Ouvert du lundi au dimanche, de 11h à 19h.',
  },
] as const

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
}

export default function PourquoiBodystartPage() {
  return (
    <div className="bg-canvas min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ─── Hero answer-first ─── */}
      <section className="pt-12 pb-10 md:pt-16 md:pb-14 bg-white border-b border-spruce/10">
        <div className="container max-w-[860px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
            Pourquoi nous
          </p>
          <h1 className="font-display text-[34px] md:text-[52px] font-extrabold text-spruce tracking-tight leading-[1.05] mb-6">
            Pourquoi choisir BodyStart&nbsp;?
          </h1>
          {/* Réponse directe (answer-first) : le paragraphe qui suffit à lui seul */}
          <p className="text-ink text-[17px] md:text-[19px] leading-[1.65] font-medium max-w-[720px]">
            Parce qu&apos;on est une vraie boutique de compléments alimentaires à
            Coignières (78), ouverte 7j/7, qui conseille des sportifs depuis
            13&nbsp;ans — avec des marques sélectionnées, des produits testés par
            des pratiquants et un conseil personnalisé gratuit, en magasin comme
            en ligne. Tu peux commander sur le site et retirer en boutique en
            quelques minutes.
          </p>
          <p className="text-[12px] text-ink-mute font-medium mt-6">
            Mise à jour : {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* ─── Les 6 raisons ─── */}
      <section className="py-12 md:py-16">
        <div className="container max-w-[1080px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {REASONS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-spruce/10 p-7">
                <div className="w-11 h-11 rounded-full bg-sage flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-spruce" />
                </div>
                <h2 className="font-display text-[19px] font-extrabold text-spruce tracking-tight mb-2.5">
                  {title}
                </h2>
                <p className="text-[14px] text-ink-mute leading-[1.65] font-medium">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── La preuve en photos ─── */}
      <section className="pb-12 md:pb-16">
        <div className="container max-w-[1080px]">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="relative aspect-[4/3] md:aspect-[3/4] rounded-2xl overflow-hidden border border-spruce/10 col-span-2 md:col-span-1">
              <Image
                src="/boutique/rayon-nutrimuscle.webp"
                alt="Rayon des protéines Nutrimuscle et Protimuscle dans la boutique BodyStart à Coignières"
                fill
                className="object-cover"
                sizes="(min-width: 768px) 33vw, 100vw"
              />
            </div>
            <div className="relative aspect-[4/3] md:aspect-[3/4] rounded-2xl overflow-hidden border border-spruce/10">
              <Image
                src="/boutique/rayon-isozero.webp"
                alt="Pots de whey Iso Zero alignés dans la boutique BodyStart Nutrition"
                fill
                className="object-cover"
                sizes="(min-width: 768px) 33vw, 50vw"
              />
            </div>
            <div className="relative aspect-[4/3] md:aspect-[3/4] rounded-2xl overflow-hidden border border-spruce/10">
              <Image
                src="/boutique/equipe-training.webp"
                alt="À la salle après l'entraînement — chez BodyStart, on pratique aussi"
                fill
                className="object-cover"
                sizes="(min-width: 768px) 33vw, 50vw"
              />
            </div>
          </div>
          <p className="text-[13px] text-ink-mute font-medium mt-4 text-center">
            Les rayons, c&apos;est chez nous. L&apos;entraînement aussi.
          </p>
        </div>
      </section>

      {/* ─── Par où commencer (maillage produits/catégories) ─── */}
      <section className="pb-12 md:pb-16">
        <div className="container max-w-[860px]">
          <div className="bg-white rounded-2xl border border-spruce/10 p-8 md:p-10">
            <h2 className="font-display text-[24px] md:text-[28px] font-extrabold text-spruce tracking-tight mb-4">
              Par où commencer&nbsp;?
            </h2>
            <p className="text-[15px] text-ink-mute leading-[1.65] font-medium mb-6">
              Si tu débutes, deux valeurs sûres qu&apos;on conseille tous les jours au
              comptoir : une{' '}
              <Link href="/products/whey-native-protimuscle" className="font-semibold text-spruce underline underline-offset-4 hover:text-fresh-deep">
                whey native Protimuscle
              </Link>{' '}
              pour ton quota de protéines, et une{' '}
              <Link href="/products/creatine-100-monohydrate-micronisee" className="font-semibold text-spruce underline underline-offset-4 hover:text-fresh-deep">
                créatine monohydrate
              </Link>{' '}
              — le complément le plus étudié. Pour creuser :{' '}
              <Link href="/categories/proteines" className="font-semibold text-spruce underline underline-offset-4 hover:text-fresh-deep">
                le rayon protéines
              </Link>
              ,{' '}
              <Link href="/categories/creatine" className="font-semibold text-spruce underline underline-offset-4 hover:text-fresh-deep">
                le rayon créatine
              </Link>{' '}
              ou{' '}
              <Link href="/blog" className="font-semibold text-spruce underline underline-offset-4 hover:text-fresh-deep">
                nos guides nutrition
              </Link>
              .
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/conseil"
                className="inline-flex items-center justify-center gap-2 bg-fresh text-white font-semibold text-[14px] px-6 py-3.5 rounded-full transition-colors hover:bg-fresh-deep"
              >
                Demander un conseil gratuit
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/stores"
                className="inline-flex items-center justify-center gap-2 border border-spruce text-spruce font-semibold text-[14px] px-6 py-3.5 rounded-full transition-colors hover:bg-spruce/5"
              >
                Venir en boutique
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="pb-14 md:pb-20">
        <div className="container max-w-[860px]">
          <h2 className="font-display text-[26px] md:text-[32px] font-extrabold text-spruce tracking-tight mb-7">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="group bg-white rounded-2xl border border-spruce/10 px-6 py-5"
              >
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-display font-bold text-[15px] md:text-[16px] text-ink">
                  {f.q}
                  <span className="text-spruce transition-transform group-open:rotate-45 text-xl leading-none flex-shrink-0" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="text-[14px] text-ink-mute leading-[1.7] font-medium mt-3">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="text-[14px] text-ink-mute font-medium mt-8">
            Envie d&apos;en savoir plus sur l&apos;histoire de la boutique&nbsp;?{' '}
            <Link href="/about" className="font-semibold text-spruce underline underline-offset-4 hover:text-fresh-deep">
              Qui est BodyStart&nbsp;?
            </Link>{' '}
            · Ton pote veut s&apos;y mettre&nbsp;?{' '}
            <Link href="/parrainage" className="font-semibold text-spruce underline underline-offset-4 hover:text-fresh-deep">
              Le parrainage
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
