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
}

export function calculerCadeaux(
  cart: ShopifyCart | null,
  donnees: DonneesPaliers | null,
  options: {
    now: Date
    refuses: ReadonlySet<number>
    choix: Readonly<Record<number, string>>
    codesTestes: ReadonlySet<string>
    retraitBoutique: boolean
  }
): EtatCadeaux {
  const vide: EtatCadeaux = {
    periode: null, etats: [], baseCadeaux: 0, codeBloquant: null, horsBase: false, actions: [], refuser: [], codesATester: null,
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

  const etats = etatPaliers(periode, {
    baseCadeaux: baseDe,
    baseLivraison: livraison,
    stock: donnees.stock,
    lignes,
    refuses: options.refuses,
    retraitBoutique: options.retraitBoutique,
  })

  const codes = cart.discountCodes ?? []
  const codeBloquant = codes.find((c) => c.applicable)?.code ?? null
  const lignesCadeaux = lignes.filter((l) => l.cadeau !== null)
  const signature = signatureCodes(cart)

  // Code refusé avec un cadeau au panier : on retire le cadeau une fois pour
  // laisser le code s'appliquer (le code du client est prioritaire).
  const aTester =
    !codeBloquant && lignesCadeaux.length > 0 && codes.some((c) => !c.applicable) && !options.codesTestes.has(signature)

  const refuser = new Set<number>()
  let actions: ActionCadeau[]
  if (aTester) {
    actions = lignesCadeaux.map((l) => ({ type: 'retirer', lineId: l.id }))
  } else {
    actions = planCadeaux(etats, lignes, { bloque: !!codeBloquant, choix: options.choix })
    if (codeBloquant) {
      // Cadeaux non donnés à cause du code : le bouton « Ajouter mon cadeau » reviendra si le code est retiré.
      for (const e of etats) if (e.palier.type === 'cadeau' && e.atteint && !e.refuse) refuser.add(e.palier.montant)
    } else {
      // Jamais de cadeau facturé : une ligne cadeau que Shopify ne passe pas à 0 € est retirée.
      const dejaRetirees = new Set(actions.filter((a) => a.type === 'retirer').map((a) => (a as { lineId: string }).lineId))
      for (const l of cadeauxPayants(lignes)) {
        if (!dejaRetirees.has(l.id)) actions.push({ type: 'retirer', lineId: l.id })
        refuser.add(l.cadeau!)
      }
      // Pas d'ajout d'un cadeau qu'on vient de retirer parce qu'il était facturé.
      if (refuser.size) actions = actions.filter((a) => a.type !== 'ajouter' || !refuser.has(a.montant))
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
  }
}

/** « avec ton code BIENVENUE5 » / « avec ta cagnotte » (codes LY-). */
export function avecLeCode(code: string): string {
  return /^LY-/i.test(code) ? 'avec ta cagnotte' : `avec ton code ${code}`
}
