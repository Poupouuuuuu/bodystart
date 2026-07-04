export const PRODUCT_CARD_FRAGMENT = `
  fragment ProductCard on Product {
    id
    handle
    title
    tags
    vendor
    productType
    availableForSale
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
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    collections(first: 5) {
      nodes {
        handle
        title
      }
    }
    variants(first: 2) {
      # first: 2 (et pas 1) : le quick-add « + » des cartes doit savoir si le
      # produit a PLUSIEURS variantes (nodes.length > 1) pour renvoyer vers la
      # fiche (choix de saveur) au lieu d'ajouter la 1re à l'aveugle. Les
      # consommateurs n'utilisent que nodes[0] pour le prix — payload +1 variante.
      nodes {
        id
        title
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
      }
    }
  }
`

export const GET_PRODUCTS = `
  ${PRODUCT_CARD_FRAGMENT}
  query GetProducts($first: Int!, $after: String, $sortKey: ProductSortKeys, $reverse: Boolean, $query: String) {
    products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, query: $query) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ...ProductCard
      }
    }
  }
`

export const SEARCH_PRODUCTS = `
  ${PRODUCT_CARD_FRAGMENT}
  query SearchProducts($query: String!, $first: Int!) {
    products(first: $first, query: $query, sortKey: RELEVANCE) {
      nodes {
        ...ProductCard
      }
    }
  }
`

export const GET_PRODUCT_BY_HANDLE = `
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      tags
      vendor
      productType
      seo {
        title
        description
      }
      featuredImage {
        url
        altText
        width
        height
      }
      images(first: 20) {
        nodes {
          url
          altText
          width
          height
        }
      }
      variants(first: 100) {
        nodes {
          id
          title
          availableForSale
          quantityAvailable
          image {
            url
            altText
            width
            height
          }
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
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
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      collections(first: 1) {
        nodes {
          handle
          title
        }
      }
      metafields(identifiers: [
        { namespace: "custom", key: "composition" },
        { namespace: "custom", key: "conseils_d_utilisation" },
        { namespace: "custom", key: "valeurs_nutritionnelles" },
        { namespace: "custom", key: "ingredients" },
        { namespace: "custom", key: "usage" },
        { namespace: "custom", key: "nutrition_facts" },
        { namespace: "custom", key: "format" },
        { namespace: "custom", key: "allergenes" }
      ]) {
        namespace
        key
        value
        type
      }
    }
  }
`

// Featured = 8 meilleures ventes, AVEC les composants de bundle (pour que
// les cartes packs affichent les pots empiles en cross-sell — CrossSellV2
// utilise getFeaturedProducts() en fallback).
// Requete dediee (pas le fragment ProductCard partage) : on n'ajoute PAS
// les composants au fragment global, sinon la requete catalogue (first:250)
// exploserait le cout Storefront. Ici first:8 → cout maitrise.
export const GET_FEATURED_PRODUCTS = `
  query GetFeaturedProducts {
    products(first: 8, sortKey: BEST_SELLING) {
      nodes {
        id
        handle
        title
        tags
        vendor
        productType
        availableForSale
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
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        collections(first: 5) {
          nodes {
            handle
            title
          }
        }
        variants(first: 2) {
          # first: 2 (et pas 1), comme PRODUCT_CARD_FRAGMENT : le quick-add
          # « + » de ProductCardShop (home best-sellers) doit savoir si le
          # produit a PLUSIEURS variantes (nodes.length > 1) pour renvoyer
          # vers la fiche (choix de saveur) au lieu d'ajouter la 1re à
          # l'aveugle. Les consommateurs n'utilisent que nodes[0] pour le
          # prix et les composants de bundle.
          nodes {
            id
            title
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
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`
