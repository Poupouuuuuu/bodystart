// Recherche du site (17/10/2026, bugs signalés par un client en boutique) :
// moteur côté site sur le catalogue complet, au lieu de la recherche
// Storefront de Shopify, qui ne retire pas les accents (« proteine » et
// « protéine » donnaient deux listes), cherche aussi dans les descriptions
// (un cookie avant une whey) et ne tient compte ni du stock ni des accessoires
// (un shaker en tête sur « whey »).
//
// Règles :
// - accents, casse, ponctuation et pluriel en « s » ignorés ;
// - champs : titre > catégorie (type de produit) et étiquettes > marque ;
//   la description ne sert qu'en dernier recours, quand aucune fiche n'est
//   trouvée autrement ;
// - tous les mots de la recherche doivent être trouvés (« whey vegan ») ;
// - un mot qui nomme un rayon (« protéine », « créatine ») fait remonter
//   tout le rayon, dans l'ordre des meilleures ventes (gainers en fin de
//   rayon, sauf recherche « gainer ») ;
// - en stock avant les ruptures, accessoires après les compléments (sauf
//   recherche d'accessoire : « shaker ») ;
// - à égalité, l'ordre reçu (meilleures ventes, comme le catalogue).
//
// Pur, sans réseau. Testé dans recherche.test.ts.

export interface Recherchable {
  title: string
  vendor?: string | null
  productType?: string | null
  tags?: string[] | null
  description?: string | null
  availableForSale?: boolean | null
}

// ─── Normalisation ──────────────────────────────────────────

/** Expressions ramenées à un seul mot, dans la recherche comme dans les fiches. */
const EXPRESSIONS: [RegExp, string][] = [
  [/\bpre ?(workout|entrainement|training)\b/g, 'preworkout'],
  [/\bprise de masse\b/g, 'gainer'],
  [/\bmass gainer\b/g, 'gainer'],
  [/\bacides? amines?\b/g, 'acidesamines'],
  [/\bclear ?whey\b/g, 'clearwhey'],
]

/** Équivalents : même mot (traduction, abréviation), y compris pour nommer un rayon. */
const SYNONYMES: Record<string, string[]> = {
  iso: ['isolate'],
  isolate: ['iso'],
  isolat: ['isolate', 'iso'],
  protein: ['proteine'],
  proteine: ['protein'],
  vitamin: ['vitamine'],
  vitamine: ['vitamin'],
  creatin: ['creatine'],
}

/**
 * Élargissements : le mot trouve aussi le rayon voisin (« bcaa » trouve les
 * autres acides aminés), mais ne le nomme pas : les fiches qui portent le mot
 * passent d'abord.
 */
const ELARGISSEMENTS: Record<string, string[]> = {
  bcaa: ['acidesamine'],
  eaa: ['acidesamine'],
}

const MOTS_VIDES = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'et', 'en', 'au', 'aux', 'pour', 'avec', 'l', 'd', 'a'])

/** Minuscules, sans accents ni ponctuation, expressions regroupées. */
export function normaliser(s: string | null | undefined): string {
  let t = (s ?? '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  for (const [re, mot] of EXPRESSIONS) t = t.replace(re, mot)
  return t
}

/** Singulier approximatif : « proteines » → « proteine » (même règle des deux côtés). */
function singulier(mot: string): string {
  return mot.length > 3 && mot.endsWith('s') && !mot.endsWith('ss') ? mot.slice(0, -1) : mot
}

/** Mots d'un texte, normalisés et au singulier. */
export function mots(s: string | null | undefined): string[] {
  return normaliser(s)
    .split(' ')
    .filter(Boolean)
    .map(singulier)
}

/** Mots utiles de la recherche (sans mots vides, sans doublons). */
export function motsRecherche(q: string): string[] {
  return [...new Set(mots(q).filter((m) => !MOTS_VIDES.has(m)))]
}

// ─── Correspondance ─────────────────────────────────────────

/** Niveau d'un champ : plus haut = plus pertinent. */
export const NIVEAU = { titre: 4, categorie: 3, marque: 2, description: 1 } as const

interface FicheIndexee {
  titre: string[]
  categorie: string[]
  etiquettes: string[]
  marque: string[]
  description: string[]
  type: string[]
}

function indexer(p: Recherchable): FicheIndexee {
  const type = mots(p.productType)
  return {
    titre: mots(p.title),
    categorie: type,
    etiquettes: (p.tags ?? []).flatMap((t) => mots(t)),
    marque: mots(p.vendor),
    description: mots(p.description),
    type,
  }
}

/** 2 = mot exact, 1 = début de mot (saisie en cours : « prot »), 0 = absent. */
function correspond(champ: string[], terme: string): 0 | 1 | 2 {
  let meilleur: 0 | 1 | 2 = 0
  for (const m of champ) {
    if (m === terme) return 2
    if (terme.length >= 2 && m.startsWith(terme)) meilleur = 1
  }
  return meilleur
}

interface Trouve {
  /** Niveau du champ le plus pertinent pour ce mot (0 = introuvable). */
  niveau: number
  exact: boolean
}

function chercherMot(f: FicheIndexee, mot: string): Trouve {
  const termes = [mot, ...(SYNONYMES[mot] ?? []), ...(ELARGISSEMENTS[mot] ?? [])]
  const champs: [string[], number][] = [
    [f.titre, NIVEAU.titre],
    [f.categorie, NIVEAU.categorie],
    [f.etiquettes, NIVEAU.categorie],
    [f.marque, NIVEAU.marque],
    [f.description, NIVEAU.description],
  ]
  for (const [champ, niveau] of champs) {
    let exact = false
    let trouve = false
    for (const t of termes) {
      const c = correspond(champ, t)
      if (c > 0) trouve = true
      if (c === 2) exact = true
    }
    if (trouve) return { niveau, exact }
  }
  return { niveau: 0, exact: false }
}

/**
 * Le mot (sans synonyme) nomme-t-il le rayon de la fiche (« proteine » →
 * Protéines) ? Début de mot accepté pendant la saisie (« prot »), mais pas
 * quand le mot est lui-même un mot de rayon : « proteine » ne nomme pas
 * « Barres protéinées ».
 */
function nommeLeRayon(f: FicheIndexee, mot: string, motsDeRayon: Set<string>): boolean {
  if (mot.length < 4) return false
  // « protein » : son synonyme « proteine » est un mot de rayon, comparaison exacte.
  const exacts = [mot, ...(SYNONYMES[mot] ?? [])].filter((m) => motsDeRayon.has(m))
  if (exacts.length > 0) return f.type.some((m) => exacts.includes(m))
  return f.type.some((m) => m.startsWith(mot))
}

const estAccessoire = (f: FicheIndexee) => f.type.includes('accessoire')

/**
 * Étiquettes rangées en fin de rayon, sauf si la recherche les nomme : un
 * gainer n'est pas ce qu'on cherche en tapant « protéine ».
 */
const FIN_DE_RAYON = ['gainer']

// ─── Recherche ──────────────────────────────────────────────

interface Resultat<T> {
  produit: T
  rang: number
  niveau: number
  score: number
  rayon: boolean
  finDeRayon: boolean
  accessoire: boolean
  enStock: boolean
}

/**
 * Fiches qui correspondent à la recherche, de la plus pertinente à la moins
 * pertinente. L'ordre reçu sert de départage (meilleures ventes).
 */
export function rechercher<T extends Recherchable>(produits: T[], q: string): T[] {
  const termes = motsRecherche(q)
  if (termes.length === 0) return []

  const fiches = produits.map(indexer)
  const motsDeRayon = new Set(fiches.flatMap((f) => f.type))

  const trouves: Resultat<T>[] = []
  produits.forEach((produit, rang) => {
    const f = fiches[rang]
    let niveau: number = NIVEAU.titre
    let score = 0
    for (const t of termes) {
      const r = chercherMot(f, t)
      if (r.niveau === 0) return // tous les mots doivent être trouvés
      niveau = Math.min(niveau, r.niveau)
      score += r.niveau * 2 + (r.exact ? 1 : 0)
    }
    trouves.push({
      produit,
      rang,
      niveau,
      score,
      rayon: termes.some((t) => nommeLeRayon(f, t, motsDeRayon)),
      finDeRayon: FIN_DE_RAYON.some((e) => f.etiquettes.includes(e) && !termes.includes(e)),
      accessoire: estAccessoire(f),
      enStock: produit.availableForSale !== false,
    })
  })

  // Description : dernier recours, seulement si aucune fiche n'est trouvée
  // par son titre, son rayon, ses étiquettes ou sa marque (« vanille »).
  // Sinon un shaker « pour ta créatine » sortait sur « créatine ».
  const parLesChamps = trouves.filter((r) => r.niveau > NIVEAU.description)
  const retenus = parLesChamps.length > 0 ? parLesChamps : trouves

  // Recherche d'accessoire (« shaker », « gourde ») : un mot de la recherche
  // désigne le type ou une étiquette d'accessoire. Pas le titre : « eric
  // favre » est aussi dans le titre d'un shaker. Les accessoires ne sont
  // alors pas relégués.
  const motsAccessoires = fiches.filter(estAccessoire).flatMap((f) => [...f.type, ...f.etiquettes])
  const rechercheAccessoire = termes.some((t) => correspond(motsAccessoires, t) > 0)

  const cle = (r: Resultat<T>): number[] => [
    r.accessoire && !rechercheAccessoire ? 1 : 0,
    r.rayon ? 0 : 1, // le rayon nommé d'abord, en entier
    r.enStock ? 0 : 1,
    r.rayon && r.finDeRayon ? 1 : 0,
    r.rayon ? 0 : -r.niveau, // dans le rayon : l'ordre des ventes suffit
    r.rayon ? 0 : -r.score,
    r.rang,
  ]
  return retenus
    .map((r) => ({ r, k: cle(r) }))
    .sort((a, b) => {
      for (let i = 0; i < a.k.length; i++) if (a.k[i] !== b.k[i]) return a.k[i] - b.k[i]
      return 0
    })
    .map(({ r }) => r.produit)
}
