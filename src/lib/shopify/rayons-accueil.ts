// Tuiles des rayons de l'accueil (refonte du 28/11/2026, liste de Gestion),
// côté serveur : 6 pages /categories avec un sous-titre court, et pour chaque
// rayon l'image d'un produit en stock (le plus vendu du productType,
// Storefront, une seule requête relue toutes les 6 heures au plus). Packs et
// coffrets s'ajoutent dans la page (images déjà lues). Sans Shopify : les
// tuiles restent, sans image.

import { unstable_cache } from 'next/cache'
import { CATEGORY_PAGES } from '@/lib/categories'
import { shopifyFetch } from './client'

export interface RayonAccueil {
  cle: string
  label: string
  sousTitre: string
  href: string
  image: { url: string; altText: string | null } | null
}

/** Rayons de l'accueil, dans l'ordre (pas de Brûleurs, décision de Gestion). */
export const RAYONS_ACCUEIL: { slug: string; sousTitre: string }[] = [
  { slug: 'proteines', sousTitre: 'Whey, isolate, vegan' },
  { slug: 'creatine', sousTitre: 'Monohydrate, en poudre ou gélules' },
  { slug: 'barres-proteinees', sousTitre: 'Pour la poche et le sac' },
  { slug: 'pre-workout', sousTitre: 'Avec ou sans caféine' },
  { slug: 'acides-amines', sousTitre: 'BCAA, EAA, glutamine' },
  { slug: 'sante', sousTitre: 'Vitamines, oméga 3, magnésium' },
]

/** Seuls les rayons dont la page /categories existe (jamais de lien en 404). */
export function rayonsExistants() {
  return RAYONS_ACCUEIL.flatMap((r) => {
    const page = CATEGORY_PAGES.find((c) => c.slug === r.slug)
    return page ? [{ ...r, label: page.label, productType: page.productType }] : []
  })
}

type Reponse = Record<string, { nodes: { featuredImage: { url: string; altText: string | null } | null }[] } | null>

const imagesEnCache = unstable_cache(
  async (): Promise<RayonAccueil['image'][]> => {
    const rayons = rayonsExistants()
    const variables = Object.fromEntries(
      rayons.map((r, i) => [`q${i}`, `product_type:${JSON.stringify(r.productType)} AND available_for_sale:true`])
    )
    const requete = `query RayonsAccueil(${rayons.map((_, i) => `$q${i}: String!`).join(', ')}) { ${rayons
      .map((_, i) => `r${i}: products(first: 1, sortKey: BEST_SELLING, query: $q${i}) { nodes { featuredImage { url altText } } }`)
      .join('\n')} }`
    const data = await shopifyFetch<Reponse>(requete, variables)
    return rayons.map((_, i) => data[`r${i}`]?.nodes[0]?.featuredImage ?? null)
  },
  ['rayons-accueil-v2'],
  { revalidate: 21600 }
)

/** Les rayons de l'accueil avec une image quand Shopify en donne une. */
export async function getRayonsAccueil(): Promise<RayonAccueil[]> {
  const rayons = rayonsExistants()
  const images = await imagesEnCache().catch(() => rayons.map(() => null))
  return rayons.map((r, i) => ({
    cle: r.slug,
    label: r.label,
    sousTitre: r.sousTitre,
    href: `/categories/${r.slug}`,
    image: images[i] ?? null,
  }))
}
