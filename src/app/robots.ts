import type { MetadataRoute } from 'next'

// Fallback : domaine reel actuel (Vercel), pas un domaine devine.
const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart.vercel.app').replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account/', '/login', '/register', '/forgot-password', '/api/', '/search'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
