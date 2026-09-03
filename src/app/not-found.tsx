import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowRight, Search } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/cart/CartDrawer'
import { getCollections } from '@/lib/shopify'
import type { ShopifyCollection } from '@/lib/shopify/types'

// Raccourcis vers les rayons les plus demandés : une 404 doit remettre le
// visiteur sur un chemin d'achat, pas juste s'excuser.
const QUICK_LINKS = [
  { label: 'Protéines', href: '/products?cat=proteines' },
  { label: 'Vitamines & santé', href: '/products?cat=sante' },
  { label: 'Performance', href: '/products?obj=muscle' },
  { label: 'Packs', href: '/packs' },
  { label: 'FAQ', href: '/faq' },
]

/**
 * 404 — PREMIUM V2. L'ancienne version était encore dans le style V1
 * (palette brand-*, gris neutres, tout centré). Ici : composition éditoriale
 * alignée à gauche, « 404 » massif en Fraunces comme élément graphique,
 * palette V2, boutons partagés (.btn-*) et pas de « Oups ».
 *
 * Header + footer : ce fichier vit à la racine de app/ (seul endroit où Next
 * intercepte les URL inconnues), donc HORS du layout (nutrition) qui porte la
 * navigation. Sans ça la 404 s'affichait nue — un cul-de-sac sans logo ni
 * menu. Les providers (panier, client) sont dans le root layout : on peut
 * monter le même chrome ici.
 */
export default async function NotFound() {
  let collections: ShopifyCollection[] = []
  try {
    collections = await getCollections(50)
  } catch {
    // Shopify indisponible — navigation sans sous-menus
  }

  return (
    <>
      <Suspense fallback={<div className="h-[104px] bg-white border-b border-spruce/10" />}>
        <Header collections={collections} />
      </Suspense>
      <Suspense fallback={null}>
        <CartDrawer />
      </Suspense>
      <main id="main" className="flex-1 bg-canvas">
        <div className="container flex min-h-[70vh] items-center py-16 md:py-24">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            {/* Texte */}
            <div className="order-2 lg:order-1">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">
                Page introuvable
              </p>
              <h1 className="font-display text-[34px] font-extrabold leading-[1.02] tracking-tight text-spruce md:text-[48px] [text-wrap:balance]">
                Cette page n&apos;existe pas, ou plus.
              </h1>
              <p className="mt-5 max-w-[46ch] text-[17px] leading-[1.65] text-ink-mute">
                Le lien est peut-être ancien, ou le produit a changé d&apos;adresse. Tout
                le catalogue reste à portée de main.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/products" className="btn-primary press">
                  Voir la boutique
                </Link>
                <Link href="/" className="btn-secondary press">
                  Retour à l&apos;accueil
                </Link>
                <Link href="/search" className="btn-ghost press">
                  <Search className="h-4 w-4" />
                  Rechercher un produit
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-2">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sage px-3 py-1.5 text-[13px] font-semibold text-spruce transition-colors hover:bg-spruce hover:text-white"
                  >
                    {link.label}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ))}
              </div>
            </div>

            {/* « 404 » comme élément graphique : Fraunces avec WONK, vert très
                pâle sur crème. Purement décoratif → aria-hidden. */}
            <div className="order-1 select-none lg:order-2 lg:justify-self-end" aria-hidden="true">
              <span className="display-hero block font-display text-[120px] font-extrabold leading-[0.85] tracking-tight text-spruce/[0.12] md:text-[200px] lg:text-[240px]">
                404
              </span>
            </div>
          </div>
        </div>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </>
  )
}
