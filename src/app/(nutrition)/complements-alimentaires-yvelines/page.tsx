import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Store, Clock, MapPin, Phone, ShoppingBag, MessageCircle, Truck, Car, Route } from 'lucide-react'
import { buildPageMetadata } from '@/lib/seo'
import { CATEGORY_PAGES } from '@/lib/categories'
import { GOOGLE_DIRECTIONS_URL, STORE } from '@/lib/store-info'
import {
  COLISSIMO,
  FREE_SHIPPING_LABEL,
  LIVRAISON_LOCALE,
  MONDIAL_RELAY,
  PICKUP_PROMISE,
  formatShippingPrice,
} from '@/lib/shipping'
import {
  VILLES_DESSERVIES,
  formatKm,
  itineraireDepuis,
  listeFr,
  villesLivraisonLocale,
  type LivraisonLocale,
} from '@/lib/zone-locale'
import { frenchSpacing } from '@/lib/typo'

// Landing SEO locale à l'échelle du DÉPARTEMENT (intention « compléments
// alimentaires Yvelines / 78 / Saint-Quentin / près de moi »), COMPLÉMENTAIRE
// de la page Coignières (échelle ville) et de /stores (fiche pratique).
// Un bloc par commune avec des données réelles (trajet, axes, livraison
// locale vérifiée dans Shopify : lib/zone-locale), sur UNE seule page : pas de
// pages-villes satellites (anti-doorway).
export const revalidate = 3600

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart.vercel.app').replace(/\/$/, '')

export const metadata: Metadata = buildPageMetadata({
  path: '/complements-alimentaires-yvelines',
  title: 'Compléments alimentaires dans les Yvelines (78)',
  description:
    'Boutique de compléments alimentaires à Coignières, dans l’agglomération de Saint-Quentin-en-Yvelines : trajets depuis 12 villes du 78, retrait immédiat, livraison locale.',
})

const heure = (hhmm: string) => `${Number(hhmm.slice(0, 2))} h`
const HORAIRES = `du lundi au samedi, de ${heure(STORE.opens)} à ${heure(STORE.closes)}`
const PRIX_LOCALE = formatShippingPrice(LIVRAISON_LOCALE.priceCents)
const PRIX_RELAIS = formatShippingPrice(MONDIAL_RELAY.priceCents)
const PRIX_COLISSIMO = formatShippingPrice(COLISSIMO.priceCents)
const DELAI_LOCALE = LIVRAISON_LOCALE.delayLabel.toLowerCase()

const ville = (nom: string) => VILLES_DESSERVIES.find((v) => v.nom === nom)!
const trajet = (nom: string) => {
  const v = ville(nom)
  return `${formatKm(v.km)}, environ ${v.minutes} minutes`
}

const LIVRAISON: Record<LivraisonLocale, string> = {
  oui: `Livraison locale à ${PRIX_LOCALE} : ${DELAI_LOCALE}.`,
  partielle: `Livraison locale à ${PRIX_LOCALE} pour les adresses à moins de 10 km de la boutique : elle t’est proposée au paiement si ton adresse est dans la zone. Sinon, ${MONDIAL_RELAY.label} ou Colissimo.`,
  non: `Hors zone de livraison locale : point relais ${MONDIAL_RELAY.label} à ${PRIX_RELAIS} ou Colissimo à ${PRIX_COLISSIMO}, offerts ${FREE_SHIPPING_LABEL}.`,
}

// FAQ locale VISIBLE ci-dessous, reprise mot pour mot dans le schema FAQPage.
const LOCAL_FAQ = [
  {
    q: 'Où trouver une boutique de compléments alimentaires dans les Yvelines ?',
    a: `BodyStart Nutrition est une boutique physique de nutrition sportive au ${STORE.streetAddress}, ${STORE.postalCode} ${STORE.locality}, au bord de la N10. Elle est ouverte ${HORAIRES}, et on y trouve whey, créatine, vitamines et pré-workout, avec du conseil gratuit au comptoir.`,
  },
  {
    q: 'Y a-t-il un magasin de compléments alimentaires à Saint-Quentin-en-Yvelines ?',
    a: `Oui : Coignières fait partie des 12 communes de l’agglomération de Saint-Quentin-en-Yvelines, et BodyStart Nutrition y a sa boutique. Compte ${trajet('Trappes')} depuis la mairie de Trappes et ${trajet('Montigny-le-Bretonneux')} depuis celle de Montigny-le-Bretonneux, hors heures de pointe.`,
  },
  {
    q: 'Quelle boutique de nutrition sportive près de Rambouillet, Plaisir ou Chevreuse ?',
    a: `La boutique BodyStart Nutrition de Coignières est la plus simple d’accès : ${trajet('Rambouillet')} depuis Rambouillet par la N10, ${trajet('Plaisir')} depuis Plaisir et ${trajet('Chevreuse')} depuis Chevreuse par la D13, hors heures de pointe.`,
  },
  {
    q: 'Livrez-vous à domicile autour de Coignières ?',
    a: `Oui. La livraison locale coûte ${PRIX_LOCALE} et arrive ${DELAI_LOCALE}. Elle couvre ${listeFr(villesLivraisonLocale('oui'))}, ainsi qu’une partie de ${listeFr(villesLivraisonLocale('partielle'))}. Ailleurs dans le 78 : point relais ${MONDIAL_RELAY.label} à ${PRIX_RELAIS} ou Colissimo à ${PRIX_COLISSIMO}, offerts ${FREE_SHIPPING_LABEL}.`,
  },
  {
    q: 'Peut-on commander en ligne et retirer sa commande le jour même ?',
    a: `Oui, le Click & Collect est gratuit : ${PICKUP_PROMISE.long.charAt(0).toLowerCase()}${PICKUP_PROMISE.long.slice(1)}, ${HORAIRES}. ${PICKUP_PROMISE.horsHoraires} Le site affiche le stock de la boutique en temps réel.`,
  },
].map(({ q, a }) => ({ q: frenchSpacing(q), a: frenchSpacing(a) }))

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

        {/* Answer-first : où, pour qui, comment */}
        <div className="max-w-[720px] mb-12">
          <p className="text-ink/90 text-[17px] leading-[1.7] mb-4">
            BodyStart Nutrition est une{' '}
            <strong className="font-semibold">vraie boutique de compléments alimentaires</strong> au{' '}
            <strong className="font-semibold">8 Rue du Pont des Landes à Coignières</strong>, au bord de la
            N10, dans l&apos;agglomération de Saint-Quentin-en-Yvelines. On y vient en 5 à 20&nbsp;minutes
            depuis la plupart des villes de l&apos;ouest du 78.
          </p>
          <p className="text-ink/90 text-[16px] leading-[1.7]">
            Whey, créatine, vitamines, pré-workout : tu repars avec le bon produit pour ton objectif, pas le
            plus cher. Commande en ligne et retire en boutique gratuitement, ou fais-toi livrer : la{' '}
            <strong className="font-semibold">livraison locale</strong> couvre les communes à moins de 10&nbsp;km,
            et tout le 78 est livré en point relais ou à domicile.
          </p>
        </div>

        {/* 3 raisons (extractible) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {[
            { Icon: MessageCircle, title: 'Une vraie boutique dans le 78', desc: 'Du conseil humain au comptoir, pas un simple entrepôt en ligne.' },
            { Icon: ShoppingBag, title: 'Click & Collect gratuit', desc: frenchSpacing(`${PICKUP_PROMISE.court}, ${HORAIRES}.`) },
            {
              Icon: Truck,
              title: 'Livraison dans tout le 78',
              desc: frenchSpacing(`Livraison locale ${PRIX_LOCALE} à moins de 10 km. ${MONDIAL_RELAY.label} ${PRIX_RELAIS}, Colissimo ${PRIX_COLISSIMO}, offerts ${FREE_SHIPPING_LABEL}.`),
            },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-spruce/10 p-6">
              <Icon className="w-5 h-5 text-fresh mb-3" />
              <h2 className="font-display font-extrabold text-[16px] text-spruce tracking-tight mb-1.5">{title}</h2>
              <p className="text-[13.5px] text-ink-mute leading-[1.6]">{desc}</p>
            </div>
          ))}
        </div>

        {/* Un bloc par ville : trajet réel, axes, livraison vérifiée dans Shopify */}
        <section className="mb-14" aria-labelledby="villes">
          <h2 id="villes" className="font-display text-[24px] font-extrabold text-spruce tracking-tight mb-3">
            Venir de ta ville : trajet et livraison
          </h2>
          <p className="text-ink-mute text-[15px] leading-[1.65] mb-6 max-w-[680px]">
            {frenchSpacing(
              `Trajets en voiture depuis la mairie de chaque commune, hors heures de pointe. Partout, le retrait en boutique est gratuit : ${PICKUP_PROMISE.long.charAt(0).toLowerCase()}${PICKUP_PROMISE.long.slice(1)}, ${HORAIRES}.`
            )}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VILLES_DESSERVIES.map((v) => (
              <article key={v.nom} className="bg-white rounded-2xl border border-spruce/10 p-6 flex flex-col">
                <h3 className="font-display font-extrabold text-[17px] text-spruce tracking-tight mb-3">
                  Depuis {v.nom} <span className="font-sans font-normal text-[13px] text-ink-mute">({v.codePostal})</span>
                </h3>
                <ul className="space-y-1.5 mb-3 text-[14px] text-ink/90">
                  <li className="flex items-start gap-2.5">
                    <Car className="w-4 h-4 flex-shrink-0 mt-0.5 text-fresh" aria-hidden="true" />
                    <span>
                      {formatKm(v.km)}, environ {v.minutes}&nbsp;min hors heures de pointe
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Route className="w-4 h-4 flex-shrink-0 mt-0.5 text-fresh" aria-hidden="true" />
                    <span>Par {listeFr(v.axes)}</span>
                  </li>
                </ul>
                <p className="text-[14px] text-ink/90 leading-[1.65] mb-3">{frenchSpacing(v.acces)}</p>
                <p className="text-[13.5px] text-ink-mute leading-[1.6] mb-4">{frenchSpacing(LIVRAISON[v.livraisonLocale])}</p>
                <a
                  href={itineraireDepuis(v)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex min-h-[44px] items-center gap-1.5 self-start text-[14px] font-semibold text-spruce underline underline-offset-4 hover:text-fresh-deep"
                >
                  Itinéraire depuis {v.nom}
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </article>
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
            Des marques établies (Nutrimuscle, Eric Favre, Applied Nutrition, Dedicated, DY Nutrition…), et le
            site affiche le stock de la boutique en temps réel :
          </p>
          <div className="flex flex-wrap gap-2.5">
            {CATEGORY_PAGES.map((c) => (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                className="inline-flex min-h-[44px] items-center bg-white border border-spruce/15 text-spruce text-[13px] font-semibold px-4 rounded-full hover:bg-sage transition-colors"
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
                <span>Lun. au sam. · 11h à 19h</span>
              </li>
              <li className="flex items-start gap-3 text-[15px]">
                <Phone className="w-4 h-4 flex-shrink-0 mt-1 text-white/70" />
                <a href="tel:+33761847580" className="-my-2.5 inline-flex min-h-[44px] items-center hover:text-white/80 transition-colors">07 61 84 75 80</a>
              </li>
            </ul>
            <div className="flex flex-col gap-3">
              <a
                href={GOOGLE_DIRECTIONS_URL}
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
