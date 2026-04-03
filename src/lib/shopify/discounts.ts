import { shopifyAdminFetch } from './client'

// ─── Mutations Admin API pour les réductions coaching ────────

const CREATE_DISCOUNT_CODE = `
  mutation CreateDiscountCode($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            title
            codes(first: 1) {
              nodes { code }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`

const DEACTIVATE_DISCOUNT = `
  mutation DeactivateDiscount($id: ID!) {
    discountCodeDeactivate(id: $id) {
      codeDiscountNode {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`

const SEARCH_DISCOUNTS = `
  query SearchDiscounts($query: String!) {
    codeDiscountNodes(first: 5, query: $query) {
      nodes {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            title
            status
          }
        }
      }
    }
  }
`

/**
 * Crée un code promo -15% personnalisé pour un client coaching.
 * Le code est au format COACH-{email hash court} pour être unique.
 */
export async function createCoachingDiscount(
  stripeCustomerId: string,
  customerEmail: string
): Promise<string> {
  // Générer un code unique basé sur l'email
  const emailHash = customerEmail
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8)
    .toUpperCase()
  const code = `COACH-${emailHash}`

  const startsAt = new Date().toISOString()
  const endsAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 an

  await shopifyAdminFetch(CREATE_DISCOUNT_CODE, {
    basicCodeDiscount: {
      title: `Coaching -15% — ${customerEmail}`,
      code,
      startsAt,
      endsAt,
      customerSelection: {
        all: true,
      },
      customerGets: {
        value: {
          percentage: 0.15,
        },
        items: {
          all: true,
        },
      },
      usageLimit: null,
      appliesOncePerCustomer: false,
      combinesWith: {
        orderDiscounts: false,
        productDiscounts: false,
        shippingDiscounts: true,
      },
    },
  })

  return code
}

/**
 * Désactive le code promo coaching d'un client (lors de la résiliation).
 */
export async function deactivateCoachingDiscount(stripeCustomerId: string): Promise<void> {
  // Chercher le discount par titre contenant le customer ID
  const data = await shopifyAdminFetch<{
    codeDiscountNodes: {
      nodes: { id: string; codeDiscount: { title: string; status: string } }[]
    }
  }>(SEARCH_DISCOUNTS, { query: `title:Coaching AND title:${stripeCustomerId}` })

  for (const node of data.codeDiscountNodes.nodes) {
    if (node.codeDiscount.status === 'ACTIVE') {
      await shopifyAdminFetch(DEACTIVATE_DISCOUNT, { id: node.id })
    }
  }
}

/**
 * Récupère le code promo coaching d'un client (pour affichage dans le dashboard).
 */
export async function getCoachingDiscountCode(customerEmail: string): Promise<string | null> {
  const emailHash = customerEmail
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8)
    .toUpperCase()

  const data = await shopifyAdminFetch<{
    codeDiscountNodes: {
      nodes: { id: string; codeDiscount: { title: string; status: string } }[]
    }
  }>(SEARCH_DISCOUNTS, { query: `title:"Coaching -15% — ${customerEmail}"` })

  const active = data.codeDiscountNodes.nodes.find(
    (n) => n.codeDiscount.status === 'ACTIVE'
  )

  return active ? `COACH-${emailHash}` : null
}
