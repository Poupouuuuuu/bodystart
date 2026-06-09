'use client'

// Capture du parrainage : si l'URL contient ?parrain=CODE (lien partagé par un
// parrain, ex. https://bodystart-nutrition.fr/?parrain=BS-XXXXX), on stocke le
// code en cookie ~60 jours puis on nettoie l'URL. Le code est ensuite réutilisé
// à l'inscription loyalty (EnrollmentBlock) et au checkout.

import { useEffect } from 'react'

const REFERRAL_COOKIE = 'bs_referral'
const MAX_AGE_SECONDS = 60 * 24 * 60 * 60 // 60 jours
const CODE_RE = /^BS-[A-Z2-9]{5}$/ // format BS-XXXXX (alphabet sans 0/O/1/I/L)

export default function ReferralCapture() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const raw = url.searchParams.get('parrain')
      if (raw) {
        const code = raw.trim().toUpperCase()
        if (CODE_RE.test(code)) {
          document.cookie = `${REFERRAL_COOKIE}=${encodeURIComponent(code)}; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax`
        }
        // Nettoyer l'URL (retirer ?parrain), code valide ou non.
        url.searchParams.delete('parrain')
        const clean = url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : '') + url.hash
        window.history.replaceState({}, '', clean)
      }
    } catch {
      /* no-op : URL non parsable / environnement sans window */
    }
  }, [])
  return null
}

/** Lit le code parrain capturé (cookie). Renvoie null si absent/invalide. */
export function readReferralCookie(): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|;\s*)bs_referral=([^;]+)/)
  if (!m) return null
  try {
    const code = decodeURIComponent(m[1]).toUpperCase()
    return CODE_RE.test(code) ? code : null
  } catch {
    return null
  }
}
