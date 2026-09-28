// ============================================================
// Consentement cookies — source de vérité partagée
// ============================================================
// Le bandeau (CookieBanner) écrit le choix de l'utilisateur ; Google Analytics
// (mesure d'audience) et le pixel Meta (publicité) le lisent et réagissent en direct.
// Conformité CNIL : AUCUN script de mesure ne doit se charger avant un
// consentement explicite « analytics », AUCUN script publicitaire avant « marketing ».

export const CONSENT_KEY = 'body-start-cookie-consent'

// Événement custom diffusé dans l'onglet courant à chaque écriture du choix,
// pour que GA réagisse sans rechargement de page.
export const CONSENT_EVENT = 'bs-consent-change'

// Rouvre le bandeau depuis le lien « Gérer mes cookies » (pied de page, /cookies).
export const OPEN_CONSENT_EVENT = 'bs-open-cookie-settings'

// Version du recueil, enregistrée avec le choix. Passée à 2 le 26/09/2026 avec
// l'arrivée du pixel Meta : un accord « marketing » donné avant cette date ne
// couvrait aucun partenaire publicitaire, il n'est donc plus valable et le
// bandeau se réaffiche. Un refus reste valable (rien de nouveau à refuser).
export const CONSENT_VERSION = 2

declare global {
  interface Window {
    /** Clic sur « Gérer mes cookies » avant le chargement du bandeau (lazy). */
    __bsOpenConsent?: boolean
  }
}

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
    const marketing = p?.marketing === true
    // Accord publicitaire antérieur au pixel Meta : on redemande (cf. CONSENT_VERSION).
    if (marketing && !(Number(p?.v) >= CONSENT_VERSION)) return null
    return {
      necessary: p?.necessary !== false, // toujours vrai en pratique
      analytics: p?.analytics === true,
      marketing,
    }
  } catch {
    return null
  }
}

export function writeConsent(prefs: CookiePreferences): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...prefs, v: CONSENT_VERSION }))
  } catch {
    /* localStorage indisponible (navigation privée stricte) : on diffuse quand même */
  }
  window.dispatchEvent(new CustomEvent<CookiePreferences>(CONSENT_EVENT, { detail: prefs }))
}

// true uniquement si l'utilisateur a explicitement accepté la mesure d'audience.
export function isAnalyticsGranted(): boolean {
  return readConsent()?.analytics === true
}

// true uniquement si l'utilisateur a explicitement accepté la publicité (pixel Meta).
export function isMarketingGranted(): boolean {
  return readConsent()?.marketing === true
}

// Lien « Gérer mes cookies » : rouvre le bandeau sur le panneau de choix.
export function openConsentSettings(): void {
  if (typeof window === 'undefined') return
  window.__bsOpenConsent = true
  window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))
}
