import Link from 'next/link'
import Image from 'next/image'
import { Store, MessageCircle, ArrowRight } from 'lucide-react'

/**
 * "Le conseil qu'aucun site n'a" — section differenciante.
 * Cf. tech-specs/redesign-v2-direction-artistique.md §B.Home.5
 *
 * DA : photo boutique a venir (placeholder neutre), texte + CTA, layout 2 colonnes
 * Click & Collect en accent secondaire.
 */
export default function ConseilDifferenciantV2() {
  // PREMIUM V2 — RYTHME DES SECTIONS : la home enchaînait canvas, canvas,
  // white, white → deux paires de fonds identiques collées, les chapitres se
  // fondaient les uns dans les autres. Cette section adopte une TROISIÈME
  // surface (vert très pâle) : elle se détache à la fois des best-sellers
  // (crème) et du bandeau parrainage (blanc), et le différenciateur de la
  // marque gagne son propre plan. Sûr ici : la section ne contient aucune
  // carte blanche qui disparaîtrait (seul le cadre de secours de l'image).
  return (
    <section className="bg-sage/40">
      {/* Rythme : les sections NARRATIVES respirent plus large (py-16/24) que
          les bandeaux compacts (py-12) — un padding identique partout donne une
          page qui défile « à plat ». Bas légèrement plus généreux que le haut :
          correction optique classique. */}
      <div className="container py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Visuel : intérieur de la boutique */}
          <div className="order-2 lg:order-1">
            <div className="relative aspect-[5/4] w-full rounded-2xl overflow-hidden border border-spruce/10 bg-white">
              <Image
                src="/assets/interieur.webp"
                alt="Intérieur de la boutique BodyStart Nutrition à Coignières"
                fill
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover"
              />
            </div>
          </div>

          {/* Texte */}
          <div className="order-1 lg:order-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
              Le conseil qu&apos;aucun site n&apos;a
            </p>
            <h2 className="font-display text-[32px] md:text-[42px] font-extrabold text-spruce leading-[1.05] tracking-tight mb-6">
              Un humain qui connaît ce qu&apos;il vend.
            </h2>
            <p className="text-ink-mute text-[17px] leading-[1.65] mb-8 max-w-[520px]">
              On ne référence pas tout ce qui existe. On teste les marques, on lit les
              étiquettes, on vérifie les dosages — et on ne met en rayon que ce qu&apos;on
              prendrait nous-mêmes. Si un produit ne sert à rien, on te le dira.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link
                href="/conseil"
                className="inline-flex items-center justify-center gap-2 bg-fresh text-white font-semibold text-[15px] px-7 py-3.5 rounded-full transition-colors hover:bg-fresh-deep"
              >
                <MessageCircle className="w-4 h-4" />
                Demander conseil
              </Link>
              <Link
                href="/stores"
                className="inline-flex items-center justify-center gap-2 bg-transparent border border-spruce text-spruce font-semibold text-[15px] px-7 py-3.5 rounded-full transition-colors hover:bg-spruce/5"
              >
                <Store className="w-4 h-4" />
                Passer en boutique
              </Link>
            </div>

            <div className="inline-flex items-center gap-2 bg-sage text-spruce text-[13px] font-semibold px-4 py-2 rounded-full">
              Click &amp; Collect gratuit, souvent prêt en quelques minutes
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
