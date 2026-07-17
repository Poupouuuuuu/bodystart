import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Store, Clock, MapPin, Phone, ShoppingBag, MessageCircle, Truck } from 'lucide-react'
import { buildPageMetadata } from '@/lib/seo'
import { CATEGORY_PAGES } from '@/lib/categories'

// Landing SEO locale (intention transactionnelle « compléments alimentaires
// Coignières / 78 ») — complémentaire de /stores (fiche pratique boutique).
// Villes voisines mentionnées NATURELLEMENT, pas de pages-villes vides.
export const revalidate = 3600

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart.vercel.app').replace(/\/$/, '')

export const metadata: Metadata = buildPageMetadata({
  path: '/complements-alimentaires-coignieres',
  title: 'Boutique de compléments alimentaires à Coignières (78)',
  description:
    'Whey, créatine, vitamines : une vraie boutique de compléments à Coignières, ouverte du lundi au samedi. Conseil gratuit, Click & Collect, à 10 min de Maurepas et Élancourt.',
})

// FAQ locale VISIBLE ci-dessous — reprise mot pour mot dans le schema FAQPage.
const LOCAL_FAQ = [
  {
    q: 'Où acheter des compléments alimentaires près de Coignières ?',
    a: 'BodyStart Nutrition est une boutique spécialisée au 8 Rue du Pont des Landes, 78310 Coignières, dans la zone commerciale. On y trouve protéines, créatine, pré-workout, vitamines et brûleurs, avec du conseil gratuit, du lundi au samedi de 11h à 19h (fermé le dimanche).',
  },
  {
    q: 'Le Click & Collect est-il gratuit ?',
    a: 'Oui. Tu commandes sur bodystart-nutrition.fr, tu choisis le retrait en boutique au moment du paiement, et tu récupères ta commande au comptoir à Coignières, souvent prête en quelques minutes. Aucun montant minimum.',
  },
  {
    q: 'Peut-on se faire conseiller sans rien acheter ?',
    a: 'Bien sûr. Le conseil est gratuit et sans engagement : tu viens avec ton objectif (prise de masse, sèche, récupération, santé) et on te dit ce qui est utile — et ce qui ne l’est pas. C’est le cœur du métier de la boutique.',
  },
  {
    q: 'C’est bien l’ancienne boutique BodyFit de Coignières ?',
    a: 'Oui, BodyStart Nutrition est la reprise à 100 % de la boutique BodyFit : même adresse au 8 Rue du Pont des Landes, même métier, avec en plus un site e-commerce qui livre partout en France.',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: LOCAL_FAQ.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Compléments alimentaires à Coignières',
      item: `${SITE_URL}/complements-alimentaires-coignieres`,
    },
  ],
}

export default function CoignieresLandingPage() {
  return (
    <div className="bg-canvas min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="container py-14 md:py-20 max-w-4xl">
        <h1 className="font-display text-[32px] md:text-[46px] font-extrabold text-spruce leading-[1.07] tracking-tight mb-6 max-w-[760px]">
          Ta boutique de compléments alimentaires à Coignières (78)
        </h1>

        {/* Answer-first */}
        <div className="max-w-[720px] mb-12">
          <p className="text-ink/90 text-[17px] leading-[1.7] mb-4">
            Tu cherches de la whey, de la créatine ou des vitamines près de chez toi ?
            BodyStart Nutrition est une boutique physique spécialisée en nutrition
            sportive au <strong className="font-semibold">8 Rue du Pont des Landes à Coignières</strong>,
            ouverte du lundi au samedi de 11h à 19h — à moins de 10 minutes de Maurepas, Élancourt et
            Plaisir, et facilement accessible depuis Trappes ou Rambouillet par la RN10.
          </p>
          <p className="text-ink/90 text-[16px] leading-[1.7]">
            La différence avec une commande sur une marketplace ? Tu repars avec le bon
            produit, pas le plus cher : on prend le temps de comprendre ton objectif
            avant de te conseiller. Et si tu préfères commander en ligne, le{' '}
            <strong className="font-semibold">Click &amp; Collect est gratuit</strong> — ta
            commande t&apos;attend au comptoir, souvent en quelques minutes.
          </p>
          <p className="text-ink/90 text-[15px] leading-[1.7] mt-4">
            Tu viens d&apos;une autre commune du 78 ? Voir aussi{' '}
            <Link href="/complements-alimentaires-yvelines" className="font-semibold text-spruce hover:underline underline-offset-4">
              compléments alimentaires dans les Yvelines
            </Link>{' '}
            (zone desservie et livraison dans tout le département).
          </p>
        </div>

        {/* 3 raisons (extractible) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {[
            { Icon: MessageCircle, title: 'Conseil gratuit', desc: 'Objectif, budget, niveau : on te guide au comptoir, sans engagement.' },
            { Icon: ShoppingBag, title: 'Click & Collect', desc: 'Commande en ligne, retire en boutique — souvent prêt en quelques minutes.' },
            { Icon: Truck, title: 'Livraison France', desc: 'Pas dans le 78 ? Mondial Relay 4,90 €, Colissimo 6,90 €, offert dès 85 €.' },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-spruce/10 p-6">
              <Icon className="w-5 h-5 text-fresh mb-3" />
              <h2 className="font-display font-extrabold text-[16px] text-spruce tracking-tight mb-1.5">{title}</h2>
              <p className="text-[13.5px] text-ink-mute leading-[1.6]">{desc}</p>
            </div>
          ))}
        </div>

        {/* Ce qu'on trouve en rayon (maillage catégories) */}
        <section className="mb-14">
          <h2 className="font-display text-[24px] font-extrabold text-spruce tracking-tight mb-3">
            Ce que tu trouves en boutique et en ligne
          </h2>
          <p className="text-ink-mute text-[15px] leading-[1.65] mb-6 max-w-[680px]">
            Le magasin et le site partagent le même stock multi-marques (Eric Favre,
            Nutrimuscle, MuscleTech, Dedicated, French Nutrition…) :
          </p>
          <div className="flex flex-wrap gap-2.5">
            {CATEGORY_PAGES.map((c) => (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                className="bg-white border border-spruce/15 text-spruce text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-sage transition-colors"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </section>

        {/* NAP + accès */}
        <section className="bg-spruce text-white rounded-2xl p-8 md:p-10 mb-14">
          <h2 className="font-display text-[22px] font-extrabold tracking-tight mb-6">
            BodyStart Nutrition, Coignières
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ul className="space-y-3.5">
              <li className="flex items-start gap-3 text-[15px]">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-1 text-white/70" />
                <span>8 Rue du Pont des Landes, 78310 Coignières</span>
              </li>
              <li className="flex items-start gap-3 text-[15px]">
                <Clock className="w-4 h-4 flex-shrink-0 mt-1 text-white/70" />
                <span>Lun–Sam · 11h – 19h</span>
              </li>
              <li className="flex items-start gap-3 text-[15px]">
                <Phone className="w-4 h-4 flex-shrink-0 mt-1 text-white/70" />
                <a href="tel:+33761847580" className="hover:text-white/80 transition-colors">07 61 84 75 80</a>
              </li>
            </ul>
            <div className="flex flex-col gap-3">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=48.736836,1.909592"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white text-spruce font-semibold text-[14px] px-6 py-3 rounded-full hover:bg-white/90 transition-colors"
              >
                Itinéraire <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/stores"
                className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold text-[14px] px-6 py-3 rounded-full hover:bg-white/10 transition-colors"
              >
                <Store className="w-4 h-4" /> Tout sur la boutique
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ locale (= schema FAQPage) */}
        <section className="mb-10">
          <h2 className="font-display text-[24px] font-extrabold text-spruce tracking-tight mb-5">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {LOCAL_FAQ.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-xl border border-spruce/10 p-5">
                <h3 className="font-display font-bold text-[15px] text-spruce mb-2">{q}</h3>
                <p className="text-[14px] leading-[1.7] text-ink/90">{a}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="text-[14px] text-ink-mute">
          Pour aller plus loin :{' '}
          <Link href="/blog" className="font-semibold text-spruce hover:underline underline-offset-4">nos guides nutrition</Link>
          {' '}·{' '}
          <Link href="/conseil" className="font-semibold text-spruce hover:underline underline-offset-4">demander un conseil gratuit</Link>
          {' '}·{' '}
          <Link href="/livraison" className="font-semibold text-spruce hover:underline underline-offset-4">livraison &amp; retours</Link>
        </p>
      </div>
    </div>
  )
}
