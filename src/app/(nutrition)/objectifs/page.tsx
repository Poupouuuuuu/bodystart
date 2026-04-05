import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Dumbbell, Flame, Zap, Moon, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Shop by objectif',
  description: 'Trouvez les compl\u00e9ments adapt\u00e9s \u00e0 votre objectif sportif.',
}

const OBJECTIFS = [
  {
    slug: 'prise-de-muscle',
    label: 'Prise de muscle',
    icon: Dumbbell,
    desc: 'Whey, cr\u00e9atine, gainers \u2014 les essentiels pour construire du muscle.',
    image: '/assets/images/objectif-muscle.jpg',
    gradient: 'from-[#1a2e23]/80 to-[#1a2e23]/40',
  },
  {
    slug: 'perte-de-poids',
    label: 'Perte de poids',
    icon: Flame,
    desc: 'Prot\u00e9ines maigres et compl\u00e9ments pour optimiser votre composition corporelle.',
    image: '/assets/images/objectif-poids.jpg',
    gradient: 'from-[#1a2e23]/80 to-[#4a5f4c]/40',
  },
  {
    slug: 'energie',
    label: '\u00c9nergie & Endurance',
    icon: Zap,
    desc: 'Pr\u00e9-workout, BCAA et caf\u00e9ine pour repousser vos limites.',
    image: '/assets/images/objectif-energie.jpg',
    gradient: 'from-[#1a2e23]/80 to-[#89a890]/30',
  },
  {
    slug: 'recuperation',
    label: 'R\u00e9cup\u00e9ration',
    icon: Moon,
    desc: 'Magn\u00e9sium, om\u00e9ga 3 et compl\u00e9ments pour r\u00e9cup\u00e9rer plus vite.',
    image: '/assets/images/objectif-recuperation.jpg',
    gradient: 'from-[#1a2e23]/80 to-[#1a2e23]/50',
  },
  {
    slug: 'immunite',
    label: 'Immunit\u00e9',
    icon: ShieldCheck,
    desc: 'Vitamines, zinc et antioxydants pour renforcer vos d\u00e9fenses naturelles.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    gradient: 'from-[#4a5f4c]/80 to-[#89a890]/30',
  },
]

export default function ObjectifsPage() {
  return (
    <div className="bg-[#f4f6f1] min-h-screen">
      {/* Hero */}
      <section className="pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="container text-center max-w-2xl mx-auto">
          <p className="text-[#89a890] text-xs font-bold uppercase tracking-widest mb-4">
            Votre parcours
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-[#1a2e23] mb-5 leading-none">
            Shop by objectif
          </h1>
          <p className="text-[#4a5f4c] text-lg font-medium max-w-xl mx-auto leading-relaxed">
            Choisissez votre objectif et d&eacute;couvrez les compl&eacute;ments s&eacute;lectionn&eacute;s pour vous aider &agrave; l&apos;atteindre.
          </p>
        </div>
      </section>

      {/* Grille des objectifs */}
      <section className="container pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {OBJECTIFS.slice(0, 4).map((objectif) => (
            <ObjectifCard key={objectif.slug} objectif={objectif} />
          ))}
          {/* Derni\u00e8re carte centr\u00e9e */}
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
  const Icon = objectif.icon

  return (
    <Link
      href={`/objectifs/${objectif.slug}`}
      className="group relative overflow-hidden rounded-[24px] min-h-[320px] flex flex-col justify-end transition-all duration-500 block shadow-lg hover:shadow-2xl hover:-translate-y-1"
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
      <div className={`absolute inset-0 bg-gradient-to-t ${objectif.gradient}`} />

      {/* Contenu */}
      <div className="relative z-10 p-7">
        <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h2 className="font-display text-2xl font-black uppercase tracking-tight text-white mb-2 leading-tight">
          {objectif.label}
        </h2>
        <p className="text-white/85 text-sm font-medium mb-5 leading-relaxed">
          {objectif.desc}
        </p>
        <span className="inline-flex items-center gap-2 text-sm font-bold text-[#1a2e23] bg-white px-5 py-2.5 rounded-full shadow-md transition-all group-hover:shadow-lg group-hover:gap-3">
          D&eacute;couvrir
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  )
}
