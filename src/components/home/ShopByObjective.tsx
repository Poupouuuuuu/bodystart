import Link from 'next/link'
import Image from 'next/image'
import { Dumbbell, Activity, ShieldPlus, ArrowRight } from 'lucide-react'

const CATEGORIES = [
  {
    icon: Dumbbell,
    label: 'Prise de masse',
    href: '/products?obj=muscle',
    image: '/category-masse.png',
  },
  {
    icon: Activity,
    label: 'Récupération',
    href: '/products?obj=recuperation',
    image: '/category-recuperation.png',
  },
  {
    icon: ShieldPlus,
    label: 'Santé & Vitalité',
    href: '/products?obj=sante',
    image: '/category-sante.png',
  },
]

export default function ShopByObjective() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="container">
        <div className="text-center mb-12">
          <h3 className="font-display text-2xl md:text-3xl font-black uppercase text-gray-900 tracking-tight">
            CATÉGORIES
          </h3>
          <p className="text-gray-500 text-base mt-3 max-w-md mx-auto">
            Trouvez les compléments adaptés à votre objectif
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {CATEGORIES.map(({ icon: Icon, label, href, image }) => (
            <Link
              key={label}
              href={href}
              className="relative h-[240px] rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-300"
            >
              {/* Image de fond */}
              <Image
                src={image}
                alt={label}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, 33vw"
              />

              {/* Overlay vert semi-transparent */}
              <div className="absolute inset-0 bg-[#345f44]/50 group-hover:bg-[#345f44]/40 transition-colors duration-300" />

              {/* Contenu centré */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-white text-center">
                <Icon className="w-14 h-14 mb-4 text-white drop-shadow-lg opacity-90" strokeWidth={1.5} />
                <span className="font-display font-black text-xl md:text-2xl uppercase drop-shadow-md">
                  {label}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/0 group-hover:text-white/90 transition-all duration-300 mt-3">
                  Explorer <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
