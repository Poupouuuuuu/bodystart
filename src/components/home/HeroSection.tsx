import Link from 'next/link'
import { FlaskConical, ShieldCheck, Award } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative bg-white overflow-hidden flex flex-col pt-4 lg:pt-0 h-auto lg:h-[calc(100vh-85px)] lg:min-h-[700px]">
      {/* ─── Main Hero Area (Text) ─── */}
      <div className="container relative z-30 flex-grow flex items-center h-full">
        <div className="w-full lg:w-[50%] relative z-20 shrink-0 pb-12 lg:pb-0">
          <h1 className="font-display text-[46px] md:text-6xl lg:text-[80px] font-black uppercase leading-[0.92] text-gray-950 mb-6 tracking-tighter whitespace-nowrap">
            Des compléments<br />
            qui font la<br />
            différence
          </h1>

          <p className="text-gray-800 text-lg md:text-xl font-medium leading-snug mb-10 max-w-[460px]">
            Maximisez vos performances avec nos formules scientifiquement élaborées et des ingrédients de qualité supérieure.
          </p>

          <Link
            href="/collections/objectifs"
            className="inline-flex items-center justify-center bg-[#366046] hover:bg-[#2c4d39] text-white font-bold text-sm lg:text-[15px] px-10 py-[18px] w-auto rounded-full transition-all hover:scale-105 uppercase tracking-wider shadow-md"
          >
            DÉCOUVRIR NOS PRODUITS
          </Link>
        </div>
      </div>

      {/* ─── Colonne droite : Image compositée (Runner) Desktop (Absolute) ─── */}
      <div className="hidden lg:flex absolute bottom-0 right-0 z-30 w-[55%] h-full items-end justify-center pointer-events-none xl:-mr-12">
        <img
          src="/hero-runner.png"
          alt="Athlète avec compléments alimentaires Body Start"
          className="w-full max-w-[850px] object-contain drop-shadow-2xl"
          style={{ transform: 'translateY(1%)' }}
        />
      </div>

      {/* ─── Colonne droite : Image compositée (Runner) Mobile (Relative) ─── */}
      <div className="flex lg:hidden w-full relative z-30 flex-col items-center justify-end pointer-events-none -mb-16">
        <img
          src="/hero-runner.png"
          alt="Athlète avec compléments alimentaires Body Start"
          className="w-[125%] max-w-[500px] h-auto object-contain drop-shadow-2xl"
        />
      </div>

      {/* ─── Bottom Green Band (Reassurance) ─── */}
      <div className="bg-[#d1ebd6] py-6 lg:py-0 lg:h-[130px] relative z-20 flex items-center mt-auto shrink-0">
        <div className="container">
           <div className="flex items-center justify-center gap-12 lg:gap-24">
              <div className="flex flex-col items-center justify-center gap-3">
                <FlaskConical className="w-9 h-9 text-gray-800" strokeWidth={1.5} />
                <span className="text-[13px] font-bold text-gray-900 uppercase text-center leading-tight tracking-[0.08em]">
                  Prouvé<br/>Scientifiquement
                </span>
              </div>
              <div className="flex flex-col items-center justify-center gap-3">
                <ShieldCheck className="w-9 h-9 text-gray-800" strokeWidth={1.5} />
                <span className="text-[13px] font-bold text-gray-900 uppercase text-center leading-tight tracking-[0.08em]">
                  Ingrédients<br/>Traçables
                </span>
              </div>
              <div className="flex flex-col items-center justify-center gap-3">
                <Award className="w-9 h-9 text-gray-800" strokeWidth={1.5} />
                <span className="text-[13px] font-bold text-gray-900 uppercase text-center leading-tight tracking-[0.08em]">
                  Marques sélectionnées<br/>par nos experts
                </span>
              </div>
           </div>
        </div>
      </div>
    </section>
  )
}
