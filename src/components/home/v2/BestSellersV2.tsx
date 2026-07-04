import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/types'
import { ProductCardShop } from '@/components/product/ProductCardShop'

/**
 * "Les plus pris en boutique" — 4 best-sellers.
 * Cf. tech-specs/site-rewrite-copy-v1.md §3.3
 *      tech-specs/redesign-v2-direction-artistique.md §B.Home.3
 *
 * Carte : ProductCardShop (LA carte unique du site — sprint 2 « cohérence
 * DA »). Le quick-add « + » est réel : ajout direct mono-variante, navigation
 * vers la fiche (choix de saveur) en multi-variantes. Au moins 1 produit
 * sante (decision Adam — l'ordre des produits vient de Shopify, c'est a
 * Adam de garantir le mix dans son admin).
 */
interface BestSellersV2Props {
  products: ShopifyProduct[]
}

export default function BestSellersV2({ products }: BestSellersV2Props) {
  const items = products.slice(0, 4)
  if (items.length === 0) return null

  return (
    <section className="bg-canvas">
      <div className="container py-14 md:py-18">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-9">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
              Les plus pris en boutique
            </p>
            <h2 className="font-display text-[32px] md:text-[42px] font-extrabold text-spruce leading-[1.05] tracking-tight">
              Ce qui part vite chez nous
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-spruce font-semibold text-[14px] hover:text-fresh-deep transition-colors group"
          >
            Voir tout le catalogue
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {items.map((product) => (
            <ProductCardShop key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
