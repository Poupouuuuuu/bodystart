// Types du guide /conseil.
//
// Le guide (recommandations, candidats, phrases « pourquoi ») vit dans le
// metafield boutique Shopify `bodystart.guide_conseil` : il est mis à jour par
// la boutique quand le stock ou le catalogue change. Rien de son contenu n'est
// recopié dans le code ; ces types décrivent seulement sa forme, une fois lue
// et validée par `parseGuide` (./guide.ts).

export const BUDGETS = ['moins-40', '40-90', 'plus-90'] as const
export type Budget = (typeof BUDGETS)[number]

export const SEANCES = ['0-1', '2-3', '4-plus'] as const
export type Seances = (typeof SEANCES)[number]

/**
 * Contraintes alimentaires. Données de santé possibles (RGPD) : elles restent
 * dans le navigateur, jamais dans une requête, une URL ou un attribut panier.
 */
export const CONTRAINTES = ['sans-lactose', 'vegan', 'sans-cafeine'] as const
export type Contrainte = (typeof CONTRAINTES)[number]

export type Role = 'essentiel' | 'complement'

export interface Emplacement {
  role: Role
  /** Clés produit (`Guide.produits`), dans l'ordre de préférence. */
  candidats: string[]
}

export type ParcoursParBudget = Record<Budget, Emplacement[]>

export interface GuideProduit {
  handle: string
  /** Texte contenu dans le titre de variante (« 1 kg », « 2,25 kg »). Vide = n'importe quelle variante. */
  format: string
  /** Phrase affichée telle quelle (allégations validées par la boutique). */
  pourquoi: string
}

export interface QuestionSup {
  cle: string
  texte: string
  /** Nom du parcours si la réponse est oui (ex. « masse »). */
  oui: string
  /** Nom du parcours si la réponse est non (ex. « standard »). */
  non: string
}

export interface ObjectifParcours {
  type: 'parcours'
  cle: string
  libelle: string
  questionSup: QuestionSup | null
  /** Parcours par nom (« standard », « masse »…), puis par budget. */
  parcours: Record<string, ParcoursParBudget>
}

export interface ObjectifBoutique {
  type: 'boutique'
  cle: string
  libelle: string
  texte: string
  suggestions: string[]
}

export type Objectif = ObjectifParcours | ObjectifBoutique

/**
 * Guide validé. Les notes internes des objectifs et le texte descriptif des
 * règles ne sont pas conservés : seuls les messages client (entre « »)
 * sont extraits des règles.
 */
export interface Guide {
  version: number
  produits: Record<string, GuideProduit>
  /** Dans l'ordre du metafield. */
  objectifs: Objectif[]
  messages: {
    frequence01: string | null
    sansLactose: string | null
    /** Message vegan par défaut (le dernier entre « » de la règle). */
    vegan: string | null
    /** Message vegan propre à un objectif (« muscle, affiner : « … » ; sante : « … » »). */
    veganParObjectif: Record<string, string>
  }
}

export interface Image {
  url: string
  altText: string | null
  width: number
  height: number
}

export interface CatalogueVariante {
  id: string
  titre: string
  prixCents: number
  /** availableForSale (Storefront) : sans lui, l'ajout au panier échoue. */
  disponible: boolean
  /** Stock disponible à l'emplacement Shopify de la boutique active. */
  stock: number
  image: Image | null
}

export interface CatalogueProduit {
  handle: string
  titre: string
  image: Image | null
  variantes: CatalogueVariante[]
}

/** Par clé produit du guide (deux clés peuvent partager un handle : formats différents). */
export type Catalogue = Record<string, CatalogueProduit>

export interface Reponses {
  objectif: string
  seances: Seances
  /** Réponse à la question supplémentaire (null si l'objectif n'en a pas). */
  questionSup: boolean | null
  contraintes: Contrainte[]
  budget: Budget
}

export interface VarianteProposee {
  id: string
  /** Parfum (ou libellé de variante) sans le format. Vide si rien à dire. */
  libelle: string
  prixCents: number
  stock: number
  image: Image | null
}

export interface Ligne {
  cle: string
  role: Role | 'option' | 'suggestion'
  handle: string
  titre: string
  pourquoi: string
  /** Format tel qu'écrit dans le titre de variante (« 2,25 kg »), sinon null. */
  format: string | null
  /** Variantes en stock au bon format, la plus stockée d'abord (= parfum par défaut). */
  variantes: VarianteProposee[]
  /** Prix le plus haut parmi les variantes proposées : le plafond tient quel que soit le parfum choisi. */
  prixMaxCents: number
}

export type Resultat =
  | {
      type: 'selection'
      lignes: Ligne[]
      /** Shaker proposé en option (case à cocher), hors total par défaut. */
      shaker: Ligne | null
      messages: string[]
      plafondCents: number | null
    }
  | {
      type: 'boutique'
      /** ne-sait-pas : choix du client ; rupture : rien en stock pour ses réponses. */
      raison: 'ne-sait-pas' | 'rupture'
      texte: string | null
      suggestions: Ligne[]
      messages: string[]
    }
