const CART_FRAGMENT = `
  fragment CartFragment on Cart {
    id
    checkoutUrl
    buyerIdentity {
      email
    }
    totalQuantity
    lines(first: 50) {
      nodes {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            price {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
            product {
              id
              handle
              title
              productType
              tags
              featuredImage {
                url
                altText
                width
                height
              }
            }
            # Composants du bundle (Shopify Bundles) : sert de repli visuel
            # pour la vignette panier quand le bundle n'a pas de featuredImage.
            components(first: 12) {
              nodes {
                productVariant {
                  image {
                    url
                    altText
                    width
                    height
                  }
                  product {
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
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
      }
    }
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
      totalTaxAmount {
        amount
        currencyCode
      }
    }
    discountCodes {
      code
      applicable
    }
    # Montants réellement déduits par code, affichés dans le récap et le
    # widget cagnotte (« Cagnotte appliquée : -X € ») ; sans ça le client ne
    # voyait jamais combien sa remise a déduit.
    discountAllocations {
      discountedAmount {
        amount
        currencyCode
      }
      ... on CartCodeDiscountAllocation {
        code
      }
    }
    # Attributs personnalisés du cart (dont le point relais Mondial Relay).
    attributes {
      key
      value
    }
  }
`

export const CREATE_CART = `
  ${CART_FRAGMENT}
  mutation CreateCart($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart {
        ...CartFragment
      }
    }
  }
`

export const ADD_TO_CART = `
  ${CART_FRAGMENT}
  mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFragment
      }
    }
  }
`

export const UPDATE_CART = `
  ${CART_FRAGMENT}
  mutation UpdateCart($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFragment
      }
      # userErrors N'ÉTAIENT PAS requêtés : une quantité plafonnée par le
      # stock (ou toute erreur métier) passait silencieusement : le « + »
      # semblait mort, et cart pouvait être null → panier local effacé.
      userErrors {
        field
        message
      }
    }
  }
`

export const REMOVE_FROM_CART = `
  ${CART_FRAGMENT}
  mutation RemoveFromCart($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFragment
      }
    }
  }
`

// Rattache le panier au client connecté : checkout pré-rempli (email,
// adresses) et panier identifié côté Shopify (relance « panier abandonné »).
export const UPDATE_CART_BUYER_IDENTITY = `
  ${CART_FRAGMENT}
  mutation UpdateCartBuyerIdentity($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
`

export const GET_CART = `
  ${CART_FRAGMENT}
  query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      ...CartFragment
    }
  }
`

export const UPDATE_CART_ATTRIBUTES = `
  ${CART_FRAGMENT}
  mutation UpdateCartAttributes($cartId: ID!, $attributes: [AttributeInput!]!) {
    cartAttributesUpdate(cartId: $cartId, attributes: $attributes) {
      cart {
        ...CartFragment
      }
    }
  }
`

export const UPDATE_CART_DISCOUNT_CODES = `
  ${CART_FRAGMENT}
  mutation UpdateCartDiscountCodes($cartId: ID!, $discountCodes: [String!]) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
`
