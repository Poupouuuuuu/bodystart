import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import type { ShopifyProduct } from '@/lib/shopify/types'

interface FeaturedProductsProps {
  products: ShopifyProduct[]
}

const FALLBACK_PRODUCTS = [
  {
    title: 'Protéine Whey',
    price: '45,00 €',
    image: '/whey.png'
  },
  {
    title: 'BCAA',
    price: '35,00 €',
    image: '/whey.png'
  },
  {
    title: 'Pré-Workout',
    price: '40,00 €',
    image: '/whey.png'
  },
  {
    title: 'Omega 3',
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
    <section className="section py-16 lg:py-24 bg-cream-100">
      <div className="container">
        {/* En-tête centré */}
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl md:text-3xl lg:text-[40px] font-black uppercase text-gray-900 tracking-tight">
            NOS MEILLEURES SÉLECTIONS
          </h2>
          <p className="text-gray-500 text-base mt-3 max-w-md mx-auto">
            Les incontournables choisis par nos experts en boutique
          </p>
        </div>

        {/* Grille de produits — chaque card a l'image Background.webp en fond */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5 max-w-6xl mx-auto">
          {displayProducts.map((item) => (
            <Link
              key={item.id}
              href={item.handle !== '#' ? `/products/${item.handle}` : '#'}
              className="rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-2 shadow-md hover:shadow-xl border border-cream-300 group"
            >
              {/* Zone image — Background.webp en fond, produit centré sur le socle */}
              <div
                className="relative w-full h-[280px] bg-cover bg-bottom bg-no-repeat overflow-hidden"
                style={{ backgroundImage: "url('/Background.webp')" }}
              >
                {/* Produit centré horizontalement et posé en bas sur le socle */}
                <div className="absolute inset-0 flex items-end justify-center">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="relative z-10 w-auto min-h-[140px] max-h-[190px] object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                    style={{ marginBottom: '6px' }}
                  />
                </div>

                {/* Dégradé bas : fondu vers blanc pour transition douce */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent z-0" />
              </div>

              {/* Content — fond blanc sous l'image */}
              <div className="bg-white p-4 flex flex-col flex-1">
                <h3 className="font-display font-bold text-gray-900 text-lg mb-0.5 line-clamp-1">
                  {item.title}
                </h3>
                <div className="font-bold text-gray-900 text-base mb-4">
                  {item.price}
                </div>

                <span className="block w-full py-3 bg-[#345f44] text-white text-sm uppercase font-bold rounded-full text-center group-hover:bg-[#234832] transition-colors shadow-md mt-auto">
                  VOIR LE PRODUIT
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
