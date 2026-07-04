import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, BookOpen, Store } from 'lucide-react'
import { getProducts } from '@/lib/shopify'
import type { ShopifyProduct } from '@/lib/shopify/types'
import { buildPageMetadata } from '@/lib/seo'
import { CATEGORY_PAGES, getCategoryPage } from '@/lib/categories'
import { ProductCardShop } from '@/components/product/ProductCardShop'

// Pages catégories SEO : 1 URL indexable par famille de produits (les filtres
// `?cat=` de /products restent du confort client-side, non indexable).
export const revalidate = 3600

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart.vercel.app').replace(/\/$/, '')

export function generateStaticParams() {
  return CATEGORY_PAGES.map((c) => ({ slug: c.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const cat = getCategoryPage(params.slug)
  if (!cat) return {}
  return buildPageMetadata({
    path: `/categories/${cat.slug}`,
    title: cat.metaTitle,
    description: cat.metaDescription,
  })
}

async function getCategoryProducts(productType: string): Promise<ShopifyProduct[]> {
  try {
    const res = await getProducts({ query: `product_type:'${productType}'`, first: 50 })
    return res.nodes
  } catch {
    return []
  }
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const cat = getCategoryPage(params.slug)
  if (!cat) notFound()

  const products = await getCategoryProducts(cat.productType)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Produits', item: `${SITE_URL}/products` },
      { '@type': 'ListItem', position: 3, name: cat.label, item: `${SITE_URL}/categories/${cat.slug}` },
    ],
  }

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: cat.h1,
    description: cat.metaDescription,
    url: `${SITE_URL}/categories/${cat.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.slice(0, 30).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.title,
        url: `${SITE_URL}/products/${p.handle}`,
      })),
    },
  }

  return (
    <div className="bg-canvas min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />

      <div className="container py-12 md:py-16">
        {/* Fil d'ariane */}
        <nav aria-label="Fil d'ariane" className="mb-8 text-[12px] font-semibold text-ink-mute">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-spruce transition-colors">Accueil</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/products" className="hover:text-spruce transition-colors">Produits</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-spruce" aria-current="page">{cat.label}</li>
          </ol>
        </nav>

        {/* Intro answer-first */}
        <div className="max-w-[760px] mb-10">
          <h1 className="font-display text-[32px] md:text-[44px] font-extrabold text-spruce leading-[1.05] tracking-tight mb-5">
            {cat.h1}
          </h1>
          {cat.intro.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="text-ink-mute text-[16px] leading-[1.7] mb-4">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Nos choix (maillage produits phares) */}
        <div className="bg-white rounded-2xl border border-spruce/10 p-6 md:p-7 mb-12 max-w-[760px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
            Nos choix dans ce rayon
          </p>
          <ul className="space-y-2.5">
            {cat.featured.map((f) => (
              <li key={f.handle}>
                <Link
                  href={`/products/${f.handle}`}
                  className="inline-flex items-center gap-2 text-[15px] font-semibold text-spruce hover:text-fresh transition-colors"
                >
                  <ArrowRight className="w-4 h-4 flex-shrink-0" />
                  {f.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Grille produits */}
        <h2 className="font-display text-[22px] font-extrabold text-spruce tracking-tight mb-6">
          Tous nos produits {cat.label.toLowerCase()} ({products.length})
        </h2>
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
            {products.map((p) => (
              <ProductCardShop key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="text-ink-mute mb-14">
            Le rayon se remplit — passe nous voir en boutique ou{' '}
            <Link href="/products" className="font-semibold text-spruce hover:underline underline-offset-4">
              parcours tout le catalogue
            </Link>
            .
          </p>
        )}

        {/* Guides liés (maillage blog) */}
        {cat.guides.length > 0 && (
          <div className="bg-sage/60 rounded-2xl p-6 md:p-7 mb-10 max-w-[760px]">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-spruce mb-3">
              <BookOpen className="w-4 h-4" /> Nos guides pour bien choisir
            </p>
            <ul className="space-y-2.5">
              {cat.guides.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/blog/${g.slug}`}
                    className="text-[15px] font-semibold text-spruce hover:text-fresh transition-colors"
                  >
                    {g.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Catégories liées + rappel boutique */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-[12px] font-semibold uppercase tracking-widest text-ink-mute">
            À voir aussi :
          </span>
          {cat.related.map((r) => (
            <Link
              key={r.slug}
              href={`/categories/${r.slug}`}
              className="bg-white border border-spruce/15 text-spruce text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-sage transition-colors"
            >
              {r.label}
            </Link>
          ))}
        </div>
        <p className="flex items-center gap-2 text-[14px] text-ink-mute">
          <Store className="w-4 h-4 text-spruce" />
          Tout le rayon est aussi en boutique à Coignières (78), avec du conseil gratuit —{' '}
          <Link href="/stores" className="font-semibold text-spruce hover:underline underline-offset-4">
            infos et horaires
          </Link>
        </p>
      </div>
    </div>
  )
}
