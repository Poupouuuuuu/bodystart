/**
 * Helpers Admin API Shopify pour la couche loyalty (Sprint L3).
 *
 * Distinct de `src/lib/shopify/discounts.ts` (qui sert au coaching legacy)
 * pour eviter de melanger 2 contextes metier.
 *
 * Spec V2 §5 (methode A).
 */
import { shopifyAdminFetch } from './client'

const CREATE_BASIC_DISCOUNT = `
  mutation CreateBasicDiscount($input: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $input) {
      codeDiscountNode {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            title
            status
            codes(first: 1) { nodes { code } }
            endsAt
          }
        }
      }
      userErrors { field message code }
    }
  }
`

const DELETE_DISCOUNT = `
  mutation DeleteDiscount($id: ID!) {
    discountCodeDelete(id: $id) {
      deletedCodeDiscountId
      userErrors { field message }
    }
  }
`

interface CreateBasicResponse {
  discountCodeBasicCreate: {
    codeDiscountNode: { id: string } | null
    userErrors: Array<{ field?: string[]; message: string; code?: string }>
  }
}

interface DeleteResponse {
  discountCodeDelete: {
    deletedCodeDiscountId: string | null
    userErrors: Array<{ field?: string[]; message: string }>
  }
}

/**
 * Cree un code Shopify pour le parrainage (-5 € sur 1ere commande filleul ≥ 40 €).
 *
 * Specs cle :
 *   - Code = referralCode (BS-XXXXX) du parrain.
 *   - Montant fixe -5 €.
 *   - Prerequisite : subtotal ≥ 40 € (la commande doit faire au moins ce montant).
 *   - Pas d'endsAt : le code reste valide tant que le parrain a un compte.
 *   - appliesOncePerCustomer = true : Shopify empeche la reutilisation par
 *     le meme compte client connecte (defense partielle vs guest fraud).
 *   - usageLimit = null : le code doit pouvoir servir a plusieurs filleuls.
 *   - combinesWith : shipping OK, le reste interdit (la commission parrain
 *     vit cote Supabase, pas besoin de cumul cote Shopify).
 *
 * @returns GID Shopify du code cree (ex: gid://shopify/DiscountCodeNode/123)
 * @throws si userErrors non vide (caller doit catch + logger pour reparation)
 */
export async function createReferralDiscountCode(opts: {
  referralCode: string
  parrainEmail?: string | null
}): Promise<string> {
  const titleSuffix = opts.parrainEmail ? ` (${opts.parrainEmail})` : ''
  const data = await shopifyAdminFetch<CreateBasicResponse>(CREATE_BASIC_DISCOUNT, {
    input: {
      title: `Parrainage ${opts.referralCode}${titleSuffix}`,
      code: opts.referralCode,
      startsAt: new Date().toISOString(),
      // endsAt omis → code valide indefiniment
      customerSelection: { all: true },
      customerGets: {
        value: {
          discountAmount: {
            amount: 5.0, // 5 euros
            appliesOnEachItem: false,
          },
        },
        items: { all: true },
      },
      minimumRequirement: {
        subtotal: { greaterThanOrEqualToSubtotal: 40.0 },
      },
      appliesOncePerCustomer: true,
      usageLimit: null,
      combinesWith: {
        orderDiscounts: false,
        productDiscounts: false,
        shippingDiscounts: true,
      },
    },
  })

  const result = data.discountCodeBasicCreate
  if (result.userErrors.length > 0) {
    const messages = result.userErrors.map((e) => `${e.field?.join('.') ?? ''}: ${e.message}`).join(' | ')
    throw new Error(`[createReferralDiscountCode] Shopify userErrors: ${messages}`)
  }
  if (!result.codeDiscountNode?.id) {
    throw new Error('[createReferralDiscountCode] Pas de codeDiscountNode retourne')
  }
  return result.codeDiscountNode.id
}

/**
 * Cree un code Shopify pour une redemption cagnotte (montant fixe, usage unique).
 *
 * Specs cle :
 *   - Code = chaine generee unique (ex: LY-{uuid8})
 *   - Montant fixe = amountCents (converti en euros pour Shopify)
 *   - Prerequisite : subtotal ≥ 2 * amountCents (cap 50% spec V2 §3,
 *     mais on laisse 0 ici et c'est notre route /api/loyalty/redeem-online
 *     qui valide ; Shopify n'a pas le panier en temps reel pour la regle 50%)
 *   - endsAt = now + 1h : Shopify rejette le code apres → anti-fuite
 *   - usageLimit = 1
 *   - appliesOncePerCustomer = true
 *   - combinesWith : shipping OK, rien d'autre
 *
 * @returns { gid, code } — le code Shopify a appliquer au panier
 * @throws si userErrors non vide
 */
export async function createRedemptionDiscountCode(opts: {
  customerHint: string // ex: phone E.164 ou id customer, pour le title
  amountCents: number
  expiresAt: Date
  cartSubtotalCents?: number // optionnel, pour minimum requirement defensive
}): Promise<{ shopifyDiscountNodeId: string; discountCode: string }> {
  if (!Number.isInteger(opts.amountCents) || opts.amountCents <= 0) {
    throw new Error('[createRedemptionDiscountCode] amountCents doit etre un entier positif')
  }
  if (!(opts.expiresAt instanceof Date) || Number.isNaN(opts.expiresAt.getTime())) {
    throw new Error('[createRedemptionDiscountCode] expiresAt doit etre une Date valide')
  }

  // Code unique : LY-XXXXXXXX (X = 8 chars hex)
  const random = Math.random().toString(16).slice(2, 10).toUpperCase().padEnd(8, '0')
  const code = `LY-${random}`

  const amountEuros = opts.amountCents / 100

  const data = await shopifyAdminFetch<CreateBasicResponse>(CREATE_BASIC_DISCOUNT, {
    input: {
      title: `Cagnotte ${code} (${opts.customerHint})`,
      code,
      startsAt: new Date().toISOString(),
      endsAt: opts.expiresAt.toISOString(),
      customerSelection: { all: true },
      customerGets: {
        value: {
          discountAmount: {
            amount: amountEuros,
            appliesOnEachItem: false,
          },
        },
        items: { all: true },
      },
      // Defense supplementaire : le panier doit etre ≥ 2x l'amount (cap 50%)
      // Note : c'est une 2eme barriere ; la verif principale est cote
      // /api/loyalty/redeem-online (qui voit le panier reel).
      ...(opts.cartSubtotalCents
        ? {
            minimumRequirement: {
              subtotal: { greaterThanOrEqualToSubtotal: (opts.cartSubtotalCents / 100) },
            },
          }
        : {}),
      appliesOncePerCustomer: true,
      usageLimit: 1,
      combinesWith: {
        orderDiscounts: false,
        productDiscounts: false,
        shippingDiscounts: true,
      },
    },
  })

  const result = data.discountCodeBasicCreate
  if (result.userErrors.length > 0) {
    const messages = result.userErrors.map((e) => `${e.field?.join('.') ?? ''}: ${e.message}`).join(' | ')
    throw new Error(`[createRedemptionDiscountCode] Shopify userErrors: ${messages}`)
  }
  if (!result.codeDiscountNode?.id) {
    throw new Error('[createRedemptionDiscountCode] Pas de codeDiscountNode retourne')
  }

  return { shopifyDiscountNodeId: result.codeDiscountNode.id, discountCode: code }
}

/**
 * Supprime un code Shopify. Utilise pour le cleanup eventuel des codes morts.
 * Idempotent (Shopify accepte les ids inexistants en general, mais on protege).
 *
 * Note : un code expire (endsAt passe) ne fonctionne plus cote checkout, donc
 * pas urgent de le supprimer. Cette fonction sert au cleanup manuel mensuel.
 */
export async function deleteDiscountCode(shopifyDiscountNodeId: string): Promise<void> {
  if (!shopifyDiscountNodeId) return
  const data = await shopifyAdminFetch<DeleteResponse>(DELETE_DISCOUNT, {
    id: shopifyDiscountNodeId,
  })
  const result = data.discountCodeDelete
  if (result.userErrors.length > 0) {
    const messages = result.userErrors.map((e) => `${e.field?.join('.') ?? ''}: ${e.message}`).join(' | ')
    // On ne throw pas pour ne pas casser un batch de cleanup — on log et continue
    console.warn('[deleteDiscountCode] userErrors:', messages, 'id:', shopifyDiscountNodeId)
  }
}
