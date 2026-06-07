// ============================================================
// Consentement cookies — source de vérité partagée
// ============================================================
// Le bandeau (CookieBanner) écrit le choix de l'utilisateur ; les modules de
// mesure d'audience (Google Analytics) le lisent et réagissent en direct.
// Conformité CNIL : AUCUN script de mesure ne doit se charger avant un
// consentement explicite « analytics ».

export const CONSENT_KEY = 'body-start-cookie-consent'

// Événement custom diffusé dans l'onglet courant à chaque écriture du choix,
// pour que GA réagisse sans rechargement de page.
export const CONSENT_EVENT = 'bs-consent-change'

export interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
}

export function readConsent(): CookiePreferences | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    return {
      necessary: p?.necessary !== false, // toujours vrai en pratique
      analytics: p?.analytics === true,
      marketing: p?.marketing === true,
    }
  } catch {
    return null
  }
}

export function writeConsent(prefs: CookiePreferences): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(prefs))
  } catch {
    /* localStorage indisponible (navigation privée stricte) : on diffuse quand même */
  }
  window.dispatchEvent(new CustomEvent<CookiePreferences>(CONSENT_EVENT, { detail: prefs }))
}

// true uniquement si l'utilisateur a explicitement accepté la mesure d'audience.
export function isAnalyticsGranted(): boolean {
  return readConsent()?.analytics === true
}
