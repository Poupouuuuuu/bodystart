import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getProducts } from '@/lib/shopify'
import ProductCard from '@/components/product/ProductCard'

const OBJECTIF_IMAGES: Record<string, string> = {
  'prise-de-muscle': '/assets/images/objectif-muscle.jpg',
  'perte-de-poids': '/assets/images/objectif-poids.jpg',
  'energie': '/assets/images/objectif-energie.jpg',
  'recuperation': '/assets/images/objectif-recuperation.jpg',
  'immunite': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80',
}

const OBJECTIVES_META: Record<string, { title: string; emoji: string; description: string; tags: string[] }> = {
  'prise-de-muscle': {
    title: 'Prise de muscle',
    emoji: '💪',
    description: 'Protéines, créatine et gainers pour maximiser la synthèse musculaire et soutenir vos séances.',
    tags: ['protéine', 'créatine', 'gainer', 'bcaa'],
  },
  'perte-de-poids': {
    title: 'Perte de poids',
    emoji: '🔥',
    description: 'Des compléments pour soutenir votre métabolisme, préserver la masse musculaire et réduire les fringales.',
    tags: ['brûleur', 'protéine', 'thermogénique'],
  },
  'energie': {
    title: 'Énergie & Endurance',
    emoji: '⚡',
    description: "Pré-workouts, caféine et BCAA pour performer à l'entraînement et repousser vos limites.",
    tags: ['pré-workout', 'caféine', 'bcaa', 'énergie'],
  },
  'recuperation': {
    title: 'Récupération',
    emoji: '🌙',
    description: 'Magnésium, oméga 3 et protéines à digestion lente pour récupérer plus vite et mieux dormir.',
    tags: ['magnésium', 'oméga 3', 'sommeil', 'récupération'],
  },
  'immunite': {
    title: 'Immunité',
    emoji: '🛡️',
    description: 'Vitamines, minéraux et antioxydants pour renforcer vos défenses naturelles tout au long de l\'année.',
    tags: ['vitamine c', 'zinc', 'vitamine d', 'antioxydant'],
  },
}

export async function generateMetadata({ params }: { params: { objectif: string } }): Promise<Metadata> {
  const meta = OBJECTIVES_META[params.objectif]
  return { title: meta ? `${meta.emoji} ${meta.title}` : 'Objectif' }
}

export default async function ObjectifPage({ params }: { params: { objectif: string } }) {
  const meta = OBJECTIVES_META[params.objectif]

  let products: import('@/lib/shopify/types').ShopifyProduct[] = []
  try {
    // Cherche les produits par tags correspondant à l'objectif
    const tagsQuery = meta?.tags?.map((t) => `tag:${t}`).join(' OR ') ?? ''
    const result = await getProducts({ first: 8, query: tagsQuery || undefined })
    products = result.nodes
  } catch {}

  if (!meta) {
    return (
      <div className="container py-20 text-center">
        <p className="text-gray-500 mb-4">Objectif non trouvé.</p>
        <Link href="/" className="btn-primary">Retour à l&apos;accueil</Link>
      </div>
    )
  }

  const heroImage = OBJECTIF_IMAGES[params.objectif]

  return (
    <div>
      <div className="relative bg-gray-950 text-white py-20 md:py-28 overflow-hidden border-b-4 border-gray-900">
        {heroImage && (
          <Image
            src={heroImage}
            alt={meta.title}
            fill
            className="object-cover opacity-30"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gray-950/80" />
        <div className="relative container max-w-3xl text-center">
          <span className="text-6xl block mb-6">{meta.emoji}</span>
          <h1 className="font-display text-4xl md:text-5xl lg:text-[4.5rem] font-black uppercase tracking-tighter mb-4 leading-none">{meta.title}</h1>
          <p className="text-gray-300 text-lg md:text-xl font-medium max-w-2xl mx-auto">{meta.description}</p>
        </div>
      </div>

      <div className="container py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 border-b-2 border-gray-200 pb-6">
          <Link href="/objectifs" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-700 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Tous les objectifs
          </Link>
          <h2 className="font-display font-black text-2xl uppercase tracking-tight text-gray-900">Produits recommandés</h2>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">Produits en cours de chargement...</p>
            <Link href="/products" className="btn-primary">
              Voir tous les produits <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
