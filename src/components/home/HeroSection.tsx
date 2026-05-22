import Link from 'next/link'
import Image from 'next/image'
import { Users, Leaf, Store, Scale } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative bg-[#f4f6f1] overflow-hidden flex flex-col h-auto lg:h-[calc(100vh-85px)] lg:min-h-[750px]">

      {/* ─── Main Hero Area ─── */}
      <div className="container relative z-30 flex-grow flex flex-col lg:flex-row items-center h-full pt-12 lg:pt-0">

        {/* Left: Typography */}
        <div className="w-full lg:w-[55%] relative z-20 shrink-0 pb-16 lg:pb-0 flex flex-col justify-center">

          <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#4a5f4c] mb-5">
            Coignières · Yvelines
          </p>

          <h1 className="font-display text-[40px] sm:text-[60px] lg:text-[78px] font-black uppercase leading-[0.95] text-[#1a2e23] mb-7 tracking-tighter relative z-20">
            Les bons compléments.<br />
            Le bon conseil.<br />
            <span className="text-[#89a890]">Sans bullshit.</span>
          </h1>

          <p className="text-[#4a5f4c] text-lg md:text-xl font-medium leading-relaxed mb-10 max-w-[520px]">
            Que tu veuilles prendre du muscle ou juste te sentir mieux au quotidien, on t&apos;aide à
            choisir ce qui te sert vraiment — et à zapper le reste. Produits propres, bien dosés,
            testés par nous.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center justify-center bg-[#1a2e23] text-white font-bold text-[13px] px-9 py-4 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-xl uppercase tracking-widest"
            >
              Voir les produits
            </Link>
            <Link
              href="/conseil"
              className="inline-flex items-center justify-center bg-transparent border-2 border-[#1a2e23] text-[#1a2e23] font-bold text-[13px] px-9 py-4 rounded-full transition-all hover:bg-[#1a2e23] hover:text-white uppercase tracking-widest"
            >
              Demander conseil
            </Link>
          </div>
        </div>

        {/* Right: Dramatic Runner Image */}
        <div className="w-full lg:w-[50%] h-[400px] lg:h-full relative z-10 flex items-end justify-center lg:justify-end mt-16 lg:mt-0 lg:absolute lg:bottom-0 lg:right-0">
          <div className="relative w-full lg:w-[130%] max-w-[800px] h-full lg:translate-x-12">
            <Image
              src="/hero-runner.png"
              alt="Compléments BodyStart pour le sport et la santé au quotidien"
              fill
              priority
              sizes="(min-width: 1024px) 570px, 100vw"
              className="object-contain object-bottom drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
            />
          </div>
        </div>
      </div>

      {/* ─── Scrolling Marquee Ticker — 4 nouvelles puces (cf. copy spec §3.2) ─── */}
      <div className="bg-[#1a2e23] py-4 relative z-20 overflow-hidden w-full border-y border-white/10 shrink-0 flex">
        <div className="flex w-max animate-marquee">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex shrink-0 items-center px-8">
              <div className="flex items-center gap-3 pr-16">
                <Users className="w-5 h-5 text-[#89a890]" />
                <span className="text-[11px] font-bold text-white uppercase tracking-widest">
                  Conseil d&apos;humain
                </span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/20 mr-16" />

              <div className="flex items-center gap-3 pr-16">
                <Leaf className="w-5 h-5 text-[#2ab0b0]" />
                <span className="text-[11px] font-bold text-white uppercase tracking-widest">
                  Ingrédients tracés
                </span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/20 mr-16" />

              <div className="flex items-center gap-3 pr-16">
                <Store className="w-5 h-5 text-[#89a890]" />
                <span className="text-[11px] font-bold text-white uppercase tracking-widest">
                  On teste tout en boutique
                </span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/20 mr-16" />

              <div className="flex items-center gap-3 pr-16">
                <Scale className="w-5 h-5 text-[#2ab0b0]" />
                <span className="text-[11px] font-bold text-white uppercase tracking-widest">
                  Bien dosé, pas survendu
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
