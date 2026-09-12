import Image from 'next/image'
import { Clapperboard, Play } from 'lucide-react'
import Reveal from '@/components/ui/Reveal'
import { INSTAGRAM_FEATURES } from '@/lib/social-proof'

/**
 * Section « Vu sur Instagram » (accueil V3) : les vidéos d'influenceurs
 * tournées à la boutique. Cartes statiques (aucun script Instagram, donc
 * rien à soumettre au consentement cookies), lien vers le reel.
 * Masquée tant que la liste de src/lib/social-proof.ts est vide.
 */
export default function VuSurInstagramV3() {
  if (INSTAGRAM_FEATURES.length === 0) return null

  return (
    <section className="bg-canvas">
      <div className="container py-14 md:py-28">
        <Reveal>
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-spruce/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-ink-mute">
              <Clapperboard className="h-3.5 w-3.5" aria-hidden="true" />
              Vu sur Instagram
            </span>
            <h2 className="mt-5 font-display text-[40px] font-extrabold leading-[0.98] tracking-tight text-spruce md:text-[56px] [text-wrap:balance]">
              Ils sont passés à la boutique
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-mute md:text-[18px]">
              Des athlètes qu&apos;on suit, filmés à Coignières, sans script. Leur avis, leurs produits,
              et le code qu&apos;ils te laissent.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 md:mt-14">
          {INSTAGRAM_FEATURES.map((f, i) => (
            <Reveal key={f.url} delay={i * 80}>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded-[20px] bg-white shadow-card transition-shadow hover:shadow-lift press"
                aria-label={`Voir la vidéo de ${f.author} sur Instagram`}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-sage">
                  <Image
                    src={f.image}
                    alt={`${f.author} à la boutique BodyStart Nutrition`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.04]"
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-spruce shadow-soft backdrop-blur-sm">
                      <Play className="ml-0.5 h-6 w-6" aria-hidden="true" fill="currentColor" />
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="font-display text-[18px] font-bold leading-tight text-spruce">{f.author}</p>
                    <p className="mt-0.5 truncate text-[13px] text-ink-mute">{f.title}</p>
                  </div>
                  <span className="shrink-0 text-[12px] font-semibold text-ink-mute">@{f.handle}</span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
