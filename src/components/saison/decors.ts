import type { ComponentType } from 'react'
import type { ThemeSaison } from '@/lib/saison'
import ChauvesSourisPhoto from './halloween/ChauvesSourisPhoto'
import FriseHalloween from './halloween/FriseHalloween'
import SeparateurHalloween from './halloween/SeparateurHalloween'
import { CSS_HALLOWEEN } from './halloween/styles'

/**
 * Couleurs du haut de l'accueil en deux parties (variables CSS lues par
 * HeroV3). Texte principal, texte secondaire et lien : 4,5:1 sur --h-fond ;
 * --h-accent (« Le bon conseil. », 46 px et plus) : 3:1.
 */
export type PaletteHero = Record<`--h-${string}`, string>

/**
 * Déco de saison complète, par thème (Halloween le 19/10/2026 ; Noël du 29/11
 * au 24/12 se branche ici avec les mêmes champs). Le thème vient du metafield
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
  }
  /** Séparateur fin entre les grandes sections de l'accueil. */
  Separateur: ComponentType
  /** Frise en tête du pied de page. */
  Frise: ComponentType
  /** Section de l'accueil sous le haut de page. */
  selection: { titre: string; motTheme: string; intro: string; fond: string }
}

const DECORS: Partial<Record<ThemeSaison, DecorSaisonPremium>> = {
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
      DecorPhoto: ChauvesSourisPhoto,
    },
    Separateur: SeparateurHalloween,
    Frise: FriseHalloween,
    selection: {
      titre: 'La sélection',
      motTheme: 'Halloween',
      intro:
        'Nos packs et des produits que nos clients reprennent le plus. Retrait gratuit en boutique à Coignières, livraison partout en France.',
      fond: 'hw-selection',
    },
  },
}

export function decorSaison(theme: ThemeSaison | null | undefined): DecorSaisonPremium | null {
  return (theme && DECORS[theme]) || null
}
