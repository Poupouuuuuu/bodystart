// STANDBY 2026-05-23 : cartes coaching + vetements retirees de "Nos univers"
// (cf. tech-specs/site-rewrite-copy-v1.md §3.8 + brief recentrage).
// La section devient un bloc Nutrition pleine largeur. Si on relance coaching
// ou vetements plus tard, restaurer le layout multi-univers depuis git history.
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Salad } from 'lucide-react'

export default function UniversSection() {
  return (
    <section className="bg-[#fcfaf8] py-24 border-t border-[#1a2e23]/5">
      <div className="container">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <p className="text-[12px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-3">
              Ce qu&apos;on fait
            </p>
            <h2 className="font-display text-[40px] md:text-[55px] font-black uppercase text-[#1a2e23] leading-[0.9] tracking-tighter">
              UNE CHOSE, BIEN FAITE
            </h2>
          </div>
          <p className="text-[#4a5f4c] text-sm md:text-base max-w-sm pb-2 font-medium">
            Compléments sport et santé, propres et bien dosés. Le cœur de notre métier, et tout
            ce sur quoi on se concentre aujourd&apos;hui.
          </p>
        </div>

        {/* Bloc Nutrition pleine largeur */}
        <Link
          href="/products"
          className="relative h-[480px] lg:h-[560px] rounded-3xl overflow-hidden group block transition-all duration-500 hover:-translate-y-1 shadow-sm hover:shadow-2xl max-w-7xl mx-auto"
        >
          <Image
            src="/nutrition-hd.png"
            alt="Compléments nutrition BodyStart"
            fill
            className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e23] via-[#1a2e23]/40 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-8 md:p-12 flex flex-col justify-end max-w-3xl">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-6 border border-white/20">
              <Salad className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <h3 className="font-display font-black text-4xl md:text-5xl uppercase text-white mb-3">
              NUTRITION
            </h3>
            <p className="text-white/80 text-base md:text-lg mb-6 max-w-md font-medium leading-snug">
              Protéines, créatine, oméga 3, magnésium, vitamines… On teste, on sélectionne, et
              on ne garde que ce qui sert vraiment.
            </p>
            <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-white group-hover:gap-4 transition-all">
              VOIR LES PRODUITS <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

      </div>
    </section>
  )
}
