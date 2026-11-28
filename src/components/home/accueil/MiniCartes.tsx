import Link from 'next/link'
import Image from '@/components/ui/Image'
import type { ShopifyProduct } from '@/lib/shopify/types'
import type { PastillesAccueil } from '@/lib/pastilles-accueil'
import { cardPriceOf } from '@/lib/product-price'
import { altImage, altProduit } from '@/lib/alt-produit'
import { cn, formatPrice } from '@/lib/utils'
import PastilleDatee from './PastilleDatee'

/**
 * Deux meilleures ventes en petit, dans le premier écran du téléphone et de
 * la tablette (sous lg), sous le bouton de l'offre : critère de Gestion, au
 * moins 2 produits avec leur prix dès le premier écran à 390 px. Lien vers
 * la fiche (choix du parfum et ajout au panier). Mêmes prix que la carte
 * catalogue (cardPriceOf). Sur ordinateur, ces 2 produits sont en cartes
 * catalogue à droite de l'offre (HautAccueil) : ce bloc y est masqué, ses
 * images en chargement différé n'y sont pas téléchargées.
 */
export default function MiniCartes({ produits, pastilles }: { produits: ShopifyProduct[]; pastilles: PastillesAccueil }) {
  if (produits.length < 2) return null
  return (
    <ul className="mt-6 grid grid-cols-2 gap-3 lg:hidden" aria-label="Les plus pris en ce moment">
      {produits.slice(0, 2).map((p) => {
        const prix = cardPriceOf(p)
        const image = p.featuredImage
        const pastille = pastilles[p.id]
        return (
          <li key={p.id}>
            <Link
              href={`/products/${p.handle}`}
              className="press group flex h-full flex-col rounded-[18px] bg-white p-2 shadow-card"
            >
              <span
                className="relative block h-[92px] overflow-hidden rounded-[13px] bg-sage bg-cover bg-bottom sm:h-[120px]"
                style={{ backgroundImage: "url('/bg-vegetal-800.webp')" }}
              >
                {image && (
                  <span className="absolute inset-x-[18%] bottom-[6%] top-[10%]">
                    <Image
                      src={image.url}
                      alt={altImage(image, altProduit(p))}
                      fill
                      sizes="120px"
                      className={cn(
                        'object-contain object-bottom [filter:drop-shadow(0_8px_10px_rgba(45,90,45,0.3))]',
                        p.availableForSale === false && 'opacity-60 saturate-[0.55]'
                      )}
                    />
                  </span>
                )}
                {pastille && (
                  <PastilleDatee
                    texte={pastille.texte}
                    fin={pastille.fin}
                    className="absolute left-1.5 top-1.5 badge-saison rounded-md bg-mustard px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-mustard-ink"
                  />
                )}
              </span>
              <span className="mt-2 line-clamp-2 px-1 font-display text-[13px] font-bold leading-[1.2] text-spruce">{p.title}</span>
              {prix && (
                <span className="flex items-baseline gap-1 px-1 pb-0.5 pt-0.5 font-display text-[17px] font-extrabold tabular-nums text-spruce">
                  {prix.from && <span className="font-sans text-[12px] font-medium text-ink-mute">dès</span>}
                  {formatPrice(prix.price)}
                  {prix.compareAt && (
                    <span className="font-sans text-[12px] font-medium text-ink-mute line-through">{formatPrice(prix.compareAt)}</span>
                  )}
                </span>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
