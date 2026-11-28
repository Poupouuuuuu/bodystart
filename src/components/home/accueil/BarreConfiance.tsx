import { CreditCard, RotateCcw, Store, Truck } from 'lucide-react'
import type { ReactNode } from 'react'
import { FREE_SHIPPING_LABEL, MONDIAL_RELAY, formatShippingPrice } from '@/lib/shipping'

/**
 * Barre de confiance (refonte du 28/11/2026), libellés de Gestion, sans note
 * Google. Montants tirés de lib/shipping (franco et relais). Paiement :
 * libellé court demandé par Gestion, CB, PayPal et Klarna vérifiés sur
 * l'écran de paiement Shopify le 28/11/2026 (liste complète, lue dans
 * Shopify : getMoyensPaiement, lib/shopify/paiement).
 * Chaque libellé : début en gras, suite en clair (texte continu).
 * 2 × 2 sur téléphone, une rangée de 4 sur ordinateur.
 */
const ITEMS: { icone: ReactNode; fort: string; suite: string }[] = [
  {
    icone: <Store className="h-[18px] w-[18px] text-spruce" strokeWidth={1.75} aria-hidden="true" />,
    fort: 'Retrait gratuit à Coignières',
    suite: ', immédiat si en stock',
  },
  {
    icone: <Truck className="h-[18px] w-[18px] text-spruce" strokeWidth={1.75} aria-hidden="true" />,
    fort: `Livraison offerte ${FREE_SHIPPING_LABEL}`,
    suite: ` · relais dès ${formatShippingPrice(MONDIAL_RELAY.priceCents)}`,
  },
  {
    icone: <CreditCard className="h-[18px] w-[18px] text-spruce" strokeWidth={1.75} aria-hidden="true" />,
    fort: 'Paiement CB, PayPal ou Klarna',
    suite: '',
  },
  {
    icone: <RotateCcw className="h-[18px] w-[18px] text-spruce" strokeWidth={1.75} aria-hidden="true" />,
    fort: 'Retours sous 14 jours',
    suite: '',
  },
]

export default function BarreConfiance() {
  return (
    <section aria-label="Nos engagements" className="bg-canvas">
      <div className="container pb-12 md:pb-20">
        <ul className="grid grid-cols-2 overflow-hidden rounded-[20px] bg-white shadow-card lg:grid-cols-4">
          {ITEMS.map((it, i) => (
            <li
              key={it.fort}
              className={[
                'flex min-h-[72px] items-center gap-3 border-spruce/10 px-3.5 py-3.5 md:px-5 md:py-5',
                i % 2 === 1 ? 'border-l' : '',
                i >= 2 ? 'border-t lg:border-t-0' : '',
                i === 2 ? 'lg:border-l' : '',
              ].join(' ')}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage">{it.icone}</span>
              <span className="min-w-0 text-[13px] leading-snug text-ink-mute md:text-[14px]">
                <span className="font-semibold text-ink">{it.fort}</span>
                {it.suite}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
