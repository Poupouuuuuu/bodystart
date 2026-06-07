'use client'

// Google Analytics 4 — chargement CONSENT MODE V2, mode BASIC (choix CNIL).
// - Feature flag : NEXT_PUBLIC_GA4_ID absente → ce composant ne rend RIEN.
// - Tant que l'utilisateur n'a pas accepté la mesure d'audience : aucun <script>
//   gtag n'est rendu → ZÉRO requête vers googletagmanager.com / google-analytics.com
//   (pas même un ping cookieless).
// - À l'acceptation : on charge gtag.js (afterInteractive) avec consent par
//   défaut analytics_storage 'granted' et ad_* 'denied' (pas de pub).
// - Au retrait du consentement : consent update → analytics_storage 'denied'.

import Script from 'next/script'
import { Suspense, useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { readConsent, CONSENT_EVENT } from '@/lib/consent'
import { gaFlushQueue } from '@/lib/analytics'

const GA_ID = process.env.NEXT_PUBLIC_GA4_ID ?? ''

export default function GoogleAnalytics() {
  const [granted, setGranted] = useState(false)
  const everLoaded = useRef(false)

  useEffect(() => {
    if (!GA_ID) return
    const evaluate = () => {
      const ok = readConsent()?.analytics === true
      setGranted(ok)
      // Retrait du consentement APRÈS un chargement : on coupe la mesure
      // (gtag.js reste en mémoire pour la session mais ne collecte plus).
      if (everLoaded.current && !ok && typeof window.gtag === 'function') {
        window.gtag('consent', 'update', { analytics_storage: 'denied' })
      }
    }
    evaluate()
    window.addEventListener(CONSENT_EVENT, evaluate)
    window.addEventListener('storage', evaluate) // consentement changé dans un autre onglet
    return () => {
      window.removeEventListener(CONSENT_EVENT, evaluate)
      window.removeEventListener('storage', evaluate)
    }
  }, [])

  // Dès que gtag est injecté (post-consentement), on vide la file d'events
  // émis trop tôt (ex. view_item au chargement direct d'une fiche produit).
  useEffect(() => {
    if (!granted) return
    let tries = 0
    const t = setInterval(() => {
      tries += 1
      if (typeof window.gtag === 'function') {
        gaFlushQueue()
        clearInterval(t)
      } else if (tries > 40) {
        clearInterval(t) // ~4 s : on abandonne (script bloqué)
      }
    }, 100)
    return () => clearInterval(t)
  }, [granted])

  // Flag éteint OU consentement non donné → rien (donc aucune requête réseau).
  if (!GA_ID || !granted) return null
  everLoaded.current = true

  return (
    <>
      <Script id="ga-consent-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'granted'
          });
          gtag('config', '${GA_ID}');
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Suspense fallback={null}>
        <GaPageViews />
      </Suspense>
    </>
  )
}

// page_view à chaque navigation client (App Router SPA).
function GaPageViews() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const firstRun = useRef(true)

  useEffect(() => {
    // La 1re page_view est émise automatiquement par gtag('config').
    // On ne track ensuite que les navigations SPA, pour éviter le double comptage.
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    if (typeof window.gtag !== 'function') return
    const qs = searchParams?.toString()
    const path = pathname + (qs ? `?${qs}` : '')
    window.gtag('event', 'page_view', {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    })
  }, [pathname, searchParams])

  return null
}
