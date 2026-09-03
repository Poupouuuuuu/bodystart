import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

/**
 * « Le conseil qu'aucun site n'a » — V3.
 *
 * Même message qu'en V2 (différenciateur n°1 de BodyStart), mise en scène
 * poussée : photo réelle des rayons dans une double enceinte, carte qui
 * déborde du cadre, titre jusqu'à 60 px, CTA « bouton dans le bouton ».
 */
export default function ConseilV3() {
  return (
    <section className="bg-sage/40">
      <div className="container py-16 md:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          {/* ─── Photo ─── */}
          <div className="relative order-2 lg:order-1">
            <div className="rounded-[2rem] bg-white/60 p-1.5 ring-1 ring-spruce/10">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[calc(2rem-0.375rem)]">
                <Image
                  src="/boutique/allee.webp"
                  alt="Les rayons de la boutique BodyStart Nutrition à Coignières"
                  fill
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover transition-transform duration-[1200ms] ease-out-expo hover:scale-[1.03]"
                />
              </div>
            </div>
            {/* Carte qui déborde : profondeur physique. */}
            <div className="absolute -bottom-6 right-4 max-w-[280px] rounded-2xl bg-white/90 p-4 shadow-lift backdrop-blur-md md:-right-6">
              <p className="font-display text-[17px] font-bold leading-snug text-spruce">
                « Si un produit ne sert à rien, on te le dit. »
              </p>
              <p className="mt-2 text-[12px] text-ink-mute">Adam, gérant de la boutique</p>
            </div>
          </div>

          {/* ─── Texte ─── */}
          <div className="order-1 lg:order-2">
            <span className="inline-flex items-center rounded-full border border-spruce/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-ink-mute">
              Le conseil qu&apos;aucun site n&apos;a
            </span>
            <h2 className="mt-5 font-display text-[38px] font-extrabold leading-[1] tracking-tight text-spruce md:text-[52px] lg:text-[60px] [text-wrap:balance]">
              Un humain qui connaît ce qu&apos;il vend.
            </h2>
            <p className="mt-7 max-w-[520px] text-[17px] leading-[1.65] text-ink-mute md:text-[18px]">
              On ne référence pas tout ce qui existe. On teste les marques, on lit les
              étiquettes, on vérifie les dosages, et on ne met en rayon que ce qu&apos;on
              prendrait nous-mêmes.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link
                href="/conseil"
                className="press group inline-flex items-center gap-3 rounded-full bg-fresh py-2 pl-6 pr-2 text-[15px] font-semibold text-white shadow-card transition-all duration-500 ease-out-expo hover:bg-fresh-deep hover:shadow-lift"
              >
                Demander conseil
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:scale-105">
                  <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                </span>
              </Link>
              <Link
                href="/stores"
                className="group inline-flex items-center gap-2 text-[15px] font-semibold text-spruce transition-colors duration-500 ease-out-expo hover:text-fresh"
              >
                Passer en boutique
                <ArrowUpRight
                  className="h-4 w-4 transition-transform duration-500 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </Link>
            </div>

            <p className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-spruce shadow-soft">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-fresh" />
              Click &amp; Collect gratuit, souvent prêt en quelques minutes
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
