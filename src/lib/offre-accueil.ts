// ============================================================
// Offre du haut de l'accueil (refonte du 28/11/2026)
// ============================================================
// Un titre, une phrase, un bouton, choisis par la période du mode saison
// (metafield `bodystart.saison`, lib/saison) : Black Week, Noël, sinon une
// offre permanente. Les textes sont écrits ici, par thème : rien n'est écrit
// dans Shopify.
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
  finPeriode,
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
  /** Petite étiquette au-dessus du titre. */
  etiquette: string
  /** Titre (pas le H1 de la page). */
  titre: string
  /** Mots du titre mis en couleur (présents tels quels dans `titre`). */
  accent: string
  phrase: string
  bouton: string
  lien: string
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

const heureParis = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Heure de fin, heure de Paris (« 23 h 59 »). */
export function heureFin(p: PeriodeSaison): string {
  const [h, m] = heureParis.format(new Date(p.au)).split(':')
  return `${h}\u00a0h\u00a0${m}`
}

/**
 * Échéance affichée sans lire l'heure (premier rendu, identique au serveur) :
 * « Jusqu'à ce soir 23 h 59 » le dernier jour, sinon « Jusqu'au 24/12 ».
 */
export function echeance(p: PeriodeSaison, estDernierJour: boolean): string {
  return estDernierJour ? `Jusqu'à ce soir ${heureFin(p)}` : `Jusqu'au ${finPeriode(p)}`
}

/** Le compte à rebours ne s'affiche que dans les dernières 24 heures. */
export const COMPTE_A_REBOURS_MS = 24 * 3600 * 1000

/**
 * Temps restant avant la fin de la période (« Plus que 5 h 12 min »), null
 * hors des dernières 24 heures ou une fois la période finie. Minutes
 * arrondies au-dessus : jamais moins que le temps réel.
 */
export function resteAvantFin(p: PeriodeSaison, now: Date): string | null {
  const reste = Date.parse(p.au) + 1000 - now.getTime()
  if (reste <= 0 || reste > COMPTE_A_REBOURS_MS) return null
  const minutes = Math.ceil(reste / 60000)
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `Plus que ${m}\u00a0min`
  return m === 0 ? `Plus que ${h}\u00a0h` : `Plus que ${h}\u00a0h\u00a0${m}\u00a0min`
}

/** Textes de l'offre pour une période (null : offre permanente). */
export function offreDe(p: PeriodeSaison | null, estDernierJour: boolean): OffreAccueil {
  if (p?.theme === 'black-week') {
    return {
      cle: 'black-week',
      etiquette: 'Black Week',
      titre: estDernierJour
        ? 'Dernier jour\u00a0: ta créatine 500\u00a0g offerte dès 100\u00a0€ de compléments'
        : 'Ta créatine 500\u00a0g offerte dès 100\u00a0€ de compléments',
      accent: 'offerte',
      phrase: `Elle arrive dans ton panier dès 100\u00a0€ d'achats. Retrait gratuit à Coignières, livraison offerte ${FREE_SHIPPING_LABEL}.`,
      bouton: "J'en profite",
      // Tout le catalogue : le lien du bandeau de la période peut viser un
      // seul produit (Pack Gamer le 28/11), l'offre vaut pour tout le panier.
      lien: '/products',
    }
  }
  if (p?.theme === 'noel') {
    return {
      cle: 'noel',
      etiquette: 'Coffrets de Noël',
      titre: 'Nos coffrets de Noël, composés au comptoir',
      accent: 'coffrets de Noël',
      phrase:
        'Des idées cadeaux pour un sportif, du plus gourmand au plus complet. Retrait gratuit à Coignières ou livraison partout en France.',
      bouton: 'Voir les coffrets',
      lien: COFFRETS_CHEMIN,
    }
  }
  return {
    cle: 'permanente',
    etiquette: 'Conseil gratuit en boutique',
    titre: `Livraison offerte ${FREE_SHIPPING_LABEL}, retrait gratuit à Coignières`,
    accent: 'offerte',
    phrase: "Et le conseil reste gratuit, au comptoir comme en ligne\u00a0: dis\u2011nous ton objectif, on t'oriente.",
    bouton: 'Voir les meilleures ventes',
    lien: '#meilleures-ventes',
  }
}
