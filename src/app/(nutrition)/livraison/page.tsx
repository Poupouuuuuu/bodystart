import type { Metadata } from 'next'
import { Truck, Store, Package } from 'lucide-react'
import { buildPageMetadata } from '@/lib/seo'
import {
  CLICK_AND_COLLECT,
  COLISSIMO,
  MONDIAL_RELAY,
  FREE_SHIPPING_THRESHOLD_CENTS,
  formatShippingPrice,
} from '@/lib/shipping'

const FRANCO = `${FREE_SHIPPING_THRESHOLD_CENTS / 100}€`
const MR_PRICE = formatShippingPrice(MONDIAL_RELAY.priceCents)
const COLIS_PRICE = formatShippingPrice(COLISSIMO.priceCents)

export const metadata: Metadata = buildPageMetadata({
  path: '/livraison',
  title: 'Livraison & Retours',
  description: `Click & Collect gratuit, Mondial Relay ${MR_PRICE}, Colissimo ${COLIS_PRICE}. Livraison offerte dès ${FRANCO}.`,
})

// Tarifs et délais : source unique src/lib/shipping.ts (alignée sur les rates Shopify).
const shippingMethods = [
  {
    Icon: Store,
    name: CLICK_AND_COLLECT.label,
    delay: `${CLICK_AND_COLLECT.delayLabel} — souvent en quelques minutes`,
    price: 'Gratuit',
    details: "Retire ta commande en boutique à Coignières. On te prévient dès que c'est prêt.",
  },
  {
    Icon: Package,
    name: MONDIAL_RELAY.label,
    delay: MONDIAL_RELAY.delayLabel,
    price: `Offerte dès ${FRANCO} · sinon ${MR_PRICE}`,
    details: 'Retrait dans le point relais de ton choix. Pratique et économique.',
  },
  {
    Icon: Truck,
    name: COLISSIMO.label,
    delay: COLISSIMO.delayLabel,
    price: `Offerte dès ${FRANCO} · sinon ${COLIS_PRICE}`,
    details: 'Livraison à domicile avec suivi. Un numéro de suivi est envoyé par email.',
  },
]

const HERO_HIGHLIGHTS = [
  { Icon: Truck, label: 'Colissimo', sub: `${COLISSIMO.transitDays![0]}-${COLISSIMO.transitDays![1]} jours` },
  { Icon: Package, label: 'Mondial Relay', sub: `${MONDIAL_RELAY.transitDays![0]}-${MONDIAL_RELAY.transitDays![1]} jours` },
  { Icon: Store, label: 'Click & Collect', sub: 'Sous 2h' },
]

export default function LivraisonPage() {
  return (
    <div className="bg-canvas min-h-screen">
      {/* Hero */}
      <section className="pt-12 md:pt-16 pb-12 md:pb-16">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
              Expédition & Retours
            </p>
            <h1 className="font-display text-[32px] md:text-[40px] font-extrabold text-spruce leading-[1.1] tracking-tight mb-5">
              Livraison & Retours
            </h1>
            <p className="text-ink-mute text-[16px] md:text-[18px] leading-[1.6]">
              Livraison rapide partout en France. Retours faciles sous 14 jours.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 max-w-3xl">
            {HERO_HIGHLIGHTS.map(({ Icon, label, sub }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-spruce/10 p-5 flex items-center gap-4"
              >
                <div className="w-11 h-11 bg-sage text-spruce rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-display font-extrabold text-spruce text-[15px] tracking-tight leading-tight">
                    {label}
                  </p>
                  <p className="text-[13px] text-ink-mute mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container pb-16 md:pb-24 max-w-4xl">
        <h2 className="sr-only">Livraison & Retours détail</h2>

        {/* Modes de livraison */}
        <section className="mb-16 md:mb-20">
          <h2 className="font-display text-[28px] md:text-[36px] font-extrabold text-spruce leading-[1.1] tracking-tight mb-8">
            Modes de livraison
          </h2>
          <div className="space-y-4">
            {shippingMethods.map(({ Icon, name, delay, price, details }) => (
              <div
                key={name}
                className="bg-white rounded-2xl border border-spruce/10 p-6 md:p-8 flex flex-col md:flex-row gap-5 md:gap-7 items-start"
              >
                <div className="w-12 h-12 bg-sage text-spruce rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                    <h3 className="font-display font-extrabold text-[18px] text-spruce tracking-tight">
                      {name}
                    </h3>
                    <span className="inline-flex items-center bg-sage text-spruce text-[12px] font-semibold px-3 py-1.5 rounded-full shrink-0">
                      {price}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
                    {delay}
                  </p>
                  <p className="text-ink text-[15px] leading-relaxed">{details}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Retours */}
        <section className="mb-16 md:mb-20">
          <h2 className="font-display text-[28px] md:text-[36px] font-extrabold text-spruce leading-[1.1] tracking-tight mb-8">
            Politique de retour
          </h2>
          <div className="bg-white rounded-2xl border border-spruce/10 p-6 md:p-10 space-y-6 text-ink text-[15px] leading-relaxed">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-sage text-spruce font-semibold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                1
              </div>
              <p>
                <strong className="font-semibold text-spruce">14 jours</strong> pour changer
                d&apos;avis (droit de rétractation légal).
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-sage text-spruce font-semibold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                2
              </div>
              <p>
                Les produits doivent être{' '}
                <strong className="font-semibold text-spruce">
                  non ouverts et dans leur emballage d&apos;origine
                </strong>{' '}
                pour garantir leur intégrité.
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-sage text-spruce font-semibold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                3
              </div>
              <p>
                Pour initier un retour, contactez-nous à{' '}
                <a
                  href="mailto:bodystartnutrition@gmail.com"
                  className="text-spruce font-semibold hover:underline underline-offset-4 break-words"
                >
                  bodystartnutrition@gmail.com
                </a>{' '}
                avec votre numéro de commande.
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-sage text-spruce font-semibold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                4
              </div>
              <p>
                Le remboursement est effectué sous{' '}
                <strong className="font-semibold text-spruce">14 jours</strong> après réception
                et validation du retour dans nos locaux.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Footer */}
        <section className="bg-white rounded-2xl border border-spruce/10 p-8 md:p-10 text-center">
          <h2 className="font-display text-[22px] md:text-[26px] font-extrabold text-spruce tracking-tight mb-3">
            Une question ?
          </h2>
          <p className="text-ink-mute text-[15px] leading-[1.6]">
            Notre équipe est disponible du lundi au samedi.
          </p>
          <a
            href="mailto:bodystartnutrition@gmail.com"
            className="inline-flex items-center justify-center mt-6 bg-fresh text-white font-semibold text-[14px] px-6 py-3 rounded-full hover:bg-fresh-deep transition-colors max-w-full break-all"
          >
            bodystartnutrition@gmail.com
          </a>
        </section>
      </div>
    </div>
  )
}
