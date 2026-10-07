// ============================================================
// Jeu de la roue en boutique : LOTS (fichier unique à modifier)
// ============================================================
// - weight : poids du tirage (35 + 25 + 20 + 15 + 4 + 1 = 100 → % de chance).
// - type 'product' : un article offert. La remise vaut le prix d'une unité
//   (lu en direct dans Shopify au moment du tirage, `amount` sert de repli),
//   limitée aux produits / variantes ciblés, appliquée une seule fois.
//   Lot retiré du tirage s'il n'a plus de stock à la boutique de Coignières.
// - type 'order' : remise sur la commande (`amount` €, dès `minSubtotal` €).
// - id : sert aussi d'étiquette client Shopify (`jeu-roue-<id>`) : ne pas
//   renommer un lot déjà joué, en ajouter un nouveau plutôt.
// IDs vérifiés dans Shopify le 07/10/2026.

export type LotId = 'canette-abe' | 'crunch-bar' | 'shaker' | 'bon-5' | 'creatine' | 'whey'

export interface Lot {
  id: LotId
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
  /** Montant de la remise en euros (repli si le prix Shopify est illisible). */
  amount: number
  /** Minimum d'achat en euros (remise sur commande). */
  minSubtotal?: number
}

export const LOTS: Lot[] = [
  {
    id: 'canette-abe',
    label: 'Une canette ABE Energy',
    wheelLabel: 'Canette ABE',
    weight: 35,
    type: 'product',
    products: ['gid://shopify/Product/10927490892118'],
    amount: 3.1,
  },
  {
    id: 'crunch-bar',
    label: 'Une barre Crunch Bar',
    wheelLabel: 'Crunch Bar',
    weight: 25,
    type: 'product',
    variants: [
      'gid://shopify/ProductVariant/54097477534038',
      'gid://shopify/ProductVariant/54130802786646',
      'gid://shopify/ProductVariant/54401705804118',
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
    id: 'bon-5',
    label: '5 € dès 30 € d’achat',
    wheelLabel: '5 € offerts',
    weight: 15,
    type: 'order',
    amount: 5,
    minSubtotal: 30,
  },
  {
    id: 'creatine',
    label: 'Une créatine Dedicated 500 g',
    wheelLabel: 'Créatine',
    weight: 4,
    type: 'product',
    variants: ['gid://shopify/ProductVariant/53981935206742'],
    amount: 36.9,
  },
  {
    id: 'whey',
    label: 'Une whey Protimuscle 1 kg',
    wheelLabel: 'Whey',
    weight: 1,
    type: 'product',
    variants: [
      'gid://shopify/ProductVariant/54095546483030',
      'gid://shopify/ProductVariant/54095546515798',
      'gid://shopify/ProductVariant/54095546548566',
      'gid://shopify/ProductVariant/54095546581334',
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

export function lotById(id: string): Lot | undefined {
  return LOTS.find((l) => l.id === id)
}
