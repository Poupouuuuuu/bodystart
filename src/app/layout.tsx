import type { Metadata } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import '@/styles/globals.css'
import { CartProvider } from '@/context/CartContext'
import { CustomerProvider } from '@/context/CustomerContext'
import { Toaster } from 'react-hot-toast'
import CookieBanner from '@/components/ui/CookieBanner'

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

export const metadata: Metadata = {
  title: {
    template: '%s | Body Start Nutrition',
    default: 'Body Start Nutrition — Compléments alimentaires & Sport',
  },
  description: 'Découvrez les compléments alimentaires Body Start Nutrition : protéines, vitamines, créatine, BCAA. Livraison Colissimo & Mondial Relay. Click & Collect en boutique.',
  keywords: ['compléments alimentaires', 'nutrition sportive', 'protéines whey', 'créatine', 'BCAA', 'body start', 'compléments sport'],
  authors: [{ name: 'Body Start Nutrition' }],
  creator: 'Body Start',
  openGraph: {
    siteName: 'Body Start Nutrition',
    locale: 'fr_FR',
    type: 'website',
    title: 'Body Start Nutrition — Compléments alimentaires premium',
    description: 'Formules scientifiques, ingrédients tracés, dosages précis. Livraison rapide, Click & Collect disponible.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Body Start Nutrition',
    description: 'Compléments alimentaires premium pour sportifs exigeants.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${montserrat.variable}`}>
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
