import { CLICK_AND_COLLECT, COLISSIMO, MONDIAL_RELAY } from '@/lib/shipping'
import { formatPrice, cn } from '@/lib/utils'

const prix = (cents: number) => formatPrice({ amount: (cents / 100).toFixed(2), currencyCode: 'EUR' })

/**
 * Tarifs sous le seuil de la livraison offerte, en mode livraison (A4, 28/11/2026) :
 * « Retrait gratuit à Coignières · Point relais 4,90 € · Colissimo 6,90 € ».
 * Prix de lib/shipping (source unique). Pas la livraison locale : zone limitée, jamais offerte.
 */
export function TarifsLivraison({ className }: { className?: string }) {
  return (
    <p className={cn('flex flex-wrap gap-x-1.5 gap-y-0.5 text-[11px] leading-snug text-ink-mute', className)}>
      <span className="whitespace-nowrap font-semibold text-spruce">
        {CLICK_AND_COLLECT.priceCents === 0 ? 'Retrait gratuit' : `Retrait ${prix(CLICK_AND_COLLECT.priceCents)}`} à Coignières
      </span>
      <span aria-hidden="true">·</span>
      <span className="whitespace-nowrap">Point relais {prix(MONDIAL_RELAY.priceCents)}</span>
      <span aria-hidden="true">·</span>
      <span className="whitespace-nowrap">Colissimo {prix(COLISSIMO.priceCents)}</span>
    </p>
  )
}

/**
 * Sous « Atteint » (A3, 28/11/2026) : un code promo saisi au paiement fait
 * baisser le total ; sous le seuil après remise, la livraison redevient payante.
 */
export function MentionCodePromo({ montant, className }: { montant: number; className?: string }) {
  const seuil = formatPrice({ amount: montant.toFixed(2), currencyCode: 'EUR' }).replace(',00', '')
  return (
    <p className={cn('text-[11px] leading-snug text-ink-mute', className)}>
      Avec un code promo, il faut {seuil} après la remise.
    </p>
  )
}
