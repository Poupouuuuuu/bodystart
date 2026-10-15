import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import PackCardV2 from '@/components/pack/v2/PackCardV2'
import { COFFRETS_CHEMIN } from '@/lib/coffrets'
import type { ShopifyProduct } from '@/lib/shopify/types'

/**
 * Bloc « Coffrets de Noël » de l'accueil, du 2/11 au 24/12 (heure de Paris).
 * La page décide de l'afficher (lib/coffrets) ; sans coffret publié, rien.
 *
 * Mobile : piste horizontale (scroll-snap, sans JS), une carte et un bout de
 * la suivante. Ordinateur : une rangée de 4.
 */
export default function CoffretsNoelV3({ coffrets }: { coffrets: ShopifyProduct[] }) {
  if (coffrets.length === 0) return null
  return (
    <section className="bg-canvas">
      <div className="container py-16 md:py-20">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-[560px]">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">
              Idées cadeaux
            </p>
            <h2 className="mb-4 font-display text-[32px] font-extrabold leading-[1.05] tracking-tight text-spruce md:text-[42px]">
              Coffrets de Noël
            </h2>
            <p className="text-[17px] leading-[1.65] text-ink-mute">
              Composés au comptoir avec des produits qu&apos;on conseille tous les jours, du plus
              gourmand au plus complet.
            </p>
          </div>
          <Link
            href={COFFRETS_CHEMIN}
            className="inline-flex min-h-[44px] flex-shrink-0 items-center gap-2 text-[14px] font-semibold text-spruce underline underline-offset-4 transition-colors hover:text-fresh-deep"
          >
            Voir les coffrets
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div
          role="region"
          aria-label="Coffrets de Noël"
          tabIndex={0}
          className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {coffrets.slice(0, 4).map((p) => (
            <div key={p.id} className="flex w-[78%] flex-shrink-0 snap-start sm:w-[45%] lg:w-auto [&>a]:w-full">
              <PackCardV2 product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
