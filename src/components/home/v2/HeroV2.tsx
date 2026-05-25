import Link from 'next/link'
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
      <div className="container py-16 md:py-24 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
          {/* ─── Colonne typo ─── */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-6">
              Coignières · Yvelines
            </p>

            <h1 className="font-display text-[40px] sm:text-[48px] lg:text-[56px] font-extrabold text-spruce leading-[1.05] tracking-tight mb-6">
              Les bons compléments.<br />
              Le bon conseil.
            </h1>

            <p className="text-ink-mute text-lg md:text-[19px] leading-[1.65] max-w-[540px] mb-9">
              Que tu veuilles prendre du muscle ou juste te sentir mieux au quotidien, on
              t&apos;aide à choisir ce qui te sert vraiment, et à zapper le reste. Produits
              propres, bien dosés, testés par nous.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
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
              <span>Ouvert 7j/7 à Coignières</span>
              <span className="mx-3 text-ink-mute/40">·</span>
              <span>Testé en boutique</span>
            </p>
          </div>

          {/* ─── Colonne visuel (placeholder neutre en attendant photo) ─── */}
          <div className="relative">
            <div
              className="aspect-[4/5] w-full max-w-[520px] mx-auto rounded-[20px] overflow-hidden border border-spruce/10 bg-white"
              aria-label="Photo lifestyle a venir : comptoir bois + produits + shaker"
            >
              {/* Placeholder neutre : gradient sage tres subtil + mention discrete. */}
              {/* A remplacer par une vraie photo lifestyle (Adam) — voir DA §A.Imagerie. */}
              <div className="w-full h-full bg-gradient-to-br from-sage to-canvas flex items-end justify-start p-8">
                <div className="text-ink-mute/60 text-[11px] font-medium uppercase tracking-widest">
                  Photo boutique à venir
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
