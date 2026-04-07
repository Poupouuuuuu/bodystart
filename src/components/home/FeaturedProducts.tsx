import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import type { ShopifyProduct } from '@/lib/shopify/types'

interface FeaturedProductsProps {
  products: ShopifyProduct[]
}

const FALLBACK_PRODUCTS = [
  {
    title: 'Iso Fusion Protein',
    price: '41,90 €',
    image: '/whey.png'
  },
  {
    title: 'Pre-Workout Pro',
    price: '35,00 €',
    image: '/whey.png'
  },
  {
    title: 'BCAA Elite',
    price: '28,00 €',
    image: '/whey.png'
  },
  {
    title: 'Omega 3 Premium',
    price: '25,00 €',
    image: '/whey.png'
  }
]

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  // Use real products if available, otherwise use fallbacks to match mockup
  const displayProducts = products && products.length >= 4
    ? products.slice(0, 4).map(p => ({
        id: p.id,
        title: p.title,
        price: formatPrice(p.priceRange.minVariantPrice),
        image: p.featuredImage?.url || '/whey.png',
        handle: p.handle
      }))
    : FALLBACK_PRODUCTS.map((p, i) => ({ ...p, id: `fallback-${i}`, handle: '#' }))

  return (
    <section className="section py-24 bg-white relative">
      <div className="container relative z-10">
        
        {/* Header DNVB Style */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-[40px] md:text-[55px] font-black uppercase text-[#1a2e23] leading-[0.9] tracking-tighter">
              Bestsellers
            </h2>
          </div>
          <Link
            href="/products"
            className="text-[12px] font-bold uppercase tracking-widest text-[#4a5f4c] hover:text-[#1a2e23] underline underline-offset-4 pb-2 transition-colors"
          >
            Voir tout le catalogue
          </Link>
        </div>

        {/* Grille de produits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {displayProducts.map((item) => (
            <Link
              key={item.id}
              href={item.handle !== '#' ? `/products/${item.handle}` : '#'}
              className="group flex flex-col items-center"
            >
              {/* Carte Image */}
              <div className="w-full relative rounded-[32px] overflow-hidden bg-[#f4f6f1] transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-[#1a2e23]/5 mb-6">
                <div
                  className="relative w-full aspect-[4/5] bg-cover bg-bottom bg-no-repeat overflow-hidden"
                  style={{ backgroundImage: "url('/Background.webp')" }}
                >
                  <div className="absolute inset-0 flex items-end justify-center pb-6">
                    <div className="relative z-10 w-full h-[60%]">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
                        className="object-contain drop-shadow-2xl transition-transform duration-700 ease-out group-hover:scale-110"
                      />
                    </div>
                  </div>
                  
                  {/* Subtle vignette effect at bottom for seamless landing */}
                  <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#f4f6f1] to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Contenu Texte minimaliste en dessous */}
              <div className="flex flex-col items-center text-center px-4 w-full">
                <h3 className="font-bold text-[#1a2e23] text-lg mb-1 uppercase tracking-wider line-clamp-1">
                  {item.title}
                </h3>
                <div className="font-medium text-[#4a5f4c] text-sm mb-4">
                  {item.price}
                </div>
                
                <span className="opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 text-[11px] font-bold uppercase tracking-widest text-[#1a2e23] border-b border-[#1a2e23] pb-1">
                  Découvrir
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
