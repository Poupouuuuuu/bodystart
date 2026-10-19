'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { BundleComponentDetail } from '@/lib/shopify/bundle'
import type { ShopifyImage } from '@/lib/shopify/types'

interface BundleGalleryV2Props {
  /**
   * Detail des composants pour la variante de bundle ACTUELLEMENT
   * selectionnee. L'image utilisee est la variant-image si presente
   * (sinon featuredImage du produit). Le composant re-render quand la
   * selection change cote BuyBoxV2.
   */
  components: BundleComponentDetail[]
  title: string
  discountPct: number | null
  /**
   * Photo du produit composé (coffrets de Noël : carrée, fond blanc). Si
   * présente, elle remplace les pots empilés en tête de galerie : le client
   * voit d'abord ce qu'il reçoit, les composants suivent dans la bande.
   */
  photo?: ShopifyImage | null
  /**
   * Image principale du pack (PNG détouré, proportions réelles). Si présente,
   * elle remplace les pots empilés en tête de galerie, sur le fond végétal
   * (même règle que les cartes de pack, cf. BundleComposite).
   */
  imagePack?: ShopifyImage | null
  /** Titre de la bande des composants (« Dans ce pack » par défaut). */
  libelleComposants?: string
  /**
   * Handles des composants sans fiche sur le site (vendus seulement en
   * caisse) : nommés sans lien, sinon le lien mène à une 404.
   */
  sansFiche?: string[]
}

/**
 * Galerie V2 specifique aux bundles (Shopify Bundles).
 * Cf. tech-specs/redesign-v2-direction-artistique.md §B.Fiche pack
 *
 * Hero, dans l'ordre (19/10/2026, Claude Gestion) :
 * - coffret : sa photo (carrée, fond blanc) ;
 * - pack : son image principale sur bg-vegetal-800.webp, comme les cartes de
 *   pack (la pile des pots donnait des proportions fausses : créatine deux
 *   fois plus grosse que la whey) ;
 * - sinon (pack sans image) : pots des composants en ligne, leger overlap,
 *   sur bg-vegetal-800.webp.
 *
 * Rendu :
 * - Sous le hero : strip horizontale avec les noms des composants
 *   (et leur quantite si > 1), chaque carte cliquable vers la fiche quand
 *   le composant en a une sur le site (pas s'il est vendu seulement en caisse).
 *
 * Choix de design (libre arbitre Adam) : grille empilee plutot que
 * carousel. Le pack vit dans son ensemble, on veut tout voir d'un coup,
 * pas swiper sequentiellement. Aucune interaction necessaire = friction
 * zero pour comprendre ce qu'on achete.
 */
export default function BundleGalleryV2({
  components,
  title,
  discountPct,
  photo = null,
  imagePack = null,
  libelleComposants = 'Dans ce pack',
  sansFiche = [],
}: BundleGalleryV2Props) {
  if (components.length === 0 && !photo && !imagePack) {
    // Securite : ce composant ne devrait etre rendu que si components > 0
    // (la fiche fait deja la detection). Mais on garde un fallback propre.
    return (
      <div
        className="aspect-square w-full bg-cover bg-bottom rounded-2xl border border-spruce/10"
        style={{ backgroundImage: "url('/bg-vegetal-800.webp')" }}
        aria-label={title}
      />
    )
  }

  // Echelle des pots selon le count : plus on a de composants, plus on
  // resserre l'overlap et reduit la hauteur, pour rester lisible.
  const overlapClass =
    components.length >= 4
      ? '-space-x-10 md:-space-x-14'
      : components.length === 3
        ? '-space-x-6 md:-space-x-10'
        : '-space-x-3 md:-space-x-6'

  const heightPct =
    components.length >= 4 ? '60%' : components.length === 3 ? '68%' : '74%'

  return (
    <div className="w-full">
      {photo ? (
        /* ─── Hero coffret : sa photo, image LCP de la fiche ─── */
        <div className="saison-toile saison-toile-droite relative w-full aspect-square overflow-hidden rounded-2xl border border-spruce/10 bg-white">
          {discountPct !== null && (
            <div className="saison-badge-citrouille saison-badge-citrouille-droite absolute top-4 left-4 z-30 bg-terracotta text-white text-[12px] font-bold px-3 py-1.5 rounded-full shadow-sm">
              −{discountPct}%
            </div>
          )}
          <Image
            src={photo.url}
            alt={photo.altText ?? title}
            fill
            priority
            fetchPriority="high"
            sizes="(max-width: 1024px) calc(100vw - 32px), 580px"
            className="object-cover"
          />
        </div>
      ) : imagePack ? (
        /* ─── Hero pack : son image sur fond végétal, image LCP de la fiche ───
            Mise en page de ProductGalleryV2 : fond en <Image priority unoptimized>
            (préchargé avec le HTML, même URL que le fond des cartes), image
            centrée à 85 % (les PNG des packs sont carrés, pots centrés). */
        <div className="saison-toile saison-toile-droite relative w-full aspect-square overflow-hidden rounded-2xl border border-spruce/10 bg-sage">
          <Image
            src="/bg-vegetal-800.webp"
            alt=""
            aria-hidden="true"
            fill
            priority
            unoptimized
            className="object-cover"
          />
          {discountPct !== null && (
            <div className="saison-badge-citrouille saison-badge-citrouille-droite absolute top-4 left-4 z-30 bg-terracotta text-white text-[12px] font-bold px-3 py-1.5 rounded-full shadow-sm">
              −{discountPct}%
            </div>
          )}
          <div className="absolute inset-0 m-auto h-[85%] w-[85%]">
            <Image
              src={imagePack.url}
              alt={imagePack.altText ?? title}
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 1024px) calc(100vw - 32px), 580px"
              className="object-contain [filter:drop-shadow(0_22px_28px_rgba(45,90,45,0.30))]"
            />
          </div>
        </div>
      ) : (
      /* ─── Hero : pots empiles sur fond vegetal ─── */
      <div
        className="saison-toile saison-toile-droite relative w-full aspect-square bg-cover bg-bottom bg-no-repeat overflow-hidden rounded-2xl border border-spruce/10"
        style={{ backgroundImage: "url('/bg-vegetal-800.webp')" }}
      >
        {/* Badge promo eventuel (coherence avec ProductGalleryV2) */}
        {discountPct !== null && (
          <div className="saison-badge-citrouille saison-badge-citrouille-droite absolute top-4 left-4 z-30 bg-terracotta text-white text-[12px] font-bold px-3 py-1.5 rounded-full shadow-sm">
            −{discountPct}%
          </div>
        )}

        <div className="absolute inset-0 flex items-end justify-center pb-8 md:pb-10">
          <div className={`flex items-end justify-center ${overlapClass}`}>
            {components.slice(0, 5).map((c, i) => {
              if (!c.image?.url) return null
              return (
                <div
                  key={`${c.productHandle}-${i}-${c.variantTitle}`}
                  className="relative transition-all duration-300"
                  style={{ height: heightPct, zIndex: 10 + i }}
                  title={c.productTitle}
                >
                  <Image
                    src={c.image.url}
                    alt={c.image.altText ?? `${c.productTitle} ${c.variantTitle}`}
                    width={420}
                    height={420}
                    priority={i === 0}
                    className="h-full w-auto object-contain drop-shadow-2xl"
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Gradient bas pour fondu avec la carte parente */}
        <div className="absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-t from-white/60 to-transparent" />
      </div>
      )}

      {/* ─── Strip composants : noms + lien vers chaque produit qui a une fiche ─── */}
      <div className="mt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
          {libelleComposants}
        </p>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {components.map((c, i) => {
            const contenu = (
              <>
                <div className="relative w-10 h-10 flex-shrink-0 bg-sage/40 rounded-lg overflow-hidden">
                  {c.image?.url && (
                    <Image
                      src={c.image.url}
                      alt={c.image.altText ?? c.productTitle}
                      fill
                      sizes="40px"
                      className="object-contain p-1"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-ink leading-tight truncate group-hover:text-spruce transition-colors">
                    {c.productTitle}
                  </p>
                  {c.quantity > 1 && (
                    <p className="text-[11px] text-ink-mute">×{c.quantity}</p>
                  )}
                </div>
              </>
            )
            const carte = 'flex items-center gap-3 bg-white border border-spruce/10 rounded-xl p-2.5'
            return (
              <li key={`${c.productHandle}-${i}`}>
                {sansFiche.includes(c.productHandle) ? (
                  <div className={carte}>{contenu}</div>
                ) : (
                  <Link
                    href={`/products/${c.productHandle}`}
                    className={`group ${carte} hover:border-spruce/30 transition-colors`}
                  >
                    {contenu}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
