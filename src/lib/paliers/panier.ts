// Orchestration des cadeaux à partir du panier Shopify : bases, paliers
// affichés, changements à apporter au panier, règles des codes de réduction.
// Pur (aucun appel réseau) : le tiroir l'appelle à chaque changement du
// panier et applique les actions renvoyées. Testé dans panier.test.ts.
//
// Codes (arbitrage de Claude Gestion du 13/10/2026) : les cadeaux ne se
// cumulent pas avec un code sur la commande (BIENVENUE5, parrainage BS-,
// cagnotte LY-…). Le code du client est prioritaire : avec un code appliqué,
// pas de cadeau. Un code refusé alors qu'un cadeau est au panier : on retire
// le cadeau une fois, pour voir si le code passe. Jamais de cadeau facturé.
//
// Cadeau facturé sans code : Shopify ne l'accorde pas avec ce panier. Constaté
// le 13/10/2026 : deux remises « achetez X, obtenez Y » sur la même collection
// ne se cumulent pas (Shopify garde la plus forte : le shaker à 100 €, la
// Crunch Bar repasse à 2,90 €). La ligne est retirée et le palier marqué « non
// accordé » pour ce contexte (paliers atteints, codes, autres cadeaux) : ni
// ajout automatique ni bouton, sinon le bouton tournerait en boucle. Le contexte
// change (panier sous 100 €, shaker retiré…) : le palier redevient normal.

import type { ShopifyCart } from '@/lib/shopify/types'
import {
  CADEAU_ATTR, baseCadeaux, baseLivraison, cadeauxPayants, etatPaliers, idNumerique, periodeActive, planCadeaux,
  type ActionCadeau, type EtatPalier, type LigneCadeau, type Palier, type Periode,
} from './index'

export interface DonneesPaliers {
  periodes: (Omit<Periode, 'paliers'> & { paliers: (Palier & { ensemble?: number })[] })[]
  ensembles: string[][]
  stock: Record<string, boolean>
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
    }
  })
}

const signatureCodes = (cart: ShopifyCart | null) =>
  (cart?.discountCodes ?? []).map((c) => c.code.toUpperCase()).sort().join('|')

export interface EtatCadeaux {
  periode: Periode | null
  etats: EtatPalier[]
  baseCadeaux: number
  /** Code appliqué qui bloque les cadeaux (premier code applicable), sinon null. */
  codeBloquant: string | null
  /** Le panier contient des produits qui ne comptent pas pour les cadeaux (accessoires…). */
  horsBase: boolean
  /** Changements à faire au panier. */
  actions: ActionCadeau[]
  /** Paliers à marquer « retirés » (le bouton « Ajouter mon cadeau » remplace l'ajout automatique). */
  refuser: number[]
  /** Signature des codes testés (cadeau retiré pour voir si le code passe). */
  codesATester: string | null
  /** Paliers que Shopify vient de refuser, avec leur contexte (à garder dans le navigateur). */
  nonAccorder: Record<number, string>
}

/** Contexte d'un refus de Shopify : paliers cadeaux atteints, codes, autres cadeaux au panier. */
function contexteDe(montant: number, etats: EtatPalier[], lignes: LigneCadeau[], codes: string): string {
  const atteints = etats.filter((e) => e.palier.type === 'cadeau' && e.atteint).map((e) => e.palier.montant).sort((a, b) => a - b)
  const autres = [...new Set(lignes.filter((l) => l.cadeau !== null && l.cadeau !== montant).map((l) => l.cadeau!))].sort((a, b) => a - b)
  return `${atteints.join(',')}|${codes}|${autres.join(',')}`
}

export function calculerCadeaux(
  cart: ShopifyCart | null,
  donnees: DonneesPaliers | null,
  options: {
    now: Date
    refuses: ReadonlySet<number>
    choix: Readonly<Record<number, string>>
    codesTestes: ReadonlySet<string>
    /** Paliers refusés par Shopify → contexte du refus. */
    nonAccordes?: Readonly<Record<number, string>>
    retraitBoutique: boolean
  }
): EtatCadeaux {
  const vide: EtatCadeaux = {
    periode: null, etats: [], baseCadeaux: 0, codeBloquant: null, horsBase: false, actions: [], refuser: [], codesATester: null, nonAccorder: {},
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
  const etats = nonAccordes.size ? etatPaliers(periode, { ...ctx, nonAccordes }) : provisoires

  const codes = cart.discountCodes ?? []
  const codeBloquant = codes.find((c) => c.applicable)?.code ?? null
  const lignesCadeaux = lignes.filter((l) => l.cadeau !== null)

  // Code refusé avec un cadeau au panier : on retire le cadeau une fois pour
  // laisser le code s'appliquer (le code du client est prioritaire).
  const aTester =
    !codeBloquant && lignesCadeaux.length > 0 && codes.some((c) => !c.applicable) && !options.codesTestes.has(signature)

  const refuser = new Set<number>()
  const nonAccorder: Record<number, string> = {}
  let actions: ActionCadeau[]
  if (aTester) {
    actions = lignesCadeaux.map((l) => ({ type: 'retirer', lineId: l.id }))
  } else {
    actions = planCadeaux(etats, lignes, { bloque: !!codeBloquant, choix: options.choix })
    if (codeBloquant) {
      // Cadeaux non donnés à cause du code : le bouton « Ajouter mon cadeau » reviendra si le code est retiré.
      for (const e of etats) if (e.palier.type === 'cadeau' && e.atteint && !e.refuse) refuser.add(e.palier.montant)
    } else {
      // Jamais de cadeau facturé : une ligne cadeau que Shopify ne passe pas à 0 € est retirée,
      // et le palier n'est plus proposé tant que le contexte ne change pas.
      const dejaRetirees = new Set(actions.filter((a) => a.type === 'retirer').map((a) => (a as { lineId: string }).lineId))
      for (const l of cadeauxPayants(lignes)) {
        if (dejaRetirees.has(l.id)) continue // palier plus atteint, doublon… : pas un refus de Shopify
        actions.push({ type: 'retirer', lineId: l.id })
        nonAccorder[l.cadeau!] = contexteDe(l.cadeau!, etats, lignes, signature)
      }
      // Pas d'ajout d'un cadeau qu'on vient de retirer parce qu'il était facturé.
      if (Object.keys(nonAccorder).length) actions = actions.filter((a) => a.type !== 'ajouter' || !(a.montant in nonAccorder))
    }
  }

  const premier = etats.find((e) => e.palier.type === 'cadeau')
  return {
    periode,
    etats,
    baseCadeaux: premier ? premier.base : 0,
    codeBloquant,
    horsBase: lignes.some((l) => l.cadeau === null && !tous.has(l.productId)),
    actions,
    refuser: [...refuser],
    codesATester: aTester ? signature : null,
    nonAccorder,
  }
}

/** « avec ton code BIENVENUE5 » / « avec ta cagnotte » (codes LY-). */
export function avecLeCode(code: string): string {
  return /^LY-/i.test(code) ? 'avec ta cagnotte' : `avec ton code ${code}`
}
