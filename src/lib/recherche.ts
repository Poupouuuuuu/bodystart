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
// - à égalité, l'ordre reçu (meilleures ventes, comme le catalogue) ;
// - parfums et formats (variantes, 17/10/2026) : « whey vanille » trouve les
//   whey qui ont un parfum vanille (français ou anglais), et la variante
//   trouvée est rendue pour ouvrir la fiche dessus (?variant=).
//
// Pur, sans réseau. Testé dans recherche.test.ts.

/** Variante d'une fiche (parfum, format) : « Vanille / 1 kg ». */
export interface VarianteRecherchable {
  id: string
  title: string
  availableForSale?: boolean | null
}

export interface Recherchable {
  title: string
  vendor?: string | null
  productType?: string | null
  tags?: string[] | null
  description?: string | null
  availableForSale?: boolean | null
  variantes?: VarianteRecherchable[] | null
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
  // Parfums : les marques les écrivent en français ou en anglais.
  vanille: ['vanilla'],
  vanilla: ['vanille'],
  chocolat: ['chocolate'],
  chocolate: ['chocolat'],
  fraise: ['strawberry'],
  strawberry: ['fraise'],
  framboise: ['raspberry'],
  raspberry: ['framboise'],
  cerise: ['cherry'],
  cherry: ['cerise'],
  pasteque: ['watermelon'],
  watermelon: ['pasteque'],
  ananas: ['pineapple'],
  pineapple: ['ananas'],
  citron: ['lemon'],
  lemon: ['citron'],
  pomme: ['apple'],
  apple: ['pomme'],
  cannelle: ['cinnamon'],
  cinnamon: ['cannelle'],
  noisette: ['hazelnut'],
  hazelnut: ['noisette'],
  cacahuete: ['peanut'],
  peanut: ['cacahuete'],
  banane: ['banana'],
  banana: ['banane'],
  peche: ['peach'],
  peach: ['peche'],
  cafe: ['coffee'],
  coffee: ['cafe'],
  creme: ['cream'],
  cream: ['creme'],
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
    // Format collé à son unité : « 1 kg » = « 1kg », « 2,25 kg » = « 2 25kg »
    .replace(/\b(\d+) (kg|g|ml|cl|l)\b/g, '$1$2')
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

interface VarianteIndexee {
  variante: VarianteRecherchable
  mots: string[]
  dispo: boolean
}

interface FicheIndexee {
  titre: string[]
  categorie: string[]
  etiquettes: string[]
  /** Mots de toutes les variantes (parfums, formats). */
  parfums: string[]
  marque: string[]
  description: string[]
  type: string[]
  variantes: VarianteIndexee[]
}

function indexer(p: Recherchable): FicheIndexee {
  const type = mots(p.productType)
  const variantes = (p.variantes ?? [])
    .filter((v) => v.title && v.title !== 'Default Title')
    .map((v) => ({ variante: v, mots: mots(v.title), dispo: v.availableForSale !== false }))
  return {
    titre: mots(p.title),
    categorie: type,
    etiquettes: (p.tags ?? []).flatMap((t) => mots(t)),
    parfums: variantes.flatMap((v) => v.mots),
    marque: mots(p.vendor),
    description: mots(p.description),
    type,
    variantes,
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
  /** Trouvé seulement dans une variante (parfum, format). */
  parfum?: boolean
}

function chercherTermes(f: FicheIndexee, termes: string[]): Trouve {
  const champs: [string[], number, boolean][] = [
    [f.titre, NIVEAU.titre, false],
    [f.categorie, NIVEAU.categorie, false],
    [f.etiquettes, NIVEAU.categorie, false],
    [f.parfums, NIVEAU.categorie, true],
    [f.marque, NIVEAU.marque, false],
    [f.description, NIVEAU.description, false],
  ]
  for (const [champ, niveau, parfum] of champs) {
    let exact = false
    let trouve = false
    for (const t of termes) {
      const c = correspond(champ, t)
      if (c > 0) trouve = true
      if (c === 2) exact = true
    }
    if (trouve) return { niveau, exact, parfum }
  }
  return { niveau: 0, exact: false }
}

/**
 * Variante qui porte tous les mots trouvés seulement dans les variantes
 * (« vanille », « 1kg »), en stock d'abord. null si aucune ne les porte tous
 * (« vanille chocolat » : deux parfums différents).
 */
function varianteTrouvee(f: FicheIndexee, termesParfum: string[]): VarianteIndexee | null {
  if (termesParfum.length === 0) return null
  const porteTout = f.variantes.filter((v) =>
    termesParfum.every((t) => [t, ...(SYNONYMES[t] ?? [])].some((m) => correspond(v.mots, m) > 0))
  )
  return porteTout.find((v) => v.dispo) ?? porteTout[0] ?? null
}

function chercherMot(f: FicheIndexee, mot: string): Trouve {
  const direct = chercherTermes(f, [mot, ...(SYNONYMES[mot] ?? [])])
  const elargi = ELARGISSEMENTS[mot] ? chercherTermes(f, ELARGISSEMENTS[mot]) : { niveau: 0, exact: false }
  // Un élargissement ne vaut jamais un titre : « Acides Aminés Essentiels »
  // ne passe pas devant les BCAA sur « bcaa ».
  const plafonne = { niveau: Math.min(elargi.niveau, NIVEAU.categorie), exact: false }
  return direct.niveau >= plafonne.niveau ? direct : plafonne
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
  variante: VarianteIndexee | null
  rang: number
  niveau: number
  score: number
  rayon: boolean
  finDeRayon: boolean
  accessoire: boolean
  enStock: boolean
}

type VarianteDe<T extends Recherchable> = NonNullable<T['variantes']>[number]

/** Une fiche trouvée, et la variante qui correspond au parfum ou au format demandé. */
export interface Trouvaille<T extends Recherchable> {
  produit: T
  variante: VarianteDe<T> | null
}

/**
 * Fiches qui correspondent à la recherche, de la plus pertinente à la moins
 * pertinente. L'ordre reçu sert de départage (meilleures ventes).
 */
export function rechercher<T extends Recherchable>(produits: T[], q: string): T[] {
  return rechercherDetail(produits, q).map((r) => r.produit)
}

/** Comme rechercher, avec la variante trouvée (pour ouvrir la fiche dessus). */
export function rechercherDetail<T extends Recherchable>(produits: T[], q: string): Trouvaille<T>[] {
  const termes = motsRecherche(q)
  if (termes.length === 0) return []

  const fiches = produits.map(indexer)
  const motsDeRayon = new Set(fiches.flatMap((f) => f.type))

  const trouves: Resultat<T>[] = []
  produits.forEach((produit, rang) => {
    const f = fiches[rang]
    let niveau: number = NIVEAU.titre
    let score = 0
    const termesParfum: string[] = []
    for (const t of termes) {
      const r = chercherMot(f, t)
      if (r.niveau === 0) return // tous les mots doivent être trouvés
      niveau = Math.min(niveau, r.niveau)
      score += r.niveau * 2 + (r.exact ? 1 : 0)
      if (r.parfum) termesParfum.push(t)
    }
    const variante = varianteTrouvee(f, termesParfum)
    trouves.push({
      produit,
      variante,
      rang,
      niveau,
      score,
      rayon: termes.some((t) => nommeLeRayon(f, t, motsDeRayon)),
      finDeRayon: FIN_DE_RAYON.some((e) => f.etiquettes.includes(e) && !termes.includes(e)),
      accessoire: estAccessoire(f),
      // Parfum demandé : en stock si CE parfum l'est (« whey fraise » : une
      // whey sans fraise disponible passe après celles qui en ont).
      enStock: variante ? variante.dispo : produit.availableForSale !== false,
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
    // La variante rendue est celle de la fiche (avec ses champs en plus : prix).
    .map(({ r }) => ({ produit: r.produit, variante: (r.variante?.variante as VarianteDe<T> | undefined) ?? null }))
}
