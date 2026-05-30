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
 * Vrai si le produit est un "pack" au sens catalogue : productType "Pack"
 * (insensible a la casse) OU tag "pack". Utilise pour exclure les packs de
 * la grille "Tous les produits".
 *
 * Plus large et moins couteux qu'isBundle (qui exige les composants) : ici
 * on n'a souvent qu'un ProductCard fragment (productType + tags), pas les
 * composants. Couvre donc les deux criteres de tag Adam.
 */
export function isPackProduct(product: {
  productType?: string
  tags?: string[]
}): boolean {
  if ((product.productType ?? '').trim().toLowerCase() === 'pack') return true
  return (product.tags ?? []).some((t) => t.trim().toLowerCase() === 'pack')
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

/**
 * Images des composants pour une ligne de panier (bundle).
 * Repli visuel quand le bundle n'a pas de featuredImage propre (volontaire :
 * la galerie de la fiche empile les composants dynamiquement, on ne met pas
 * d'image composite statique sur le produit bundle).
 *
 * Priorité par composant : image de la variante du composant > featuredImage
 * du produit composant. On filtre ceux sans image pour ne pas créer de trous.
 */
export interface CartLineMerchandiseLike {
  components?: {
    nodes: {
      productVariant: {
        image: ShopifyImage | null
        product: { featuredImage: ShopifyImage | null }
      }
    }[]
  } | null
}

export function getCartLineComponentImages(
  merchandise: CartLineMerchandiseLike
): ShopifyImage[] {
  const nodes = merchandise.components?.nodes ?? []
  return nodes
    .map((n) => n.productVariant?.image ?? n.productVariant?.product?.featuredImage ?? null)
    .filter((x): x is ShopifyImage => !!x && !!x.url)
}

// ════════════════════════════════════════════════════════════════════
// SÉLECTEURS DE VARIANTE DE BUNDLE — logique pure (testable)
// ════════════════════════════════════════════════════════════════════
//
// Modèle : l'app Shopify Bundles crée sur le bundle des OPTIONS NOMMÉES
// "{Produit} ({Type})" (ex "Sub Zero Whey Isolate (Poids)"). Chaque
// variante de bundle porte ces options dans selectedOptions. On pilote
// les sélecteurs là-dessus — robuste, sans dépendre de l'ordre/présence
// des composants.
//
// Piège réel (Pack Sèche) : certaines combinaisons d'options existent
// comme variante de bundle MAIS avec un composant manquant (ex Sub Zero
// chocolate-muffin en 810g n'existe pas → la variante de bundle existe,
// availableForSale=true, mais SANS composant Sub Zero). Ces variantes
// "incomplètes" ne doivent pas être proposées. On les détecte en
// comparant l'ensemble des produits composants présents à l'ensemble
// attendu (union sur toutes les variantes).

export interface BundleAxis {
  name: string
  values: string[]
}

/** Ensemble des product ids composants attendus (union sur toutes variantes). */
export function getExpectedComponentProductIds(variants: ShopifyProductVariant[]): string[] {
  const ids = new Set<string>()
  for (const v of variants) {
    for (const c of v.components?.nodes ?? []) {
      const id = c.productVariant?.product?.id
      if (id) ids.add(id)
    }
  }
  return Array.from(ids)
}

/** Une variante est "complète" si elle contient TOUS les produits composants attendus. */
export function isVariantComplete(
  variant: ShopifyProductVariant,
  expectedIds: string[]
): boolean {
  if (expectedIds.length === 0) return true
  const present = new Set(
    (variant.components?.nodes ?? [])
      .map((c) => c.productVariant?.product?.id)
      .filter((x): x is string => !!x)
  )
  return expectedIds.every((id) => present.has(id))
}

/**
 * Variantes de bundle réellement proposables : composants complets.
 * Si le bundle n'a pas de composants (cas dégénéré), on renvoie tout
 * pour ne jamais aboutir à un sélecteur vide.
 */
export function getCompleteBundleVariants(
  variants: ShopifyProductVariant[]
): ShopifyProductVariant[] {
  const expected = getExpectedComponentProductIds(variants)
  if (expected.length === 0) return variants
  const complete = variants.filter((v) => isVariantComplete(v, expected))
  return complete.length > 0 ? complete : variants
}

/** Variante initiale à afficher : 1re complète + en vente, sinon 1re complète, sinon variants[0]. */
export function pickInitialBundleVariant(
  variants: ShopifyProductVariant[]
): ShopifyProductVariant {
  const complete = getCompleteBundleVariants(variants)
  return complete.find((v) => v.availableForSale) ?? complete[0] ?? variants[0]
}

/** Valeur d'une option nommée sur une variante. */
export function variantOptionValue(v: ShopifyProductVariant, name: string): string {
  return v.selectedOptions?.find((o) => o.name === name)?.value ?? ''
}

/**
 * Axes des sélecteurs = options nommées du bundle, dans l'ordre d'apparition,
 * avec leurs valeurs distinctes. Construit à partir des variantes complètes.
 */
export function buildBundleAxes(completeVariants: ShopifyProductVariant[]): BundleAxis[] {
  const order: string[] = []
  const valuesByName = new Map<string, string[]>()
  for (const v of completeVariants) {
    for (const o of v.selectedOptions ?? []) {
      if (!valuesByName.has(o.name)) {
        valuesByName.set(o.name, [])
        order.push(o.name)
      }
      const arr = valuesByName.get(o.name)!
      if (!arr.includes(o.value)) arr.push(o.value)
    }
  }
  return order.map((name) => ({ name, values: valuesByName.get(name) ?? [] }))
}

/**
 * Une valeur d'option est disponible si une variante complète existe avec
 * cette valeur ET respectant toutes les AUTRES sélections en cours.
 * → gère la dépendance entre options (810g ⇒ seules saveurs existant en 810g).
 */
export function isBundleOptionAvailable(
  completeVariants: ShopifyProductVariant[],
  axes: BundleAxis[],
  currentSelection: Record<string, string>,
  name: string,
  value: string
): boolean {
  return completeVariants.some(
    (v) =>
      variantOptionValue(v, name) === value &&
      axes.every(
        (a) => a.name === name || variantOptionValue(v, a.name) === currentSelection[a.name]
      )
  )
}

/**
 * Résout la variante de bundle à sélectionner après changement d'une option.
 * Match exact d'abord ; sinon meilleure variante complète qui fixe l'option
 * modifiée et conserve un max d'autres sélections (en préférant en-vente).
 */
export function resolveBundleVariantOnChange(
  completeVariants: ShopifyProductVariant[],
  axes: BundleAxis[],
  currentSelection: Record<string, string>,
  name: string,
  value: string
): ShopifyProductVariant | null {
  const target = { ...currentSelection, [name]: value }
  const exact = completeVariants.find((v) =>
    axes.every((a) => variantOptionValue(v, a.name) === target[a.name])
  )
  if (exact) return exact

  const candidates = completeVariants.filter((v) => variantOptionValue(v, name) === value)
  if (candidates.length === 0) return null

  return (
    candidates
      .map((v) => ({
        v,
        score: axes.reduce(
          (s, a) =>
            s +
            (a.name !== name && variantOptionValue(v, a.name) === currentSelection[a.name] ? 1 : 0),
          0
        ),
        avail: v.availableForSale ? 1 : 0,
      }))
      .sort((a, b) => b.score - a.score || b.avail - a.avail)[0]?.v ?? candidates[0]
  )
}
