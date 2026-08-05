/**
 * Flux produit Google Merchant — logique pure (testable sans réseau).
 *
 * RSS 2.0 + namespace g: (http://base.google.com/ns/1.0), un <item> par
 * VARIANTE achetable. Source : Admin API (le barcode/GTIN n'existe pas en
 * Storefront). Règles anti-suspension :
 *   - aucun item sans prix, sans image ou sans lien ;
 *   - prix = prix Shopify (le même que la fiche produit → concordance) ;
 *   - exclusion des produits taggés `exclu-google` et des non-publiés
 *     online store (onlineStoreUrl null).
 */

// ─── Types (sous-ensemble Admin API utilisé) ───

export interface FeedVariant {
  id: string // gid://shopify/ProductVariant/123
  title: string // "Vanille / 810g" ou "Default Title"
  sku: string | null
  barcode: string | null
  price: string // "29.9"
  compareAtPrice: string | null
  inventoryQuantity: number | null
  inventoryPolicy: 'CONTINUE' | 'DENY' | null
  image: { url: string } | null
}

export interface FeedProduct {
  id: string // gid://shopify/Product/123
  title: string
  handle: string
  descriptionHtml: string | null
  vendor: string | null
  productType: string | null
  tags: string[]
  onlineStoreUrl: string | null
  featuredImage: { url: string } | null
  images: { nodes: { url: string }[] }
  variants: { nodes: FeedVariant[] }
}

export const EXCLUDE_TAG = 'exclu-google'

// IDs relevés dans la taxonomie OFFICIELLE Google le 2026-08-05
// (google.com/basepages/producttype/taxonomy-with-ids.en-US.txt) :
//   525  = Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements
//   2984 = Health & Beauty > Health Care > Fitness & Nutrition > Nutrition Bars
//   5723 = Food, Beverages & Tobacco > Beverages > Sports & Energy Drinks
// ⚠️ BUG HISTORIQUE corrigé : le feed envoyait 2984 pour TOUT le catalogue en
// le croyant « Vitamins & Supplements » — 2984 est en réalité « Nutrition
// Bars » : tous les produits étaient déclarés à Google comme des barres.
// Accessoires (shaker, entonnoir, serviette…) : AUCUNE catégorie émise — trop
// hétérogènes pour un mapping par productType, l'auto-classification Google
// fait mieux qu'une catégorie fausse.
export function googleCategoryFor(productType: string | null): string | null {
  switch (productType) {
    case 'Snacks':
      return '2984' // Nutrition Bars (barres et cookies protéinés)
    case 'Boissons':
      return '5723' // Sports & Energy Drinks
    case 'Accessoires':
      return null
    default:
      return '525' // Vitamins & Supplements (protéines, créatine, santé…)
  }
}

// ─── Échappement XML ───

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** CDATA sûre : une séquence `]]>` dans le texte casserait la section. */
export function cdata(s: string): string {
  return `<![CDATA[${s.replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`
}

/** descriptionHtml → texte brut (tags retirés, entités décodées, espaces normalisés). */
export function htmlToText(html: string): string {
  return html
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6])[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&eacute;/gi, 'é')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
}

/**
 * GTIN valide = 8/12/13/14 chiffres avec clé GS1 correcte (EAN-13, UPC-A…).
 * Tout le reste (codes internes, vides, "N/A") → pas de g:gtin émis.
 */
export function isValidGtin(barcode: string | null | undefined): barcode is string {
  if (!barcode) return false
  const digits = barcode.trim()
  if (!/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(digits)) return false
  // Clé GS1 : somme pondérée 1/3 depuis la droite (hors clé), mod 10
  const nums = digits.split('').map(Number)
  const check = nums.pop()!
  const sum = nums.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0)
  return (10 - (sum % 10)) % 10 === check
}

/** "29.9" → "29.90 EUR" (TTC, point décimal — format Google). */
export function formatGooglePrice(amount: string): string | null {
  const n = parseFloat(amount)
  if (!Number.isFinite(n) || n <= 0) return null
  return `${n.toFixed(2)} EUR`
}

export function numericId(gid: string): string {
  return gid.split('/').pop() ?? gid
}

// ─── Construction du flux ───

export interface FeedItemCounters {
  items: number
  skippedNoImage: number
  skippedNoPrice: number
  skippedProducts: number // exclu-google / non publié / sans handle
}

export function buildGoogleFeedXml(
  products: FeedProduct[],
  siteUrl: string
): { xml: string; counters: FeedItemCounters } {
  const base = siteUrl.replace(/\/+$/, '')
  const counters: FeedItemCounters = { items: 0, skippedNoImage: 0, skippedNoPrice: 0, skippedProducts: 0 }
  const items: string[] = []

  for (const p of products) {
    // Exclusions produit (le filtre query-side existe aussi ; ceinture+bretelles)
    if (!p.handle || !p.onlineStoreUrl || p.tags.includes(EXCLUDE_TAG)) {
      counters.skippedProducts++
      continue
    }

    const link = `${base}/products/${encodeURIComponent(p.handle)}`
    const brand = p.vendor?.trim() || 'BodyStart'
    const description = (htmlToText(p.descriptionHtml ?? '') || p.title).slice(0, 5000)
    const groupId = numericId(p.id)
    const productImages = [
      ...(p.featuredImage ? [p.featuredImage.url] : []),
      ...p.images.nodes.map((i) => i.url),
    ].filter((u, i, arr) => u.startsWith('https://') && arr.indexOf(u) === i)
    const multiVariant = p.variants.nodes.length > 1

    for (const v of p.variants.nodes) {
      const mainImage = (v.image?.url?.startsWith('https://') && v.image.url) || productImages[0]
      if (!mainImage) {
        counters.skippedNoImage++
        continue
      }

      const isSale = v.compareAtPrice != null && parseFloat(v.compareAtPrice) > parseFloat(v.price)
      const price = formatGooglePrice(isSale ? v.compareAtPrice! : v.price)
      const salePrice = isSale ? formatGooglePrice(v.price) : null
      if (!price) {
        counters.skippedNoPrice++
        continue
      }

      const additional = productImages.filter((u) => u !== mainImage).slice(0, 10)
      const title =
        multiVariant && v.title && v.title !== 'Default Title' ? `${p.title} - ${v.title}` : p.title
      const sku = v.sku?.trim() || null
      const gtin = isValidGtin(v.barcode) ? v.barcode.trim() : null
      const inStock =
        (v.inventoryQuantity ?? 0) > 0 || v.inventoryPolicy === 'CONTINUE'

      const fields = [
        `<g:id>${escapeXml(sku ?? numericId(v.id))}</g:id>`,
        `<g:item_group_id>${escapeXml(groupId)}</g:item_group_id>`,
        `<title>${cdata(title)}</title>`,
        `<g:description>${cdata(description)}</g:description>`,
        `<link>${escapeXml(link)}</link>`,
        `<g:image_link>${escapeXml(mainImage)}</g:image_link>`,
        ...additional.map((u) => `<g:additional_image_link>${escapeXml(u)}</g:additional_image_link>`),
        `<g:availability>${inStock ? 'in_stock' : 'out_of_stock'}</g:availability>`,
        `<g:price>${price}</g:price>`,
        ...(salePrice ? [`<g:sale_price>${salePrice}</g:sale_price>`] : []),
        `<g:brand>${cdata(brand)}</g:brand>`,
        ...(gtin ? [`<g:gtin>${gtin}</g:gtin>`] : []),
        ...(sku ? [`<g:mpn>${escapeXml(sku)}</g:mpn>`] : []),
        // identifier_exists=no UNIQUEMENT si ni gtin ni (brand+mpn)
        ...(!gtin && !sku ? ['<g:identifier_exists>no</g:identifier_exists>'] : []),
        `<g:condition>new</g:condition>`,
        ...(() => {
          const cat = googleCategoryFor(p.productType)
          return cat ? [`<g:google_product_category>${cat}</g:google_product_category>`] : []
        })(),
        ...(p.productType ? [`<g:product_type>${cdata(p.productType)}</g:product_type>`] : []),
      ]
      items.push(`    <item>\n      ${fields.join('\n      ')}\n    </item>`)
      counters.items++
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>BodyStart Nutrition</title>
    <link>${escapeXml(base)}</link>
    <description>Compléments alimentaires sport et santé — BodyStart Nutrition, Coignières (78). Whey, créatine, vitamines, accompagnement en boutique.</description>
${items.join('\n')}
  </channel>
</rss>
`
  return { xml, counters }
}
