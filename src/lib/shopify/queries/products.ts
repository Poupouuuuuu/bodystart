export const PRODUCT_CARD_FRAGMENT = `
  fragment ProductCard on Product {
    id
    handle
    title
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
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 1) {
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
      featuredImage {
        url
        altText
        width
        height
      }
      images(first: 10) {
        nodes {
          url
          altText
          width
          height
        }
      }
      variants(first: 20) {
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
          selectedOptions {
            name
            value
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
      metafields(identifiers: [
        { namespace: "custom", key: "ingredients" },
        { namespace: "custom", key: "usage" },
        { namespace: "custom", key: "nutrition_facts" }
      ]) {
        namespace
        key
        value
        type
      }
    }
  }
`

export const GET_FEATURED_PRODUCTS = `
  ${PRODUCT_CARD_FRAGMENT}
  query GetFeaturedProducts {
    collection(handle: "featured") {
      products(first: 8) {
        nodes {
          ...ProductCard
        }
      }
    }
  }
`
