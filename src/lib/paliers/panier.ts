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
// deux paliers, et Shopify prend toujours les moins chers. Avec une Crunch
// Bar éligible achetée, elle passerait devant le shaker. Donc, dès qu'un
// palier supérieur est atteint, une Crunch éligible achetée devient le
// cadeau du palier inférieur : pas de ligne cadeau, et la remise tombe sur
// la Crunch achetée et le shaker. À partir de 2 achetées, Shopify offre les
// 2 Crunch et le shaker saute (accepté, message dans le tiroir).

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
  /** Articles achetés qui tiennent lieu de cadeau : 1 → « Ta Crunch Bar est offerte. », 2 et plus → à la place du cadeau supérieur. */
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

  // Article acheté qui tient lieu de cadeau : palier cadeau atteint, palier cadeau supérieur atteint aussi.
  const achetes = (e: EtatPalier) => {
    const ids = new Set((e.palier.variantes ?? []).map((v) => v.id))
    return lignes.filter((l) => l.cadeau === null && ids.has(l.merchandiseId)).reduce((n, l) => n + l.quantity, 0)
  }
  const etats = etatsShopify.map((e) => {
    if (e.palier.type !== 'cadeau' || !e.atteint) return e
    const superieur = etatsShopify.some((q) => q.palier.type === 'cadeau' && q.palier.montant > e.palier.montant && q.atteint)
    const n = superieur ? achetes(e) : 0
    return n > 0 ? { ...e, parAchat: n } : e
  })

  const titres = new Set(donnees.titres ?? [])
  const transferts = transfertsCadeaux(lignes, titres)
  const nonAccorder: Record<number, string> = {}
  let actions = planCadeaux(etats, lignes, { choix: options.choix })
  // Jamais de cadeau facturé : une ligne cadeau que Shopify ne passe pas à 0 € est retirée,
  // et le palier n'est plus proposé tant que le contexte ne change pas. Si ce tour retire déjà
  // une ligne cadeau (palier plus atteint, doublon, article acheté à la place), le cadeau facturé
  // vient sans doute d'elle : on juge au tour suivant, qui suit immédiatement la mise à jour.
  const retraitsPrevus = actions.some((a) => a.type === 'retirer')
  for (const l of retraitsPrevus ? [] : cadeauxPayants(lignes, transferts.couverts)) {
    actions.push({ type: 'retirer', lineId: l.id })
    nonAccorder[l.cadeau!] = contexteDe(l.cadeau!, etats, lignes, signature)
  }
  // Pas d'ajout d'un cadeau qu'on vient de retirer parce qu'il était facturé.
  if (Object.keys(nonAccorder).length) actions = actions.filter((a) => a.type !== 'ajouter' || !(a.montant in nonAccorder))

  const lignesOffertes = lignes
    .filter((l) => l.cadeau === null && l.total <= 0.005 && (l.remises ?? []).some((r) => titres.has(r.titre) && r.montant > 0))
    .map((l) => l.id)

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
    offertsParAchat: Math.max(0, ...etats.map((e) => e.parAchat)),
  }
}
