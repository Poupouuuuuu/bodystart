import type { Metadata } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import dynamic from 'next/dynamic'
import '@/styles/globals.css'
import { CartProvider } from '@/context/CartContext'
import { CustomerProvider } from '@/context/CustomerContext'
import { Toaster } from 'react-hot-toast'

// Lazy : invisible au load (montre seulement si pas de consent en localStorage)
const CookieBanner = dynamic(() => import('@/components/ui/CookieBanner'), { ssr: false })

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart-nutrition.fr').replace(/\/$/, '')

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: '%s | Body Start Nutrition',
    default: 'Body Start Nutrition — Compléments alimentaires & Sport',
  },
  description: 'Découvrez les compléments alimentaires Body Start Nutrition : protéines, vitamines, créatine, BCAA. Livraison Colissimo & Mondial Relay. Click & Collect en boutique.',
  keywords: ['compléments alimentaires', 'nutrition sportive', 'protéines whey', 'créatine', 'BCAA', 'body start', 'compléments sport', 'click and collect', 'coignières'],
  authors: [{ name: 'Body Start Nutrition' }],
  creator: 'Body Start',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    siteName: 'Body Start Nutrition',
    locale: 'fr_FR',
    type: 'website',
    url: SITE_URL,
    title: 'Body Start Nutrition — Compléments alimentaires premium',
    description: 'Formules scientifiques, ingrédients tracés, dosages précis. Livraison rapide, Click & Collect disponible.',
    images: [
      {
        url: '/assets/logos/logo-nutrition.png',
        width: 1200,
        height: 630,
        alt: 'Body Start Nutrition',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Body Start Nutrition',
    description: 'Compléments alimentaires premium pour sportifs exigeants.',
    images: ['/assets/logos/logo-nutrition.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${montserrat.variable}`}>
      <head>
        {/* dns-prefetch suffit pour cdn.shopify.com (images produits below-the-fold) */}
        <link rel="dns-prefetch" href="https://cdn.shopify.com" />
      </head>
      <body className="min-h-screen flex flex-col">
        <CustomerProvider>
          <CartProvider>
            {children}
            <CookieBanner />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  borderRadius: '12px',
                  fontFamily: 'var(--font-inter)',
                },
                success: {
                  iconTheme: {
                    primary: '#15803d',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </CartProvider>
        </CustomerProvider>
      </body>
    </html>
  )
}
