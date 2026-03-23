import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { Suspense } from 'react'
import { getProductByHandle } from '@/lib/shopify'
import ClickAndCollect from '@/components/product/ClickAndCollect'
import Badge from '@/components/ui/Badge'
import ProductActions from '@/components/product/ProductActions'
import ProductReviews from '@/components/product/ProductReviews'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: { handle: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const product = await getProductByHandle(params.handle)
    if (!product) return { title: 'Produit introuvable' }
    return {
      title: product.title,
      description: product.description?.slice(0, 160) ?? '',
    }
  } catch {
    return { title: 'Produit' }
  }
}

export default async function ProductPage({ params }: Props) {
  let product = null
  try {
    product = await getProductByHandle(params.handle)
  } catch {
    // API non configurée
  }

  if (!product) notFound()

  const mainVariant = product.variants.nodes[0]
  const hasDiscount =
    mainVariant?.compareAtPrice &&
    parseFloat(mainVariant.compareAtPrice.amount) > parseFloat(mainVariant.price.amount)
  const discountPct = hasDiscount
    ? Math.round(
        ((parseFloat(mainVariant!.compareAtPrice!.amount) - parseFloat(mainVariant!.price.amount)) /
          parseFloat(mainVariant!.compareAtPrice!.amount)) *
          100
      )
    : null

  return (
    <div className="container py-8 md:py-12">
      {/* Breadcrumb */}
      <Link href="/products" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-700 hover:text-gray-900 mb-10 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour au catalogue
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Galerie */}
        <div className="space-y-4">
          {/* Image principale */}
          <div className="relative aspect-square bg-gray-50 rounded-sm overflow-hidden border-2 border-gray-900 shadow-[8px_8px_0_theme(colors.gray.900)]">
            {product.featuredImage ? (
              <Image
                src={product.featuredImage.url}
                alt={product.featuredImage.altText ?? product.title}
                fill
                className="object-contain p-4"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-brand-300 text-6xl font-bold">BS</span>
              </div>
            )}
            {discountPct && (
              <div className="absolute top-4 left-4">
                <Badge variant="red" size="md">-{discountPct}%</Badge>
              </div>
            )}
          </div>

          {/* Vignettes */}
          {(product.images?.nodes.length ?? 0) > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 mt-6">
              {product.images!.nodes.slice(0, 5).map((img, i) => (
                <div key={i} className="relative w-24 h-24 flex-shrink-0 bg-gray-50 rounded-sm overflow-hidden border-2 border-gray-200 hover:border-gray-900 hover:shadow-[4px_4px_0_theme(colors.gray.900)] cursor-pointer transition-all">
                  <Image
                    src={img.url}
                    alt={img.altText ?? `${product.title} - image ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Infos produit */}
        <div className="lg:pl-8">
          {/* Labels */}
          <div className="flex items-center gap-3 mb-6">
            {product.productType && (
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-700 bg-brand-50 border-2 border-brand-200 px-3 py-1 rounded-sm">
                {product.productType}
              </span>
            )}
            {product.vendor && (
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                • {product.vendor}
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl md:text-5xl lg:text-[3.5rem] font-black uppercase tracking-tight text-gray-900 mb-6 leading-none">
            {product.title}
          </h1>

          {/* Sélecteur de variante + prix + bouton panier */}
          <ProductActions
            variants={product.variants.nodes}
            productTitle={product.title}
          />

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 mb-6 border-b-2 border-gray-100 pb-8">
              {product.tags.slice(0, 5).map((tag) => (
                <span key={tag} className="text-[10px] font-black uppercase tracking-widest text-gray-600 bg-gray-100 px-3 py-1.5 rounded-sm border-2 border-transparent">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Description courte */}
          {product.description && (
            <p className="text-gray-600 font-medium leading-relaxed mb-10 text-lg">
              {product.description.slice(0, 300)}
              {(product.description?.length ?? 0) > 300 ? '...' : ''}
            </p>
          )}

          {/* ⭐ Click & Collect */}
          <ClickAndCollect />

          {/* Description complète */}
          {product.descriptionHtml && (
            <div className="mt-12 pt-10 border-t-2 border-gray-200">
              <h2 className="font-display font-black text-2xl uppercase tracking-tight text-gray-900 mb-6">Informations détaillées</h2>
              <div
                className="prose prose-gray max-w-none prose-p:font-medium prose-headings:font-display prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-a:text-brand-700 font-medium text-gray-600"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Avis Judge.me */}
      <Suspense fallback={null}>
        <ProductReviews handle={params.handle} />
      </Suspense>
    </div>
  )
}
