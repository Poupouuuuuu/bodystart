import type { MetadataRoute } from 'next'
import { getProducts } from '@/lib/shopify'

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart-nutrition.fr').replace(/\/$/, '')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, priority: 1.0, changeFrequency: 'daily' },
    { url: `${BASE_URL}/products`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE_URL}/packs`, priority: 0.85, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/stores`, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/conseil`, priority: 0.8, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/about`, priority: 0.7, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/coaching`, priority: 0.6, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/faq`, priority: 0.7, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/livraison`, priority: 0.7, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/cgv`, priority: 0.4, changeFrequency: 'yearly' },
    { url: `${BASE_URL}/mentions-legales`, priority: 0.4, changeFrequency: 'yearly' },
    { url: `${BASE_URL}/confidentialite`, priority: 0.4, changeFrequency: 'yearly' },
    { url: `${BASE_URL}/cookies`, priority: 0.3, changeFrequency: 'yearly' },
  ]

  // Routes objectifs (statique — la liste évolue rarement)
  const objectifs = ['prise-de-muscle', 'perte-de-poids', 'energie', 'recuperation', 'immunite']
  const objectifRoutes: MetadataRoute.Sitemap = objectifs.map((slug) => ({
    url: `${BASE_URL}/objectifs/${slug}`,
    priority: 0.7,
    changeFrequency: 'monthly',
  }))

  // Routes produits — fetch dynamique
  let productRoutes: MetadataRoute.Sitemap = []
  try {
    const result = await getProducts({ first: 250 })
    productRoutes = result.nodes.map((p) => ({
      url: `${BASE_URL}/products/${p.handle}`,
      priority: 0.75,
      changeFrequency: 'weekly' as const,
    }))
  } catch {
    // Shopify indisponible
  }

  return [...staticRoutes, ...objectifRoutes, ...productRoutes].map((route) => ({
    ...route,
    lastModified: now,
  }))
}
