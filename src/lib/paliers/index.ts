// ============================================================
// Paliers cadeaux du panier (échelle validée le 12/10/2026)
// ============================================================
// Source unique : métachamp boutique `bodystart.paliers_cadeaux` (json, tenu
// par Claude Gestion). Aucun montant, libellé, date ni variante en dur ici.
// Shopify accorde les cadeaux (remises automatiques « achetez X, obtenez Y ») ;
// le site affiche la progression et met la ligne cadeau au panier (Shopify
// ne l'ajoute pas lui-même).
//
// Pur, sans réseau : utilisé par le tiroir panier (client) et la route
// /api/paliers (serveur). Testé dans index.test.ts.

/** Attribut de ligne qui marque un cadeau (valeur = montant du palier). Le « _ » le masque au paiement. */
export const CADEAU_ATTR = '_cadeau'

export interface PalierVariante {
  id: string
  nom: string
}

export interface Palier {
  montant: number
  type: 'cadeau' | 'livraison'
  libelle: string
  /** Formule pour « Plus que X € pour {accroche} » (ex. « ta Crunch Bar offerte »). Facultatif. */
  accroche?: string
  variantes?: PalierVariante[]
  /** Remise automatique Shopify qui accorde le cadeau (sert à lire la collection de base). */
  remise_shopify?: string
}

export interface Periode {
  nom: string
  du: string
  au: string | null
  paliers: Palier[]
}

export interface PaliersConfig {
  periodes: Periode[]
}

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x)
const GID_VARIANTE = /^gid:\/\/shopify\/ProductVariant\/\d+$/
const GID_REMISE = /^gid:\/\/shopify\/Discount\w*Node\/\d+$/

function parsePalier(raw: unknown): Palier | null {
  if (!isObj(raw)) return null
  const montant = Number(raw.montant)
  const type = raw.type
  const libelle = typeof raw.libelle === 'string' ? raw.libelle.trim() : ''
  if (!Number.isFinite(montant) || montant <= 0 || !libelle) return null
  if (type !== 'cadeau' && type !== 'livraison') return null
  const palier: Palier = { montant, type, libelle }
  if (typeof raw.accroche === 'string' && raw.accroche.trim()) palier.accroche = raw.accroche.trim()
  if (type === 'cadeau') {
    const variantes = Array.isArray(raw.variantes)
      ? raw.variantes
          .filter(isObj)
          .map((v) => ({ id: String(v.id ?? ''), nom: String(v.nom ?? '').trim() }))
          .filter((v) => GID_VARIANTE.test(v.id))
      : []
    if (variantes.length === 0) return null
    palier.variantes = variantes
    if (typeof raw.remise_shopify === 'string' && GID_REMISE.test(raw.remise_shopify)) {
      palier.remise_shopify = raw.remise_shopify
    }
  }
  return palier
}

/** Lit le métachamp ; périodes ou paliers invalides écartés (une faute de saisie ne casse pas le panier). */
export function parsePaliers(value: string | null | undefined): PaliersConfig | null {
  if (!value) return null
  let raw: unknown
  try {
    raw = JSON.parse(value)
  } catch {
    return null
  }
  if (!isObj(raw) || !Array.isArray(raw.periodes)) return null
  const periodes: Periode[] = []
  for (const p of raw.periodes) {
    if (!isObj(p) || typeof p.du !== 'string' || Number.isNaN(Date.parse(p.du))) continue
    const au = typeof p.au === 'string' && !Number.isNaN(Date.parse(p.au)) ? p.au : null
    const paliers = (Array.isArray(p.paliers) ? p.paliers : [])
      .map(parsePalier)
      .filter((x): x is Palier => !!x)
      .sort((a, b) => a.montant - b.montant)
    if (paliers.length === 0) continue
    periodes.push({ nom: String(p.nom ?? ''), du: p.du, au, paliers })
  }
  return periodes.length ? { periodes } : null
}

/** Période en cours à `now` (bornes incluses ; `au` absent = sans fin). */
export function periodeActive(config: PaliersConfig | null, now: Date): Periode | null {
  if (!config) return null
  const t = now.getTime()
  return (
    config.periodes.find((p) => Date.parse(p.du) <= t && (p.au === null || t <= Date.parse(p.au))) ?? null
  )
}

/**
 * Date de référence : maintenant, ou celle de `?paliers_date=` hors
 * production (test de la Black Week sur la preview). Ignorée en production.
 */
export function dateDeReference(search: string, env: string | undefined, now = new Date()): Date {
  if (env === 'production') return now
  const forcee = new URLSearchParams(search).get('paliers_date')
  if (!forcee) return now
  const t = Date.parse(forcee)
  return Number.isNaN(t) ? now : new Date(t)
}

// ─── Panier ───────────────────────────────────────────────────

export interface LigneCadeau {
  id: string
  merchandiseId: string
  /** Identifiant numérique du produit (fin du gid). */
  productId: string
  quantity: number
  /** Montant de la ligne avant remises de ligne. */
  subtotal: number
  /** Montant de la ligne après remises de ligne (0 pour un cadeau accordé). */
  total: number
  /** Montant du palier si la ligne est un cadeau, sinon null. */
  cadeau: number | null
}

export const idNumerique = (gid: string) => gid.split('/').pop() ?? gid

/** Base des paliers cadeaux : lignes non cadeaux des produits de la collection, avant codes de réduction. */
export function baseCadeaux(lignes: LigneCadeau[], eligibles: ReadonlySet<string>): number {
  return arrondi(
    lignes
      .filter((l) => l.cadeau === null && eligibles.has(l.productId))
      .reduce((s, l) => s + l.subtotal, 0)
  )
}

/** Base du palier livraison : total des produits après réductions (ligne et commande), comme le tarif Shopify. */
export function baseLivraison(sousTotalApresRemisesDeLigne: number, remisesCommande: number): number {
  return arrondi(Math.max(0, sousTotalApresRemisesDeLigne - remisesCommande))
}

const arrondi = (n: number) => Math.round(n * 100) / 100

export interface EtatPalier {
  palier: Palier
  base: number
  atteint: boolean
  /** Reste à atteindre, en euros (0 si atteint). */
  reste: number
  /** Variantes cadeaux en stock (vide pour la livraison). */
  variantesDispo: PalierVariante[]
  /** Lignes cadeaux de ce palier déjà au panier. */
  lignes: LigneCadeau[]
  /** Le client a retiré ce cadeau : on ne le remet pas de force. */
  refuse: boolean
  /** Shopify ne l'accorde pas avec ce panier (deux remises « achetez X » sur les mêmes produits ne se cumulent pas) : ni ajout ni bouton. */
  nonAccorde: boolean
}

export interface ContextePaliers {
  /** Base des paliers cadeaux (nombre, ou fonction quand chaque palier a sa propre collection). */
  baseCadeaux: number | ((palier: Palier) => number)
  baseLivraison: number
  /** Disponibilité des variantes cadeaux (id → en stock). Absente = inconnue → considérée en rupture. */
  stock: Readonly<Record<string, boolean>>
  lignes: LigneCadeau[]
  /** Montants des paliers dont le client a retiré le cadeau. */
  refuses: ReadonlySet<number>
  /** Montants des paliers que Shopify n'accorde pas avec ce panier. Absent = aucun. */
  nonAccordes?: ReadonlySet<number>
  /** Retrait en boutique : le palier livraison n'a pas de sens. */
  retraitBoutique: boolean
}

/** Paliers affichés pour la période : cadeau sans variante en stock masqué, livraison masquée en retrait boutique. */
export function etatPaliers(periode: Periode | null, ctx: ContextePaliers): EtatPalier[] {
  if (!periode) return []
  const out: EtatPalier[] = []
  for (const palier of periode.paliers) {
    if (palier.type === 'livraison') {
      if (ctx.retraitBoutique) continue
      const reste = arrondi(Math.max(0, palier.montant - ctx.baseLivraison))
      out.push({ palier, base: ctx.baseLivraison, atteint: reste === 0, reste, variantesDispo: [], lignes: [], refuse: false, nonAccorde: false })
      continue
    }
    const variantesDispo = (palier.variantes ?? []).filter((v) => ctx.stock[v.id] === true)
    const lignes = ctx.lignes.filter((l) => l.cadeau === palier.montant)
    if (variantesDispo.length === 0 && lignes.length === 0) continue
    const base = typeof ctx.baseCadeaux === 'function' ? ctx.baseCadeaux(palier) : ctx.baseCadeaux
    const reste = arrondi(Math.max(0, palier.montant - base))
    out.push({
      palier,
      base,
      atteint: reste === 0,
      reste,
      variantesDispo,
      lignes,
      refuse: ctx.refuses.has(palier.montant),
      nonAccorde: ctx.nonAccordes?.has(palier.montant) ?? false,
    })
  }
  return out
}

export type ActionCadeau =
  | { type: 'ajouter'; variantId: string; montant: number }
  | { type: 'retirer'; lineId: string }
  | { type: 'quantite1'; lineId: string }

/**
 * Ce qu'il faut changer au panier pour qu'il colle aux paliers :
 * - cadeau d'un palier atteint absent (et non refusé, ni bloqué par un code) → l'ajouter ;
 * - cadeau d'un palier non atteint, d'un palier masqué ou d'une autre période → le retirer ;
 * - doublon ou quantité > 1 sur une ligne cadeau → ramener à une seule unité.
 * `choix` : variante préférée par palier (choix du parfum), sinon la première en stock.
 */
export function planCadeaux(
  etats: EtatPalier[],
  lignes: LigneCadeau[],
  options: { bloque: boolean; choix?: Readonly<Record<number, string>> }
): ActionCadeau[] {
  const actions: ActionCadeau[] = []
  const montantsActifs = new Set(etats.filter((e) => e.palier.type === 'cadeau').map((e) => e.palier.montant))

  for (const l of lignes) {
    if (l.cadeau !== null && !montantsActifs.has(l.cadeau)) actions.push({ type: 'retirer', lineId: l.id })
  }

  for (const e of etats) {
    if (e.palier.type !== 'cadeau') continue
    if (!e.atteint || options.bloque) {
      for (const l of e.lignes) actions.push({ type: 'retirer', lineId: l.id })
      continue
    }
    const [garde, ...doublons] = e.lignes
    for (const l of doublons) actions.push({ type: 'retirer', lineId: l.id })
    if (garde) {
      if (garde.quantity !== 1) actions.push({ type: 'quantite1', lineId: garde.id })
      continue
    }
    if (e.refuse || e.nonAccorde || e.variantesDispo.length === 0) continue
    const prefere = options.choix?.[e.palier.montant]
    const variante = e.variantesDispo.find((v) => v.id === prefere) ?? e.variantesDispo[0]
    actions.push({ type: 'ajouter', variantId: variante.id, montant: e.palier.montant })
  }
  return actions
}

/** Lignes cadeaux que Shopify ne passe pas à 0 € (code non cumulable, remise inactive…) : à retirer, jamais à faire payer. */
export function cadeauxPayants(lignes: LigneCadeau[]): LigneCadeau[] {
  return lignes.filter((l) => l.cadeau !== null && l.total > 0.005)
}

/** Prochain palier à atteindre (le plus bas non atteint), ou null si tout est débloqué. */
export function prochainPalier(etats: EtatPalier[]): EtatPalier | null {
  return etats.filter((e) => !e.atteint).sort((a, b) => a.palier.montant - b.palier.montant)[0] ?? null
}
