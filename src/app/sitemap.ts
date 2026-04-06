import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://bodystart-nutrition.fr'
  const now = new Date()

  const staticRoutes = [
    { url: baseUrl, priority: 1.0, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/products`, priority: 0.9, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/stores`, priority: 0.8, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/about`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/coaching`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/vetements`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/faq`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/livraison`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/cgv`, priority: 0.4, changeFrequency: 'yearly' as const },
    { url: `${baseUrl}/mentions-legales`, priority: 0.4, changeFrequency: 'yearly' as const },
    { url: `${baseUrl}/confidentialite`, priority: 0.4, changeFrequency: 'yearly' as const },
    { url: `${baseUrl}/cookies`, priority: 0.3, changeFrequency: 'yearly' as const },
  ]

  const collections = ['proteines', 'vitamines', 'performance', 'creatine', 'bcaa', 'pre-workout', 'omega', 'gainers']
  const collectionRoutes = collections.map(handle => ({
    url: `${baseUrl}/collections/${handle}`,
    priority: 0.8,
    changeFrequency: 'weekly' as const,
  }))

  const objectifs = ['prise-de-muscle', 'perte-de-poids', 'energie', 'recuperation', 'immunite']
  const objectifRoutes = objectifs.map(slug => ({
    url: `${baseUrl}/objectifs/${slug}`,
    priority: 0.7,
    changeFrequency: 'monthly' as const,
  }))

  return [...staticRoutes, ...collectionRoutes, ...objectifRoutes].map(route => ({
    ...route,
    lastModified: now,
  }))
}
