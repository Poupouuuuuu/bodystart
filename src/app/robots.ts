import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account/', '/login', '/register', '/forgot-password', '/api/'],
    },
    sitemap: 'https://bodystart-nutrition.fr/sitemap.xml',
  }
}
