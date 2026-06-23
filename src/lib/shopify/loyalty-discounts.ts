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
 * Cree un code Shopify pour le parrainage (-10 € sur 1ere commande filleul ≥ 60 €).
 *
 * Specs cle :
 *   - Code = referralCode (BS-XXXXX) du parrain.
 *   - Montant fixe -10 €.
 *   - Prerequisite : subtotal ≥ 60 € (la commande doit faire au moins ce montant).
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
            amount: 10.0, // 10 euros (parrainage à vie)
            appliesOnEachItem: false,
          },
        },
        items: { all: true },
      },
      minimumRequirement: {
        subtotal: { greaterThanOrEqualToSubtotal: 60.0 },
      },
      // 1 fois par filleul (1re commande) ; usable par plusieurs filleuls.
      appliesOncePerCustomer: true,
      usageLimit: null,
      // Aucune combinaison → NON cumulable avec BIENVENUE10 ni autre code.
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
 * Cree le code de réduction Shopify d'un AMBASSADEUR (-10% à vie sur la commande).
 *
 * Recette EXACTE validée (cf. test E2EAMBA10) :
 *   - code manuel (saisi au checkout), -10% sur TOUS les articles,
 *   - NON combinable (order/product/shipping = false),
 *   - SANS minimum d'achat, SANS limite d'usage, appliesOncePerCustomer = false,
 *   - pas d'endsAt → actif tant que l'ambassadeur l'est.
 *
 * Renvoie un résultat discriminé (pas d'exception) pour que l'appelant gère
 * proprement le cas « code déjà pris » (retry avec suffixe).
 */
export async function createAmbassadorDiscountCode(opts: {
  code: string
  ambassadorEmail?: string | null
}): Promise<{ ok: true; shopifyDiscountNodeId: string } | { ok: false; codeTaken: boolean; message: string }> {
  const data = await shopifyAdminFetch<CreateBasicResponse>(CREATE_BASIC_DISCOUNT, {
    input: {
      title: `Ambassadeur ${opts.code}${opts.ambassadorEmail ? ` (${opts.ambassadorEmail})` : ''}`,
      code: opts.code,
      startsAt: new Date().toISOString(),
      customerSelection: { all: true },
      customerGets: {
        value: { percentage: 0.1 },
        items: { all: true },
      },
      appliesOncePerCustomer: false,
      usageLimit: null,
      combinesWith: {
        orderDiscounts: false,
        productDiscounts: false,
        shippingDiscounts: false,
      },
    },
  })
  const result = data.discountCodeBasicCreate
  if (result.userErrors.length > 0) {
    const message = result.userErrors.map((e) => `${e.field?.join('.') ?? ''}: ${e.message}`).join(' | ')
    const codeTaken = result.userErrors.some(
      (e) => /taken|exists|déjà|already/i.test(e.message) || e.code === 'TAKEN'
    )
    return { ok: false, codeTaken, message }
  }
  if (!result.codeDiscountNode?.id) {
    return { ok: false, codeTaken: false, message: 'Pas de codeDiscountNode retourné' }
  }
  return { ok: true, shopifyDiscountNodeId: result.codeDiscountNode.id }
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
 * Cree un code Shopify pour une DÉPENSE de cagnotte AMBASSADEUR (montant fixe, usage unique).
 *
 * Specs cle (cf. 00013_ambassador_redemptions) :
 *   - Code = AMB-XXXXXXXX (distinct des codes fidélité LY- et des codes -10% ambassadeur).
 *   - Montant fixe = amountCents (remise sur l'ensemble du panier).
 *   - minimumRequirement = 2 × amountCents → garantit que la remise s'applique
 *     TOUJOURS en entier (jamais tronquée) et respecte le cap 50% du panier.
 *   - endsAt = now + 1h (anti-fuite : Shopify rejette le code après).
 *   - usageLimit = 1, appliesOncePerCustomer = true.
 *   - combinesWith : shipping uniquement → NON cumulable (ni BIENVENUE10, ni
 *     code -10% ambassadeur, ni autre remise produit/commande).
 *
 * @returns { shopifyDiscountNodeId, discountCode }
 * @throws si userErrors non vide
 */
export async function createAmbassadorRedemptionDiscountCode(opts: {
  ambassadorHint: string // email de l'ambassadeur, pour le title
  amountCents: number
  expiresAt: Date
}): Promise<{ shopifyDiscountNodeId: string; discountCode: string }> {
  if (!Number.isInteger(opts.amountCents) || opts.amountCents <= 0) {
    throw new Error('[createAmbassadorRedemptionDiscountCode] amountCents doit etre un entier positif')
  }
  if (!(opts.expiresAt instanceof Date) || Number.isNaN(opts.expiresAt.getTime())) {
    throw new Error('[createAmbassadorRedemptionDiscountCode] expiresAt doit etre une Date valide')
  }

  const random = Math.random().toString(16).slice(2, 10).toUpperCase().padEnd(8, '0')
  const code = `AMB-${random}`
  const amountEuros = opts.amountCents / 100
  // Cap 50% : panier requis ≥ 2× le montant → la remise fixe s'applique en entier.
  const minSubtotalEuros = (opts.amountCents * 2) / 100

  const data = await shopifyAdminFetch<CreateBasicResponse>(CREATE_BASIC_DISCOUNT, {
    input: {
      title: `Cagnotte ambassadeur ${code} (${opts.ambassadorHint})`,
      code,
      startsAt: new Date().toISOString(),
      endsAt: opts.expiresAt.toISOString(),
      customerSelection: { all: true },
      customerGets: {
        value: { discountAmount: { amount: amountEuros, appliesOnEachItem: false } },
        items: { all: true },
      },
      minimumRequirement: {
        subtotal: { greaterThanOrEqualToSubtotal: minSubtotalEuros },
      },
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
    throw new Error(`[createAmbassadorRedemptionDiscountCode] Shopify userErrors: ${messages}`)
  }
  if (!result.codeDiscountNode?.id) {
    throw new Error('[createAmbassadorRedemptionDiscountCode] Pas de codeDiscountNode retourne')
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
export async function deleteDiscountCode(shopifyDiscountNodeId: string): Promise<boolean> {
  if (!shopifyDiscountNodeId) return true
  const data = await shopifyAdminFetch<DeleteResponse>(DELETE_DISCOUNT, {
    id: shopifyDiscountNodeId,
  })
  const result = data.discountCodeDelete
  if (result.userErrors.length > 0) {
    const messages = result.userErrors.map((e) => `${e.field?.join('.') ?? ''}: ${e.message}`).join(' | ')
    // On ne throw pas (pour ne pas casser un batch de cleanup) MAIS on renvoie
    // false : le caller doit savoir que la suppression a échoué (ex. compensation
    // d'un code orphelin → ne pas prétendre que le nettoyage a réussi).
    console.warn('[deleteDiscountCode] userErrors:', messages, 'id:', shopifyDiscountNodeId)
    return false
  }
  return true
}
