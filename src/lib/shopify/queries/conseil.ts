// Guide /conseil (Storefront API).

/** Metafield boutique `bodystart.guide_conseil` (type json, accès Storefront PUBLIC_READ). */
export const GET_GUIDE_CONSEIL = `
  query GetGuideConseil {
    shop {
      metafield(namespace: "bodystart", key: "guide_conseil") {
        value
      }
    }
  }
`

const GUIDE_PRODUCT_FRAGMENT = `
  fragment GuideProduct on Product {
    id
    handle
    title
    featuredImage {
      url
      altText
      width
      height
    }
    variants(first: 100) {
      nodes {
        id
        title
        availableForSale
        price {
          amount
          currencyCode
        }
        image {
          url
          altText
          width
          height
        }
      }
    }
  }
`

/**
 * Tous les produits du guide en UNE requête : un alias par handle (p0, p1…),
 * chaque handle passé en variable (jamais interpolé dans la requête).
 */
export function buildGuideProductsQuery(count: number): string {
  const vars = Array.from({ length: count }, (_, i) => `$h${i}: String!`).join(', ')
  const fields = Array.from({ length: count }, (_, i) => `p${i}: product(handle: $h${i}) { ...GuideProduct }`).join('\n    ')
  return `
  ${GUIDE_PRODUCT_FRAGMENT}
  query GetGuideConseilProducts(${vars}) {
    ${fields}
  }
`
}
