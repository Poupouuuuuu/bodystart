import Link from 'next/link'
import Image from '@/components/ui/Image'
import type { RayonAccueil } from '@/lib/shopify/rayons-accueil'

/**
 * Rayons en tuiles (refonte du 28/11/2026) : les 9 pages /categories, un
 * produit en stock du rayon sur le fond végétal (même fichier que les cartes
 * produit, déjà téléchargé). 3 colonnes sur téléphone, une rangée de 9 sur
 * ordinateur. Liens au libellé exact du rayon (maillage SEO, comme le menu).
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
        <ul className="grid grid-cols-3 gap-2.5 sm:gap-3 md:grid-cols-5 lg:grid-cols-9 lg:gap-4">
          {rayons.map((r) => (
            <li key={r.slug}>
              <Link
                href={r.href}
                className="press group flex h-full flex-col overflow-hidden rounded-[18px] bg-white shadow-card transition-shadow duration-300 ease-out-expo hover:shadow-lift"
              >
                <span
                  className="relative block aspect-[5/4] overflow-hidden bg-sage bg-cover bg-bottom"
                  style={{ backgroundImage: "url('/bg-vegetal-800.webp')" }}
                >
                  {r.image && (
                    <span className="absolute inset-x-[16%] bottom-[8%] top-[12%]">
                      <Image
                        src={r.image.url}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 110px, (min-width: 768px) 18vw, 30vw"
                        className="object-contain object-bottom transition-transform duration-500 ease-out-expo [filter:drop-shadow(0_10px_12px_rgba(45,90,45,0.28))] group-hover:scale-[1.06]"
                      />
                    </span>
                  )}
                </span>
                <span className="flex min-h-[44px] flex-1 items-center justify-center px-1.5 py-2 text-center font-display text-[13px] font-bold leading-[1.15] text-spruce sm:text-[14px]">
                  {r.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
