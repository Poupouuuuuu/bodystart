// ============================================================
// Fermetures exceptionnelles de la boutique (source unique)
// ============================================================
// La règle générale ne change pas : ouvert du lundi au samedi, 11 h à 19 h,
// jours fériés compris (store-info, BODY_START_STORES). Ici, seulement les
// exceptions décidées par la direction, jour par jour (heure de Paris) :
// - bandeau du header (mode saison, thème « annonce », prioritaire) ;
// - statut « ouvert / fermé » de /stores et /conseil ;
// - ligne « Fermeture exceptionnelle » de /stores ;
// - JSON-LD du Store (specialOpeningHoursSpecification).
// Une fermeture passée ne s'affiche plus nulle part : on peut la laisser ici
// ou la retirer au ménage suivant.
//
// Pur, sans réseau. Testé dans fermetures.test.ts.

import type { PeriodeSaison } from './saison'

export interface FermetureExceptionnelle {
  /** Jour fermé, heure de Paris (AAAA-MM-JJ). */
  date: string
  /** « mercredi 11 novembre » */
  libelle: string
  /** Bandeau du header, de `du` à `au` (ISO UTC, inclus). */
  bandeau: { du: string; au: string; texte: string; lien: string | null }
}

const NBSP = ' '

export const FERMETURES_EXCEPTIONNELLES: FermetureExceptionnelle[] = [
  {
    // Décision de la direction du 10/11/2026 (via Claude Gestion, demande de
    // l'Agent Digital) : boutique fermée le mercredi 11/11/2026.
    date: '2026-11-11',
    libelle: 'mercredi 11 novembre',
    bandeau: {
      du: '2026-11-10T00:00:00.000Z',
      au: '2026-11-11T22:59:59.000Z', // 11/11, 23 h 59 59 à Paris
      texte: `Boutique fermée exceptionnellement le mercredi 11 novembre · Commandes Click & Collect prêtes jeudi 12/11 dès 11${NBSP}h`,
      lien: '/livraison',
    },
  },
]

/**
 * Couleurs sobres du bandeau d'annonce : fond sage, texte et liseré spruce
 * (design system : jamais de bandeau vert plein). Contraste 7,2:1.
 */
const ANNONCE = { accent: '#EEF4EC', accent2: '#2D5A2D', texteSurAccent: '#2D5A2D' }

/** Date du jour à Paris (AAAA-MM-JJ). */
export function dateDeParis(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

/** « 2026-11-10 » + 2 jours → « 2026-11-12 » (calendrier, sans heure). */
export function decalerDate(date: string, jours: number): string {
  const [a, m, j] = date.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, j + jours)).toISOString().slice(0, 10)
}

/** Le jour `date` (AAAA-MM-JJ, Paris) est-il une fermeture exceptionnelle ? */
export function estJourFerme(date: string, fermetures: FermetureExceptionnelle[] = FERMETURES_EXCEPTIONNELLES): boolean {
  return fermetures.some((f) => f.date === date)
}

/** Fermetures du jour ou à venir (heure de Paris), dans l'ordre. */
export function fermeturesAVenir(
  now: Date,
  fermetures: FermetureExceptionnelle[] = FERMETURES_EXCEPTIONNELLES
): FermetureExceptionnelle[] {
  const aujourdhui = dateDeParis(now)
  return fermetures.filter((f) => f.date >= aujourdhui).sort((a, b) => a.date.localeCompare(b.date))
}

/** Bandeaux des fermetures, au format du mode saison (thème « annonce », sans décor). */
export function periodesAnnonce(fermetures: FermetureExceptionnelle[] = FERMETURES_EXCEPTIONNELLES): PeriodeSaison[] {
  return fermetures.map((f) => ({
    theme: 'annonce',
    du: new Date(f.bandeau.du).toISOString(),
    au: new Date(f.bandeau.au).toISOString(),
    texte: f.bandeau.texte,
    lien: f.bandeau.lien,
    ...ANNONCE,
    decor: null,
  }))
}

/**
 * JSON-LD : un jour fermé = OpeningHoursSpecification de ce seul jour, ouvert
 * et fermé à 00:00 (forme reconnue par Google pour une fermeture).
 */
export function horairesSpeciauxJsonLd(now: Date, fermetures: FermetureExceptionnelle[] = FERMETURES_EXCEPTIONNELLES) {
  return fermeturesAVenir(now, fermetures).map((f) => ({
    '@type': 'OpeningHoursSpecification',
    validFrom: f.date,
    validThrough: f.date,
    opens: '00:00',
    closes: '00:00',
  }))
}
