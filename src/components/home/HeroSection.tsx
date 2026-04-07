import Link from 'next/link'
import Image from 'next/image'
import { FlaskConical, ShieldCheck, Award, Zap, Leaf } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative bg-[#f4f6f1] overflow-hidden flex flex-col h-auto lg:h-[calc(100vh-85px)] lg:min-h-[750px]">
      
      {/* ─── Main Hero Area ─── */}
      <div className="container relative z-30 flex-grow flex flex-col lg:flex-row items-center h-full pt-12 lg:pt-0">
        
        {/* Left: Typography */}
        <div className="w-full lg:w-[55%] relative z-20 shrink-0 pb-16 lg:pb-0 flex flex-col justify-center">

          <h1 className="font-display text-[44px] sm:text-[70px] lg:text-[100px] font-black uppercase leading-[0.85] text-[#1a2e23] mb-8 tracking-tighter relative z-20">
            COMPLÉMENTS<br />
            QUI FONT LA<br />
            <span className="text-[#89a890]">
              DIFFÉRENCE
            </span>
          </h1>

          <p className="text-[#4a5f4c] text-lg md:text-xl font-medium leading-relaxed mb-10 max-w-[460px]">
            Maximisez vos performances avec nos formules scientifiquement élaborées et des ingrédients de qualité supérieure.
          </p>

          <Link
            href="/products"
            className="inline-flex items-center justify-center bg-[#1a2e23] text-white font-bold text-[13px] px-10 py-5 rounded-full transition-all hover:-translate-y-1 hover:shadow-xl uppercase tracking-widest w-max"
          >
            DÉCOUVRIR LES PRODUITS
          </Link>
        </div>

        {/* Right: Dramatic Runner Image */}
        <div className="w-full lg:w-[50%] h-[400px] lg:h-full relative z-10 flex items-end justify-center lg:justify-end mt-16 lg:mt-0 lg:absolute lg:bottom-0 lg:right-0">
          <div className="relative w-full lg:w-[130%] max-w-[800px] h-full lg:translate-x-12">
            <Image
              src="/hero-runner.png"
              alt="Athlète avec compléments alimentaires Body Start"
              fill
              priority
              sizes="(min-width: 1024px) 570px, 100vw"
              className="object-contain object-bottom drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
            />
          </div>
        </div>
      </div>

      {/* ─── Scrolling Marquee Ticker ─── */}
      <div className="bg-[#1a2e23] py-4 relative z-20 overflow-hidden w-full border-y border-white/10 shrink-0 flex">
        <div className="flex w-max animate-marquee">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex shrink-0 items-center px-8">
              <div className="flex items-center gap-3 pr-16">
                <FlaskConical className="w-5 h-5 text-[#89a890]" />
                <span className="text-[11px] font-bold text-white uppercase tracking-widest">
                  Prouvé Scientifiquement
                </span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/20 mr-16" />
              
              <div className="flex items-center gap-3 pr-16">
                <ShieldCheck className="w-5 h-5 text-[#2ab0b0]" />
                <span className="text-[11px] font-bold text-white uppercase tracking-widest">
                  Ingrédients Traçables
                </span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/20 mr-16" />
              
              <div className="flex items-center gap-3 pr-16">
                <Award className="w-5 h-5 text-[#89a890]" />
                <span className="text-[11px] font-bold text-white uppercase tracking-widest">
                  Sélection d'experts
                </span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/20 mr-16" />
              
              <div className="flex items-center gap-3 pr-16">
                <Zap className="w-5 h-5 text-[#2ab0b0]" />
                <span className="text-[11px] font-bold text-white uppercase tracking-widest">
                  Efficacité Maximale
                </span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/20 mr-16" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
