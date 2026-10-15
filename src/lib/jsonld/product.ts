// Schéma Product des fiches (SEO 2, demande de Claude Gestion du 10/10/2026).
//
// - Une variante : un Product avec un Offer.
// - Plusieurs variantes (saveurs, formats) : un ProductGroup, une entrée
//   hasVariant par variante, chacune avec son prix, sa disponibilité et son
//   Offer. Google l'interdit en AggregateOffer (« Don't use AggregateOffer to
//   describe a set of product variants ») et ne l'accepte pas pour les fiches
//   marchandes, qui exigent un Offer. Avant : un seul Offer, au prix de la
//   variante affichée (Protimuscle à 44,90 € alors que la fiche dit
//   « dès 23,90 € »).
// - Identifiants : GTIN du code-barres Shopify quand il est valide (clé GS1,
//   même règle que le flux Google Merchant), propriété adaptée à sa longueur
//   (gtin13 pour un EAN-13, gtin12 pour un UPC). sku : le SKU Shopify s'il
//   existe, sinon l'identifiant numérique de la variante, le même que
//   l'identifiant de l'article dans le flux Merchant (g:id) : Google demande un
//   identifiant unique par variante.
// - Pas de Product du tout sans image : Google l'exige pour les fiches
//   marchandes.
// - Description tirée du HTML, avec un espace entre les paragraphes (le
//   champ texte de Shopify les colle : « 500 g.La créatine »).
//
// Pur, sans réseau. Testé dans product.test.ts.

import { isValidGtin, numericId } from '@/lib/google-feed'
import { plainTextFromHtml, truncateAtWord } from '@/lib/seo'

export interface VarianteSchema {
  id: string
  title: string
  availableForSale: boolean
  price: { amount: string; currencyCode: string }
  image?: { url: string } | null
  selectedOptions?: { name: string; value: string }[]
  sku?: string | null
  barcode?: string | null
}

export interface ProduitSchema {
  id: string
  handle: string
  title: string
  vendor?: string | null
  description?: string | null
  descriptionHtml?: string | null
  images: { url: string }[]
  variants: VarianteSchema[]
}

export interface OptionsSchema {
  siteUrl: string
  /** Propriétés communes à chaque Offer (livraison, retours, vendeur). */
  offre?: Record<string, unknown>
  /** Propriétés ajoutées au Product ou au ProductGroup (aggregateRating). */
  extra?: Record<string, unknown>
}

const MAX_IMAGES = 5
const MAX_DESCRIPTION = 500

/** Propriété GTIN adaptée à la longueur du code-barres, ou rien s'il est invalide. */
export function gtinSchema(barcode: string | null | undefined): Record<string, string> {
  if (!isValidGtin(barcode)) return {}
  const code = barcode.trim()
  return { [`gtin${code.length}`]: code }
}

/** Texte de la description : paragraphes séparés par un espace, coupé au mot. */
export function descriptionSchema(p: Pick<ProduitSchema, 'description' | 'descriptionHtml'>): string {
  const texte = plainTextFromHtml(p.descriptionHtml) || (p.description ?? '').replace(/\s+/g, ' ').trim()
  return truncateAtWord(texte, MAX_DESCRIPTION)
}

/** « Chocolat, 1 kg » d'après les options, sinon le titre de la variante. */
function libelleVariante(v: VarianteSchema): string {
  const valeurs = (v.selectedOptions ?? []).map((o) => o.value.trim()).filter(Boolean)
  if (valeurs.length > 0 && !(valeurs.length === 1 && valeurs[0] === 'Default Title')) return valeurs.join(', ')
  return v.title && v.title !== 'Default Title' ? v.title : ''
}

function offre(v: VarianteSchema, url: string, commun: Record<string, unknown>) {
  return {
    '@type': 'Offer',
    url,
    priceCurrency: v.price.currencyCode || 'EUR',
    price: v.price.amount,
    availability: v.availableForSale ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
    ...commun,
  }
}

const identifiants = (v: VarianteSchema) => ({
  sku: v.sku?.trim() || numericId(v.id),
  ...gtinSchema(v.barcode),
})

/**
 * JSON-LD de la fiche : Product (une variante) ou ProductGroup (plusieurs),
 * ou null si le produit n'a ni image ni variante vendable (prix > 0).
 */
export function productSchema(
  p: ProduitSchema,
  { siteUrl, offre: commun = {}, extra = {} }: OptionsSchema,
): Record<string, unknown> | null {
  const images = [...new Set(p.images.map((i) => i.url).filter((u) => u?.startsWith('https://')))].slice(0, MAX_IMAGES)
  const variantes = p.variants.filter((v) => Number(v.price.amount) > 0)
  if (images.length === 0 || variantes.length === 0) return null

  const url = `${siteUrl}/products/${p.handle}`
  const description = descriptionSchema(p)
  const brand = { '@type': 'Brand', name: p.vendor?.trim() || 'BodyStart Nutrition' }

  if (variantes.length === 1) {
    const v = variantes[0]
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${url}#produit`,
      name: p.title,
      description,
      image: images,
      url,
      brand,
      ...identifiants(v),
      offers: offre(v, url, commun),
      ...extra,
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'ProductGroup',
    '@id': `${url}#produit`,
    name: p.title,
    description,
    image: images,
    url,
    brand,
    productGroupID: numericId(p.id),
    hasVariant: variantes.map((v) => {
      const libelle = libelleVariante(v)
      const urlVariante = `${url}?variant=${numericId(v.id)}`
      return {
        '@type': 'Product',
        name: libelle ? `${p.title} - ${libelle}` : p.title,
        image: v.image?.url?.startsWith('https://') ? v.image.url : images[0],
        ...identifiants(v),
        offers: offre(v, urlVariante, commun),
      }
    }),
    ...extra,
  }
}
