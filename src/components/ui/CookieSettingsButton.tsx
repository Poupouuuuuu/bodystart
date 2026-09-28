'use client'

// Lien « Gérer mes cookies » : rouvre le bandeau sur le panneau de choix, pour
// modifier ou retirer un consentement à tout moment (exigence CNIL : retirer
// son accord doit être aussi simple que le donner).

import { openConsentSettings } from '@/lib/consent'

export default function CookieSettingsButton({
  className,
  label = 'Gérer mes cookies',
}: {
  className?: string
  label?: string
}) {
  return (
    <button type="button" onClick={openConsentSettings} className={className}>
      {label}
    </button>
  )
}
