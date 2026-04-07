// ─── Admin API — Inventory queries ───────────────────────────

export const GET_PRODUCT_INVENTORY_BY_LOCATION = `
  query GetProductInventoryByLocation($productId: ID!) {
    product(id: $productId) {
      variants(first: 50) {
        nodes {
          id
          title
          inventoryItem {
            id
            inventoryLevels(first: 10) {
              nodes {
                location {
                  id
                }
                quantities(names: ["available"]) {
                  name
                  quantity
                }
              }
            }
          }
        }
      }
    }
  }
`

export const GET_INVENTORY_FOR_VARIANTS = `
  query GetInventoryForVariants($variantIds: [ID!]!) {
    nodes(ids: $variantIds) {
      ... on ProductVariant {
        id
        title
        inventoryItem {
          id
          inventoryLevels(first: 10) {
            nodes {
              location {
                id
              }
              quantities(names: ["available"]) {
                name
                quantity
              }
            }
          }
        }
      }
    }
  }
`
