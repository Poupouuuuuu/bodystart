import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Lock, Dumbbell, Salad, Shirt } from 'lucide-react'

const UNIVERS = [
  {
    href: '/',
    label: 'Nutrition',
    description: 'Protéines, vitamines et boosters. Tout pour atteindre vos objectifs.',
    cta: 'Explorer la boutique',
    active: true,
    icon: Salad,
    image: '/category-masse.png',
    gradient: 'from-[#2d5a3d]/80 to-[#1a3a25]/90',
  },
  {
    href: '/coaching',
    label: 'Coaching',
    description: 'Programmes sur-mesure et suivi personnalisé par nos coachs certifiés.',
    cta: 'Découvrir les programmes',
    active: true,
    icon: Dumbbell,
    image: '/category-recuperation.png',
    gradient: 'from-[#1a6b6b]/80 to-[#0d4f4f]/90',
  },
  {
    href: '/vetements',
    label: 'Vêtements',
    description: 'Collection de vêtements techniques et accessoires sport. Bientôt disponible.',
    cta: 'Être notifié',
    active: false,
    icon: Shirt,
    image: '/category-sante.png',
    gradient: 'from-gray-700/80 to-gray-900/90',
  },
]

export default function UniversSection() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="container">
        <div className="text-center mb-14">
          <h2 className="font-display text-2xl md:text-3xl lg:text-[40px] font-black uppercase text-gray-900 tracking-tight mb-3">
            NOS UNIVERS
          </h2>
          <p className="text-gray-500 text-base max-w-lg mx-auto">
            Trois univers complémentaires pour vous accompagner à chaque étape de votre progression
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {UNIVERS.map(({ href, label, description, cta, active, icon: Icon, image, gradient }) => (
            <Link
              key={label}
              href={active ? href : '#'}
              className={`relative h-[340px] rounded-2xl overflow-hidden group transition-all duration-300 ${
                active ? 'hover:shadow-xl hover:-translate-y-1' : 'opacity-75 cursor-default'
              }`}
            >
              {/* Image de fond */}
              <Image
                src={image}
                alt={label}
                fill
                className={`object-cover transition-transform duration-700 ${active ? 'group-hover:scale-110' : ''}`}
                sizes="(max-width: 768px) 100vw, 33vw"
              />

              {/* Overlay dégradé */}
              <div className={`absolute inset-0 bg-gradient-to-t ${gradient}`} />

              {/* Badge locked pour Vêtements */}
              {!active && (
                <div className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Lock className="w-4 h-4 text-white/70" />
                </div>
              )}

              {/* Contenu positionné en bas */}
              <div className="absolute inset-0 z-10 flex flex-col justify-end p-6">
                <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>

                <h3 className="font-display font-black text-2xl uppercase text-white mb-2">
                  {label}
                </h3>
                <p className="text-white/70 text-sm leading-relaxed mb-4 max-w-[260px]">
                  {description}
                </p>

                <span className={`inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${
                  active ? 'text-white group-hover:gap-3' : 'text-white/50'
                } transition-all`}>
                  {cta} <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
