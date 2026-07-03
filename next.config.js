/** @type {import('next').NextConfig} */
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
        ],
      },
    ]
    // NB : pas de Content-Security-Policy ici — à introduire plus tard en
    // Report-Only (tiers à inventorier : GA4, cdn.shopify.com, widget Mondial
    // Relay, Google Maps embed) avant de durcir.
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
