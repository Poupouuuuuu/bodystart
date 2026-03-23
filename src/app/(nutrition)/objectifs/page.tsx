import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Shop by objectif',
  description: 'Trouvez les compléments adaptés à votre objectif sportif.',
}

const OBJECTIFS = [
  {
    slug: 'prise-de-muscle',
    label: 'Prise de muscle',
    emoji: '💪',
    desc: 'Whey, créatine, gainers — les essentiels pour construire du muscle.',
    image: '/assets/images/objectif-muscle.jpg',
    color: 'from-brand-900/70 to-brand-700/50',
  },
  {
    slug: 'perte-de-poids',
    label: 'Perte de poids',
    emoji: '🔥',
    desc: 'Protéines maigres et compléments pour optimiser votre composition corporelle.',
    image: '/assets/images/objectif-poids.jpg',
    color: 'from-orange-900/70 to-orange-700/50',
  },
  {
    slug: 'energie',
    label: 'Énergie & Endurance',
    emoji: '⚡',
    desc: 'Pré-workout, BCAA et caféine pour repousser vos limites.',
    image: '/assets/images/objectif-energie.jpg',
    color: 'from-yellow-900/70 to-yellow-700/50',
  },
  {
    slug: 'recuperation',
    label: 'Récupération',
    emoji: '🌙',
    desc: 'Magnésium, oméga 3 et compléments pour récupérer plus vite.',
    image: '/assets/images/objectif-recuperation.jpg',
    color: 'from-blue-950/70 to-blue-800/50',
  },
  {
    slug: 'immunite',
    label: 'Immunité',
    emoji: '🛡️',
    desc: 'Vitamines, zinc et antioxydants pour renforcer vos défenses naturelles.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    color: 'from-green-900/70 to-green-700/50',
  },
]

export default function ObjectifsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gray-50 border-b-2 border-gray-200 py-16 md:py-20">
        <div className="container text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-[4rem] font-black uppercase tracking-tight text-gray-900 mb-4 leading-none">
            Shop by objectif
          </h1>
          <p className="text-gray-600 font-medium text-lg max-w-xl mx-auto">
            Choisissez votre objectif et découvrez les compléments sélectionnés pour vous aider à l&apos;atteindre.
          </p>
        </div>
      </section>

      {/* Grille des objectifs */}
      <section className="container py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {OBJECTIFS.slice(0, 4).map((objectif) => (
            <ObjectifCard key={objectif.slug} objectif={objectif} />
          ))}
          {/* Dernière carte centrée */}
          <div className="md:col-start-1 md:col-span-2 lg:col-start-2 lg:col-span-1">
            <ObjectifCard objectif={OBJECTIFS[4]} />
          </div>
        </div>
      </section>
    </div>
  )
}

function ObjectifCard({
  objectif,
}: {
  objectif: (typeof OBJECTIFS)[number]
}) {
  return (
    <Link
      href={`/objectifs/${objectif.slug}`}
      className="group relative overflow-hidden rounded-sm border-2 border-gray-900 min-h-[300px] flex flex-col justify-end transition-all duration-300 block shadow-[8px_8px_0_theme(colors.gray.900)] hover:-translate-y-1 hover:shadow-[12px_12px_0_theme(colors.gray.900)]"
    >
      {/* Image de fond */}
      <Image
        src={objectif.image}
        alt={objectif.label}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />

      {/* Overlay gradient */}
      <div className={`absolute inset-0 bg-gradient-to-t ${objectif.color}`} />

      {/* Contenu */}
      <div className="relative z-10 p-6 md:p-8">
        <span className="text-4xl mb-4 block">{objectif.emoji}</span>
        <h2 className="font-display text-2xl font-black uppercase tracking-tight text-white mb-2 leading-tight">
          {objectif.label}
        </h2>
        <p className="text-white/90 text-sm font-medium mb-6 leading-relaxed">
          {objectif.desc}
        </p>
        <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-900 bg-white px-4 py-2.5 rounded-sm border-2 border-transparent transition-all hover:bg-gray-100">
          Découvrir le programme
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  )
}
