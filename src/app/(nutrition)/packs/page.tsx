import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Package } from 'lucide-react'
import { getCollectionByHandle } from '@/lib/shopify'
import PackCardV2 from '@/components/pack/v2/PackCardV2'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  path: '/packs',
  title: 'Nos packs, BodyStart Nutrition',
  description:
    'Nos meilleurs produits regroupés pour t’aider à économiser. Une routine complète, un seul prix.',
})

// 60s — laisse Adam ajuster les packs cote Shopify sans avoir a rebuild.
export const revalidate = 60

export default async function PacksPage() {
  // Strategie : on s'appuie sur la collection "packs" (handle Shopify),
  // c'est le critere le plus fiable et le plus simple a piloter cote Adam
  // (il publie un Bundle Shopify et le tague dans la collection "packs").
  // Si la collection est vide ou inexistante (premier deploiement, debug
  // Shopify, etc.) on tombe sur l'empty state V2.
  let collection: Awaited<ReturnType<typeof getCollectionByHandle>> = null
  try {
    collection = await getCollectionByHandle('packs', 24)
  } catch (err) {
    console.error('[PacksPage] fetch collection failed:', err)
  }

  const packs = collection?.products?.nodes ?? []

  return (
    <div className="bg-canvas min-h-screen">
      {/* ─── Hero court (padding-top aligné sur /products : pt-10 md:pt-12) ─── */}
      <section className="pt-10 md:pt-12">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-4">
              Bons plans
            </p>
            <h1 className="font-display text-[36px] sm:text-[44px] lg:text-[52px] font-extrabold text-spruce leading-[1.05] tracking-tight mb-5">
              Nos packs
            </h1>
            <p className="text-ink-mute text-[16px] md:text-[17px] leading-[1.6] max-w-[600px]">
              Nos meilleurs produits regroupés pour t’aider à économiser. Une routine
              complète, un seul prix.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Liste packs ─── */}
      <section className="py-10 md:py-14">
        <div className="container">
          {packs.length === 1 ? (
            /* Un seul pack publié : carte « à la une » pleine largeur plutôt
               qu'une carte carrée orpheline dans une grille de 3 colonnes. */
            <div className="max-w-5xl">
              <PackCardV2 product={packs[0]} featured />
            </div>
          ) : packs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packs.map((product) => (
                <PackCardV2 key={product.id} product={product} />
              ))}
            </div>
          ) : (
            /* Empty state V2 — sobre, DA claire, pas de gros titre vert caps */
            <div className="max-w-xl mx-auto bg-white border border-spruce/10 rounded-2xl p-8 md:p-10 text-center">
              <div className="w-12 h-12 bg-sage rounded-full mx-auto mb-5 flex items-center justify-center">
                <Package className="w-5 h-5 text-spruce" />
              </div>
              <h2 className="font-display text-[22px] md:text-[26px] font-extrabold text-spruce tracking-tight mb-3">
                On prépare des nouveautés
              </h2>
              <p className="text-ink-mute text-[14.5px] leading-[1.6] max-w-md mx-auto mb-6">
                Nos packs reviennent très vite. En attendant, tu peux composer ta routine
                à la carte dans le catalogue.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-fresh text-white font-semibold text-[14px] px-6 py-3 rounded-full hover:bg-fresh-deep transition-colors"
              >
                Voir tous les produits
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─── Coup de pouce conseil (discret, V2) ─── */}
      {packs.length > 0 && (
        <section className="pb-16 md:pb-20">
          <div className="container">
            <div className="max-w-3xl mx-auto bg-white border border-spruce/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-2">
                  Pas sûr du bon pack ?
                </p>
                <p className="font-display text-[18px] md:text-[20px] font-bold text-spruce leading-tight">
                  Dis-nous ton objectif, on t’oriente.
                </p>
              </div>
              <Link
                href="/conseil"
                className="inline-flex items-center gap-2 border border-spruce text-spruce font-semibold text-[14px] px-6 py-3 rounded-full hover:bg-spruce/5 transition-colors"
              >
                Demander conseil
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
