import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import PackCardV2 from '@/components/pack/v2/PackCardV2'
import type { ShopifyProduct } from '@/lib/shopify/types'

/**
 * Packs de l'accueil hors saison décorée (refonte du 28/11/2026) : collection
 * `packs`, mêmes cartes que /packs (PackCardV2). En saison, les packs passent
 * par la sélection de saison (SelectionSaison) : ce bloc n'est pas rendu.
 * Piste horizontale sur téléphone (scroll-snap, sans JS), rangée de 4 sur
 * ordinateur, comme les coffrets de Noël.
 */
export default function PacksAccueil({ packs }: { packs: ShopifyProduct[] }) {
  if (packs.length === 0) return null
  return (
    <section aria-labelledby="titre-packs" className="bg-canvas">
      <div className="container py-12 md:py-20">
        <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
          <div className="max-w-[560px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">Packs</p>
            <h2
              id="titre-packs"
              className="saison-titre mt-2 font-display text-[28px] font-extrabold leading-[1.05] tracking-tight text-spruce md:text-[40px]"
            >
              Les packs <span className="saison-mot">prêts</span> à commander
            </h2>
            <p className="mt-3 text-[16px] leading-[1.6] text-ink-mute">
              Des produits qui vont ensemble, en une seule commande.
            </p>
          </div>
          <Link
            href="/packs"
            className="group inline-flex min-h-[44px] shrink-0 items-center gap-1.5 text-[14px] font-semibold text-spruce underline decoration-spruce/30 underline-offset-4 transition-colors hover:decoration-spruce"
          >
            Tous les packs
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div
          role="region"
          aria-label="Packs"
          tabIndex={0}
          className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {packs.slice(0, 4).map((p) => (
            <div key={p.id} className="flex w-[78%] flex-shrink-0 snap-start sm:w-[45%] lg:w-auto [&>a]:w-full">
              <PackCardV2 product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
