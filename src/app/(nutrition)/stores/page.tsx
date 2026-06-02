import type { Metadata } from 'next'
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Navigation,
  ShieldCheck,
  Truck,
  Store,
  ChevronDown,
} from 'lucide-react'
import { BODY_START_STORES } from '@/lib/shopify/types'
import NotifyFormV2 from '@/components/stores/NotifyFormV2'
import StoreStatusV2 from '@/components/stores/StoreStatusV2'
import { buildPageMetadata } from '@/lib/seo'

// ─── SEO ──────────────────────────────────────────────────────────
export const metadata: Metadata = {
  ...buildPageMetadata({
    path: '/stores',
    title: 'Boutique de compléments à Coignières (78)',
    description:
      'Ta boutique de protéines, créatine et compléments à Coignières (78310). Conseil gratuit, ouvert 7j/7, Click & Collect. Anciennement BodyFit.',
  }),
  // Title exact demandé (bypass du template '%s | BodyStart' du root layout).
  title: {
    absolute: 'Boutique de compléments alimentaires à Coignières (78) | BodyStart Nutrition',
  },
}

// ─── Données boutique ─────────────────────────────────────────────
const ADDRESS_LINE = '8 Rue du Pont des Landes, 78310 Coignières'
const PHONE_DISPLAY = '07 61 84 75 80'
const PHONE_TEL = '+33761847580'
const EMAIL = 'bodystartnutrition@gmail.com'
const HOURS_DISPLAY = '7j/7 · 11h00 – 19h00'
const MAPS_DIRECTIONS = 'https://www.google.com/maps/dir/?api=1&destination=48.736836,1.909592'
const MAPS_EMBED =
  'https://maps.google.com/maps?q=48.736836,1.909592&z=17&ie=UTF8&iwloc=&output=embed'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart.vercel.app'

// JSON-LD LocalBusiness (Store)
const STORE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'BodyStart Nutrition',
  description:
    'Boutique de compléments alimentaires (protéines, créatine, vitamines) à Coignières. Conseil gratuit, Click & Collect.',
  url: `${SITE_URL}/stores`,
  telephone: PHONE_TEL,
  email: EMAIL,
  priceRange: '€€',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '8 Rue du Pont des Landes',
    postalCode: '78310',
    addressLocality: 'Coignières',
    addressRegion: 'Île-de-France',
    addressCountry: 'FR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 48.736836,
    longitude: 1.909592,
  },
  hasMap: MAPS_DIRECTIONS,
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '11:00',
      closes: '19:00',
    },
  ],
}

const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 bg-fresh text-white font-semibold text-[15px] px-7 py-3.5 rounded-full transition-colors hover:bg-fresh-deep'
const BTN_OUTLINE =
  'inline-flex items-center justify-center gap-2 border border-spruce text-spruce font-semibold text-[15px] px-7 py-3.5 rounded-full transition-colors hover:bg-spruce/5'
const EYEBROW = 'text-[11px] font-semibold uppercase tracking-[0.2em] text-mustard mb-3'

export default function StoresPage() {
  const store = BODY_START_STORES[0]

  return (
    <div className="bg-canvas min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STORE_JSONLD) }}
      />

      {/* ─── 1. Hero court (sans photo) ─── */}
      <section className="pt-12 md:pt-16 pb-8">
        <div className="container">
          <div className="max-w-2xl">
            <p className={EYEBROW}>Coignières · 78</p>
            <h1 className="font-display text-[34px] sm:text-[42px] lg:text-[52px] font-extrabold text-spruce leading-[1.05] tracking-tight mb-5">
              Nos boutiques
            </h1>
            <p className="text-ink-mute text-[16px] md:text-[18px] leading-[1.6]">
              Sport &amp; santé, le bon conseil près de chez toi — ouvert 7j/7. Anciennement
              BodyFit Coignières.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 2. Les deux cards (cœur de la page) ─── */}
      <section className="pb-16 md:pb-20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
            {/* Card 1 — BodyStart Nutrition Coignières */}
            <div className="bg-white rounded-2xl border border-spruce/10 p-6 md:p-8 flex flex-col">
              <StoreStatusV2 hours={store.hours} />

              <h2 className="font-display text-[22px] md:text-[26px] font-extrabold text-spruce leading-[1.15] tracking-tight mt-4">
                BodyStart Nutrition — Coignières
              </h2>

              <ul className="mt-5 space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-spruce flex-shrink-0 mt-0.5" />
                  <span className="text-[15px] text-ink">{ADDRESS_LINE}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-spruce flex-shrink-0 mt-0.5" />
                  <span className="text-[15px] text-ink">{HOURS_DISPLAY}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-spruce flex-shrink-0 mt-0.5" />
                  <a
                    href={`tel:${PHONE_TEL}`}
                    className="text-[15px] text-ink hover:text-spruce transition-colors"
                  >
                    {PHONE_DISPLAY}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-spruce flex-shrink-0 mt-0.5" />
                  <a
                    href={`mailto:${EMAIL}`}
                    className="text-[15px] text-ink hover:text-spruce transition-colors break-words"
                  >
                    {EMAIL}
                  </a>
                </li>
              </ul>

              <div className="flex flex-wrap gap-3 mt-7">
                <a href={MAPS_DIRECTIONS} target="_blank" rel="noopener noreferrer" className={BTN_PRIMARY}>
                  <Navigation className="w-4 h-4" />
                  Itinéraire
                </a>
                <a href={`tel:${PHONE_TEL}`} className={BTN_OUTLINE}>
                  <Phone className="w-4 h-4" />
                  Appeler
                </a>
              </div>

              <ul className="flex flex-wrap gap-2 mt-7 pt-6 border-t border-spruce/10">
                {['Vente sur place', 'Click & Collect', 'Paiement CB'].map((s) => (
                  <li
                    key={s}
                    className="inline-flex items-center bg-sage text-spruce text-[12px] font-semibold px-3 py-1.5 rounded-full"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Card 2 — 2e boutique (bientôt) */}
            <div className="bg-white rounded-2xl border border-spruce/10 p-6 md:p-8 flex flex-col">
              <span className="inline-flex items-center self-start gap-2 bg-sage text-spruce text-[12px] font-semibold px-3 py-1 rounded-full">
                Bientôt
              </span>

              <h2 className="font-display text-[22px] md:text-[26px] font-extrabold text-spruce leading-[1.15] tracking-tight mt-4">
                Une 2ᵉ boutique arrive
              </h2>

              <p className="text-ink-mute text-[15px] leading-[1.6] mt-3">
                On s&apos;agrandit. Laisse ton email pour être prévenu de l&apos;ouverture — et
                recevoir une offre de bienvenue.
              </p>

              <div className="mt-auto pt-7">
                <NotifyFormV2 />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. Nous trouver (carte Google Maps, sans photo) ─── */}
      <section className="pb-16 md:pb-20">
        <div className="container">
          <div className="mb-7 max-w-2xl">
            <h2 className="font-display text-[28px] md:text-[36px] font-extrabold text-spruce leading-[1.1] tracking-tight">
              Nous trouver
            </h2>
          </div>

          <div className="rounded-2xl overflow-hidden border border-spruce/10 aspect-[16/9] md:aspect-[21/9] bg-sage/30">
            <iframe
              src={MAPS_EMBED}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="BodyStart Nutrition — Coignières"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-5">
            <p className="text-[14px] text-ink-mute">À 2 min de la N10 · Grand parking devant la boutique</p>
            <a href={MAPS_DIRECTIONS} target="_blank" rel="noopener noreferrer" className={BTN_PRIMARY}>
              <Navigation className="w-4 h-4" />
              Voir l&apos;itinéraire
            </a>
          </div>
        </div>
      </section>

      {/* ─── 4. Trust bar ─── */}
      <section className="pb-4">
        <div className="container">
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { icon: ShieldCheck, label: 'Paiement sécurisé' },
              { icon: Truck, label: 'Livraison offerte dès 85 €' },
              { icon: Store, label: 'Click & Collect gratuit' },
              { icon: Clock, label: 'On répond 7j/7' },
            ].map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 bg-white rounded-2xl border border-spruce/10 px-4 py-4"
              >
                <Icon className="w-5 h-5 text-spruce flex-shrink-0" />
                <span className="text-[13px] font-medium text-ink leading-snug">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── 5. FAQ locale ─── */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <p className={EYEBROW}>Questions fréquentes</p>
              <h2 className="font-display text-[28px] md:text-[36px] font-extrabold text-spruce leading-[1.1] tracking-tight">
                Bon à savoir
              </h2>
            </div>

            <div className="space-y-3">
              {[
                {
                  q: 'C’est bien l’ancienne boutique BodyFit ?',
                  a: 'Oui. Même adresse à Coignières, même passion du conseil. On a simplement changé de nom pour BodyStart Nutrition.',
                },
                {
                  q: 'Où se garer ?',
                  a: 'Un grand parking est disponible devant la boutique.',
                },
                {
                  q: 'Quels moyens de paiement acceptez-vous ?',
                  a: 'Carte bancaire (CB, Visa, Mastercard) et espèces en boutique.',
                },
                {
                  q: 'Le Click & Collect est-il vraiment gratuit ?',
                  a: 'Oui, 100 % gratuit. Tu commandes en ligne, tu récupères en boutique sans frais.',
                },
              ].map(({ q, a }) => (
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
          </div>
        </div>
      </section>
    </div>
  )
}
