import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

/**
 * Hero V2 — redesign 2026.
 * Cf. tech-specs/redesign-v2-direction-artistique.md §B.Home.1
 *      tech-specs/site-rewrite-copy-v1.md §3.1
 *
 * Principe : less is more, surfaces claires, vert en accent uniquement.
 * Photo lifestyle a venir (Adam) — placeholder neutre en attendant.
 */
export default function HeroV2() {
  return (
    <section className="bg-canvas">
      <div className="container py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
          {/* ─── Colonne typo ─── */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-4">
              Coignières · Yvelines
            </p>

            <h1 className="font-display text-[40px] sm:text-[48px] lg:text-[56px] font-extrabold text-spruce leading-[1.05] tracking-tight mb-5">
              Les bons compléments.<br />
              Le bon conseil.
            </h1>

            <p className="text-ink-mute text-lg md:text-[19px] leading-[1.6] max-w-[540px] mb-7">
              Que tu veuilles prendre du muscle ou juste te sentir mieux au quotidien, on
              t&apos;aide à choisir ce qui te sert vraiment, et à zapper le reste. Produits
              propres, bien dosés, testés par nous.
            </p>

            <div className="flex flex-wrap gap-3 mb-7">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 bg-fresh text-white font-semibold text-[15px] px-7 py-3.5 rounded-full transition-colors hover:bg-fresh-deep"
              >
                Voir les produits
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/conseil"
                className="inline-flex items-center justify-center bg-transparent border border-spruce text-spruce font-semibold text-[15px] px-7 py-3.5 rounded-full transition-colors hover:bg-spruce/5"
              >
                Demander conseil
              </Link>
            </div>

            {/* Micro-preuve reelle (cf. DA §B.1) */}
            <p className="text-[13px] text-ink-mute font-medium">
              <span className="text-spruce font-semibold">+2 600 clients</span>
              <span className="mx-3 text-ink-mute/40">·</span>
              <span>Ouvert du lundi au samedi à Coignières</span>
              <span className="mx-3 text-ink-mute/40">·</span>
              <span>Testé en boutique</span>
            </p>
          </div>

          {/* ─── Colonne visuel : devanture de la boutique ─── */}
          <div className="relative">
            <div className="relative aspect-[4/5] w-full max-w-[520px] mx-auto rounded-[20px] overflow-hidden border border-spruce/10 bg-white">
              <Image
                src="/assets/devanture.webp"
                alt="Devanture de la boutique BodyStart Nutrition à Coignières"
                fill
                sizes="(max-width: 1024px) 100vw, 520px"
                className="object-cover"
                priority
                quality={65}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
