import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export default function BrandValues() {
  return (
    <section className="relative w-full h-[420px] md:h-[480px] overflow-hidden group">
      {/* Image de fond plein cadre avec zoom subtil au hover */}
      <Image
        src="/Notresélection.webp"
        alt="Notre sélection de compléments premium"
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        sizes="100vw"
        priority
      />

      {/* Overlay gradient sombre côté gauche pour lisibilité du texte */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

      {/* Contenu texte */}
      <div className="container relative z-10 h-full flex items-center">
        <div className="max-w-lg">
          <p className="text-white/70 text-xs font-bold uppercase tracking-[0.2em] mb-3">
            Notre sélection
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-black uppercase text-white leading-[0.95] mb-5 tracking-tight">
            Nous sélectionnons<br />
            le meilleur pour vous
          </h2>
          <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-md mb-8">
            Nous sélectionnons les meilleures marques de compléments alimentaires, testées par nos professionnels en boutique. Qualité, transparence et résultats : chaque produit est choisi pour vous accompagner dans vos objectifs.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold text-sm px-8 py-3.5 rounded-full hover:bg-white/90 transition-all shadow-lg uppercase tracking-wider"
          >
            Découvrir nos marques
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
