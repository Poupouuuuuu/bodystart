import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Dumbbell, Flame, Zap, Moon, ShieldCheck } from 'lucide-react'
import { getProducts } from '@/lib/shopify'
import ProductCard from '@/components/product/ProductCard'

const OBJECTIF_IMAGES: Record<string, string> = {
  'prise-de-muscle': '/assets/images/objectif-muscle.jpg',
  'perte-de-poids': '/assets/images/objectif-poids.jpg',
  'energie': '/assets/images/objectif-energie.jpg',
  'recuperation': '/assets/images/objectif-recuperation.jpg',
  'immunite': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80',
}

const OBJECTIVES_META: Record<string, { title: string; icon: typeof Dumbbell; description: string; tags: string[] }> = {
  'prise-de-muscle': {
    title: 'Prise de muscle',
    icon: Dumbbell,
    description: 'Prot\u00e9ines, cr\u00e9atine et gainers pour maximiser la synth\u00e8se musculaire et soutenir vos s\u00e9ances.',
    tags: ['prot\u00e9ine', 'cr\u00e9atine', 'gainer', 'bcaa'],
  },
  'perte-de-poids': {
    title: 'Perte de poids',
    icon: Flame,
    description: 'Des compl\u00e9ments pour soutenir votre m\u00e9tabolisme, pr\u00e9server la masse musculaire et r\u00e9duire les fringales.',
    tags: ['br\u00fbleur', 'prot\u00e9ine', 'thermog\u00e9nique'],
  },
  'energie': {
    title: '\u00c9nergie & Endurance',
    icon: Zap,
    description: "Pr\u00e9-workouts, caf\u00e9ine et BCAA pour performer \u00e0 l'entra\u00eenement et repousser vos limites.",
    tags: ['pr\u00e9-workout', 'caf\u00e9ine', 'bcaa', '\u00e9nergie'],
  },
  'recuperation': {
    title: 'R\u00e9cup\u00e9ration',
    icon: Moon,
    description: 'Magn\u00e9sium, om\u00e9ga 3 et prot\u00e9ines \u00e0 digestion lente pour r\u00e9cup\u00e9rer plus vite et mieux dormir.',
    tags: ['magn\u00e9sium', 'om\u00e9ga 3', 'sommeil', 'r\u00e9cup\u00e9ration'],
  },
  'immunite': {
    title: 'Immunit\u00e9',
    icon: ShieldCheck,
    description: 'Vitamines, min\u00e9raux et antioxydants pour renforcer vos d\u00e9fenses naturelles tout au long de l\'ann\u00e9e.',
    tags: ['vitamine c', 'zinc', 'vitamine d', 'antioxydant'],
  },
}

export async function generateMetadata({ params }: { params: { objectif: string } }): Promise<Metadata> {
  const meta = OBJECTIVES_META[params.objectif]
  return { title: meta ? meta.title : 'Objectif' }
}

export default async function ObjectifPage({ params }: { params: { objectif: string } }) {
  const meta = OBJECTIVES_META[params.objectif]

  let products: import('@/lib/shopify/types').ShopifyProduct[] = []
  try {
    // Cherche les produits par tags correspondant \u00e0 l'objectif
    const tagsQuery = meta?.tags?.map((t) => `tag:${t}`).join(' OR ') ?? ''
    const result = await getProducts({ first: 8, query: tagsQuery || undefined })
    products = result.nodes
  } catch {}

  if (!meta) {
    return (
      <div className="bg-[#f4f6f1] min-h-screen">
        <div className="container py-20 text-center">
          <p className="text-[#4a5f4c] mb-6 text-lg">Objectif non trouv\u00e9.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a2e23] text-white font-bold rounded-full hover:bg-[#4a5f4c] transition-colors"
          >
            Retour \u00e0 l&apos;accueil
          </Link>
        </div>
      </div>
    )
  }

  const Icon = meta.icon
  const heroImage = OBJECTIF_IMAGES[params.objectif]

  return (
    <div className="bg-[#f4f6f1] min-h-screen">
      {/* Hero */}
      <div className="relative text-white py-24 md:py-32 overflow-hidden">
        {heroImage && (
          <Image
            src={heroImage}
            alt={meta.title}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e23] via-[#1a2e23]/80 to-[#1a2e23]/50" />

        <div className="relative container max-w-3xl text-center">
          <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
            <Icon className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight mb-5 leading-none">
            {meta.title}
          </h1>
          <p className="text-white/80 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            {meta.description}
          </p>
        </div>
      </div>

      {/* Produits */}
      <div className="container py-14">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <Link
            href="/objectifs"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#89a890] hover:text-[#1a2e23] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tous les objectifs
          </Link>
          <h2 className="font-display font-black text-2xl uppercase tracking-tight text-[#1a2e23]">
            Produits recommand\u00e9s
          </h2>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-[#89a890] mb-6 text-lg">Produits en cours de chargement...</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#1a2e23] text-white font-bold rounded-full hover:bg-[#4a5f4c] transition-colors shadow-md hover:shadow-lg"
            >
              Voir tous les produits
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
