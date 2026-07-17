import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Store, Clock, MapPin, Phone, ShoppingBag, MessageCircle, Truck } from 'lucide-react'
import { buildPageMetadata } from '@/lib/seo'
import { CATEGORY_PAGES } from '@/lib/categories'

// Landing SEO locale à l'échelle du DÉPARTEMENT (intention « compléments
// alimentaires Yvelines / 78 / près de moi ») — COMPLÉMENTAIRE de la page
// Coignières (échelle ville) et de /stores (fiche pratique). Angle distinct :
// zone de chalandise, Click & Collect pour tout le 78, villes desservies avec
// accès réels. Pas de pages-villes vides (anti-doorway) : une seule page zone.
export const revalidate = 3600

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart.vercel.app').replace(/\/$/, '')

export const metadata: Metadata = buildPageMetadata({
  path: '/complements-alimentaires-yvelines',
  title: 'Compléments alimentaires dans les Yvelines (78)',
  description:
    'Une vraie boutique de compléments alimentaires dans les Yvelines : whey, créatine, vitamines. Conseil gratuit, Click & Collect et livraison dans tout le 78.',
})

// Zone de chalandise réelle autour de Coignières (RN10 + A12), regroupée par
// secteur. Mentions naturelles, pas de page dédiée par ville.
const ZONES = [
  {
    secteur: 'Autour de Coignières',
    villes: 'Maurepas, Élancourt, Les Essarts-le-Roi, Le Mesnil-Saint-Denis',
    acces: 'À 5 à 10 minutes : tu es quasiment sur place.',
  },
  {
    secteur: 'Saint-Quentin-en-Yvelines',
    villes: 'Montigny-le-Bretonneux, Trappes, Guyancourt, Voisins-le-Bretonneux, La Verrière',
    acces: '10 à 15 minutes par la RN10 ou la D912.',
  },
  {
    secteur: 'Nord du 78 (vers Plaisir)',
    villes: 'Plaisir, Les Clayes-sous-Bois, Villepreux, Bois-d’Arcy',
    acces: 'Accès direct par la RN10 puis l’A12.',
  },
  {
    secteur: 'Sud du 78 (vers Rambouillet)',
    villes: 'Le Perray-en-Yvelines, Rambouillet, Les Bréviaires',
    acces: 'Ligne droite par la RN10 vers le sud.',
  },
]

// FAQ locale VISIBLE ci-dessous — reprise mot pour mot dans le schema FAQPage.
const LOCAL_FAQ = [
  {
    q: 'Où trouver une boutique de compléments alimentaires dans les Yvelines ?',
    a: 'BodyStart Nutrition est une boutique physique spécialisée en nutrition sportive au 8 Rue du Pont des Landes, 78310 Coignières, sur la RN10. Sa position centrale dans l’ouest des Yvelines la rend facile d’accès depuis Maurepas, Élancourt, Saint-Quentin-en-Yvelines, Plaisir ou Rambouillet. Ouverte du lundi au samedi de 11h à 19h.',
  },
  {
    q: 'BodyStart livre-t-il partout dans les Yvelines ?',
    a: 'Oui. Où que tu sois dans le 78, tu peux commander sur bodystart-nutrition.fr et être livré en point relais Mondial Relay (4,90 €) ou à domicile via Colissimo (6,90 €), livraison offerte dès 85 €. Et si tu passes près de Coignières, le Click & Collect gratuit t’évite les frais.',
  },
  {
    q: 'Peut-on faire du Click & Collect depuis une autre ville du 78 ?',
    a: 'Bien sûr. Tu commandes en ligne depuis Montigny, Plaisir, Rambouillet ou ailleurs dans les Yvelines, tu choisis le retrait en boutique au paiement, et tu récupères ta commande au comptoir à Coignières — souvent prête en quelques minutes, sans montant minimum.',
  },
  {
    q: 'Vendez-vous les mêmes marques qu’en ligne ?',
    a: 'Oui, le magasin et le site partagent le même stock multi-marques (Eric Favre, Nutrimuscle, MuscleTech, Dedicated, French Nutrition et d’autres). L’avantage de la boutique, c’est le conseil gratuit : on t’aide à choisir le bon produit pour ton objectif, pas le plus cher.',
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
      name: 'Compléments alimentaires dans les Yvelines',
      item: `${SITE_URL}/complements-alimentaires-yvelines`,
    },
  ],
}

export default function YvelinesLandingPage() {
  return (
    <div className="bg-canvas min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="container py-14 md:py-20 max-w-4xl">
        <h1 className="font-display text-[32px] md:text-[46px] font-extrabold text-spruce leading-[1.07] tracking-tight mb-6 max-w-[780px]">
          Compléments alimentaires dans les Yvelines (78)
        </h1>

        {/* Answer-first — angle département/zone */}
        <div className="max-w-[720px] mb-12">
          <p className="text-ink/90 text-[17px] leading-[1.7] mb-4">
            Dans les Yvelines, la plupart des gens achètent leurs compléments en ligne,
            sans conseil. BodyStart Nutrition fait le pari inverse : une{' '}
            <strong className="font-semibold">vraie boutique physique</strong> en nutrition
            sportive, au <strong className="font-semibold">8 Rue du Pont des Landes à Coignières</strong>,
            sur la RN10 — un point central facile d&apos;accès depuis tout l&apos;ouest du 78.
          </p>
          <p className="text-ink/90 text-[16px] leading-[1.7]">
            Whey, créatine, vitamines, pré-workout : tu repars avec le bon produit pour
            ton objectif, pas le plus cher. Et si tu es à l&apos;autre bout du département,
            tout le catalogue est <strong className="font-semibold">livrable dans tout le 78</strong>{' '}
            — ou en <strong className="font-semibold">Click &amp; Collect gratuit</strong> si tu
            passes près de Coignières.
          </p>
        </div>

        {/* 3 raisons (extractible) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {[
            { Icon: MessageCircle, title: 'Une vraie boutique dans le 78', desc: 'Du conseil humain au comptoir, pas un simple entrepôt en ligne.' },
            { Icon: ShoppingBag, title: 'Click & Collect gratuit', desc: 'Commande en ligne d’où que tu sois, retire à Coignières sans frais.' },
            { Icon: Truck, title: 'Livraison dans tout le 78', desc: 'Mondial Relay 4,90 €, Colissimo 6,90 €, offert dès 85 €.' },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-spruce/10 p-6">
              <Icon className="w-5 h-5 text-fresh mb-3" />
              <h2 className="font-display font-extrabold text-[16px] text-spruce tracking-tight mb-1.5">{title}</h2>
              <p className="text-[13.5px] text-ink-mute leading-[1.6]">{desc}</p>
            </div>
          ))}
        </div>

        {/* Zone de chalandise — villes desservies avec accès réel */}
        <section className="mb-14">
          <h2 className="font-display text-[24px] font-extrabold text-spruce tracking-tight mb-3">
            On dessert tout l&apos;ouest des Yvelines
          </h2>
          <p className="text-ink-mute text-[15px] leading-[1.65] mb-6 max-w-[680px]">
            Coignières est idéalement placée sur la RN10, au carrefour de plusieurs communes
            du 78. Voici les secteurs d&apos;où l&apos;on nous rejoint le plus facilement :
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ZONES.map(({ secteur, villes, acces }) => (
              <div key={secteur} className="bg-white rounded-2xl border border-spruce/10 p-6">
                <h3 className="font-display font-extrabold text-[15px] text-spruce tracking-tight mb-1.5">{secteur}</h3>
                <p className="text-[14px] text-ink/90 leading-[1.6] mb-2">{villes}</p>
                <p className="text-[13px] text-ink-mute leading-[1.55]">{acces}</p>
              </div>
            ))}
          </div>
          <p className="text-ink-mute text-[14px] leading-[1.65] mt-5 max-w-[680px]">
            Tu es pile à Coignières ? Tout est détaillé sur la page{' '}
            <Link href="/complements-alimentaires-coignieres" className="font-semibold text-spruce hover:underline underline-offset-4">
              compléments alimentaires à Coignières
            </Link>.
          </p>
        </section>

        {/* Ce qu'on trouve en rayon (maillage catégories) */}
        <section className="mb-14">
          <h2 className="font-display text-[24px] font-extrabold text-spruce tracking-tight mb-3">
            Tous les rayons, en boutique et en ligne
          </h2>
          <p className="text-ink-mute text-[15px] leading-[1.65] mb-6 max-w-[680px]">
            Le même stock multi-marques (Eric Favre, Nutrimuscle, MuscleTech, Dedicated,
            French Nutrition…), que tu viennes au comptoir ou que tu commandes :
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
            Venir à la boutique depuis le 78
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ul className="space-y-3.5">
              <li className="flex items-start gap-3 text-[15px]">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-1 text-white/70" />
                <span>8 Rue du Pont des Landes, 78310 Coignières (RN10)</span>
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
