/**
 * Interprete les discount_codes recus dans un webhook Shopify orders/paid.
 *
 * Pour chaque code utilise :
 *   - S'il matche un loyalty_customers.referral_code (autre que l'acheteur) :
 *     → c'est un code parrain → on alimente referredByCodeUsed
 *   - S'il matche un loyalty_redemptions.discount_code de l'acheteur (status='reserved') :
 *     → c'est une cagnotte → on alimente spentLoyaltyCents + appliedRedemptionId
 *   - Sinon : c'est un code inconnu (ex: code marketing, code promo lambda) → ignore
 *
 * Cette fonction est PURE : elle prend les donnees pre-fetched et calcule
 * le resultat. Les lookups Supabase sont faits dans la route webhook.
 * Cela permet de tester independamment chaque cas de figure.
 */
import { isValidReferralCode } from './calculate'

export interface ReferralCodeLookup {
  /** Code parrain (BS-XXXXX) */
  code: string
  /** Id du customer qui POSSEDE ce code (le parrain) */
  ownerId: string
}

export interface RedemptionLookup {
  /** Code cagnotte (LY-XXXXXXXX) */
  code: string
  /** Id loyalty_redemptions */
  id: string
  /** Montant reserve en centimes */
  amountCents: number
  /** Doit etre 'reserved' (les expired/applied sont filtres en amont) */
  status: 'reserved' | 'applied' | 'expired' | 'cancelled'
  /** Id du customer qui a fait la reservation */
  customerId: string
}

export interface InterpretInput {
  /** Codes extraits du payload Shopify (cf. parseShopifyOrder) */
  discountCodes: string[]
  /** Id du customer loyalty qui passe la commande */
  buyerCustomerId: string
  /** Lookups parrain : tous les codes BS-* trouves en base */
  referralLookups: ReferralCodeLookup[]
  /** Lookups cagnotte : toutes les redemptions trouvees pour ces codes */
  redemptionLookups: RedemptionLookup[]
}

export interface InterpretResult {
  /** Code parrain a passer a finalize (only si valide ET parrain != acheteur) */
  referredByCodeUsed: string | null
  /** Cents a passer a finalize en spentLoyaltyCents */
  spentLoyaltyCents: number
  /** Id loyalty_redemptions a marquer 'applied' apres finalize OK */
  appliedRedemptionId: string | null
  /** Diagnostics pour audit/log (codes ignores, doublons, etc.) */
  diagnostics: string[]
}

/**
 * Interprete les codes. Pure, deterministe, exhaustivement testable.
 *
 * Regles :
 *   - Si plusieurs codes parrain trouves : on garde le 1er (Shopify n'autorise
 *     qu'un code par commande de toute facon, ce cas ne devrait pas exister).
 *   - Si plusieurs codes redemption trouves : pareil, 1er gagne.
 *   - Si un code matche a la fois parrain ET redemption (impossible vu les
 *     prefixes BS-* vs LY-*, mais defense) : on prefere redemption (priorite
 *     a l'argent du client).
 *   - Anti auto-parrainage : si le code parrain trouve appartient a l'acheteur
 *     lui-meme, on l'ignore (la fonction finalize fait aussi ce check, mais
 *     ceinture+bretelles).
 */
export function interpretDiscountCodes(input: InterpretInput): InterpretResult {
  const diagnostics: string[] = []
  let referredByCodeUsed: string | null = null
  let spentLoyaltyCents = 0
  let appliedRedemptionId: string | null = null

  // Index les lookups pour O(1)
  const referralByCode = new Map(input.referralLookups.map((r) => [r.code, r]))
  const redemptionByCode = new Map(input.redemptionLookups.map((r) => [r.code, r]))

  for (const rawCode of input.discountCodes) {
    if (typeof rawCode !== 'string' || rawCode.length === 0) continue
    const code = rawCode.trim()
    if (code.length === 0) continue

    // Priorite : redemption > parrain (un code LY-* ne devrait jamais matcher
    // un BS-*, mais si jamais on a une collision on prefere debiter la cagnotte
    // = "l'argent du client" plutot que d'octroyer une remise parrain).
    const redemption = redemptionByCode.get(code)
    if (redemption) {
      if (redemption.customerId !== input.buyerCustomerId) {
        diagnostics.push(`Code ${code} appartient a un autre customer, ignore.`)
        continue
      }
      if (redemption.status !== 'reserved') {
        diagnostics.push(`Code ${code} statut ${redemption.status} (attendu reserved), ignore.`)
        continue
      }
      if (appliedRedemptionId) {
        diagnostics.push(`Code redemption ${code} ignore (deja un autre code applique).`)
        continue
      }
      spentLoyaltyCents = redemption.amountCents
      appliedRedemptionId = redemption.id
      continue
    }

    // Verifier si c'est un code parrain (format BS-XXXXX)
    if (isValidReferralCode(code)) {
      const referral = referralByCode.get(code)
      if (!referral) {
        diagnostics.push(`Code parrain ${code} non trouve en base, ignore.`)
        continue
      }
      if (referral.ownerId === input.buyerCustomerId) {
        diagnostics.push(`Auto-parrainage detecte sur ${code}, ignore.`)
        continue
      }
      if (referredByCodeUsed) {
        diagnostics.push(`Code parrain ${code} ignore (deja un autre code applique).`)
        continue
      }
      referredByCodeUsed = code
      continue
    }

    diagnostics.push(`Code ${code} inconnu (ni parrain ni cagnotte), ignore.`)
  }

  return {
    referredByCodeUsed,
    spentLoyaltyCents,
    appliedRedemptionId,
    diagnostics,
  }
}
