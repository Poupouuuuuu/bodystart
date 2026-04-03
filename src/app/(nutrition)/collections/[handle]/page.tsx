import type { Metadata } from 'next'
import { getCollectionByHandle } from '@/lib/shopify'
import ProductCard from '@/components/product/ProductCard'
import Link from 'next/link'
import { Dumbbell, Zap, ShieldPlus, FlaskConical, Leaf, Globe } from 'lucide-react'

const COLLECTION_LABELS: Record<string, string> = {
  proteines: 'Protéines',
  whey: 'Whey Protéine',
  'prise-de-masse': 'Muscle Gain',
  energie: 'Energy',
  recuperation: 'Recovery',
  sante: 'Health & Vitality'
}

export async function generateMetadata({ params }: { params: { handle: string } }): Promise<Metadata> {
  const label = COLLECTION_LABELS[params.handle] ?? params.handle
  return { title: `${label} — Body Start Nutrition` }
}

export default async function CollectionPage({ params }: { params: { handle: string } }) {
  let collection = null
  try {
    collection = await getCollectionByHandle(params.handle, 24)
  } catch {}

  const products = collection?.products?.nodes ?? []

  return (
    <div className="bg-white pb-20">
      
      {/* ─── Header: FILTER BY GOAL ─── */}
      <div className="bg-[#4a5850] relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-black/20" /> {/* Texture overlay */}
        <div className="container relative z-10 flex flex-col md:flex-row items-center justify-between">
          <h1 className="font-display font-black text-3xl md:text-5xl text-[#c1d1b9] uppercase tracking-wider mb-8 md:mb-0">
            FILTRER PAR OBJECTIF
          </h1>
          <div className="flex items-center gap-6 md:gap-12">
            <Link href="/collections/prise-de-masse" className="flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 rounded-full border-2 border-white/50 flex items-center justify-center bg-white/10 group-hover:bg-white/20 transition-all">
                <Dumbbell className="w-8 h-8 text-white" />
              </div>
              <span className="text-white text-xs font-bold uppercase tracking-widest">Prise de masse</span>
            </Link>
            <Link href="/collections/energie" className="flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 rounded-full border-2 border-white/50 flex items-center justify-center bg-white/10 group-hover:bg-white/20 transition-all">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <span className="text-white text-xs font-bold uppercase tracking-widest">Énergie</span>
            </Link>
            <Link href="/collections/recuperation" className="flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 rounded-full border-2 border-white/50 flex items-center justify-center bg-white/10 group-hover:bg-white/20 transition-all">
                <ShieldPlus className="w-8 h-8 text-white" />
              </div>
              <span className="text-white text-xs font-bold uppercase tracking-widest">Récupération</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mt-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ─── Sidebar (Filtres) ─── */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-[#e6efe1] p-6 rounded-tl-xl rounded-tr-xl rounded-bl-xl rounded-br-xl">
              {/* PRICE RANGE */}
              <div className="mb-8">
                <h3 className="font-display font-bold text-gray-900 uppercase tracking-widest text-sm mb-4">Prix</h3>
                <div className="flex items-center justify-between text-xs text-gray-700 font-bold mb-2">
                  <span>39,99 €</span>
                  <span>100,00 €</span>
                </div>
                {/* Fake Slider */}
                <div className="w-full h-1 bg-gray-300 rounded-full relative">
                  <div className="absolute left-0 top-0 h-full bg-[#345f44] w-2/3 rounded-full"></div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-[#345f44] rounded-full"></div>
                  <div className="absolute left-2/3 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-[#345f44] rounded-full"></div>
                </div>
              </div>

              {/* INGREDIENTS */}
              <div className="mb-8">
                <h3 className="font-display font-bold text-gray-900 uppercase tracking-widest text-sm mb-4">Ingrédients</h3>
                <div className="space-y-3">
                  {['Aliments', 'Contient', 'Compléments', 'Arômes'].map((item) => (
                    <label key={item} className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-4 h-4 border border-gray-400 bg-white group-hover:border-[#345f44]"></div>
                      <span className="text-sm text-gray-700">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* DIETARY NEEDS */}
              <div>
                <h3 className="font-display font-bold text-gray-900 uppercase tracking-widest text-sm mb-4">Besoins Alimentaires</h3>
                <div className="space-y-3">
                  {['Protéines', 'Végétalien', 'Sans gluten', 'Autre'].map((item) => (
                    <label key={item} className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-4 h-4 border border-gray-400 bg-white group-hover:border-[#345f44]"></div>
                      <span className="text-sm text-gray-700">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Main Content ─── */}
          <div className="flex-1">
            
            {/* Grille Produits */}
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center">
                <p className="font-black uppercase tracking-widest text-gray-900 text-xl">Aucun produit</p>
              </div>
            )}

            {/* Load More */}
            <div className="flex justify-center mt-10 mb-16">
              <button className="bg-[#e6efe1] text-gray-700 font-bold uppercase text-xs tracking-widest px-6 py-2 rounded">
                Voir Plus
              </button>
            </div>

            {/* Staff Pick Banner */}
            <div className="w-full bg-[#345f44] text-white rounded-xl overflow-hidden relative flex flex-col md:flex-row items-center mb-16 h-48 lg:h-56">
               <div className="absolute inset-0 bg-black/10 z-0"></div>
               {/* Background image container for runner */}
               <div className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden pointer-events-none z-10">
                 <img src="/staff-pick-runner.jpg" alt="Le Choix de l'Équipe Runner" className="w-full h-full object-cover opacity-80" />
               </div>
               
               <div className="relative z-20 p-8 md:p-12 w-full md:w-2/3">
                 <h2 className="font-display font-black text-3xl uppercase tracking-tighter mb-2">Le Choix de l'Équipe</h2>
                 <p className="font-medium text-lg mb-6">Packs & Économies : Obtenez nos produits phares et économisez 20% !</p>
                 <Link href="/products" className="inline-block bg-[#e6efe1] text-gray-900 font-bold uppercase text-sm tracking-widest px-6 py-3 rounded hover:bg-white transition-colors">
                   VOIR LE PACK
                 </Link>
               </div>
            </div>

            {/* More Wellness Essentials */}
            <div className="mb-16">
              <h3 className="text-center font-display font-black text-2xl text-gray-900 uppercase tracking-tighter mb-8">
                Nos Indispensables Bien-Être
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Fake Horizontal Cards */}
                 <div className="bg-[#e6efe1] rounded-xl p-4 flex items-center gap-6 cursor-pointer hover:shadow-md transition-shadow">
                   <div className="w-24 h-24 bg-white rounded-lg flex-shrink-0 flex items-center justify-center p-2">
                     <img src="/whey.png" alt="Vitamines" className="w-full h-full object-contain" />
                   </div>
                   <div>
                     <h4 className="font-bold text-gray-900 uppercase">Vitamines Journalières</h4>
                     <p className="text-xs text-gray-600 mb-2">Nouvelles vitamines pour booster votre santé.</p>
                     <p className="font-bold text-gray-900">39,90 €</p>
                   </div>
                 </div>
                 <div className="bg-[#e6efe1] rounded-xl p-4 flex items-center gap-6 cursor-pointer hover:shadow-md transition-shadow">
                   <div className="w-24 h-24 bg-white rounded-lg flex-shrink-0 flex items-center justify-center p-2">
                     <img src="/omega3.png" alt="Omega 3" className="w-full h-full object-contain" />
                   </div>
                   <div>
                     <h4 className="font-bold text-gray-900 uppercase">Complexe Omega-3</h4>
                     <p className="text-xs text-gray-600 mb-2">Huile de poisson essentielle pour l'entretien cardiovasculaire.</p>
                     <p className="font-bold text-gray-900">39,90 €</p>
                   </div>
                 </div>
              </div>
            </div>

            {/* Pourquoi nous faire confiance? */}
            <div className="bg-[#f4f5f0] rounded-xl py-12 px-6 text-center mb-16">
              <h3 className="font-display font-black text-2xl text-gray-900 uppercase tracking-tighter mb-10">
                Pourquoi nous faire confiance ?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center">
                  <FlaskConical className="w-12 h-12 text-[#345f44] mb-4" strokeWidth={1.5} />
                  <h4 className="font-bold text-gray-900 mb-2">Tests de Qualité</h4>
                  <p className="text-xs text-gray-600">Tests rigoureux en laboratoire pour garantir des formulations pures et efficaces.</p>
                </div>
                <div className="flex flex-col items-center">
                  <Globe className="w-12 h-12 text-[#345f44] mb-4" strokeWidth={1.5} />
                  <h4 className="font-bold text-gray-900 mb-2">Sélection d'Experts</h4>
                  <p className="text-xs text-gray-600">Sélection pointue d'ingrédients certifiés par des experts en nutrition sportive.</p>
                </div>
                <div className="flex flex-col items-center">
                  <Leaf className="w-12 h-12 text-[#345f44] mb-4" strokeWidth={1.5} />
                  <h4 className="font-bold text-gray-900 mb-2">Emballages Écologiques</h4>
                  <p className="text-xs text-gray-600">Emballages durables, matériaux recyclés et ingrédients organiques éthiques.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
