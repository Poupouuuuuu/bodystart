import Link from 'next/link'
import { MapPin, Clock, Phone, ArrowRight, Truck } from 'lucide-react'
import { BODY_START_STORES } from '@/lib/shopify/types'

/**
 * Boutique & Click & Collect.
 * Cf. tech-specs/redesign-v2-direction-artistique.md §B.Home.7
 *      tech-specs/site-rewrite-copy-v1.md §3.7
 */
const GOOGLE_MAPS_URL = 'https://www.google.com/maps/dir/?api=1&destination=48.736836,1.909592'

export default function StoreCallV2() {
  const store = BODY_START_STORES.find((s) => s.isActive) ?? BODY_START_STORES[0]

  return (
    <section className="bg-canvas">
      <div className="container py-14 md:py-18">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-14 items-center">
          {/* Texte */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
              Notre boutique
            </p>
            <h2 className="font-display text-[32px] md:text-[42px] font-extrabold text-spruce leading-[1.05] tracking-tight mb-6">
              Passe nous voir en boutique.
            </h2>
            <p className="text-ink-mute text-[17px] leading-[1.65] mb-8 max-w-[520px]">
              Commande en ligne, récupère à Coignières — souvent prêt en quelques minutes,
              on te prévient dès que c&apos;est bon. Et tant que t&apos;es là, on prend 5
              minutes pour t&apos;aider à choisir. C&apos;est gratuit, et c&apos;est tout
              l&apos;intérêt d&apos;avoir une vraie boutique.
            </p>

            <div className="inline-flex items-center gap-2 bg-sage text-spruce text-[13px] font-semibold px-4 py-2 rounded-full mb-8">
              <Truck className="w-3.5 h-3.5" />
              Livraison offerte dès 85 €
            </div>
          </div>

          {/* Carte boutique */}
          <div className="bg-white rounded-2xl border border-spruce/10 p-7 md:p-9">
            <p className="font-display font-extrabold text-[20px] text-spruce mb-1">
              {store?.name ?? 'BodyStart Coignières'}
            </p>
            <p className="text-[13px] text-ink-mute uppercase tracking-wider font-semibold mb-6">
              Coignières · Yvelines
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-[15px] text-ink">
                <MapPin className="w-4 h-4 text-spruce flex-shrink-0 mt-1" />
                <span>{store?.address ?? '8 Rue du Pont des Landes, 78310 Coignières'}</span>
              </li>
              <li className="flex items-start gap-3 text-[15px] text-ink">
                <Clock className="w-4 h-4 text-spruce flex-shrink-0 mt-1" />
                <span>Du lundi au samedi · 11h – 19h</span>
              </li>
              <li className="flex items-start gap-3 text-[15px] text-ink">
                <Phone className="w-4 h-4 text-spruce flex-shrink-0 mt-1" />
                <a href="tel:+33761847580" className="hover:text-fresh transition-colors">
                  07 61 84 75 80
                </a>
              </li>
            </ul>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-fresh text-white font-semibold text-[14px] px-5 py-3 rounded-full transition-colors hover:bg-fresh-deep flex-1"
              >
                Itinéraire
                <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/stores"
                className="inline-flex items-center justify-center gap-2 bg-transparent border border-spruce text-spruce font-semibold text-[14px] px-5 py-3 rounded-full transition-colors hover:bg-spruce/5 flex-1"
              >
                En savoir plus
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
