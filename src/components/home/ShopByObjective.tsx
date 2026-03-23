import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

const OBJECTIVES = [
  {
    label: 'Prise de muscle',
    description: 'Whey, créatine, gainers',
    href: '/objectifs/prise-de-muscle',
    image: '/assets/images/objectif-muscle.jpg',
    accent: 'from-brand-900/80 to-brand-700/50',
    badge: '💪',
  },
  {
    label: 'Perte de poids',
    description: 'Brûleurs, protéines maigres',
    href: '/objectifs/perte-de-poids',
    image: '/assets/images/objectif-poids.jpg',
    accent: 'from-orange-900/80 to-orange-700/50',
    badge: '🔥',
  },
  {
    label: 'Énergie & Endurance',
    description: 'Pré-workout, BCAA, caféine',
    href: '/objectifs/energie',
    image: '/assets/images/objectif-energie.jpg',
    accent: 'from-yellow-900/80 to-yellow-700/50',
    badge: '⚡',
  },
  {
    label: 'Récupération',
    description: 'Magnésium, oméga 3, sommeil',
    href: '/objectifs/recuperation',
    image: '/assets/images/objectif-recuperation.jpg',
    accent: 'from-blue-950/80 to-blue-800/50',
    badge: '🌙',
  },
]

export default function ShopByObjective() {
  return (
    <section className="section bg-white">
      <div className="container">

        {/* En-tête */}
        <div className="text-center mb-12">
           <span className="text-brand-700 text-xs font-black uppercase tracking-widest">
            Votre programme
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-[2.5rem] font-black uppercase tracking-tight text-gray-900 mt-2 mb-3">
            Shop by objectif
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mx-auto font-medium">
            Trouvez les compléments adaptés à votre objectif en quelques secondes.
          </p>
        </div>

        {/* Grille objectifs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {OBJECTIVES.map(({ label, description, href, image, accent, badge }) => (
            <Link
              key={label}
              href={href}
              className="group relative overflow-hidden rounded-sm min-h-[280px] flex flex-col justify-end border-2 border-brand-900 hover:border-brand-500 shadow-[4px_4px_0_theme(colors.brand.900)] hover:shadow-[4px_4px_0_theme(colors.brand.500)] hover:-translate-y-1 transition-all duration-300"
            >
              {/* Image de fond */}
              <Image
                src={image}
                alt={label}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Overlay gradient */}
              <div className={`absolute inset-0 bg-gradient-to-t ${accent} opacity-90`} />

              {/* Contenu */}
              <div className="relative z-10 p-5">
                <span className="text-2xl mb-2 block">{badge}</span>
                <h3 className="font-display font-black uppercase tracking-tight text-white text-xl leading-tight mb-1">
                  {label}
                </h3>
                <p className="text-white/80 text-sm mb-4 font-medium">{description}</p>
                <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-black text-white border-2 border-white/30 hover:bg-white hover:text-brand-900 px-3 py-2 rounded-sm transition-all shadow-[2px_2px_0_theme(colors.white)]">
                  Voir les produits <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
