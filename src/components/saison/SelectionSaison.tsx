import Link from 'next/link'
import type { ComponentType, CSSProperties } from 'react'
import { ArrowRight } from 'lucide-react'
import PackCardV2 from '@/components/pack/v2/PackCardV2'
import { ProductCardShop } from '@/components/product/ProductCardShop'
import type { ShopifyProduct } from '@/lib/shopify/types'
import type { CouleursSelection } from './decors'

// Section « La sélection de saison » de l'accueil (déco Halloween du
// 19/10/2026, Black Week, réutilisable pour Noël ; couleurs dans decors) : une
// rangée de packs (mêmes cartes que /packs) puis une rangée de meilleures
// ventes (cartes du catalogue). Prix
// Shopify tels quels, boutons d'achat inchangés (lib/selection-saison).
// Sous lg, chaque rangée défile à l'horizontale (CSS seul) : la section reste
// courte sur téléphone.

interface SelectionSaisonProps {
  packs: ShopifyProduct[]
  produits: ShopifyProduct[]
  /** Sur-titre (« Jusqu'au 31/10 »). */
  surTitre: string
  /** Début du titre, le mot du thème suit en couleur d'accent. */
  titre: string
  motTheme: string
  intro: string
  /** Fond de la section (classe du thème). */
  fond: string
  /** Couleurs du sur-titre, du mot du thème et de son halo ; titre, texte et
   * lien pour un fond clair (decors, valeurs par défaut : fond sombre). */
  couleurs: CouleursSelection
  /** Décor posé dans la section (Noël : boules suspendues). */
  Ornement?: ComponentType
}

const RANGEE =
  '-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0'

export default function SelectionSaison({
  packs,
  produits,
  surTitre,
  titre,
  motTheme,
  intro,
  fond,
  couleurs,
  Ornement,
}: SelectionSaisonProps) {
  if (packs.length + produits.length === 0) return null
  return (
    // content-visibility : sous la ligne de flottaison, la section n'est mise
    // en page qu'à l'approche (premier affichage de l'accueil plus rapide).
    <section
      className={`relative overflow-hidden py-16 [contain-intrinsic-size:auto_1500px] [content-visibility:auto] md:py-24 ${fond}`}
      style={couleurs as CSSProperties}
      aria-labelledby="selection-saison"
    >
      {Ornement && <Ornement />}
      <div className="container relative">
        <div className="mb-10 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-[640px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--sel-sur-titre)]">{surTitre}</p>
            <h2
              id="selection-saison"
              className="saison-titre mt-3 font-display text-[34px] font-extrabold leading-[1.02] tracking-[-0.02em] text-[color:var(--sel-titre,#FAF8F3)] md:text-[48px]"
            >
              {titre}{' '}
              <span className="text-[color:var(--sel-mot)] [text-shadow:var(--sel-halo)]">
                {motTheme}
              </span>
            </h2>
            <p className="mt-4 max-w-[560px] text-[16px] leading-[1.6] text-[color:var(--sel-texte,rgba(255,255,255,0.75))] md:text-[17px]">{intro}</p>
          </div>
          <Link
            href="/packs"
            className="press group inline-flex min-h-[44px] items-center gap-2 self-start rounded-full border border-[color:var(--sel-lien-bord,rgba(255,255,255,0.25))] bg-[color:var(--sel-lien-fond,rgba(255,255,255,0.1))] px-5 text-[14px] font-semibold text-[color:var(--sel-lien,#FFFFFF)] backdrop-blur-md transition-colors duration-500 ease-out-expo hover:bg-[color:var(--sel-lien-survol,rgba(255,255,255,0.2))] md:self-auto"
          >
            Tous nos packs
            <ArrowRight
              className="h-4 w-4 transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        {packs.length > 0 && (
          <div className={RANGEE}>
            {packs.map((p) => (
              <div key={p.id} className="flex w-[84%] shrink-0 snap-start sm:w-[46%] lg:w-auto [&>*]:w-full">
                <PackCardV2 product={p} />
              </div>
            ))}
          </div>
        )}

        {produits.length > 0 && (
          <div className={`${RANGEE} ${packs.length > 0 ? 'mt-6 lg:mt-8' : ''}`}>
            {produits.map((p) => (
              <div key={p.id} className="flex w-[62%] shrink-0 snap-start sm:w-[38%] lg:w-auto [&>*]:w-full">
                <ProductCardShop product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
