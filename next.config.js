/** @type {import('next').NextConfig} */

// ─── Content-Security-Policy (Report-Only) ──────────────────────────────────
// Introduite en Report-Only le 2026-07-17 : NE BLOQUE RIEN. Le navigateur se
// contente de REMONTER les violations (console + en-tête sur la réponse) pour
// inventorier finement les tiers réellement chargés avant tout passage en mode
// bloquant. Tiers audités côté navigateur (2026-07-17) :
//   - Shopify Storefront API (panier client) ...... connect (env NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN)
//   - Supabase (auth loyalty côté client) ......... connect (env NEXT_PUBLIC_SUPABASE_URL)
//   - GA4 post-consentement ....................... script/img/connect (googletagmanager + google-analytics)
//   - Widget Mondial Relay ........................ jQuery (ajax.googleapis.com) + Leaflet (unpkg.com)
//                                                   + plugin (widget.mondialrelay.com) + tuiles OSM
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
      'https://ajax.googleapis.com',
      'https://unpkg.com',
      'https://widget.mondialrelay.com',
    ],
    'style-src': ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
    'font-src': ["'self'", 'data:'],
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
      'https://widget.mondialrelay.com',
      'https://unpkg.com',
      'https://*.tile.openstreetmap.org',
      'https://maps.gstatic.com',
      'https://*.googleusercontent.com',
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
      'https://widget.mondialrelay.com',
      'https://api.mondialrelay.com',
    ].filter(Boolean),
    'frame-src': ["'self'", 'https://maps.google.com', 'https://www.google.com'],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'media-src': ["'self'"],
  }

  return Object.entries(directives)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ')
}

const nextConfig = {
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
          // CSP en Report-Only (cf. buildContentSecurityPolicy ci-dessus) :
          // observe les violations sans rien bloquer. Passage en enforce = étape
          // ultérieure, après une période d'observation sans faux positifs.
          { key: 'Content-Security-Policy-Report-Only', value: buildContentSecurityPolicy() },
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
