import type { MetadataRoute } from 'next'

// Fallback : domaine reel actuel (Vercel), pas un domaine devine.
const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart.vercel.app').replace(/\/$/, '')

// Crawlers IA explicitement autorises : etre crawle est la condition d'etre
// cite par ChatGPT/Perplexity/AI Overviews/Copilot (decision business : la
// citation est un canal d'acquisition). Voir aussi /llms.txt.
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'ClaudeBot',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
]

// /account, /login, /register, /forgot-password et /search ne sont PLUS
// bloquees ici : elles portent un meta robots noindex (qui ne peut etre vu
// par Google que si la page est crawlable). /api et /staff restent bloquees
// (prive, aucun interet de crawl).
const DISALLOW = ['/api/', '/staff/']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: '/', disallow: DISALLOW })),
      { userAgent: '*', allow: '/', disallow: DISALLOW },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
