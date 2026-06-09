/**
 * BodyStart Loyalty — fonctions pures testables.
 *
 * Spec : tech-specs/loyalty-system-spec-v2.md §3.
 * Aucune dependance Supabase / I/O. Toutes les valeurs sont en CENTIMES (integers).
 *
 * Reutilise par :
 *   - le webhook Shopify (Sprint L2)
 *   - la route caisse /api/loyalty/finalize (Sprint L2)
 *   - le widget redemption en ligne (Sprint L3)
 *   - les tests unitaires (Sprint L1)
 */

// ============================================================
// Constantes metier (verrouillees, cf. spec V2 §0)
// ============================================================

/** 5% des achats du filleul → cagnotte du parrain (À VIE, sur chaque commande). */
export const REFERRAL_COMMISSION_RATE = 0.05

/**
 * @deprecated Le parrainage est désormais À VIE : la commission parrain n'a plus
 * de fenêtre d'expiration (cf. migration 00008 + finalize_order_loyalty).
 * Conservé pour compat (helpers calcReferralCommissionUntil / isWithinReferralWindow
 * non utilisés par le runtime money). first_purchase_at reste posé ; la commission
 * est créditée tant que le lien referrals est 'active'.
 */
export const REFERRAL_WINDOW_MONTHS = 12

/** -10€ sur la 1ere commande du filleul (≥ 60€). Pas cumulable avec BIENVENUE10. */
export const FILLEUL_DISCOUNT_CENTS = 1000

/** Montant minimum d'une 1ere commande pour debloquer le -10€ filleul : 60€. */
export const FILLEUL_MIN_ORDER_CENTS = 6000

/** Solde minimum pour pouvoir utiliser sa cagnotte : 20€. */
export const REDEEM_MIN_BALANCE_CENTS = 2000

/** Plafond d'utilisation de la cagnotte par commande : 50% du panier. */
export const REDEEM_CART_CAP_RATIO = 0.5

/** Alphabet du code parrain : sans 0/O/1/I/L (eviter les confusions visuelles). */
export const REFERRAL_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Prefixe du code parrain. */
export const REFERRAL_CODE_PREFIX = 'BS-'

/** Longueur de la partie aleatoire du code. */
export const REFERRAL_CODE_LENGTH = 5

// ============================================================
// Fonctions de calcul (pures, deterministes hors generateReferralCode)
// ============================================================

/**
 * Commission versee au parrain sur une commande du filleul.
 *
 * Base = montant produits paye par le filleul (hors livraison, hors taxe,
 * apres remises et apres deduction de sa propre cagnotte eventuelle).
 *
 * Retourne 0 si l'entree est invalide (negative, non entier, NaN).
 *
 * @param filleulPaidCents Montant paye par le filleul en centimes (entier ≥ 0)
 * @returns Commission en centimes (entier ≥ 0), arrondi a l'inferieur
 */
export function calcReferrerCommissionCents(filleulPaidCents: number): number {
  if (!Number.isInteger(filleulPaidCents)) return 0
  if (filleulPaidCents < 0) return 0
  return Math.floor(filleulPaidCents * REFERRAL_COMMISSION_RATE)
}

/**
 * Cagnotte maximum utilisable par le parrain sur SA commande.
 *
 * Regles :
 *   - si balance < 20€   → 0 (interdit d'utiliser sous le seuil)
 *   - si panier ≤ 0      → 0 (defense)
 *   - sinon              → min(balance, 50% du panier), arrondi a l'inferieur
 *
 * @param cartSubtotalCents Sous-total panier en centimes (entier > 0)
 * @param balanceCents Solde actuel de cagnotte en centimes (entier ≥ 0)
 * @returns Montant max utilisable en centimes (entier ≥ 0)
 */
export function maxRedeemableCents(cartSubtotalCents: number, balanceCents: number): number {
  if (!Number.isInteger(cartSubtotalCents) || cartSubtotalCents <= 0) return 0
  if (!Number.isInteger(balanceCents) || balanceCents < 0) return 0
  if (balanceCents < REDEEM_MIN_BALANCE_CENTS) return 0
  const cap = Math.floor(cartSubtotalCents * REDEEM_CART_CAP_RATIO)
  return Math.min(balanceCents, cap)
}

/**
 * Genere un code parrainage au format `BS-XXXXX`.
 *
 * Alphabet sans 0/O/1/I/L. La verification d'unicite en base se fait au moment
 * de l'insert (contrainte UNIQUE + boucle de retry cote serveur).
 *
 * Utilise Math.random (non cryptographique mais suffisant : 31^5 = ~28.6M combinaisons,
 * la verification UNIQUE en base previent les collisions reelles).
 *
 * @returns Code au format BS-XXXXX (8 caracteres au total)
 */
export function generateReferralCode(): string {
  const chars: string[] = []
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    const idx = Math.floor(Math.random() * REFERRAL_CODE_ALPHABET.length)
    chars.push(REFERRAL_CODE_ALPHABET[idx])
  }
  return REFERRAL_CODE_PREFIX + chars.join('')
}

/**
 * Date de fin de la fenetre de commission parrain pour un filleul.
 *
 * @param firstPurchaseAt Date du 1er achat du filleul
 * @returns Date + 12 mois (pure, ne mute pas l'input)
 */
export function calcReferralCommissionUntil(firstPurchaseAt: Date): Date {
  const d = new Date(firstPurchaseAt.getTime())
  d.setMonth(d.getMonth() + REFERRAL_WINDOW_MONTHS)
  return d
}

/**
 * Indique si une commande tombe dans la fenetre 12 mois ouvrant droit a commission
 * pour le parrain du filleul.
 *
 * @param firstPurchaseAt Date du 1er achat du filleul (null si pas encore acheté)
 * @param now Date a comparer (par defaut : maintenant)
 * @returns true si commission due, false sinon
 */
export function isWithinReferralWindow(
  firstPurchaseAt: Date | null | undefined,
  now: Date = new Date()
): boolean {
  if (!firstPurchaseAt) return false
  const until = calcReferralCommissionUntil(firstPurchaseAt)
  return now.getTime() <= until.getTime()
}

/**
 * Indique si une commande du filleul est eligible au -5€ (1ere commande, ≥ 40€).
 *
 * @param orderTotalCents Total de la commande en centimes
 * @param hasFirstPurchase Le filleul a-t-il deja fait un achat ?
 */
export function isFilleulDiscountEligible(orderTotalCents: number, hasFirstPurchase: boolean): boolean {
  if (hasFirstPurchase) return false
  if (!Number.isInteger(orderTotalCents)) return false
  return orderTotalCents >= FILLEUL_MIN_ORDER_CENTS
}

/**
 * Valide la forme d'un code parrainage : `BS-XXXXX` avec X ∈ alphabet autorise.
 * Utilise cote serveur pour valider les entrees user avant lookup en base.
 *
 * @param code Chaine a valider
 * @returns true si format valide, false sinon
 */
export function isValidReferralCode(code: string): boolean {
  if (typeof code !== 'string') return false
  const expectedLength = REFERRAL_CODE_PREFIX.length + REFERRAL_CODE_LENGTH
  if (code.length !== expectedLength) return false
  if (!code.startsWith(REFERRAL_CODE_PREFIX)) return false
  const tail = code.slice(REFERRAL_CODE_PREFIX.length)
  for (const ch of tail) {
    if (!REFERRAL_CODE_ALPHABET.includes(ch)) return false
  }
  return true
}
