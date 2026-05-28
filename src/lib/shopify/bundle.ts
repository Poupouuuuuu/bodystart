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
import type { ShopifyProduct, ShopifyBundleComponent } from './types'

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
