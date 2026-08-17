import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Star } from 'lucide-react'
import { GOOGLE_LISTING_URL, GOOGLE_RATING } from '@/lib/store-info'

/**
 * Hero — PREMIUM V2 (refonte 2026-08).
 * Cf. tech-specs/redesign-v2-direction-artistique.md §B.Home.1
 *
 * Ce qui change par rapport à la V2 initiale (rendu « en construction ») :
 *  - titre en Fraunces, massif, interligne resserré (0.98) + soulignement
 *    dessiné à la main sous l'accroche → caractère éditorial, pas template ;
 *  - halo radial sage derrière le contenu : casse le fond uni SANS tomber dans
 *    le dégradé décoratif (le radial se lit comme une lumière, pas comme un
 *    aplat) ;
 *  - photo en grand format, ombre TEINTÉE verte et profonde, + une carte de
 *    preuve sociale qui DÉBORDE sur l'image (superposition = profondeur) ;
 *  - CTA avec retour physique au clic et flèche qui glisse au survol.
 *
 * ⚠️ PERF (volontaire) : ni le titre ni la photo ne sont animés à l'entrée.
 * Un élément en opacity:0 n'est pas considéré comme peint → animer le h1 ou
 * l'image RETARDERAIT le LCP. Seuls les éléments secondaires montent en
 * cascade (classe .hero-rise), ce qui donne la vie sans coûter une milliseconde
 * de LCP. Les révélations au scroll (<Reveal>) sont réservées aux sections
 * situées sous la ligne de flottaison.
 */
export default function HeroV2() {
  const note = GOOGLE_RATING.value.toLocaleString('fr-FR')

  return (
    <section className="relative overflow-hidden bg-canvas">
      {/* Halo de lumière — décoratif, hors flux, ne capte aucun clic */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-[-10%] h-[620px] w-[620px] rounded-full opacity-70 blur-3xl
                   bg-[radial-gradient(circle_at_center,#EEF4EC_0%,rgba(238,244,236,0.45)_45%,rgba(250,248,243,0)_70%)]"
      />

      <div className="container relative py-14 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          {/* ─── Colonne éditoriale ─── */}
          <div>
            <div className="hero-rise mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute">
                Coignières · Yvelines
              </p>
              <span aria-hidden="true" className="hidden h-3 w-px bg-spruce/20 sm:block" />
              <a
                href={GOOGLE_LISTING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-spruce transition-colors hover:text-fresh"
              >
                <Star className="h-3.5 w-3.5 fill-current text-mustard" aria-hidden="true" />
                {note}/5 · {GOOGLE_RATING.count} avis Google
              </a>
            </div>

            {/* Le h1 n'est PAS animé (LCP). `display-hero` active l'axe WONK de
                Fraunces : formes déviantes = caractère artisanal. */}
            <h1 className="display-hero mb-6 font-display text-[40px] font-extrabold leading-[0.98] tracking-[-0.02em] text-spruce sm:text-[48px] lg:text-[58px] xl:text-[64px]">
              Les bons compléments.
              <br />
              <span className="relative inline-block">
                Le bon conseil.
                {/* Soulignement dessiné (tracé irrégulier) : signe éditorial
                    fait main, cohérent avec le serif. Décoratif → aria-hidden. */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 300 12"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1.5 left-0 h-[10px] w-full text-fresh/45"
                >
                  <path
                    d="M2 8.5C46 4.2 104 2.6 160 3.4c42 .6 86 2.4 138 5.6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="hero-rise hero-rise-1 mb-8 max-w-[540px] text-[17px] leading-[1.65] text-ink-mute md:text-[19px]">
              Que tu veuilles prendre du muscle ou juste te sentir mieux au quotidien, on
              t&apos;aide à choisir ce qui te sert vraiment, et à zapper le reste. Produits
              propres, bien dosés, testés par nous.
            </p>

            <div className="hero-rise hero-rise-2 mb-9 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="press group inline-flex items-center justify-center gap-2 rounded-full bg-fresh px-7 py-4 text-[15px] font-semibold text-white shadow-card hover:bg-fresh-deep hover:shadow-lift"
              >
                Voir les produits
                <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out-expo group-hover:translate-x-1" />
              </Link>
              <Link
                href="/conseil"
                className="press inline-flex items-center justify-center rounded-full border border-spruce/30 bg-white/60 px-7 py-4 text-[15px] font-semibold text-spruce backdrop-blur-sm hover:border-spruce hover:bg-white"
              >
                Demander conseil
              </Link>
            </div>

            {/* Faits réels — hiérarchisés (chiffre en gras sombre, libellé doux)
                plutôt qu'une ligne de gris uniforme. */}
            <dl className="hero-rise hero-rise-3 flex flex-wrap items-center gap-x-8 gap-y-3">
              {[
                { value: '13 ans', label: 'de conseil' },
                { value: '+2 600', label: 'clients conseillés' },
                { value: 'Lun–Sam', label: '11h – 19h' },
              ].map((f) => (
                <div key={f.value} className="flex items-baseline gap-2">
                  <dt className="sr-only">{f.label}</dt>
                  <dd className="text-[15px] font-semibold text-spruce">{f.value}</dd>
                  <dd className="text-[13px] text-ink-mute">{f.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ─── Colonne visuelle ─── */}
          {/* PAS de .hero-rise ici : cette photo est le candidat LCP. Un
              conteneur en opacity:0 empêcherait de compter l'image comme peinte
              et dégraderait la mesure de vitesse. Seule la carte flottante
              (non-LCP) monte en cascade. */}
          <div className="relative mx-auto w-full max-w-[540px] lg:mx-0">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] bg-white shadow-hero">
              <Image
                src="/assets/devanture.webp"
                alt="Devanture de la boutique BodyStart Nutrition à Coignières"
                fill
                sizes="(max-width: 1024px) 92vw, 540px"
                className="object-cover"
                priority
                quality={70}
              />
              {/* Voile bas très léger : assoit la photo et évite que la carte
                  flottante se perde sur une zone claire de l'image. */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-spruce/25 to-transparent"
              />
            </div>

            {/* Carte flottante qui DÉBORDE de la photo (négatif + z-index) :
                c'est ce chevauchement qui crée la sensation de profondeur. */}
            <div className="hero-rise hero-rise-3 absolute -bottom-6 -left-4 z-10 max-w-[260px] rounded-2xl border border-white/70 bg-white/85 p-4 shadow-lift backdrop-blur-md sm:-left-8">
              <p className="font-display text-[15px] font-bold leading-snug text-spruce">
                Le conseil est gratuit.
              </p>
              <p className="mt-1 text-[13px] leading-[1.5] text-ink-mute">
                On prend le temps de comprendre ton objectif avant de te vendre quoi que ce
                soit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
