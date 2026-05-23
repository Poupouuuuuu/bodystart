import Link from 'next/link'
import Image from 'next/image'
import { Dumbbell, Activity, ShieldPlus, Sprout, ArrowRight } from 'lucide-react'

// Copy spec §3.5 : 4 entrees pour incarner le 50/50 sport/sante
const CATEGORIES = [
  {
    icon: Dumbbell,
    label: 'Prise de masse & force',
    subtitle: 'Whey, créatine, gainer',
    href: '/products?obj=muscle',
    image: '/category-masse.png',
  },
  {
    icon: Activity,
    label: 'Récupération & énergie',
    subtitle: 'EAA, BCAA, magnésium',
    href: '/products?obj=recuperation',
    image: '/category-recuperation.png',
  },
  {
    icon: ShieldPlus,
    label: 'Santé & bien-être',
    subtitle: 'Oméga 3, vitamine D, collagène, immunité',
    href: '/products?obj=sante',
    image: '/category-sante.png',
  },
  {
    icon: Sprout,
    label: 'Vegan & protéines végétales',
    subtitle: "Pour élargir, sans compromis",
    href: '/products?obj=vegan',
    image: '/category-masse.png', // a remplacer par une vraie image vegan quand dispo
  },
]

export default function ShopByObjective() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="container">
        <div className="text-center mb-12">
          <h3 className="font-display text-2xl md:text-3xl font-black uppercase text-gray-900 tracking-tight">
            Trouve ce qui correspond à ton objectif
          </h3>
          <p className="text-gray-500 text-base mt-3 max-w-md mx-auto">
            Sport ou santé : on a ce qu&apos;il faut pour chaque objectif.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {CATEGORIES.map(({ icon: Icon, label, subtitle, href, image }) => (
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
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />

              {/* Overlay vert semi-transparent */}
              <div className="absolute inset-0 bg-[#345f44]/55 group-hover:bg-[#345f44]/45 transition-colors duration-300" />

              {/* Contenu centré */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-5 text-white text-center">
                <Icon className="w-12 h-12 mb-3 text-white drop-shadow-lg opacity-90" strokeWidth={1.5} />
                <span className="font-display font-black text-lg md:text-xl uppercase drop-shadow-md leading-tight">
                  {label}
                </span>
                <span className="text-[11px] mt-2 text-white/80 font-medium leading-snug px-2">
                  {subtitle}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/0 group-hover:text-white/95 transition-all duration-300 mt-3">
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
