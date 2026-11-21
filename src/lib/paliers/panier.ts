// Orchestration des cadeaux à partir du panier Shopify : bases, paliers
// affichés, changements à apporter au panier.
// Pur (aucun appel réseau) : le tiroir l'appelle à chaque changement du
// panier et applique les actions renvoyées. Testé dans panier.test.ts.
//
// Codes (décision de l'utilisateur, 13/10/2026) : les cadeaux se cumulent
// avec les codes (remises cadeaux et codes en productDiscounts: true). Le
// site ne bloque plus rien à cause d'un code ; il ne réagit que si Shopify
// refacture un cadeau (vieux code non cumulable, remise inactive…).
//
// Cadeau facturé : la ligne est retirée et le palier marqué « non accordé »
// pour ce contexte (paliers atteints, codes, autres cadeaux, articles achetés) :
// ni ajout automatique ni bouton, sinon le bouton tournerait en boucle. Le
// contexte change : le palier redevient normal. La gratuité tombée sur un
// article acheté identique compte comme accordée (transfertsCadeaux).
//
// Article acheté qui tient lieu de cadeau (Claude Gestion, 13/10/2026) : la
// remise du palier supérieur (100 €) offre 2 articles parmi les cadeaux des
// deux paliers. Shopify prend les moins chers, sans compter dans le minimum
// les articles qu'il offre (mesuré). Avec une Crunch Bar éligible achetée et
// un panier qui reste à 100 € sans elle, elle passerait devant le shaker :
// elle devient alors le cadeau du palier inférieur (pas de ligne cadeau), et
// la remise tombe sur elle et le shaker. Si le panier passe sous 100 € sans
// elle, elle reste dans le minimum et la ligne cadeau est gardée (Crunch
// cadeau et shaker offerts). Si le panier reste à 100 € sans 2 Crunch
// achetées, Shopify offre les 2 Crunch et le shaker saute (accepté, message).

import type { ShopifyCart } from '@/lib/shopify/types'
import {
  CADEAU_ATTR, baseCadeaux, baseLivraison, cadeauxPayants, etatPaliers, idNumerique, periodeActive, planCadeaux, transfertsCadeaux,
  type ActionCadeau, type EtatPalier, type LigneCadeau, type Palier, type Periode,
} from './index'

export interface DonneesPaliers {
  periodes: (Omit<Periode, 'paliers'> & { paliers: (Palier & { ensemble?: number })[] })[]
  ensembles: string[][]
  stock: Record<string, boolean>
  /** Titres des remises Shopify qui accordent les cadeaux (affichés au paiement). Absent = aucun transfert reconnu. */
  titres?: string[]
}

export function lignesDuPanier(cart: ShopifyCart | null): LigneCadeau[] {
  return (cart?.lines.nodes ?? []).map((l) => {
    const attr = l.attributes?.find((a) => a.key === CADEAU_ATTR)?.value
    const montant = attr != null ? Number(attr) : NaN
    const total = Number(l.cost.totalAmount.amount)
    return {
      id: l.id,
      merchandiseId: l.merchandise.id,
      productId: idNumerique(l.merchandise.product.id),
      quantity: l.quantity,
      subtotal: Number(l.cost.subtotalAmount?.amount ?? total),
      total,
      cadeau: Number.isFinite(montant) && montant > 0 ? montant : null,
      remises: (l.discountAllocations ?? [])
        .filter((a): a is typeof a & { title: string } => typeof a.title === 'string')
        .map((a) => ({ titre: a.title, montant: Number(a.discountedAmount.amount) })),
    }
  })
}

const signatureCodes = (cart: ShopifyCart | null) =>
  (cart?.discountCodes ?? []).map((c) => c.code.toUpperCase()).sort().join('|')

export interface EtatCadeaux {
  periode: Periode | null
  etats: EtatPalier[]
  baseCadeaux: number
  /** Le panier contient des produits qui ne comptent pas pour les cadeaux (accessoires…). */
  horsBase: boolean
  /** Changements à faire au panier. */
  actions: ActionCadeau[]
  /** Paliers que Shopify vient de refuser, avec leur contexte (à garder dans le navigateur). */
  nonAccorder: Record<number, string>
  /** Montants à afficher quand la gratuité du cadeau est tombée sur un article acheté identique. */
  affiches: Readonly<Record<string, number>>
  /** Lignes achetées rendues gratuites par une remise cadeau (affichées « Offert »). */
  lignesOffertes: string[]
  /** Articles achetés offerts à la place d'une ligne cadeau : 1 → « Ta Crunch Bar est offerte. », 2 et plus → à la place du cadeau supérieur. */
  offertsParAchat: number
}

/**
 * Contexte d'un refus de Shopify : paliers cadeaux atteints, codes, autres
 * cadeaux et articles achetés (variante × quantité). Shopify offre les
 * articles éligibles les moins chers : une Crunch Bar achetée peut prendre la
 * place du shaker, et la retirer doit le faire revenir.
 */
function contexteDe(montant: number, etats: EtatPalier[], lignes: LigneCadeau[], codes: string): string {
  const atteints = etats.filter((e) => e.palier.type === 'cadeau' && e.atteint).map((e) => e.palier.montant).sort((a, b) => a - b)
  const autres = [...new Set(lignes.filter((l) => l.cadeau !== null && l.cadeau !== montant).map((l) => l.cadeau!))].sort((a, b) => a - b)
  const quantites = new Map<string, number>()
  for (const l of lignes) if (l.cadeau === null) quantites.set(l.merchandiseId, (quantites.get(l.merchandiseId) ?? 0) + l.quantity)
  const achats = [...quantites].map(([v, q]) => `${idNumerique(v)}x${q}`).sort()
  return `${atteints.join(',')}|${codes}|${autres.join(',')}|${achats.join(',')}`
}

export function calculerCadeaux(
  cart: ShopifyCart | null,
  donnees: DonneesPaliers | null,
  options: {
    now: Date
    refuses: ReadonlySet<number>
    choix: Readonly<Record<number, string>>
    /** Paliers refusés par Shopify → contexte du refus. */
    nonAccordes?: Readonly<Record<number, string>>
    retraitBoutique: boolean
  }
): EtatCadeaux {
  const vide: EtatCadeaux = {
    periode: null, etats: [], baseCadeaux: 0, horsBase: false, actions: [], nonAccorder: {}, affiches: {}, lignesOffertes: [], offertsParAchat: 0,
  }
  if (!cart || !donnees) return vide
  const periode = periodeActive(donnees as { periodes: Periode[] }, options.now)
  const lignes = lignesDuPanier(cart)

  const ensembles = donnees.ensembles.map((e) => new Set(e))
  const tous = new Set(donnees.ensembles.flat())
  const baseDe = (palier: Palier & { ensemble?: number }) =>
    baseCadeaux(lignes, ensembles[palier.ensemble ?? -1] ?? new Set<string>())
  const remisesCommande = (cart.discountAllocations ?? []).reduce((s, a) => s + Number(a.discountedAmount.amount), 0)
  const livraison = baseLivraison(Number(cart.cost.subtotalAmount.amount), remisesCommande)

  const signature = signatureCodes(cart)
  const ctx = {
    baseCadeaux: baseDe,
    baseLivraison: livraison,
    stock: donnees.stock,
    lignes,
    refuses: options.refuses,
    retraitBoutique: options.retraitBoutique,
  }
  // Refus de Shopify encore valables : même contexte qu'au moment du refus.
  const provisoires = etatPaliers(periode, ctx)
  const nonAccordes = new Set(
    Object.entries(options.nonAccordes ?? {})
      .filter(([m, c]) => contexteDe(Number(m), provisoires, lignes, signature) === c)
      .map(([m]) => Number(m))
  )
  const etatsShopify = nonAccordes.size ? etatPaliers(periode, { ...ctx, nonAccordes }) : provisoires

  // Article acheté qui tient lieu de cadeau : palier atteint, et un palier cadeau supérieur qui reste
  // atteint sans cet article (sinon il doit rester dans le minimum de Shopify).
  const etats = etatsShopify.map((e) => {
    if (e.palier.type !== 'cadeau' || !e.atteint) return e
    const ids = new Set((e.palier.variantes ?? []).map((v) => v.id))
    const achats = lignes.filter((l) => l.cadeau === null && l.quantity > 0 && ids.has(l.merchandiseId))
    if (achats.length === 0) return e
    const prixMin = Math.min(...achats.map((l) => l.subtotal / l.quantity))
    const superieur = etatsShopify.some(
      (q) => q.palier.type === 'cadeau' && q.palier.montant > e.palier.montant && q.atteint && q.base - prixMin + 0.005 >= q.palier.montant
    )
    return superieur ? { ...e, parAchat: achats.reduce((n, l) => n + l.quantity, 0) } : e
  })

  const titres = new Set(donnees.titres ?? [])
  const transferts = transfertsCadeaux(lignes, titres)
  const nonAccorder: Record<number, string> = {}
  let actions = planCadeaux(etats, lignes, { choix: options.choix })
  // Jamais de cadeau facturé : une ligne cadeau que Shopify ne passe pas à 0 € est retirée.
  // Le palier n'est marqué « non accordé » (plus proposé tant que le contexte tient) que si ce
  // tour ne change rien d'autre : sinon Shopify va tout recalculer (ajout, retrait, article
  // acheté à la place) et le cadeau sera de nouveau proposé au tour suivant.
  const autresChangements = actions.length > 0
  const dejaRetirees = new Set(actions.filter((a) => a.type === 'retirer').map((a) => (a as { lineId: string }).lineId))
  for (const l of cadeauxPayants(lignes, transferts.couverts)) {
    if (dejaRetirees.has(l.id)) continue
    actions.push({ type: 'retirer', lineId: l.id })
    if (!autresChangements) nonAccorder[l.cadeau!] = contexteDe(l.cadeau!, etats, lignes, signature)
  }
  // Pas d'ajout d'un cadeau qu'on vient de retirer parce qu'il était facturé.
  if (Object.keys(nonAccorder).length) actions = actions.filter((a) => a.type !== 'ajouter' || !(a.montant in nonAccorder))

  // Ligne achetée rendue gratuite par une remise cadeau (sauf si sa gratuité est affichée sur le cadeau).
  const lignesOffertes = lignes
    .filter((l) => l.cadeau === null && l.total <= 0.005 && !(l.id in transferts.affiches))
    .filter((l) => (l.remises ?? []).some((r) => titres.has(r.titre) && r.montant > 0))
    .map((l) => l.id)
  // Articles achetés réellement offerts à la place d'une ligne cadeau (pour le message du tiroir).
  const variantesParAchat = new Set(etats.filter((e) => e.parAchat > 0).flatMap((e) => (e.palier.variantes ?? []).map((v) => v.id)))
  const offertsParAchat = lignes
    .filter((l) => l.cadeau === null && l.quantity > 0 && variantesParAchat.has(l.merchandiseId))
    .reduce((n, l) => {
      const remise = (l.remises ?? []).filter((r) => titres.has(r.titre)).reduce((s, r) => s + r.montant, 0)
      return n + Math.floor((remise + 0.005) / (l.subtotal / l.quantity))
    }, 0)

  const premier = etats.find((e) => e.palier.type === 'cadeau')
  return {
    periode,
    etats,
    baseCadeaux: premier ? premier.base : 0,
    horsBase: lignes.some((l) => l.cadeau === null && !tous.has(l.productId)),
    actions,
    nonAccorder,
    affiches: transferts.affiches,
    lignesOffertes,
    offertsParAchat,
  }
}
