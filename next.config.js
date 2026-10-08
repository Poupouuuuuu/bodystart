/** @type {import('next').NextConfig} */

// ─── Content-Security-Policy ────────────────────────────────────────────────
// Introduite en Report-Only le 2026-07-17, BLOQUANTE en production depuis le
// 2026-10-08 (dev : reste en Report-Only, le serveur de dev de Next a besoin
// d'eval). Avant le passage, inventaire Playwright de toutes les violations
// sur les parcours clés avec consentement complet (accueil, catalogue, fiche,
// panier + choix d'un point relais, collection, boutiques, blog, recherche,
// contact, pages légales, connexion, compte, /jeu, 404) : seul le widget
// Mondial Relay manquait (ses CSS + Google Fonts). Les violations restantes
// remontent dans les journaux Vercel via /api/csp-report (lignes « [csp] »).
// Tiers audités côté navigateur (2026-07-17, revus le 2026-10-08) :
//   - Shopify Storefront API (panier client) ...... connect (env NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN)
//   - Supabase (auth loyalty côté client) ......... connect (env NEXT_PUBLIC_SUPABASE_URL)
//   - GA4 post-consentement ....................... script/img/connect (googletagmanager + google-analytics)
//   - Meta Pixel post-consentement publicité ...... script (connect.facebook.net) + img/connect (www.facebook.com)
//   - Widget Mondial Relay ........................ jQuery (ajax.googleapis.com) + Leaflet (unpkg.com)
//                                                   + plugin et CSS (widget.mondialrelay.com) + tuiles OSM
//                                                   + police Montserrat (fonts.googleapis.com / fonts.gstatic.com)
//   - Carte Google Maps (embed /stores) ........... frame (maps.google.com / www.google.com)
//   - Images .......................................cdn.shopify.com ; visuels : images/plus.unsplash.com
// Polices : next/font/google = AUTO-HÉBERGÉES → 'self' suffit (0 requête Google Fonts au runtime).
// Judge.me / Shopify Admin / Resend / Upstash = appels SERVEUR → hors périmètre CSP navigateur.
// 'unsafe-inline' (script/style) : requis par les scripts d'hydratation inline de Next + le bootstrap
// gtag. Le durcissement vers une CSP à nonce (strict-dynamic) est un chantier séparé, noté pour + tard.
function cspHostFrom(urlOrDomain) {
  if (!urlOrDomain) return ''
  try {
    return new URL(urlOrDomain.includes('://') ? urlOrDomain : `https://${urlOrDomain}`).host
  } catch {
    return ''
  }
}

// Barre d'outils Vercel (commentaires, partage) : injectée sur les previews
// uniquement, jamais en production.
const VERCEL_TOOLBAR =
  process.env.VERCEL_ENV === 'preview'
    ? {
        script: ['https://vercel.live'],
        style: ['https://vercel.live'],
        font: ['https://vercel.live', 'https://assets.vercel.com'],
        img: ['https://vercel.live', 'https://vercel.com'],
        connect: ['https://vercel.live', 'wss://ws-us3.pusher.com'],
        frame: ['https://vercel.live'],
      }
    : { script: [], style: [], font: [], img: [], connect: [], frame: [] }

function buildContentSecurityPolicy() {
  const shopHost = cspHostFrom(process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN)
  const supabaseHost = cspHostFrom(process.env.NEXT_PUBLIC_SUPABASE_URL)

  const directives = {
    'default-src': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      'https://www.googletagmanager.com',
      'https://connect.facebook.net',
      'https://ajax.googleapis.com',
      'https://unpkg.com',
      'https://widget.mondialrelay.com',
      ...VERCEL_TOOLBAR.script,
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'https://unpkg.com',
      'https://widget.mondialrelay.com',
      'https://fonts.googleapis.com',
      ...VERCEL_TOOLBAR.style,
    ],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com', ...VERCEL_TOOLBAR.font],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://cdn.shopify.com',
      'https://images.unsplash.com',
      'https://plus.unsplash.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://*.google-analytics.com',
      'https://www.facebook.com',
      'https://widget.mondialrelay.com',
      'https://unpkg.com',
      'https://*.tile.openstreetmap.org',
      'https://maps.gstatic.com',
      'https://*.googleusercontent.com',
      ...VERCEL_TOOLBAR.img,
    ],
    'connect-src': [
      "'self'",
      shopHost && `https://${shopHost}`,
      supabaseHost && `https://${supabaseHost}`,
      supabaseHost && `wss://${supabaseHost}`,
      'https://www.google-analytics.com',
      'https://*.google-analytics.com',
      'https://analytics.google.com',
      'https://www.googletagmanager.com',
      'https://www.facebook.com',
      'https://widget.mondialrelay.com',
      'https://api.mondialrelay.com',
      ...VERCEL_TOOLBAR.connect,
    ].filter(Boolean),
    'frame-src': ["'self'", 'https://maps.google.com', 'https://www.google.com', ...VERCEL_TOOLBAR.frame],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'media-src': ["'self'"],
    'upgrade-insecure-requests': [],
    // Collecte des violations (journaux Vercel, cf. src/app/api/csp-report).
    'report-uri': ['/api/csp-report'],
  }

  return Object.entries(directives)
    .map(([directive, values]) => [directive, ...values].join(' '))
    .join('; ')
}

// Bloquante en production. En dev, Report-Only : le serveur de dev de Next
// évalue son code (eval), qu'une CSP bloquante sans 'unsafe-eval' casserait.
const CSP_HEADER =
  process.env.NODE_ENV === 'production' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only'

const nextConfig = {
  // Racine du projet explicite : un package-lock.json parasite traîne dans le dossier parent.
  outputFileTracingRoot: __dirname,
  // Ne pas révéler la stack (fingerprinting) — review sécurité 2026-07-03.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Anti-clickjacking : personne ne peut framer le site (staff/login, account…).
          { key: 'X-Frame-Options', value: 'DENY' },
          // Empêche le sniffing MIME des réponses.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // N'envoie que l'origine aux domaines tiers (checkout Shopify, GA…).
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Aucune API sensible utilisée par le site.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Renforce le HSTS par défaut de Vercel avec includeSubDomains.
          // (preload volontairement absent : soumission hstspreload.org = décision à part.)
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          // CSP (cf. buildContentSecurityPolicy ci-dessus) : bloquante en prod.
          { key: CSP_HEADER, value: buildContentSecurityPolicy() },
        ],
      },
    ]
  },
  async redirects() {
    return [
      // Section + routes /objectifs supprimées : 301 permanent vers le catalogue
      // pour ne pas casser les URLs indexées (étaient au sitemap).
      { source: '/objectifs', destination: '/products', permanent: true },
      { source: '/objectifs/:path*', destination: '/products', permanent: true },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        pathname: '/s/files/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  webpack: (config, { dev }) => {
    // OneDrive interfère avec le cache persistant webpack (rename .pack.gz_ → .pack.gz)
    // → on force un cache mémoire en dev pour éviter la corruption et les 404 fantômes.
    if (dev) {
      config.cache = { type: 'memory' }
    }
    return config
  },
}

module.exports = nextConfig
