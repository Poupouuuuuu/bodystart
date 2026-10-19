import { PRODUCT_CARD_FRAGMENT } from './products'

export const GET_COLLECTIONS = `
  query GetCollections($first: Int!) {
    collections(first: $first) {
      nodes {
        id
        handle
        title
        description
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

export const GET_COLLECTION_BY_HANDLE = `
  query GetCollectionByHandle($handle: String!, $productsFirst: Int!) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        url
        altText
        width
        height
      }
      products(first: $productsFirst) {
        nodes {
          id
          handle
          availableForSale
          title
          description
          tags
          vendor
          productType
          featuredImage {
            url
            altText
            width
            height
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 1) {
            nodes {
              id
              availableForSale
              quantityAvailable
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              requiresComponents
              components(first: 12) {
                nodes {
                  quantity
                  productVariant {
                    id
                    title
                    image {
                      url
                      altText
                      width
                      height
                    }
                    product {
                      id
                      handle
                      title
                      featuredImage {
                        url
                        altText
                        width
                        height
                      }
                      metafields(identifiers: [
                        { namespace: "custom", key: "format" }
                      ]) {
                        namespace
                        key
                        value
                        type
                      }
                    }
                  }
                }
              }
            }
          }
          metafields(identifiers: [
            { namespace: "custom", key: "composition" }
          ]) {
            namespace
            key
            value
            type
          }
        }
      }
    }
  }
`

// Produits d'une collection au format carte catalogue (variantes et prix de
// carte), meilleures ventes d'abord : sélection de saison de l'accueil.
export const GET_COLLECTION_CARTES = `
  ${PRODUCT_CARD_FRAGMENT}
  query CollectionCartes($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      products(first: $first, sortKey: BEST_SELLING) {
        nodes {
          ...ProductCard
        }
      }
    }
  }
`
