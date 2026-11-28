// ============================================================
// Offre du haut de l'accueil (refonte du 28/11/2026)
// ============================================================
// Sur-titre, titre, phrase, bouton et lien secondaire, choisis par la période
// du mode saison (metafield `bodystart.saison`, lib/saison) : Black Week,
// Noël, sinon une offre permanente. Les textes sont écrits ici, par thème :
// rien n'est écrit dans Shopify. Pas de compte à rebours (Gestion, 28/11).
//
// Bascule sans intervention, même avec la page en cache (modèle du header) :
// le serveur rend la période et passe son rang ; le premier rendu navigateur
// reprend ce rang à l'identique ; un effet recalcule ensuite à l'heure du
// navigateur (components/home/accueil/OffreAccueil).
//
// Pur, sans réseau. Testé dans offre-accueil.test.ts.

import { FREE_SHIPPING_LABEL } from '@/lib/shipping'
import { COFFRETS_CHEMIN } from '@/lib/coffrets'
import {
  periodeActive,
  periodeDuTheme,
  type ApercuSaison,
  type PeriodeSaison,
  type ThemeSaison,
} from '@/lib/saison'

/** Thèmes qui ont leur offre ; les autres (Halloween, annonce) prennent l'offre permanente. */
const THEMES_OFFRE: ThemeSaison[] = ['black-week', 'noel']

export interface OffreAccueil {
  /** Clé stable (tests, attributs data-). */
  cle: 'black-week' | 'noel' | 'permanente'
  /** Sur-titre (affiché en capitales). */
  surTitre: string
  /** Titre (pas le H1 de la page). */
  titre: string
  /** Mots du titre mis en couleur (présents tels quels dans `titre`). */
  accent: string
  phrase: string
  bouton: string
  lien: string
  /** Lien secondaire, à côté du bouton. */
  second: { texte: string; lien: string }
}

/**
 * Période qui pilote l'offre à `now` : la période active d'un thème qui a son
 * offre. Une annonce (fermeture) ne masque pas la période en cours : elle
 * n'a que le bandeau.
 */
export function periodeOffre(periodes: PeriodeSaison[], now: Date): PeriodeSaison | null {
  const p = periodeActive(
    periodes.filter((x) => x.theme !== 'annonce'),
    now
  )
  return p && THEMES_OFFRE.includes(p.theme) ? p : null
}

/** Même règle, avec le thème forcé de la preview (`?saison=`, cookie), comme periodeServeur. */
export function periodeOffreServeur(
  periodes: PeriodeSaison[],
  now: Date,
  apercu: ApercuSaison | null
): PeriodeSaison | null {
  if (apercu === 'aucun') return null
  if (apercu) {
    const p = periodeDuTheme(periodes, apercu, now)
    return p && THEMES_OFFRE.includes(p.theme) ? p : null
  }
  return periodeOffre(periodes, now)
}

const jourParis = new Intl.DateTimeFormat('fr-CA', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Vrai si la période finit le jour de `now`, heure de Paris (« Dernier jour »). */
export function dernierJour(p: PeriodeSaison | null, now: Date): boolean {
  if (!p) return false
  const fin = Date.parse(p.au)
  return now.getTime() <= fin + 999 && jourParis.format(now) === jourParis.format(new Date(fin))
}

/**
 * Textes de l'offre pour une période (null : offre permanente). Textes de
 * Digital validés par Gestion le 28/11/2026 ; pas de compte à rebours.
 */
export function offreDe(p: PeriodeSaison | null, estDernierJour: boolean): OffreAccueil {
  if (p?.theme === 'black-week') {
    return {
      cle: 'black-week',
      surTitre: estDernierJour ? 'Dernier jour' : 'Black Week',
      titre: 'Ta créatine 500\u00a0g offerte',
      accent: 'offerte',
      phrase:
        "Dès 100\u00a0€ de compléments, la créatine Dedicated 500\u00a0g (36,90\u00a0€) est offerte. En boutique jusqu'à 19\u00a0h, sur le site jusqu'à 23\u00a0h\u00a059.",
      bouton: "J'en profite",
      // Tout le catalogue : le lien du bandeau de la période peut viser un
      // seul produit (Pack Gamer le 28/11), l'offre vaut pour tout le panier.
      lien: '/products',
      second: { texte: 'Voir les packs', lien: '/packs' },
    }
  }
  if (p?.theme === 'noel') {
    return {
      cle: 'noel',
      surTitre: 'Noël chez BodyStart',
      titre: 'Les coffrets sont prêts',
      accent: 'coffrets',
      phrase: "Composés au comptoir avec ce qu'on conseille tous les jours. Tu les retires à Coignières, ou on te les livre.",
      bouton: 'Voir les coffrets',
      lien: COFFRETS_CHEMIN,
      second: { texte: 'Tous les produits', lien: '/products' },
    }
  }
  return {
    cle: 'permanente',
    surTitre: 'Conseil gratuit en boutique',
    titre: `Livraison offerte ${FREE_SHIPPING_LABEL}, retrait gratuit à Coignières`,
    accent: 'offerte',
    phrase: "Et le conseil reste gratuit, au comptoir comme en ligne\u00a0: dis\u2011nous ton objectif, on t'oriente.",
    bouton: 'Voir les produits',
    lien: '/products',
    second: { texte: 'Trouve ton produit en 1\u00a0min', lien: '/conseil' },
  }
}
