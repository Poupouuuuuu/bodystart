// Données des cartes produit (catalogue, catégories, recherche, accueil),
// calculées côté serveur dans lib/shopify (withCardPrice) puis envoyées sous
// une forme courte : le navigateur ne reçoit ni les options ni le métachamp.
//
// Règles (nuit du 28/11/2026, cartes « site qui vend ») :
// - format : option Poids, Format, Taille ou Contenance (même liste que le
//   JSON-LD, lib/jsonld/product) ; sinon le métachamp custom.format réduit à
//   sa quantité (lib/alt-produit) ; rien s'il est déjà dans le nom ;
// - parfums : nombre de valeurs de l'option Saveur, Parfum, Goût ou Arôme,
//   affiché à partir de 2 ;
// - « Nouveau » : étiquette nouveau ou nouveaute, ou fiche créée dans Shopify
//   depuis moins de 30 jours. Aucune règle n'existait avant ;
// - « Plus que X » : seulement pour un produit à une seule variante, avec un
//   stock réel déjà lu (stock de Coignières sur /products, sinon la quantité
//   vendable de Shopify). Sur un produit à plusieurs parfums, le total de deux
//   variantes ne dit rien du parfum que le client veut.
//
// Pur, sans réseau. Testé dans carte-produit.test.ts.

import { formatCourt } from '@/lib/alt-produit'
import { formatPoids } from '@/lib/typo'

export const JOURS_NOUVEAU = 30
export const SEUIL_STOCK_BAS = 5

export interface OptionCarte {
  name: string
  optionValues: { name: string }[]
}

/**
 * Résumé envoyé au navigateur avec le produit. Clés absentes plutôt que
 * vides (null, 0, false) : ~110 produits partent dans la charge de /products.
 */
export interface ResumeCarte {
  /** « 1 kg », « 500 g ou 1 kg », « 3 formats » ; absent si inconnu ou déjà dans le nom. */
  format?: string
  /** Nombre de parfums, à partir de 2. */
  parfums?: number
  nouveau?: true
}

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const compact = (s: string) => norm(s).replace(/[\s.,]+/g, '')

const OPTIONS_FORMAT = new Set(['poids', 'format', 'taille', 'contenance'])
const OPTIONS_PARFUM = new Set(['saveur', 'saveurs', 'parfum', 'parfums', 'gout', 'gouts', 'arome', 'aromes'])
const ETIQUETTES_NOUVEAU = new Set(['nouveau', 'nouveaute', 'nouveautes'])

const valeurs = (o: OptionCarte | undefined) =>
  (o?.optionValues ?? []).map((v) => v.name?.trim()).filter((v): v is string => !!v)

/** Format lisible d'après les options ou le métachamp, null s'il est déjà dans le nom. */
export function formatCarte(
  titre: string,
  options: OptionCarte[] | null | undefined,
  formatMeta: string | null | undefined
): string | null {
  const titreCompact = compact(titre)
  const dejaDansLeNom = (v: string) => titreCompact.includes(compact(v))
  const option = (options ?? []).find((o) => OPTIONS_FORMAT.has(norm(o.name)))
  // « 2.27kg » → « 2,27 kg » (saisie Shopify brute).
  const formats = valeurs(option).map(formatPoids)
  if (formats.length > 0) {
    if (formats.every(dejaDansLeNom)) return null
    if (formats.length === 1) return formats[0]
    if (formats.length === 2) return `${formats[0]} ou ${formats[1]}`
    return `${formats.length} formats`
  }
  const brut = formatCourt(formatMeta)
  const court = brut ? formatPoids(brut) : null
  if (!court || dejaDansLeNom(court)) return null
  // La quantité seule (« 120 gélules » de « 120 gélules végétales ») déjà dans le nom.
  const quantite = court.match(/^\d+(?:[.,]\d+)?\s*\p{L}+/u)?.[0]
  if (quantite && dejaDansLeNom(quantite)) return null
  return court
}

export function nombreDeParfums(options: OptionCarte[] | null | undefined): number {
  const option = (options ?? []).find((o) => OPTIONS_PARFUM.has(norm(o.name)))
  return valeurs(option).length
}

export function estNouveau(
  p: { tags?: string[] | null; createdAt?: string | null },
  maintenant: Date
): boolean {
  if ((p.tags ?? []).some((t) => ETIQUETTES_NOUVEAU.has(norm(t)))) return true
  if (!p.createdAt) return false
  const cree = Date.parse(p.createdAt)
  if (Number.isNaN(cree)) return false
  const age = maintenant.getTime() - cree
  return age >= 0 && age < JOURS_NOUVEAU * 24 * 60 * 60 * 1000
}

export function resumeCarte(
  p: {
    title: string
    tags?: string[] | null
    createdAt?: string | null
    optionsCarte?: OptionCarte[] | null
    formatMeta?: { value?: string | null } | null
  },
  maintenant: Date
): ResumeCarte | null {
  const format = formatCarte(p.title, p.optionsCarte, p.formatMeta?.value)
  const parfums = nombreDeParfums(p.optionsCarte)
  const resume: ResumeCarte = {
    ...(format ? { format } : {}),
    ...(parfums >= 2 ? { parfums } : {}),
    ...(estNouveau(p, maintenant) ? { nouveau: true as const } : {}),
  }
  return Object.keys(resume).length ? resume : null
}

/** « 1 kg · 6 parfums » ; null s'il n'y a rien à dire. */
export function ligneDetailsCarte(resume: ResumeCarte | null | undefined): string | null {
  if (!resume) return null
  const parfums = resume.parfums ?? 0
  const parties = [resume.format, parfums >= 2 ? `${parfums} parfums` : null].filter(Boolean)
  return parties.length ? parties.join(' · ') : null
}

/**
 * Stock à afficher en « Plus que X », ou null. Produit à une seule variante
 * seulement ; stock boutique s'il est fourni, sinon la quantité vendable.
 */
export function stockBasCarte(
  variantes: { availableForSale?: boolean; quantityAvailable?: number | null }[],
  stockBoutique?: number
): number | null {
  if (variantes.length !== 1 || !variantes[0]?.availableForSale) return null
  const stock = stockBoutique ?? variantes[0].quantityAvailable
  if (typeof stock !== 'number' || !Number.isFinite(stock)) return null
  return stock > 0 && stock <= SEUIL_STOCK_BAS ? stock : null
}
