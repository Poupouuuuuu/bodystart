import type { Metadata } from 'next'
import Link from 'next/link'
import { Package, Percent, Gift, ArrowRight, Sparkles } from 'lucide-react'
import { getCollectionByHandle } from '@/lib/shopify'
import ProductCard from '@/components/product/ProductCard'
import { formatPrice } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Packs & Économies — Body Start Nutrition',
  description:
    'Économisez en regroupant nos meilleurs produits. Packs prêts à l’emploi pour la prise de muscle, la perte de poids et la récupération.',
}

export const revalidate = 60 // 1min — facilite les tests pendant la phase de création des packs côté Shopify

function computeSavings(product: import('@/lib/shopify/types').ShopifyProduct) {
  const variant = product.variants.nodes[0]
  if (!variant?.compareAtPrice) return null
  const price = parseFloat(variant.price.amount)
  const compareAt = parseFloat(variant.compareAtPrice.amount)
  if (compareAt <= price) return null
  return {
    amount: compareAt - price,
    currency: variant.price.currencyCode,
    pct: Math.round(((compareAt - price) / compareAt) * 100),
  }
}

export default async function PacksPage() {
  let collection: Awaited<ReturnType<typeof getCollectionByHandle>> = null
  try {
    collection = await getCollectionByHandle('packs', 24)
  } catch {
    // Collection inexistante côté Shopify — on affiche l'état vide informatif
  }

  const products = collection?.products?.nodes ?? []

  // Calcul de l'économie max pour le hero
  const savings = products
    .map((p) => computeSavings(p))
    .filter((s): s is NonNullable<typeof s> => s !== null)
  const maxSavingsPct = savings.length ? Math.max(...savings.map((s) => s.pct)) : 0

  return (
    <div className="bg-[#f4f6f1] min-h-screen">
      {/* ─── Hero ─── */}
      <div className="pt-16 pb-12 md:pt-20 md:pb-16">
        <div className="container text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-[#1a2e23] text-white px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-widest">
              {maxSavingsPct > 0 ? `Jusqu'à -${maxSavingsPct}%` : 'Bons plans'}
            </span>
          </div>
          <h1 className="font-display text-[45px] md:text-[65px] lg:text-[80px] font-black uppercase text-[#1a2e23] tracking-tighter leading-none mb-6">
            PACKS &amp; ÉCONOMIES
          </h1>
          <p className="text-[#4a5f4c] font-medium text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Nos meilleurs produits regroupés pour vous faire économiser. Une routine complète, un seul prix réduit.
          </p>
        </div>
      </div>

      {/* ─── Bandeau avantages ─── */}
      <div className="container mb-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { icon: Percent, title: 'Remise immédiate', desc: 'Le pack coûte moins cher que les produits séparés' },
            { icon: Package, title: 'Routine clé en main', desc: 'Tout ce qu’il vous faut pour atteindre votre objectif' },
            { icon: Gift, title: 'Livraison offerte', desc: 'Dès 85€ d’achat — la plupart des packs sont éligibles' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-[20px] p-5 flex items-start gap-4 shadow-sm">
              <div className="w-10 h-10 bg-[#89a890]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[#4a5f4c]" />
              </div>
              <div>
                <p className="font-bold text-[#1a2e23] text-sm mb-0.5">{title}</p>
                <p className="text-xs text-[#4a5f4c] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Liste packs ─── */}
      <div className="container pb-20">
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product) => {
              const s = computeSavings(product)
              return (
                <div key={product.id} className="relative">
                  {s && (
                    <div className="absolute top-3 right-3 z-20 bg-[#1a2e23] text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg pointer-events-none">
                      Économisez {formatPrice({ amount: s.amount.toFixed(2), currencyCode: s.currency })}
                    </div>
                  )}
                  <ProductCard product={product} />
                </div>
              )
            })}
          </div>
        ) : (
          /* État vide / collection pas encore créée */
          <div className="max-w-2xl mx-auto bg-white rounded-[24px] p-10 md:p-14 text-center shadow-sm">
            <div className="w-16 h-16 bg-[#89a890]/10 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Package className="w-7 h-7 text-[#4a5f4c]" />
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight text-[#1a2e23] mb-3">
              Bientôt disponibles
            </h2>
            <p className="text-[#4a5f4c] text-base font-medium leading-relaxed mb-8 max-w-md mx-auto">
              Nos packs sont en cours de préparation. En attendant, découvrez notre catalogue complet de compléments premium.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-[#1a2e23] text-white font-bold text-sm px-8 py-3.5 rounded-full hover:bg-[#1a2e23]/90 transition-colors"
            >
              Voir tous les produits
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* ─── CTA bas de page ─── */}
      {products.length > 0 && (
        <div className="container pb-20">
          <div className="max-w-3xl mx-auto bg-[#1a2e23] rounded-[24px] p-8 md:p-12 text-center text-white">
            <h2 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight mb-3">
              Besoin d&apos;un conseil personnalisé ?
            </h2>
            <p className="text-white/70 text-sm md:text-base mb-6 max-w-lg mx-auto leading-relaxed">
              Nos coachs en boutique vous aident à composer la routine adaptée à votre objectif.
            </p>
            <Link
              href="/conseil"
              className="inline-flex items-center gap-2 bg-white text-[#1a2e23] font-bold text-sm px-8 py-3.5 rounded-full hover:bg-white/90 transition-colors"
            >
              Demander un conseil gratuit
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
