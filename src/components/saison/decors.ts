import type { ComponentType } from 'react'
import type { ThemeSaison } from '@/lib/saison'
import VoileHeroHalloween from './halloween/VoileHeroHalloween'
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
  /** Voiles et décor posés sur la photo du haut de l'accueil, à la place
   * des voiles habituels (la photo reste chargée comme hors saison). */
  VoileHero: ComponentType
  /** Deuxième ligne du titre du haut de l'accueil (« Le bon conseil. »). */
  accentTitre: string
  /** Sur-titre (h1) du haut de l'accueil et son trait. */
  accentSurTitre: string
  traitSurTitre: string
  /** Étoiles de l'avis Google du haut de l'accueil. */
  accentEtoiles: string
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
    VoileHero: VoileHeroHalloween,
    accentTitre: 'text-[color:var(--saison-accent,#E8711A)] [text-shadow:0_0_14px_rgba(232,113,26,0.35)]',
    // Orange clair pour le petit texte : AA mesuré sur la photo voilée
    // (l'accent #E8711A n'atteint pas 4,5:1 sur le vert sapin).
    accentSurTitre: 'text-[#FFB46B]',
    traitSurTitre: 'mr-3 inline-block h-px w-8 -translate-y-[0.3em] bg-[#E8711A] align-middle',
    accentEtoiles: 'fill-[#E8711A] text-[#E8711A]',
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
