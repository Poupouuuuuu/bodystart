/**
 * Catalogue /products rendu côté serveur (08/10/2026) : la page passe
 * <ProductsCatalog searchParams={null}> en contenu d'attente du Suspense.
 * Ce rendu doit contenir la vraie grille par défaut (12 cartes, liens produit),
 * sinon on retombe sur une page vide avant le JS (LCP mobile 4,7 s).
 */
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, it, expect, vi } from 'vitest'
import type { ShopifyProduct } from '@/lib/shopify/types'

vi.mock('next/navigation', () => ({
  usePathname: () => '/products',
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('@/hooks/useCart', () => ({ useCart: () => ({ addItem: vi.fn(async () => true) }) }))
vi.mock('next/image', () => ({
  default: (props: { src: string; alt: string }) => createElement('img', { src: props.src, alt: props.alt }),
}))
vi.mock('next/link', () => ({
  default: ({ children, ...props }: { href: string; style?: object; children: React.ReactNode }) =>
    createElement('a', { href: props.href, style: props.style }, children),
}))

import { ProductsCatalog } from './ProductsPageClient'

const product = (i: number): ShopifyProduct => ({
  id: `gid://shopify/Product/${i}`,
  handle: `produit-${i}`,
  title: `Produit ${i}`,
  tags: [],
  vendor: 'Marque',
  productType: 'Protéines',
  availableForSale: true,
  featuredImage: { url: `https://cdn.shopify.com/p${i}.png`, altText: `Produit ${i}`, width: 800, height: 800 },
  variants: {
    nodes: [
      {
        id: `gid://shopify/ProductVariant/${i}`,
        title: 'Default Title',
        availableForSale: true,
        quantityAvailable: 10,
        price: { amount: '29.9', currencyCode: 'EUR' },
        compareAtPrice: null,
        selectedOptions: [],
      },
    ],
  },
  priceRange: {
    minVariantPrice: { amount: '29.9', currencyCode: 'EUR' },
    maxVariantPrice: { amount: '29.9', currencyCode: 'EUR' },
  },
})

describe('ProductsCatalog : rendu serveur sans paramètres d’URL', () => {
  it('la grille par défaut est dans le HTML : 12 cartes avec leur lien produit', () => {
    const products = Array.from({ length: 20 }, (_, i) => product(i + 1))
    const html = renderToString(
      createElement(ProductsCatalog, { products, collections: [], searchParams: null })
    )
    const handles = new Set([...html.matchAll(/href="\/products\/(produit-\d+)"/g)].map((m) => m[1]))
    expect(handles.size).toBe(12)
    expect(handles.has('produit-1')).toBe(true)
    expect(html).toContain('/bg-vegetal-800.webp')
  })
})
