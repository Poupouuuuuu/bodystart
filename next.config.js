/** @type {import('next').NextConfig} */
const nextConfig = {
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
