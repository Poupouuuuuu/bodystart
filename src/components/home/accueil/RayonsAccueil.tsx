import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Image from '@/components/ui/Image'
import type { RayonAccueil } from '@/lib/shopify/rayons-accueil'

/**
 * Rayons en tuiles (refonte du 28/11/2026, liste de Gestion) : titre et
 * sous-titre court, un produit du rayon sur le fond végétal (même fichier
 * que les cartes produit, déjà téléchargé). 2 colonnes sur téléphone, 4 sur
 * ordinateur. Libellés exacts des rayons (maillage SEO, comme le menu).
 */
export default function RayonsAccueil({ rayons }: { rayons: RayonAccueil[] }) {
  if (rayons.length === 0) return null
  return (
    <section aria-labelledby="titre-rayons" className="bg-canvas">
      <div className="container pb-10 md:pb-16">
        <h2
          id="titre-rayons"
          className="mb-4 font-display text-[22px] font-extrabold leading-tight tracking-tight text-spruce md:mb-6 md:text-[28px]"
        >
          Les rayons
        </h2>
        <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 lg:gap-4">
          {rayons.map((r) => (
            <li key={r.cle}>
              <Link
                href={r.href}
                className="press group flex h-full min-h-[76px] items-center gap-3 overflow-hidden rounded-[18px] bg-white p-2 pr-3 shadow-card transition-shadow duration-300 ease-out-expo hover:shadow-lift md:gap-4 md:p-2.5 md:pr-4"
              >
                <span
                  className="relative block h-[60px] w-[60px] shrink-0 overflow-hidden rounded-[13px] bg-sage bg-cover bg-bottom md:h-[72px] md:w-[72px]"
                  style={{ backgroundImage: "url('/bg-vegetal-800.webp')" }}
                >
                  {r.image && (
                    <span className="absolute inset-[10%]">
                      <Image
                        src={r.image.url}
                        alt=""
                        fill
                        sizes="72px"
                        className="object-contain transition-transform duration-500 ease-out-expo [filter:drop-shadow(0_6px_8px_rgba(45,90,45,0.28))] group-hover:scale-[1.07]"
                      />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[15px] font-bold leading-tight text-spruce md:text-[17px]">
                    {r.label}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-ink-mute md:text-[13px]">{r.sousTitre}</span>
                </span>
                <ArrowRight
                  className="hidden h-4 w-4 shrink-0 text-spruce/50 transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5 sm:block"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
