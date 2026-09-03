import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ArrowUpRight, MapPin, Star } from 'lucide-react'
import { GOOGLE_LISTING_URL, GOOGLE_RATING } from '@/lib/store-info'

/**
 * HERO V3 — immersif, pleine largeur.
 *
 * Retour d'Adam sur la V2 : « visuellement identique à la V1 ». Cause : même
 * squelette (texte à gauche / photo à droite dans un cadre) et mêmes couleurs.
 * Ici la boutique DEVIENT le hero : la photo de l'intérieur (étagères noires,
 * mur végétal, bois) couvre l'écran, le titre en Fraunces est posé dessus en
 * crème, très grand (jusqu'à 104 px). C'est l'identité réelle du lieu, pas un
 * habillage.
 *
 * Perf : la photo est le candidat LCP → `priority`, jamais masquée par une
 * animation. Seuls les éléments secondaires montent en cascade (.hero-rise).
 * Le h1 reste sans animation (règle V2).
 */
export default function HeroV3() {
  const note = GOOGLE_RATING.value.toLocaleString('fr-FR')

  return (
    <section className="relative isolate flex min-h-[92dvh] items-end overflow-hidden bg-[#0f160f]">
      <Image
        src="/assets/interieur.webp"
        alt="Intérieur de la boutique BodyStart Nutrition à Coignières : rayons de compléments, mur végétal et comptoir"
        fill
        priority
        quality={72}
        sizes="100vw"
        className="object-cover object-[50%_38%]"
      />
      {/* Voiles : sombre en bas (lisibilité du texte), plus léger en haut pour
          laisser respirer la photo ; second voile latéral côté texte. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,22,15,0.97)_0%,rgba(15,22,15,0.74)_36%,rgba(15,22,15,0.28)_68%,rgba(15,22,15,0.38)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(100deg,rgba(15,22,15,0.6)_0%,rgba(15,22,15,0)_58%)]"
      />

      <div className="container relative pb-10 pt-36 md:pb-14 md:pt-44">
        <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
          {/* ─── Titre ─── */}
          <div className="max-w-[920px]">
            <div className="hero-rise mb-6 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-white/85 backdrop-blur-md">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-mustard" />
                Coignières · Yvelines
              </span>
              <a
                href={GOOGLE_LISTING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[12px] font-semibold text-white backdrop-blur-md transition-colors duration-500 ease-out-expo hover:bg-white/20"
              >
                <Star className="h-3.5 w-3.5 fill-mustard text-mustard" aria-hidden="true" />
                {note}/5 · {GOOGLE_RATING.count} avis Google
              </a>
            </div>

            <h1 className="display-hero font-display text-[46px] font-extrabold leading-[0.94] tracking-[-0.025em] text-canvas sm:text-[60px] md:text-[76px] lg:text-[92px] xl:text-[104px]">
              Les bons compléments.
              <br />
              <span className="text-sage">Le bon conseil.</span>
            </h1>

            <p className="hero-rise hero-rise-1 mt-7 max-w-[560px] text-[17px] leading-[1.6] text-white/80 md:text-[19px]">
              Que tu veuilles prendre du muscle ou juste te sentir mieux au quotidien, on
              t&apos;aide à choisir ce qui te sert vraiment, et à zapper le reste. Produits
              propres, bien dosés, testés par nous.
            </p>

            <div className="hero-rise hero-rise-2 mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link
                href="/products"
                className="press group inline-flex items-center gap-3 rounded-full bg-canvas py-2 pl-6 pr-2 text-[15px] font-semibold text-spruce shadow-hero transition-all duration-500 ease-out-expo hover:bg-white"
              >
                Voir les produits
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-spruce text-canvas transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:scale-105">
                  <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                </span>
              </Link>
              <Link
                href="/conseil"
                className="group inline-flex items-center gap-2 text-[15px] font-semibold text-white/90 transition-colors duration-500 ease-out-expo hover:text-white"
              >
                Demander conseil
                <ArrowUpRight
                  className="h-4 w-4 transition-transform duration-500 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>

          {/* ─── Carte boutique (verre, double enceinte) ─── */}
          <div className="hero-rise hero-rise-3 lg:justify-self-end">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.06] p-1.5 backdrop-blur-xl">
              <div className="rounded-[calc(1.6rem-0.375rem)] bg-white/[0.08] px-5 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">
                  La boutique
                </p>
                <p className="mt-1.5 font-display text-[21px] font-bold leading-tight text-canvas">
                  Lun–Sam · 11h–19h
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-white/70">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  8 rue du Pont des Landes, Coignières
                </p>
                <Link
                  href="/stores"
                  className="group mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-sage transition-colors duration-500 ease-out-expo hover:text-white"
                >
                  Itinéraire &amp; infos
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-500 ease-out-expo group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Faits réels (pas de chiffres inventés) */}
        <dl className="hero-rise hero-rise-3 mt-12 flex flex-wrap gap-x-10 gap-y-3 border-t border-white/10 pt-6">
          {[
            { value: '13 ans', label: 'de conseil au comptoir' },
            { value: '+2 600', label: 'clients conseillés' },
            { value: 'Click & Collect', label: 'prêt en quelques minutes' },
          ].map((f) => (
            <div key={f.value} className="flex items-baseline gap-2">
              <dt className="sr-only">{f.label}</dt>
              <dd className="font-display text-[17px] font-bold text-canvas">{f.value}</dd>
              <dd className="text-[13px] text-white/60">{f.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
