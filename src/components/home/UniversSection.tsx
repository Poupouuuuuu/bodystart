import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Lock } from 'lucide-react'

const UNIVERS = [
  {
    href: '/',
    label: 'Nutrition',
    subtitle: 'Disponible maintenant',
    description: 'Protéines, vitamines, boosters de performance. Tout ce qu\'il faut pour atteindre vos objectifs.',
    cta: 'Explorer',
    active: true,
    image: '/assets/images/athlete.png',
    badge: null,
    bg: 'bg-brand-700',
    border: 'border-brand-600',
    badgeColor: 'bg-brand-500 text-white',
  },
  {
    href: '/coaching',
    label: 'Coaching',
    subtitle: 'Bientôt disponible',
    description: 'Programmes d\'entraînement sur-mesure et suivi coach personnalisé. Progressez plus vite.',
    cta: 'Être notifié',
    active: false,
    image: '/assets/images/objectif-muscle.jpg',
    badge: 'Phase 2',
    bg: 'bg-coaching-700',
    border: 'border-coaching-600',
    badgeColor: 'bg-coaching-cyan-400 text-coaching-700',
  },
  {
    href: '/vetements',
    label: 'Vêtements',
    subtitle: 'En cours de conception',
    description: 'Collection de vêtements techniques et accessoires sport. Pour performer et vous sentir bien.',
    cta: 'Être notifié',
    active: false,
    image: '/assets/images/objectif-energie.jpg',
    badge: 'Phase 3',
    bg: 'bg-gray-900',
    border: 'border-gray-700',
    badgeColor: 'bg-white/20 text-white',
  },
]

export default function UniversSection() {
  return (
    <section className="section bg-white border-t-2 border-gray-100">
      <div className="container">
        <div className="text-center mb-16">
          <span className="text-brand-700 text-xs font-black uppercase tracking-widest border-l-4 border-brand-500 pl-3">
            L&apos;écosystème Body Start
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-[2.5rem] font-black uppercase tracking-tight text-gray-900 mt-2 mb-4">
            Nos univers
          </h2>
          <p className="text-gray-500 text-lg font-medium max-w-xl mx-auto">
            Body Start développe trois univers complémentaires pour vous accompagner à chaque étape de votre parcours sportif.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {UNIVERS.map(({ href, label, subtitle, description, cta, active, image, badge, bg, border, badgeColor }) => (
            <Link
              key={label}
              href={href}
              className={`group relative overflow-hidden rounded-sm border-2 ${border} min-h-[400px] flex flex-col justify-end transition-all duration-300 ${active ? 'hover:-translate-y-1 hover:shadow-[8px_8px_0_theme(colors.brand.700)]' : 'hover:border-gray-600 grayscale opacity-80'}`}
            >
              {/* Image de fond */}
              <Image
                src={image}
                alt={label}
                fill
                className={`object-cover transition-transform duration-500 group-hover:scale-105 ${!active ? 'opacity-30' : 'opacity-60 saturate-50 contrast-125 grayscale-[20%]'}`}
              />

              {/* Overlay */}
              <div className={`absolute inset-0 ${bg} opacity-70`} />

              {/* Lock icon pour les univers pas encore actifs */}
              {!active && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="w-16 h-16 bg-gray-900 border-2 border-gray-700 rounded-sm flex items-center justify-center shadow-[4px_4px_0_theme(colors.gray.900)]">
                    <Lock className="w-6 h-6 text-gray-500" />
                  </div>
                </div>
              )}

              {/* Contenu */}
              <div className="relative z-10 p-6">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-4">
                  {active && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-black px-2.5 py-1 bg-brand-900 border border-brand-500 text-brand-300 rounded-sm shadow-[2px_2px_0_theme(colors.gray.900)]">
                      <span className="w-1.5 h-1.5 bg-brand-500 rounded-sm animate-pulse" />
                      Disponible
                    </span>
                  )}
                  {badge && (
                    <span className={`text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-sm shadow-[2px_2px_0_theme(colors.gray.900)] border border-gray-700 ${badgeColor}`}>
                      {badge}
                    </span>
                  )}
                </div>

                <h3 className="font-display font-black uppercase tracking-tight text-white text-3xl md:text-4xl leading-none mb-1">
                  {label}
                </h3>
                <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mb-3">{subtitle}</p>
                <p className="text-gray-300 text-sm font-medium leading-relaxed mb-6 line-clamp-2">
                  {description}
                </p>

                <span className="inline-flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white border-2 border-white/30 hover:bg-white hover:text-gray-900 px-4 py-2.5 rounded-sm transition-all shadow-[2px_2px_0_theme(colors.white)]">
                  {cta} <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
