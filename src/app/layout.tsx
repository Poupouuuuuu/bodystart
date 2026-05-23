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
    template: '%s | BodyStart',
    default: 'BodyStart — Compléments sport & santé à Coignières (78)',
  },
  description:
    "BodyStart, ta boutique de compléments sport et santé à Coignières. Conseil d'humain en magasin, produits propres et bien dosés, livraison dans le 78, Click & Collect en 2h.",
  keywords: [
    'compléments alimentaires Coignières',
    'whey',
    'créatine',
    'magnésium',
    'oméga 3',
    'collagène',
    'nutrition sportive Yvelines',
    'click and collect 78',
    'BodyStart',
  ],
  authors: [{ name: 'BodyStart' }],
  creator: 'BodyStart',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    siteName: 'BodyStart',
    locale: 'fr_FR',
    type: 'website',
    url: SITE_URL,
    title: 'BodyStart — Compléments sport & santé à Coignières',
    description:
      "Conseil d'humain, produits propres, livrés dans le 78. On consomme ce qu'on vend.",
    images: [
      {
        url: '/assets/logos/logo-nutrition.png',
        width: 1200,
        height: 630,
        alt: 'BodyStart',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BodyStart — Compléments sport & santé',
    description: 'Compléments sport et santé, conseillés à Coignières, livrés dans le 78.',
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
