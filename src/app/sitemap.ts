import type { MetadataRoute } from 'next'
import { getProducts } from '@/lib/shopify'
import { CATEGORY_PAGES } from '@/lib/categories'
import { BLOG_ARTICLES } from '@/content/blog'

// Fallback : domaine reel actuel (Vercel), pas un domaine devine.
const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart.vercel.app').replace(/\/$/, '')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, priority: 1.0, changeFrequency: 'daily' },
    { url: `${BASE_URL}/products`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE_URL}/packs`, priority: 0.85, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/blog`, priority: 0.85, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/stores`, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/complements-alimentaires-coignieres`, priority: 0.8, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/conseil`, priority: 0.8, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/parrainage`, priority: 0.75, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/about`, priority: 0.7, changeFrequency: 'monthly' },
    // STANDBY 2026-05-23 : /coaching et /vetements hors sitemap (redirect 301 vers /products)
    { url: `${BASE_URL}/faq`, priority: 0.7, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/livraison`, priority: 0.7, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/cgv`, priority: 0.4, changeFrequency: 'yearly' },
    { url: `${BASE_URL}/mentions-legales`, priority: 0.4, changeFrequency: 'yearly' },
    { url: `${BASE_URL}/confidentialite`, priority: 0.4, changeFrequency: 'yearly' },
    { url: `${BASE_URL}/cookies`, priority: 0.3, changeFrequency: 'yearly' },
  ]

  // Pages catégories SEO (registre src/lib/categories.ts)
  const categoryRoutes: MetadataRoute.Sitemap = CATEGORY_PAGES.map((c) => ({
    url: `${BASE_URL}/categories/${c.slug}`,
    priority: 0.85,
    changeFrequency: 'weekly' as const,
  }))

  // Articles de blog — lastModified = dateModified réelle (signal fraîcheur)
  const blogRoutes: MetadataRoute.Sitemap = BLOG_ARTICLES.map((a) => ({
    url: `${BASE_URL}/blog/${a.slug}`,
    priority: 0.75,
    changeFrequency: 'monthly' as const,
    lastModified: new Date(`${a.dateModified}T12:00:00Z`),
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

  return [...staticRoutes, ...categoryRoutes, ...blogRoutes, ...productRoutes].map((route) => ({
    ...route,
    lastModified: route.lastModified ?? now,
  }))
}
