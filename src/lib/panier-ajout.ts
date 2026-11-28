// Ajout au panier : décider ce qui s'est vraiment passé (27/11/2026).
//
// Avant : toute exception sur cartLinesAdd faisait recréer un panier avec le
// seul nouvel article (le client perdait le reste), et un ajout refusé ou
// réduit par Shopify (rupture entre la page en cache et le clic) s'affichait
// « Produit ajouté au panier ! ». Ici, des fonctions pures, testées
// (panier-ajout.test.ts), que CartContext applique.
//
// Règles :
// - on ne recrée un panier QUE si Shopify dit que le panier n'existe plus
//   (userError sur le champ cartId, ou identifiant illisible) ;
// - toute autre exception (réseau, 5xx, limite de requêtes) est passagère :
//   on garde le panier et son identifiant, rien n'est annoncé comme ajouté ;
// - userErrors non vide = échec, message en français selon le code ;
// - quantité ajoutée < quantité demandée (ou alerte de stock) = on le dit.

import type { ShopifyCart } from '@/lib/shopify/types'
import { CADEAU_ATTR } from '@/lib/paliers'

/** CartUserError (Storefront 2026-10) : code CartErrorCode, field, message. */
export interface CartUserError {
  code?: string | null
  field?: string[] | null
  message: string
}

/** CartWarning (Storefront 2026-10) : code CartWarningCode, message, target. */
export interface CartWarning {
  code: string
  message?: string
  target?: string | null
}

const TELEPHONE = '07 61 84 75 80'

export const MESSAGES_PANIER = {
  passagere: `L'ajout n'a pas marché. Ton panier est intact, réessaie.`,
  refuseGenerique: `Cet article n'a pas pu être ajouté. Ton panier est intact. Réessaie ou appelle-nous au ${TELEPHONE}.`,
  stockInsuffisant: `Il ne reste plus assez de stock pour cet article.`,
  rupture: `Cet article vient de passer en rupture de stock. Rien n'a été ajouté à ton panier.`,
  plusDisponible: `Cet article n'est plus disponible à la vente.`,
  maximum: `Tu as atteint la quantité maximale pour cet article.`,
  quantiteInvalide: `Cette quantité n'est pas possible pour cet article.`,
  panierPlein: `Ton panier contient trop d'articles. Retires-en un pour continuer.`,
  panierRecree: `Ton ancien panier avait expiré. On en a ouvert un nouveau avec cet article.`,
  panierRecreeSelection: `Ton ancien panier avait expiré. On en a ouvert un nouveau avec ta sélection.`,
  selectionIncomplete: `Certains articles n'ont plus assez de stock. Vérifie ton panier.`,
} as const

/** Shopify dit que le panier n'existe plus (expiré, payé ou supprimé). */
export function panierIntrouvable(userErrors: CartUserError[] | null | undefined): boolean {
  return (userErrors ?? []).some((e) => e.field?.[0] === 'cartId')
}

/**
 * Exception levée par l'appel Shopify : « panier disparu » seulement si
 * l'identifiant stocké est illisible (Shopify rejette la variable $cartId,
 * il n'existera jamais). Tout le reste (réseau coupé, HTTP 5xx, 429,
 * « Throttled », délai dépassé) est passager : on garde le panier.
 */
export function issueErreurLevee(err: unknown): 'panier-disparu' | 'passagere' {
  const message = err instanceof Error ? err.message : typeof err === 'string' ? err : ''
  if (/\$cartId\b[^|]*invalid value/i.test(message)) return 'panier-disparu'
  return 'passagere'
}

/** Message client pour des userErrors Shopify (texte Shopify jamais affiché tel quel). */
export function messageErreursPanier(userErrors: CartUserError[]): string {
  const codes = userErrors.map((e) => e.code ?? '')
  const a = (...c: string[]) => codes.some((code) => c.includes(code))
  if (a('SERVICE_UNAVAILABLE')) return MESSAGES_PANIER.passagere
  if (a('MERCHANDISE_NOT_ENOUGH_STOCK')) return MESSAGES_PANIER.stockInsuffisant
  if (a('MERCHANDISE_OUT_OF_STOCK')) return MESSAGES_PANIER.rupture
  if (a('MAXIMUM_EXCEEDED')) return MESSAGES_PANIER.maximum
  if (a('MINIMUM_NOT_MET', 'INVALID_INCREMENT', 'LESS_THAN')) return MESSAGES_PANIER.quantiteInvalide
  if (a('CART_TOO_LARGE')) return MESSAGES_PANIER.panierPlein
  if (a('MERCHANDISE_NOT_APPLICABLE', 'INVALID_MERCHANDISE_LINE')) return MESSAGES_PANIER.plusDisponible
  // INVALID sur l'article : variante supprimée ou dépubliée.
  if (userErrors.some((e) => e.code === 'INVALID' && e.field?.includes('merchandiseId'))) {
    return MESSAGES_PANIER.plusDisponible
  }
  return MESSAGES_PANIER.refuseGenerique
}

/** Quantité d'une variante au panier, hors lignes cadeaux des paliers. */
export function quantiteAuPanier(cart: ShopifyCart | null | undefined, merchandiseId: string): number {
  if (!cart) return 0
  return cart.lines.nodes
    .filter((l) => l.merchandise.id === merchandiseId && !(l.attributes ?? []).some((a) => a.key === CADEAU_ATTR))
    .reduce((s, l) => s + l.quantity, 0)
}

/** Le panier renvoyé ne montre que 50 lignes (CartFragment) : au-delà, on ne compte pas. */
const LIGNES_MAX = 50

export type BilanAjout =
  /** Tout est au panier. */
  | { type: 'ajoute' }
  /** Une partie seulement (stock) : le panier a changé, le client doit le savoir. */
  | { type: 'partiel'; message: string }
  /** Rien n'a été ajouté (rupture, article refusé, erreur Shopify). */
  | { type: 'rien'; message: string }
  /** Shopify ne connaît plus ce panier : en ouvrir un nouveau. */
  | { type: 'panier-disparu' }

/**
 * Bilan d'un cartLinesAdd / cartCreate à partir de la réponse Shopify et du
 * panier d'avant (null pour un nouveau panier).
 */
export function bilanAjout(params: {
  avant: ShopifyCart | null | undefined
  apres: ShopifyCart | null | undefined
  demandes: { merchandiseId: string; quantity: number }[]
  userErrors?: CartUserError[] | null
  warnings?: CartWarning[] | null
}): BilanAjout {
  const { avant, apres, demandes } = params
  const userErrors = params.userErrors ?? []
  const warnings = params.warnings ?? []

  if (panierIntrouvable(userErrors)) return { type: 'panier-disparu' }
  if (userErrors.length > 0) return { type: 'rien', message: messageErreursPanier(userErrors) }
  if (!apres) return { type: 'rien', message: MESSAGES_PANIER.refuseGenerique }

  const stock = warnings.filter(
    (w) => w.code === 'MERCHANDISE_NOT_ENOUGH_STOCK' || w.code === 'MERCHANDISE_OUT_OF_STOCK'
  )
  const comptable = apres.lines.nodes.length < LIGNES_MAX

  let ajoutTotal = 0
  let manque = false
  if (comptable) {
    for (const d of demandes) {
      const ajoute = Math.max(0, quantiteAuPanier(apres, d.merchandiseId) - quantiteAuPanier(avant, d.merchandiseId))
      ajoutTotal += Math.min(ajoute, d.quantity)
      if (ajoute < d.quantity) manque = true
    }
  }

  if (!manque && stock.length === 0) return { type: 'ajoute' }

  const seul = demandes.length === 1
  // Rien de plus au panier (compté), ou rupture annoncée sans rien de compté.
  const rienAjoute = comptable ? ajoutTotal === 0 : stock.every((w) => w.code === 'MERCHANDISE_OUT_OF_STOCK')
  if (rienAjoute) {
    const rupture = stock.length > 0 && stock.every((w) => w.code === 'MERCHANDISE_OUT_OF_STOCK')
    if (!seul) return { type: 'rien', message: MESSAGES_PANIER.selectionIncomplete }
    return {
      type: 'rien',
      message: rupture
        ? MESSAGES_PANIER.rupture
        : `${MESSAGES_PANIER.stockInsuffisant} Rien n'a été ajouté à ton panier.`,
    }
  }
  if (!seul) return { type: 'partiel', message: MESSAGES_PANIER.selectionIncomplete }
  const demande = demandes[0]?.quantity ?? 0
  return {
    type: 'partiel',
    message:
      comptable && demande > 1
        ? `${MESSAGES_PANIER.stockInsuffisant} On en a ajouté ${ajoutTotal} sur les ${demande} demandés.`
        : `${MESSAGES_PANIER.stockInsuffisant} Vérifie la quantité dans ton panier.`,
  }
}
