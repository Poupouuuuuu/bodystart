import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Lock, Dumbbell, Salad, Shirt } from 'lucide-react'

export default function UniversSection() {
  return (
    <section className="bg-[#fcfaf8] py-24 border-t border-[#1a2e23]/5">
      <div className="container">
        
        {/* Header DNVB Style */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-[40px] md:text-[55px] font-black uppercase text-[#1a2e23] leading-[0.9] tracking-tighter">
              NOS UNIVERS
            </h2>
          </div>
          <p className="text-[#4a5f4c] text-sm md:text-base max-w-sm pb-2 font-medium">
            Trois piliers complémentaires pour vous accompagner vers l'excellence, à chaque étape de votre progression.
          </p>
        </div>

        {/* Grille Asymétrique façon Magazine */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[600px] max-w-7xl mx-auto">
          
          {/* Univers NUTRITION (Bloc principal 50%) */}
          <Link
            href="/products"
            className="lg:col-span-7 relative h-[400px] lg:h-full rounded-3xl overflow-hidden group transition-all duration-500 hover:-translate-y-1 shadow-sm hover:shadow-2xl"
          >
            {/* Image avec Overlay */}
            <Image
              src="/nutrition-hd.png"
              alt="Nutrition"
              fill
              className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e23] via-[#1a2e23]/30 to-transparent" />
            
            {/* Contenu textuel */}
            <div className="absolute inset-x-0 bottom-0 p-8 md:p-12 flex flex-col justify-end">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-6 border border-white/20">
                <Salad className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-black text-4xl md:text-5xl uppercase text-white mb-3">
                NUTRITION
              </h3>
              <p className="text-white/80 text-base md:text-lg mb-6 max-w-md font-medium leading-snug">
                Formules haute technicité, protéines pures et boosters pour franchir vos paliers.
              </p>
              <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-white group-hover:gap-4 transition-all">
                ACHETER <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Colonne Droite (Coaching + Vêtements) */}
          <div className="lg:col-span-5 grid grid-rows-2 gap-6 h-[600px] lg:h-full">
            
            {/* Univers COACHING */}
            <Link
              href="/coaching"
              className="relative h-full rounded-3xl overflow-hidden group transition-all duration-500 hover:-translate-y-1 shadow-sm hover:shadow-xl"
            >
              <Image
                src="/category-masse.png"
                alt="Coaching"
                fill
                className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105 object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d3b3b] via-[#1a6b6b]/40 to-transparent" />
              
              <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col justify-end">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-white/20">
                  <Dumbbell className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="font-display font-black text-3xl uppercase text-white mb-2">
                  COACHING
                </h3>
                <p className="text-white/80 text-sm mb-4 max-w-[280px] font-medium leading-snug">
                  Entraînements sur-mesure par nos experts certifiés.
                </p>
                <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white group-hover:gap-4 transition-all">
                  DÉCOUVRIR <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Univers VÊTEMENTS (Bientôt) */}
            <div className="relative h-full rounded-3xl overflow-hidden group border border-[#1a2e23]/10 flex items-center justify-center cursor-default">
              <Image
                src="/vetements-hd.png"
                alt="Vêtements"
                fill
                className="object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e23] via-[#1a2e23]/80 to-[#1a2e23]/50" />
              
              {/* Badge Lock */}
              <div className="absolute top-6 right-6 z-20 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2 shadow-xl">
                <Lock className="w-3 h-3 text-white/90" />
                <span className="text-[9px] font-bold text-white uppercase tracking-widest">Bientôt</span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col justify-end z-10 opacity-60">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                  <Shirt className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="font-display font-black text-3xl uppercase text-white mb-2">
                  VÊTEMENTS
                </h3>
                <p className="text-white/70 text-sm font-medium leading-snug">
                  La future gamme technique.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}
