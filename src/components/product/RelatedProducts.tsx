'use client'

import ProductCard from './ProductCard'
import type { ShopifyProduct } from '@/lib/shopify/types'

interface RelatedProductsProps {
  products: ShopifyProduct[]
  currentHandle: string
}

export default function RelatedProducts({ products, currentHandle }: RelatedProductsProps) {
  const filtered = products.filter((p) => p.handle !== currentHandle).slice(0, 4)

  if (filtered.length === 0) return null

  return (
    <section className="mt-16 pt-12 border-t border-cream-300">
      <div className="text-center mb-10">
        <p className="text-brand-500 text-sm font-semibold uppercase mb-1">Recommandations</p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900">
          Complétez votre objectif
        </h2>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 md:overflow-visible scrollbar-hide">
        {filtered.map((product) => (
          <div key={product.id} className="min-w-[260px] md:min-w-0 flex-shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}
