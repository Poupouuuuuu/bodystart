import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ProductCardShop } from '@/components/product/ProductCardShop'
import type { ShopifyProduct } from '@/lib/shopify/types'

// Section « La sélection de saison » de l'accueil (déco Halloween du
// 19/10/2026, réutilisable pour Noël) : packs puis meilleures ventes, prix
// Shopify tels quels (lib/selection-saison). Cartes catalogue normales :
// boutons d'achat et prix inchangés.

interface SelectionSaisonProps {
  produits: ShopifyProduct[]
  /** Sur-titre (« Jusqu'au 31/10 »). */
  surTitre: string
  /** Début du titre, le mot du thème suit en couleur d'accent. */
  titre: string
  motTheme: string
  intro: string
  /** Fond de la section (classe du thème). */
  fond: string
}

export default function SelectionSaison({ produits, surTitre, titre, motTheme, intro, fond }: SelectionSaisonProps) {
  if (produits.length === 0) return null
  return (
    <section className={`relative overflow-hidden py-16 md:py-24 ${fond}`} aria-labelledby="selection-saison">
      <div className="container relative">
        <div className="mb-10 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-[640px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F6A456]">{surTitre}</p>
            <h2
              id="selection-saison"
              className="mt-3 font-display text-[34px] font-extrabold leading-[1.02] tracking-[-0.02em] text-canvas md:text-[48px]"
            >
              {titre}{' '}
              <span className="text-[color:var(--saison-accent,#E8711A)] [text-shadow:0_0_28px_rgba(232,113,26,0.35)]">
                {motTheme}
              </span>
            </h2>
            <p className="mt-4 max-w-[560px] text-[16px] leading-[1.6] text-white/75 md:text-[17px]">{intro}</p>
          </div>
          <Link
            href="/packs"
            className="press group inline-flex min-h-[44px] items-center gap-2 self-start rounded-full border border-white/25 bg-white/10 px-5 text-[14px] font-semibold text-white backdrop-blur-md transition-colors duration-500 ease-out-expo hover:bg-white/20 md:self-auto"
          >
            Tous nos packs
            <ArrowRight
              className="h-4 w-4 transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {produits.map((p) => (
            <ProductCardShop key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  )
}
