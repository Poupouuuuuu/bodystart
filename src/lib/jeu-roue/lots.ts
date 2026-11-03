// ============================================================
// Jeu de la roue en boutique : LOTS (fichier unique à modifier)
// ============================================================
// - weight : poids du tirage (40 + 25 + 20 + 15 = 100 → % de chance).
//   Le 21/10/2026 : créatine 4 → 1 et canette 35 → 38 (4 créatines sur 71
//   codes depuis le 08/10). Le 03/11/2026 : créatine et whey retirées du jeu
//   (LOTS_RETIRES), canette 38 → 40.
// - type 'product' : un article offert. La remise vaut le prix d'une unité
//   (lu en direct dans Shopify au moment du tirage, `amount` sert de repli),
//   limitée aux produits / variantes ciblés, appliquée une seule fois.
//   Lot retiré du tirage s'il n'a plus de stock à la boutique de Coignières.
// - type 'order' : remise sur la commande (`amount` €, dès `minSubtotal` €).
// - id : sert aussi d'étiquette client Shopify (`jeu-roue-<id>`) : ne pas
//   renommer un lot déjà joué, en ajouter un nouveau plutôt.
// - Retirer un lot : le déplacer de LOTS vers LOTS_RETIRES (jamais le
//   supprimer tant que ses codes peuvent servir, voir plus bas).
// IDs vérifiés dans Shopify le 07/10/2026.

/** Lots du tirage, sur la roue. */
export type LotIdActif = 'canette-abe' | 'crunch-bar' | 'shaker' | 'bon-5'
/** Lots retirés du jeu : connus seulement pour les codes déjà émis. */
export type LotIdRetire = 'creatine' | 'whey'
export type LotId = LotIdActif | LotIdRetire

/** Parfum couvert par un lot (une variante ciblée). */
export interface Parfum {
  variant: string
  /** Nom complet, affiché au client (écran résultat, note client). */
  nom: string
  /** Nom court, dans le titre de la remise lu en caisse. */
  court: string
}

export interface Lot<Id extends LotId = LotId> {
  id: Id
  /** Libellé complet : écran résultat, note client, titre de la remise. */
  label: string
  /** Libellé court affiché sur la roue (2 lignes max). */
  wheelLabel: string
  weight: number
  type: 'product' | 'order'
  /** Produits ciblés (toutes leurs variantes). */
  products?: string[]
  /** Variantes ciblées. */
  variants?: string[]
  /**
   * Parfums couverts, dans l'ordre d'affichage, quand le lot ne couvre que
   * certaines variantes du produit (sans ce rappel, un gagnant peut prendre un
   * parfum hors lot et voir son code refusé en caisse). Une entrée par
   * variante ciblée (vérifié par lots.test.ts) : changer les variantes oblige
   * à les tenir à jour. Inutile sur un lot qui cible le produit entier.
   */
  parfums?: Parfum[]
  /**
   * Libellés portés par les titres de remise des codes déjà créés, quand le
   * libellé a changé depuis : le récap hebdo retrouve le lot de ces codes.
   */
  anciensLibelles?: string[]
  /** Montant de la remise en euros (repli si le prix Shopify est illisible). */
  amount: number
  /** Minimum d'achat en euros (remise sur commande). */
  minSubtotal?: number
}

/** Lots du tirage, dans l'ordre de la roue et du bloc des chances de /jeu. */
export const LOTS: Lot<LotIdActif>[] = [
  {
    id: 'canette-abe',
    label: 'Une canette ABE Energy',
    wheelLabel: 'Canette ABE',
    weight: 40,
    type: 'product',
    products: ['gid://shopify/Product/10927490892118'],
    amount: 3.1,
  },
  {
    // id gardé (étiquette client `jeu-roue-crunch-bar`) : le lot est devenu une
    // barre au choix le 16/10/2026 (un gagnant avait pris une Smart Bar en
    // boutique). Avant : tous les parfums de la Crunch Bar depuis le
    // 09/10/2026, 3 variantes avant. Smart Bar et Applied Crunch sont vendues
    // en caisse seulement (pas sur le site) : normal, les codes servent en
    // caisse. Les trois à 2,90 € le 16/10/2026 ; la remise prend le prix le
    // plus élevé des trois.
    id: 'crunch-bar',
    label: 'Une barre protéinée au choix (Crunch Bar, Smart Bar ou Applied Crunch)',
    // « Barre protéinée » (115 px) ne tient pas dans la part de roue (~118 px utiles).
    wheelLabel: 'Barre au choix',
    weight: 25,
    type: 'product',
    products: [
      'gid://shopify/Product/10832196010326', // Crunch Bar Warrior
      'gid://shopify/Product/11371642061142', // Smart Bar PhD 64 g
      'gid://shopify/Product/11371642093910', // Protein Crunch Bar Applied Nutrition 62 g
    ],
    anciensLibelles: [
      'Une barre Crunch Bar',
      'Une barre Crunch Bar (Dark Choco PB, PB Cup ou Cookie Dough)',
      'Une barre Crunch Bar (parfum au choix)',
    ],
    amount: 2.9,
  },
  {
    id: 'shaker',
    label: 'Un shaker',
    wheelLabel: 'Shaker',
    weight: 20,
    type: 'product',
    products: ['gid://shopify/Product/11139051290966'],
    amount: 6.9,
  },
  {
    // Janvier 2027 (programme de fidélité) : ce lot pourra devenir « 5 € dans
    // la cagnotte ». Marche à suivre : passer ce lot dans LOTS_RETIRES (ses
    // codes restent valables), ajouter ici un nouveau lot (nouvel id, nouveau
    // type traité dans shopify.ts à la place du code promo), même poids.
    id: 'bon-5',
    label: '5 € dès 30 € d’achat',
    wheelLabel: '5 € offerts',
    weight: 15,
    type: 'order',
    amount: 5,
    minSubtotal: 30,
  },
]

/**
 * Lots retirés du jeu le 03/11/2026 (décision de la direction, transmise par
 * l'Agent Digital) : ni tirés, ni sur la roue, ni dans le bloc des chances.
 * Gardés pour les codes ROUE déjà émis, valables jusqu'à leur date : écran
 * du gagnant qui revient sur /jeu (résultat lu dans son métachamp), note
 * client, récap hebdo (titre de la remise → lot). Poids 0.
 */
export const LOTS_RETIRES: Lot<LotIdRetire>[] = [
  {
    id: 'creatine',
    label: 'Une créatine Dedicated 500 g',
    wheelLabel: 'Créatine',
    weight: 0,
    type: 'product',
    variants: ['gid://shopify/ProductVariant/53981935206742'],
    amount: 36.9,
  },
  {
    id: 'whey',
    label: 'Une whey Protimuscle 1 kg',
    wheelLabel: 'Whey',
    weight: 0,
    type: 'product',
    variants: [
      'gid://shopify/ProductVariant/54095546483030',
      'gid://shopify/ProductVariant/54095546515798',
      'gid://shopify/ProductVariant/54095546548566',
      'gid://shopify/ProductVariant/54095546581334',
    ],
    // Noms tels que dans Shopify (« Chocolat / 1 kg »…) ; Matcha Latte, Amande
    // Pistache et Caramel Salé Pécan 1 kg ne sont pas dans le lot.
    parfums: [
      { variant: 'gid://shopify/ProductVariant/54095546483030', nom: 'Chocolat', court: 'Chocolat' },
      { variant: 'gid://shopify/ProductVariant/54095546515798', nom: 'Vanille', court: 'Vanille' },
      { variant: 'gid://shopify/ProductVariant/54095546548566', nom: 'Choco-cookie', court: 'Choco-cookie' },
      { variant: 'gid://shopify/ProductVariant/54095546581334', nom: 'Fraise', court: 'Fraise' },
    ],
    amount: 44.9,
  },
]

/** Emplacement de stock vérifié avant le tirage (BodyStart Coignières). */
export const JEU_LOCATION_ID = 'gid://shopify/Location/119350657366'

/** Validité du code gagné, en jours. */
export const CODE_VALIDITY_DAYS = 30

/** Lien d'avis Google de la fiche BodyStart Nutrition. */
export const GOOGLE_REVIEW_URL =
  'https://search.google.com/local/writereview?placeid=ChIJR-Jgxiyd5kcRRb2BKNRdFNM'

/** Lot du jeu ou lot retiré (codes déjà émis). */
export function lotById(id: string): Lot | undefined {
  return LOTS.find((l) => l.id === id) ?? LOTS_RETIRES.find((l) => l.id === id)
}

export function estRetire(lot: Lot): boolean {
  return (LOTS_RETIRES as Lot[]).includes(lot)
}

/** Nombre minimal de parts sur la roue : en dessous, les lots y figurent plusieurs fois. */
const PARTS_MIN = 8

/**
 * Parts de la roue, sens horaire depuis le pointeur : la suite des lots,
 * répétée jusqu'à PARTS_MIN parts au moins (4 lots → 8 parts). Chaque part
 * est un lot du tirage : aucune ne montre un lot impossible à gagner.
 */
export function partsDeRoue<L extends Lot>(lots: readonly L[]): L[] {
  if (lots.length === 0) return []
  const tours = Math.ceil(PARTS_MIN / lots.length)
  return Array.from({ length: tours }, () => lots).flat()
}

/** « A », « A ou B », « A, B ou C ». */
function enumerer(xs: string[]): string {
  return xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ou ${xs[xs.length - 1]}`
}

/** Parfums couverts, en clair (« A, B ou C ») ; null si le lot n'en précise pas. */
export function lotParfums(lot: Lot): string | null {
  return lot.parfums?.length ? enumerer(lot.parfums.map((p) => p.nom)) : null
}

/** Libellé montré au client : « Une whey Protimuscle 1 kg au choix : A, B ou C ». */
export function lotLabelClient(lot: Lot): string {
  const parfums = lotParfums(lot)
  return parfums ? `${lot.label} au choix : ${parfums}` : lot.label
}

/**
 * Libellé du titre de la remise (lu en caisse) : « Une whey Protimuscle 1 kg
 * (Chocolat, Vanille, Choco-cookie ou Fraise) ». Le récap retrouve le lot par
 * ce titre (lotFromTitle), y compris pour les anciens codes (sans parfums, ou
 * `anciensLibelles`).
 */
export function lotLabelRemise(lot: Lot): string {
  return lot.parfums?.length ? `${lot.label} (${enumerer(lot.parfums.map((p) => p.court))})` : lot.label
}
