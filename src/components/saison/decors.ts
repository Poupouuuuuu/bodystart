import type { ComponentType } from 'react'
import type { ThemeSaison } from '@/lib/saison'
import FondHeroHalloween from './halloween/FondHeroHalloween'
import FriseHalloween from './halloween/FriseHalloween'
import SeparateurHalloween from './halloween/SeparateurHalloween'
import { CSS_HALLOWEEN } from './halloween/styles'

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
  /** Haut de l'accueil : remplace la photo (aucune image chargée). */
  FondHero: ComponentType
  /** Fond de la section hero (couleur de base sous la scène). */
  fondHero: string
  /** Deuxième ligne du titre du haut de l'accueil (« Le bon conseil. »). */
  accentTitre: string
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
    FondHero: FondHeroHalloween,
    fondHero: 'bg-[#14101F]',
    accentTitre: 'text-[color:var(--saison-accent,#E8711A)] [text-shadow:0_0_14px_rgba(232,113,26,0.35)]',
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
