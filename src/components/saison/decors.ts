import type { ComponentType } from 'react'
import type { ThemeSaison } from '@/lib/saison'
import EtiquettePhoto from './black-week/EtiquettePhoto'
import FriseBlackWeek from './black-week/FriseBlackWeek'
import SeparateurBlackWeek from './black-week/SeparateurBlackWeek'
import { CSS_BLACK_WEEK } from './black-week/styles'
import { AutomneHero, FriseHalloween, PendusPhoto, PendusSection } from './halloween/scene'
import SeparateurHalloween from './halloween/SeparateurHalloween'
import { CSS_HALLOWEEN } from './halloween/styles'
import { BoulesPhoto, BoulesSection, FriseNoel, HiverHero } from './noel/scene'
import SeparateurNoel from './noel/SeparateurNoel'
import { CSS_NOEL } from './noel/styles'
import Guirlande from './scene/Guirlande'

/**
 * Couleurs du haut de l'accueil en deux parties (variables CSS lues par
 * HeroV3). Texte principal, texte secondaire et lien : 4,5:1 sur --h-fond ;
 * --h-accent (« Le bon conseil. », 46 px et plus) : 3:1.
 */
export type PaletteHero = Record<`--h-${string}`, string>

/** Variables de couleur de la sélection de saison (SelectionSaison). Les
 * facultatives valent, par défaut, le texte clair sur fond sombre. */
export type CouleursSelection = Record<'--sel-sur-titre' | '--sel-mot' | '--sel-halo', string> &
  Partial<Record<'--sel-titre' | '--sel-texte' | '--sel-lien' | '--sel-lien-bord' | '--sel-lien-fond' | '--sel-lien-survol', string>>

/**
 * Déco de saison complète, par thème (Halloween, Black Week et Noël, PR du
 * 19/10/2026 ; un nouveau thème se branche ici avec les mêmes champs). Le thème vient du metafield
 * bodystart.saison (lib/saison) : hors période, aucune déco ni CSS.
 *
 * Rendu serveur (pages en ISR, 15 min) : au changement de période, la déco
 * suit à la régénération suivante ; le bandeau, le logo et les cartes basculent
 * à l'heure pile (header, côté navigateur).
 *
 * Ne touche jamais aux boutons d'achat, aux prix, au panier, au paiement ni
 * aux pages légales.
 */
export interface DecorSaisonPremium {
  /** CSS du thème, émis une fois par le layout pendant la période. */
  css: string
  /** Haut de l'accueil en deux parties : photo nette à droite (en bandeau
   * sous lg), fond uni derrière le texte. Photo chargée comme hors saison. */
  hero: {
    /** Variantes de couleur ; `?hero=` les choisit hors production. */
    palettes: Record<string, PaletteHero>
    defaut: string
    /** Décor posé sur la photo, jamais sur le texte. */
    DecorPhoto: ComponentType
    /** Décor posé sur toute la section, texte compris (Noël : neige fine et
     * sol enneigé ; Halloween : feuilles et sol de nuit). Facultatif. */
    DecorHero?: ComponentType
    /** Classes ajoutées au bloc de texte pour laisser la place au décor du
     * bas (ex. « pb-24 lg:pb-28 »). Facultatif. */
    espaceBas?: string
  }
  /** Bande posée juste sous le haut de l'accueil (guirlande). Facultatif. */
  SousHero?: ComponentType
  /** Séparateur fin entre les grandes sections de l'accueil. */
  Separateur: ComponentType
  /** Frise en tête du pied de page. */
  Frise: ComponentType
  /** Section de l'accueil sous le haut de page. `couleurs` : sur-titre, mot
   * du thème et son halo, et pour un fond clair titre, texte et lien
   * (variables lues par SelectionSaison, sur fond `fond`). `Ornement` : décor
   * posé dans la section (objets suspendus). */
  selection: {
    titre: string
    motTheme: string
    intro: string
    fond: string
    couleurs: CouleursSelection
    Ornement?: ComponentType
  }
}

// Couleurs de la sélection sur fond crème (Noël, Halloween) : titre vert, mot
// et sur-titre à l'accent du thème, texte gris, lien vert (code du site).
const selectionClaire = (accent: string): CouleursSelection => ({
  '--sel-sur-titre': accent,
  '--sel-mot': accent,
  '--sel-halo': 'none',
  '--sel-titre': '#2D5A2D',
  '--sel-texte': '#6B6B66',
  '--sel-lien': '#2D5A2D',
  '--sel-lien-bord': 'rgba(45,90,45,0.25)',
  '--sel-lien-fond': '#FFFFFF',
  '--sel-lien-survol': '#EEF4EC',
})

const DECORS: Partial<Record<ThemeSaison, DecorSaisonPremium>> = {
  // Halloween (19 au 31/10), mise en scène refaite le 20/10/2026 sur le
  // modèle de Noël : haut de l'accueil en nuit, sections en crème, guirlande
  // de lanternes citrouilles, chauves-souris et araignées suspendues,
  // feuilles d'automne, sol de nuit avec citrouilles, tombes, bonbons et
  // marmite. Orange foncé #B4500E sur crème (4,6:1).
  halloween: {
    css: CSS_HALLOWEEN,
    hero: {
      palettes: {
        // A : fond nuit, texte clair, accents orange.
        a: {
          '--h-fond': '#14101F',
          '--h-texte': '#FAF8F3',
          '--h-texte-doux': 'rgba(255,255,255,0.8)',
          '--h-sur-titre': 'rgba(255,255,255,0.85)',
          '--h-accent': '#E8711A',
          '--h-trait': '#E8711A',
          '--h-ligne': 'rgba(255,255,255,0.14)',
          '--h-ligne-forte': 'rgba(255,255,255,0.3)',
          '--h-voile': 'rgba(255,255,255,0.06)',
          '--h-voile-fort': 'rgba(255,255,255,0.14)',
          '--h-bouton': '#FAF8F3',
          '--h-bouton-texte': '#14101F',
          '--h-rond': '#E8711A',
          '--h-rond-texte': '#14101F',
          '--h-lien': '#FFB46B',
          '--h-liseret': '#E8711A',
        },
        // B : fond orange, texte nuit (le blanc n'atteint que 3,1:1 sur
        // #E8711A : réservé au grand titre).
        b: {
          '--h-fond': '#E8711A',
          '--h-texte': '#14101F',
          '--h-texte-doux': 'rgba(20,16,31,0.86)',
          '--h-sur-titre': '#14101F',
          '--h-accent': '#FFFFFF',
          '--h-trait': '#14101F',
          '--h-ligne': 'rgba(20,16,31,0.24)',
          '--h-ligne-forte': 'rgba(20,16,31,0.5)',
          '--h-voile': 'rgba(20,16,31,0.06)',
          '--h-voile-fort': 'rgba(20,16,31,0.12)',
          '--h-bouton': '#14101F',
          '--h-bouton-texte': '#FAF8F3',
          '--h-rond': '#E8711A',
          '--h-rond-texte': '#14101F',
          '--h-lien': '#14101F',
          '--h-liseret': '#14101F',
        },
      },
      defaut: 'a',
      DecorPhoto: PendusPhoto,
      DecorHero: AutomneHero,
      espaceBas: 'pb-24 lg:pb-28',
    },
    SousHero: Guirlande,
    Separateur: SeparateurHalloween,
    Frise: FriseHalloween,
    selection: {
      titre: 'La sélection',
      motTheme: 'Halloween',
      intro:
        'Nos packs et des produits que nos clients reprennent le plus. Retrait gratuit en boutique à Coignières, livraison partout en France.',
      fond: 'hw-selection',
      couleurs: selectionClaire('#B4500E'),
      Ornement: PendusSection,
    },
  },
  // Black Week (23 au 28/11) : noir #111111 et jaune #F2C200, décor sobre
  // (étiquettes, équerres, aucune animation). Jaune sur noir : 11,8:1.
  'black-week': {
    css: CSS_BLACK_WEEK,
    hero: {
      palettes: {
        // A : fond noir, texte clair, accents jaunes.
        a: {
          '--h-fond': '#111111',
          '--h-texte': '#FAF8F3',
          '--h-texte-doux': 'rgba(255,255,255,0.8)',
          '--h-sur-titre': 'rgba(255,255,255,0.85)',
          '--h-accent': '#F2C200',
          '--h-trait': '#F2C200',
          '--h-ligne': 'rgba(255,255,255,0.14)',
          '--h-ligne-forte': 'rgba(255,255,255,0.3)',
          '--h-voile': 'rgba(255,255,255,0.06)',
          '--h-voile-fort': 'rgba(255,255,255,0.14)',
          '--h-bouton': '#F2C200',
          '--h-bouton-texte': '#111111',
          '--h-rond': '#111111',
          '--h-rond-texte': '#F2C200',
          '--h-lien': '#F2C200',
          '--h-liseret': '#F2C200',
        },
        // B : fond jaune, texte noir (noir sur #F2C200 : 12:1 ; le grand
        // titre garde son mot en noir souligné, le blanc ne passe pas).
        b: {
          '--h-fond': '#F2C200',
          '--h-texte': '#111111',
          '--h-texte-doux': 'rgba(17,17,17,0.86)',
          '--h-sur-titre': '#111111',
          '--h-accent': '#111111',
          '--h-trait': '#111111',
          '--h-ligne': 'rgba(17,17,17,0.24)',
          '--h-ligne-forte': 'rgba(17,17,17,0.5)',
          '--h-voile': 'rgba(17,17,17,0.06)',
          '--h-voile-fort': 'rgba(17,17,17,0.12)',
          '--h-bouton': '#111111',
          '--h-bouton-texte': '#FAF8F3',
          '--h-rond': '#F2C200',
          '--h-rond-texte': '#111111',
          '--h-lien': '#111111',
          '--h-liseret': '#111111',
        },
      },
      defaut: 'a',
      DecorPhoto: EtiquettePhoto,
    },
    Separateur: SeparateurBlackWeek,
    Frise: FriseBlackWeek,
    selection: {
      titre: 'La sélection',
      motTheme: 'Black Week',
      intro:
        'Nos packs et des produits que nos clients reprennent le plus. Retrait gratuit en boutique à Coignières, livraison partout en France.',
      fond: 'bw-selection',
      couleurs: { '--sel-sur-titre': '#F2C200', '--sel-mot': '#F2C200', '--sel-halo': 'none' },
    },
  },
  // Noël (29/11 au 24/12), refonte du 20/10/2026 : un décor plutôt qu'une
  // palette. Haut de l'accueil en ciel de nuit (a) ou vert sapin très foncé
  // (b), grandes sections en crème ou blanc neige, rouge et or en accents
  // seulement. Neige, guirlandes, boules suspendues, sapins et cadeaux.
  noel: {
    css: CSS_NOEL,
    hero: {
      palettes: {
        // A : ciel de nuit, texte crème, mot doré (10,9:1), bouton rouge
        // (blanc sur #C62828 : 5,6:1).
        a: {
          '--h-fond': '#13203A',
          '--h-texte': '#FAF8F3',
          '--h-texte-doux': 'rgba(255,255,255,0.82)',
          '--h-sur-titre': 'rgba(255,255,255,0.86)',
          '--h-accent': '#F2D28A',
          '--h-trait': '#F2D28A',
          '--h-ligne': 'rgba(255,255,255,0.16)',
          '--h-ligne-forte': 'rgba(255,255,255,0.32)',
          '--h-voile': 'rgba(255,255,255,0.07)',
          '--h-voile-fort': 'rgba(255,255,255,0.15)',
          '--h-bouton': '#C62828',
          '--h-bouton-texte': '#FFFFFF',
          '--h-rond': '#F2D28A',
          '--h-rond-texte': '#13203A',
          '--h-lien': '#F2D28A',
          '--h-liseret': '#F2D28A',
        },
        // B : vert sapin très foncé. Écart à la règle « jamais de vert en
        // grande surface » : à trancher par Claude Gestion.
        b: {
          '--h-fond': '#0F2A1E',
          '--h-texte': '#FAF8F3',
          '--h-texte-doux': 'rgba(255,255,255,0.82)',
          '--h-sur-titre': 'rgba(255,255,255,0.86)',
          '--h-accent': '#F2D28A',
          '--h-trait': '#F2D28A',
          '--h-ligne': 'rgba(255,255,255,0.16)',
          '--h-ligne-forte': 'rgba(255,255,255,0.32)',
          '--h-voile': 'rgba(255,255,255,0.07)',
          '--h-voile-fort': 'rgba(255,255,255,0.15)',
          '--h-bouton': '#C62828',
          '--h-bouton-texte': '#FFFFFF',
          '--h-rond': '#F2D28A',
          '--h-rond-texte': '#0F2A1E',
          '--h-lien': '#F2D28A',
          '--h-liseret': '#F2D28A',
        },
      },
      defaut: 'a',
      DecorPhoto: BoulesPhoto,
      DecorHero: HiverHero,
      espaceBas: 'pb-24 lg:pb-28',
    },
    SousHero: Guirlande,
    Separateur: SeparateurNoel,
    Frise: FriseNoel,
    selection: {
      titre: 'La sélection de',
      motTheme: 'Noël',
      intro:
        'Nos packs et des produits que nos clients reprennent le plus, à offrir ou à garder pour soi. Retrait gratuit en boutique à Coignières, livraison partout en France.',
      fond: 'nl-selection',
      couleurs: selectionClaire('#B3261E'),
      Ornement: BoulesSection,
    },
  },
}

export function decorSaison(theme: ThemeSaison | null | undefined): DecorSaisonPremium | null {
  return (theme && DECORS[theme]) || null
}
