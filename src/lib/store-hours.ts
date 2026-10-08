// Horaires de la boutique : statut « ouvert maintenant » en heure de Paris et
// résumé lisible, calculés depuis BODY_START_STORES[].hours (source unique).
// Fonctions pures (l'instant est passé en paramètre), testées.

export interface PlageHoraire {
  /** Nom FR du jour (« Lundi »…), comme dans BODY_START_STORES. */
  day: string
  /** « 11:00 », ou « Fermé ». */
  open: string
  close: string
}

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const
const ORDRE_SEMAINE = [1, 2, 3, 4, 5, 6, 0]
const NBSP = ' '

/** « 11:00 » → « 11 h », « 11:30 » → « 11 h 30 ». */
export function formatHeure(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  return m ? `${h}${NBSP}h${NBSP}${String(m).padStart(2, '0')}` : `${h}${NBSP}h`
}

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** Jour de la semaine (0 = dimanche) et minutes depuis minuit, à Paris. */
export function heureDeParis(now: Date): { jour: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const jour = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
  return { jour, minutes: Number(get('hour')) * 60 + Number(get('minute')) }
}

function plage(hours: PlageHoraire[], jour: number): PlageHoraire | undefined {
  return hours.find((h) => h.day === JOURS[jour] && h.open !== 'Fermé')
}

/** « Ouvert maintenant » ou « Fermé, ouvre … » (heure de Paris). */
export function statutOuverture(hours: PlageHoraire[], now: Date): { ouvert: boolean; libelle: string } {
  const { jour, minutes: cur } = heureDeParis(now)
  const aujourdhui = plage(hours, jour)
  if (aujourdhui) {
    if (cur >= minutes(aujourdhui.open) && cur < minutes(aujourdhui.close)) {
      return { ouvert: true, libelle: 'Ouvert maintenant' }
    }
    if (cur < minutes(aujourdhui.open)) {
      return { ouvert: false, libelle: `Fermé, ouvre à ${formatHeure(aujourdhui.open)}` }
    }
  }
  for (let d = 1; d <= 7; d++) {
    const idx = (jour + d) % 7
    const p = plage(hours, idx)
    if (p) {
      const quand = d === 1 ? 'demain' : JOURS[idx].toLowerCase()
      return { ouvert: false, libelle: `Fermé, ouvre ${quand} à ${formatHeure(p.open)}` }
    }
  }
  return { ouvert: false, libelle: 'Fermé' }
}

/** Résumé : « Du lundi au samedi, 11 h à 19 h », « Fermé le dimanche ». */
export function resumeHoraires(hours: PlageHoraire[]): string[] {
  const lignes: string[] = []
  const fermes: string[] = []
  let groupe: { debut: number; fin: number; open: string; close: string } | null = null
  const fermer = () => {
    if (!groupe) return
    const debut = JOURS[groupe.debut].toLowerCase()
    const fin = JOURS[groupe.fin].toLowerCase()
    const jours = groupe.debut === groupe.fin ? `Le ${debut}` : `Du ${debut} au ${fin}`
    lignes.push(`${jours}, ${formatHeure(groupe.open)} à ${formatHeure(groupe.close)}`)
    groupe = null
  }
  for (const jour of ORDRE_SEMAINE) {
    const p = plage(hours, jour)
    if (!p) {
      fermer()
      if (hours.some((h) => h.day === JOURS[jour])) fermes.push(JOURS[jour].toLowerCase())
      continue
    }
    if (groupe && groupe.open === p.open && groupe.close === p.close) groupe.fin = jour
    else {
      fermer()
      groupe = { debut: jour, fin: jour, open: p.open, close: p.close }
    }
  }
  fermer()
  if (fermes.length) lignes.push(`Fermé le ${fermes.join(' et le ')}`)
  return lignes
}

/** « 07 61 84 75 80 » → « +33761847580 » (lien tel:). */
export function telInternational(numeroFr: string): string {
  const chiffres = numeroFr.replace(/\D/g, '')
  return chiffres.startsWith('0') ? `+33${chiffres.slice(1)}` : `+${chiffres}`
}
