const CART_FRAGMENT = `
  fragment CartFragment on Cart {
    id
    checkoutUrl
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
    # Montants réellement déduits par code — affichés dans le récap et le
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
    # Attributs personnalisés du cart (dont "Point Relais" Mondial Relay).
    attributes {
      key
      value
    }
    # Adresses de livraison posées sur le cart (pré-remplissage checkout).
    # Sert à connaître les IDs existants pour les remplacer si le client
    # change de relais (évite l'accumulation d'adresses).
    delivery {
      addresses {
        id
        selected
      }
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
      # stock (ou toute erreur métier) passait silencieusement — le « + »
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

// ─── Mondial Relay : adresse de livraison du relais sur le cart ───
// cartBuyerIdentityUpdate.deliveryAddressPreferences N'EXISTE PAS sur la
// Storefront API 2024-04 (ni 2023-10 → 2025-04 sur ce store). Le mécanisme
// disponible est le jeu de mutations dédiées cartDeliveryAddresses* (présent
// dès 2024-04). On ADD une adresse "selected" ; on REMOVE les précédentes
// quand le client change de relais. validationStrategy COUNTRY_CODE_ONLY :
// une adresse de point relais ne valide pas toujours en strict.
export const ADD_CART_DELIVERY_ADDRESSES = `
  ${CART_FRAGMENT}
  mutation AddCartDeliveryAddresses($cartId: ID!, $addresses: [CartSelectableAddressInput!]!) {
    cartDeliveryAddressesAdd(cartId: $cartId, addresses: $addresses) {
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

export const REMOVE_CART_DELIVERY_ADDRESSES = `
  ${CART_FRAGMENT}
  mutation RemoveCartDeliveryAddresses($cartId: ID!, $addressIds: [ID!]!) {
    cartDeliveryAddressesRemove(cartId: $cartId, addressIds: $addressIds) {
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
