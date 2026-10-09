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

/** Parfum couvert par un lot (une variante ciblée). */
export interface Parfum {
  variant: string
  /** Nom complet, affiché au client (écran résultat, note client). */
  nom: string
  /** Nom court, dans le titre de la remise lu en caisse. */
  court: string
}

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
  /**
   * Parfums couverts, dans l'ordre d'affichage, quand le lot ne couvre pas
   * tous les parfums du produit (09/10/2026 : un gagnant Crunch Bar a pris un
   * parfum hors lot, code refusé en caisse). Une entrée par variante ciblée
   * (vérifié par lots.test.ts) : changer les variantes oblige à les tenir à jour.
   */
  parfums?: Parfum[]
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
    parfums: [
      { variant: 'gid://shopify/ProductVariant/54097477534038', nom: 'Dark Chocolate Peanut Butter', court: 'Dark Choco PB' },
      { variant: 'gid://shopify/ProductVariant/54401705804118', nom: 'Peanut Butter Cup', court: 'PB Cup' },
      { variant: 'gid://shopify/ProductVariant/54130802786646', nom: 'Chocolate Chip Cookie Dough', court: 'Cookie Dough' },
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

export function lotById(id: string): Lot | undefined {
  return LOTS.find((l) => l.id === id)
}

/** « A », « A ou B », « A, B ou C ». */
function enumerer(xs: string[]): string {
  return xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ou ${xs[xs.length - 1]}`
}

/** Parfums couverts, en clair (« A, B ou C ») ; null si le lot n'en précise pas. */
export function lotParfums(lot: Lot): string | null {
  return lot.parfums?.length ? enumerer(lot.parfums.map((p) => p.nom)) : null
}

/** Libellé montré au client : « Une barre Crunch Bar au choix : A, B ou C ». */
export function lotLabelClient(lot: Lot): string {
  const parfums = lotParfums(lot)
  return parfums ? `${lot.label} au choix : ${parfums}` : lot.label
}

/**
 * Libellé du titre de la remise (lu en caisse) : « Une barre Crunch Bar
 * (Dark Choco PB, PB Cup ou Cookie Dough) ». Le récap retrouve le lot par
 * ce titre (lotFromTitle), y compris pour les anciens codes sans parfums.
 */
export function lotLabelRemise(lot: Lot): string {
  return lot.parfums?.length ? `${lot.label} (${enumerer(lot.parfums.map((p) => p.court))})` : lot.label
}
