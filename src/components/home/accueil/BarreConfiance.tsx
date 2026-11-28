import { ShieldCheck, Star, Store, Truck } from 'lucide-react'
import type { ReactNode } from 'react'
import { GOOGLE_LISTING_URL } from '@/lib/store-info'
import { formatRating, getGoogleRating } from '@/lib/shopify/google-rating'
import { FREE_SHIPPING_LABEL } from '@/lib/shipping'

/**
 * Barre de confiance (refonte du 28/11/2026), remplace le bandeau défilant :
 * - note Google : valeurs du metafield (lib/shopify/google-rating), jamais en dur ;
 * - retrait immédiat en boutique, si le produit est en stock (lib/shipping) ;
 * - livraison offerte dès 85 € (FREE_SHIPPING_LABEL, lib/shipping) ;
 * - paiement sécurisé : CB, PayPal et Klarna, vérifiés sur l'écran de
 *   paiement (lib/shopify/paiement à relier quand il sera dans main).
 * 2 × 2 sur téléphone, une rangée de 4 sur ordinateur.
 */
export default async function BarreConfiance() {
  const rating = await getGoogleRating()
  const items: { icone: ReactNode; titre: string; texte: string; href?: string }[] = [
    {
      icone: <Star className="h-[18px] w-[18px] fill-mustard text-mustard" aria-hidden="true" />,
      titre: `${formatRating(rating)}/5 sur Google`,
      texte: `${rating.count} avis clients`,
      href: GOOGLE_LISTING_URL,
    },
    {
      icone: <Store className="h-[18px] w-[18px] text-spruce" strokeWidth={1.75} aria-hidden="true" />,
      titre: 'Retrait immédiat',
      texte: 'à Coignières, si en stock',
    },
    {
      icone: <Truck className="h-[18px] w-[18px] text-spruce" strokeWidth={1.75} aria-hidden="true" />,
      titre: 'Livraison offerte',
      texte: `${FREE_SHIPPING_LABEL}, partout en France`,
    },
    {
      icone: <ShieldCheck className="h-[18px] w-[18px] text-spruce" strokeWidth={1.75} aria-hidden="true" />,
      titre: 'Paiement sécurisé',
      // Moyens vérifiés sur l'écran de paiement le 28/11/2026 (à relier à
      // getMoyensPaiement, lib/shopify/paiement, quand il sera dans main).
      texte: 'CB, PayPal, Klarna',
    },
  ]
  return (
    <section aria-label="Nos engagements" className="bg-canvas">
      <div className="container pb-12 md:pb-20">
        <ul className="grid grid-cols-2 overflow-hidden rounded-[20px] bg-white shadow-card lg:grid-cols-4">
          {items.map((it, i) => {
            const contenu = (
              <>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage">{it.icone}</span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold leading-tight text-ink md:text-[15px]">{it.titre}</span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-ink-mute md:text-[13px]">{it.texte}</span>
                </span>
              </>
            )
            const classe = 'flex h-full min-h-[72px] items-center gap-3 px-3.5 py-3.5 md:px-5 md:py-5'
            return (
              <li
                key={it.titre}
                className={[
                  'border-spruce/10',
                  i % 2 === 1 ? 'border-l' : '',
                  i >= 2 ? 'border-t lg:border-t-0' : '',
                  i === 2 ? 'lg:border-l' : '',
                ].join(' ')}
              >
                {it.href ? (
                  <a
                    href={it.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${classe} transition-colors hover:bg-sage/50`}
                  >
                    {contenu}
                  </a>
                ) : (
                  <div className={classe}>{contenu}</div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
