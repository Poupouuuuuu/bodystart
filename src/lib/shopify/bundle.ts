/**
 * Helpers bundle (Shopify Bundles app).
 *
 * Source unique : Storefront API > ProductVariant.components(first:N).
 * Adam tague aussi ses bundles avec productType="Pack" et tag "pack" en
 * complement, mais la source de verite pour "est-ce un bundle ?" reste
 * la presence de composants sur la 1ere variante (requiresComponents=true).
 *
 * Pourquoi pas seulement productType : un produit peut avoir productType
 * "Pack" sans etre un vrai bundle Shopify (ex : ancien produit nomme
 * "pack" avant adoption de l'app). On veut garantir que l'UI bundle
 * ne se declenche que sur de vrais bundles.
 */
import type { ShopifyProduct, ShopifyBundleComponent, ShopifyProductVariant, ShopifyImage } from './types'

export interface BundleComponentImage {
  url: string
  altText: string | null
  width: number
  height: number
  productTitle: string
  productHandle: string
  quantity: number
}

/**
 * Description riche d'un composant pour une variante de bundle donnee.
 * - image : image de la variante du composant (variant-specific) ;
 *   fallback featuredImage du produit composant.
 * - format : grammage / contenance lu sur le metafield custom.format
 *   du produit composant (peut etre null si absent).
 * - variantTitle : titre de la variante du composant actuellement
 *   choisie (ex : "Chocolat", "Vanille").
 */
export interface BundleComponentDetail {
  image: ShopifyImage | null
  productTitle: string
  productHandle: string
  format: string | null
  variantTitle: string
  quantity: number
}

function extractComponentFormat(c: ShopifyBundleComponent): string | null {
  const metafields = c.productVariant.product.metafields ?? []
  const found = metafields.find((m) => m && m.key === 'format')
  const val = found?.value?.trim()
  return val || null
}

/**
 * Detection bundle : on regarde la premiere variante. Tous les variants
 * d'un bundle Shopify partagent la meme structure de composants (les
 * variants exposent juste les selections internes des composants, pas
 * la liste). Donc tester variants[0] suffit.
 *
 * On accepte aussi le fallback productType === 'Pack' au cas ou la query
 * ne retourne pas les composants (token ancien, version d'API < 2024-04).
 * Ca garantit que la page /products/[handle] pour un pack ne crash pas
 * meme si l'API ne renvoie pas la structure attendue.
 */
export function isBundle(product: ShopifyProduct): boolean {
  const v0 = product.variants?.nodes?.[0]
  if (v0?.requiresComponents) return true
  if ((v0?.components?.nodes?.length ?? 0) > 0) return true
  // Fallback heuristique
  return product.productType === 'Pack'
}

/**
 * Liste des images des composants pour un bundle, ordre Shopify (= ordre
 * d'ajout dans l'app Bundles). On filtre les composants sans featuredImage
 * pour ne pas casser la grille avec des trous.
 *
 * Note : pour les bundles multi-variants (ex : "Pack Prise de masse" 30
 * variants pour combinaisons de saveurs), on prend les composants de
 * variants[0] : tous les variants exposent les MEMES product components,
 * seule la selection interne (saveur de chaque composant) change.
 */
export function getBundleComponentImages(product: ShopifyProduct): BundleComponentImage[] {
  const v0 = product.variants?.nodes?.[0]
  const components: ShopifyBundleComponent[] = v0?.components?.nodes ?? []
  return components
    .map((c) => {
      const img = c.productVariant.product.featuredImage
      if (!img?.url) return null
      return {
        url: img.url,
        altText: img.altText,
        width: img.width,
        height: img.height,
        productTitle: c.productVariant.product.title,
        productHandle: c.productVariant.product.handle,
        quantity: c.quantity,
      }
    })
    .filter((x): x is BundleComponentImage => x !== null)
}

/**
 * Description detaillee des composants pour UNE variante de bundle donnee
 * (variant-aware). Utilisee cote fiche pack pour rendre le hero (galerie)
 * dynamique selon la selection en cours dans BundleSelectorsV2.
 *
 * Priorite image : variant-image > product.featuredImage > null.
 * Le format est lu sur le produit (pas la variante) car c'est le
 * grammage cote contenant — meme pour toutes les saveurs.
 *
 * Renvoie un tableau de la MEME longueur que selectedVariant.components,
 * avec une entree par composant meme si image est null (le rendu cote UI
 * gere le placeholder pour ne pas decaler la grille).
 */
export function getBundleComponentDetailsFromVariant(
  variant: ShopifyProductVariant | undefined
): BundleComponentDetail[] {
  const components: ShopifyBundleComponent[] = variant?.components?.nodes ?? []
  return components.map((c) => {
    const variantImage = c.productVariant.image
    const productImage = c.productVariant.product.featuredImage
    return {
      image: variantImage ?? productImage ?? null,
      productTitle: c.productVariant.product.title,
      productHandle: c.productVariant.product.handle,
      format: extractComponentFormat(c),
      variantTitle: c.productVariant.title,
      quantity: c.quantity,
    }
  })
}
