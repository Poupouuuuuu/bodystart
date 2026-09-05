import type { Metadata, Viewport } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import '@/styles/globals.css'
import { CartProvider } from '@/context/CartContext'
import { CustomerProvider } from '@/context/CustomerContext'
import ToasterLazy from '@/components/ui/ToasterLazy'
import { getSiteUrl } from '@/lib/site-url'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'
import ReferralCapture from '@/components/marketing/ReferralCapture'
// CookieBanner + NewsletterPopup : lazy client-only. Next 15 interdit
// dynamic(ssr:false) dans un Server Component → isolés dans ce wrapper client.
import DeferredWidgets from '@/components/ui/DeferredWidgets'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// REDESIGN PREMIUM V2 (2026-08) — décision Adam : direction « éditorial
// chaleureux » (registre Ritual / Huel / Aesop) en remplacement de Montserrat,
// qui donnait un rendu générique « template ». Fraunces est un serif VARIABLE :
// - axe wght (variable) → toute la graisse 300-900 sans charger 6 fichiers ;
// - axe SOFT → arrondit les terminaisons (moins sec, plus chaleureux) ;
// - axe WONK → active les formes « déviantes » (le caractère artisanal) ;
// - opsz est un axe optique automatique : Next l'inclut dans la variable font.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['SOFT', 'WONK'],
})

// metadataBase doit etre une URL valide. getSiteUrl() lit NEXT_PUBLIC_SITE_URL
// (configure sur Vercel) ; fallback = domaine reel actuel pour que new URL() ne
// throw pas en dev local sans config. Aucun domaine non confirme n'est inscrit
// dans le code : le seul fallback est l'URL Vercel actuellement deployee.
const SITE_URL = getSiteUrl() || 'https://bodystart.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: '%s | BodyStart Nutrition',
    default: 'BodyStart, compléments sport et santé à Coignières (78)',
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
  // Pas de alternates.canonical ni openGraph.url ici : ces 2 champs sont
  // par-page (cf. src/lib/seo.ts). Sans definition globale, Next.js
  // n'emet pas de balise canonical heritee qui polluerait toutes les pages
  // sans override.
  openGraph: {
    siteName: 'BodyStart',
    locale: 'fr_FR',
    type: 'website',
    title: 'BodyStart, compléments sport et santé à Coignières',
    description:
      "Conseil d'humain, produits propres, livrés dans le 78. On consomme ce qu'on vend.",
    images: [
      {
        url: '/assets/logos/logo-v2-og.png',
        width: 1200,
        height: 630,
        alt: 'BodyStart',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BodyStart, compléments sport et santé',
    description: 'Compléments sport et santé, conseillés à Coignières, livrés dans le 78.',
    images: ['/assets/logos/logo-v2-og.png'],
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

// Next 14 : themeColor vit dans l'export viewport (plus dans metadata).
// Vert BodyStart (--fresh) pour la barre d'adresse mobile / PWA.
export const viewport: Viewport = {
  themeColor: '#3B7A3F',
  // Mobile first : la page occupe tout l'ecran (encoche, barre iOS) ; les
  // elements colles en bas ajoutent env(safe-area-inset-bottom).
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning : le script du <head> ajoute `js-reveal` sur
    // <html> AVANT l'hydratation (pour éviter tout flash), donc la classe rendue
    // côté serveur diffère par construction de celle du client. C'est le patron
    // officiel pour ce cas (celui de next-themes) ; la suppression est limitée à
    // CET élément — les écarts d'hydratation des enfants remontent toujours.
    <html
      lang="fr"
      className={`${inter.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* dns-prefetch suffit pour cdn.shopify.com (images produits below-the-fold) */}
        <link rel="dns-prefetch" href="https://cdn.shopify.com" />
        {/* PREMIUM V2 — arme les révélations au scroll AVANT le premier paint
            (sinon le contenu s'afficherait puis disparaîtrait : flash visible).
            Volontairement inline et synchrone, c'est ~120 octets.
            Ne s'active pas si la personne a demandé moins de mouvement, et
            jamais si JS est absent → le contenu reste visible par défaut. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              // FILET DE SÉCURITÉ (indispensable) : le masquage CSS dépend de la
              // classe js-reveal. Si React n'hydrate jamais (bundle bloqué, erreur
              // d'hydratation), les sections masquées resteraient invisibles.
              // On retire donc la classe au bout de 2,5 s si aucun <Reveal> n'a
              // signalé son montage (data-reveal-ready) → tout redevient visible.
              "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){var d=document.documentElement;d.classList.add('js-reveal');setTimeout(function(){if(!d.dataset.revealReady){d.classList.remove('js-reveal')}},2500)}}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        {/* Voile de grain (~3 %) sur toute la page — cf. .grain-overlay */}
        <div className="grain-overlay" aria-hidden="true" />
        <CustomerProvider>
          <CartProvider>
            {children}
            <ReferralCapture />
            <GoogleAnalytics />
            <DeferredWidgets />
            <ToasterLazy />
          </CartProvider>
        </CustomerProvider>
      </body>
    </html>
  )
}
