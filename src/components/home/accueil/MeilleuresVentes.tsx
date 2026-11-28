import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/types'
import { ProductCardShop } from '@/components/product/ProductCardShop'

/**
 * Meilleures ventes, juste sous l'offre (refonte du 28/11/2026) : la carte
 * catalogue (ProductCardShop, prix et ajout rapide) en piste horizontale sur
 * téléphone et tablette (scroll-snap natif, sans JS), une rangée de 5 sur
 * ordinateur. Ordre et choix : metafield bodystart.accueil_vedettes
 * (lib/vedettes, la liste fait foi). Rendu avec la page, sans <Suspense>.
 *
 * `id="meilleures-ventes"` : cible du bouton de l'offre permanente.
 */
export default function MeilleuresVentes({ products }: { products: ShopifyProduct[] }) {
  if (products.length === 0) return null
  return (
    <section id="meilleures-ventes" aria-labelledby="titre-meilleures-ventes" className="scroll-mt-28 bg-canvas">
      <div className="container pb-8 pt-6 md:pb-14 md:pt-14">
        <div className="mb-5 flex items-end justify-between gap-4 md:mb-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">Les plus pris en boutique</p>
            <h2
              id="titre-meilleures-ventes"
              className="saison-titre mt-2 font-display text-[28px] font-extrabold leading-[1.05] tracking-tight text-spruce md:text-[40px]"
            >
              Ce qui part <span className="saison-mot">vite</span>
            </h2>
          </div>
          <Link
            href="/products"
            className="group inline-flex min-h-[44px] shrink-0 items-center gap-1.5 text-[14px] font-semibold text-spruce underline decoration-spruce/30 underline-offset-4 transition-colors hover:decoration-spruce"
          >
            Tout voir
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div
          role="region"
          aria-label="Meilleures ventes"
          tabIndex={0}
          className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-4 pt-1 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:gap-4 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-5 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {products.map((p) => (
            <div key={p.id} className="flex w-[46%] flex-shrink-0 snap-start flex-col sm:w-[31%] md:w-[23%] lg:w-auto [&>div]:flex-1">
              <ProductCardShop product={p} />
            </div>
          ))}
          {/* Fin de piste (téléphone, tablette) : tout le catalogue. */}
          <Link
            href="/products"
            className="flex w-[40%] flex-shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-[20px] bg-sage px-4 text-center font-display text-[17px] font-bold leading-tight text-spruce sm:w-[28%] md:w-[21%] lg:hidden"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-spruce shadow-soft">
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </span>
            Tout le catalogue
          </Link>
        </div>
      </div>
    </section>
  )
}
