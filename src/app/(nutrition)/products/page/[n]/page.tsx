import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { getCatalogue } from '@/lib/shopify/catalogue'
import { nombreDePages, numeroDePage, ordreCatalogue, pageCatalogue } from '@/lib/catalogue'
import { ProductCardShop } from '@/components/product/ProductCardShop'
import PaginationCatalogue from '@/components/product/PaginationCatalogue'
import { buildPageMetadata } from '@/lib/seo'

// Pages 2, 3… de « Tous les produits » (SEO 2, lib/catalogue) : même liste et
// même ordre que la vue par défaut de /products, 12 cartes par page, rendues
// côté serveur avec leur propre canonical. ISR comme /products. Page 1 =
// /products ; /products/page/1 et toute page au-delà de la dernière : 404.
export const revalidate = 60

type Props = { params: Promise<{ n: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = numeroDePage((await params).n)
  if (!n) return {}
  return buildPageMetadata({
    path: `/products/page/${n}`,
    title: `Tous les produits, page ${n}`,
    description: `Page ${n} du catalogue BodyStart Nutrition : protéines, créatine, vitamines, snacks et accessoires, en stock à Coignières (78) et livrés partout en France.`,
  })
}

export default async function CataloguePage({ params }: Props) {
  const n = numeroDePage((await params).n)
  if (!n) notFound()
  const { products, stockByProductId } = await getCatalogue()
  const ordre = ordreCatalogue(products)
  const items = pageCatalogue(ordre, n)
  if (!items) notFound()
  const pages = nombreDePages(ordre.length)

  return (
    <div className="bg-canvas min-h-screen">
      <section className="saison-bandeau pt-10 pb-4 md:pt-12 md:pb-6">
        <div className="container">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">Catalogue</p>
          <h1 className="font-display text-[34px] font-extrabold leading-[1.05] tracking-tight text-spruce md:text-[44px]">
            Tous les produits
          </h1>
          <p className="mt-3 text-[15px] text-ink-mute">
            Page {n} sur {pages}.{' '}
            <Link
              href="/products"
              className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-spruce underline underline-offset-4 hover:text-fresh-deep"
            >
              Filtrer par rayon ou par objectif
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </p>
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <div className="container">
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {items.map((product) => (
              <ProductCardShop key={product.id} product={product} stockAtStore={stockByProductId[product.id]} />
            ))}
          </div>
          <PaginationCatalogue page={n} pages={pages} />
        </div>
      </section>
    </div>
  )
}
