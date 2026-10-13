// Lecture des réponses de /api/jeu côté page (pur, testé dans reponse.test.ts).
// « Souci de connexion » seulement quand la requête n'aboutit pas. Une
// réponse illisible (délai dépassé ou erreur de la plateforme, sans JSON, ou
// JSON sans statut ni message) a son propre message et part au journal des
// erreurs (/api/jeu, action « signal ») : le serveur, lui, n'en voit rien.

export const MESSAGE_RESEAU = 'Petit souci de connexion. Vérifie ton réseau et réessaie.'
export const MESSAGE_SERVEUR = 'La boutique n’a pas répondu comme prévu. Réessaie dans un instant.'

export interface EchecPage {
  type: 'reseau' | 'reponse'
  /** Statut HTTP (0 : la requête n'a pas abouti). */
  http: number
  /** Début du corps reçu (ex. code d'erreur de la plateforme), pour le journal. */
  extrait: string
}

type Corps = { status?: string; error?: string; customerId?: string }

/** Réponse exploitable : un message d'erreur, ou un statut complet (« ready » avec sa fiche client). */
export function lireReponse<T extends Corps>(http: number, texte: string): { json: T | null; echec: EchecPage | null } {
  let json: T | null = null
  try {
    const v: unknown = JSON.parse(texte)
    if (v && typeof v === 'object' && !Array.isArray(v)) json = v as T
  } catch {
    json = null
  }
  const lisible =
    !!json && (typeof json.error === 'string' || (json.status === 'ready' ? !!json.customerId : typeof json.status === 'string'))
  if (lisible) return { json, echec: null }
  return { json: null, echec: { type: 'reponse', http, extrait: texte.replace(/\s+/g, ' ').trim().slice(0, 120) } }
}

/** L'inscription peut être relancée sans risque (mise à jour de la fiche) : une fois, sur un échec qui n'est pas un refus. */
export function relancerInscription(r: { httpStatus: number; status?: string; field?: string }, echec: EchecPage | null): boolean {
  if (r.status || r.field) return false
  return !!echec || r.httpStatus === 0 || r.httpStatus >= 500
}
