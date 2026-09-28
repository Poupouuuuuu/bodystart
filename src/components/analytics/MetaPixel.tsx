'use client'

// Meta Pixel (publicité), branché sur le consentement « marketing » du bandeau.
// - Feature flag : NEXT_PUBLIC_META_PIXEL_ID absente → ce composant ne rend RIEN.
// - Sans accord publicité : aucun <script>, donc ZÉRO requête vers
//   connect.facebook.net ou www.facebook.com.
// - À l'accord : fbevents.js, fbq('init'), puis PageView (et à chaque navigation).
//   autoConfig coupé : seuls PageView, ViewContent et AddToCart partent, pas les
//   clics détectés automatiquement par Meta.
// - Au retrait : fbq('consent', 'revoke'), plus aucun envoi pour la session.
// ViewContent et AddToCart : src/lib/meta-pixel.ts (TrackViewItem, CartContext).

import Script from 'next/script'
import { Suspense, useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { readConsent, CONSENT_EVENT } from '@/lib/consent'
import { metaFlushQueue, metaTrack } from '@/lib/meta-pixel'

const RAW_ID = (process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '').trim()
// Un ID de pixel est numérique : toute autre valeur est ignorée (il est injecté dans un script inline).
const PIXEL_ID = /^\d+$/.test(RAW_ID) ? RAW_ID : ''

export default function MetaPixel() {
  const [granted, setGranted] = useState(false)
  const everLoaded = useRef(false)

  useEffect(() => {
    if (!PIXEL_ID) return
    const evaluate = () => {
      const ok = readConsent()?.marketing === true
      setGranted(ok)
      // Pixel déjà chargé dans cette page : on suit le choix en direct.
      if (everLoaded.current && typeof window.fbq === 'function') {
        window.fbq('consent', ok ? 'grant' : 'revoke')
      }
    }
    evaluate()
    window.addEventListener(CONSENT_EVENT, evaluate)
    window.addEventListener('storage', evaluate) // choix changé dans un autre onglet
    return () => {
      window.removeEventListener(CONSENT_EVENT, evaluate)
      window.removeEventListener('storage', evaluate)
    }
  }, [])

  // Dès que fbq existe (post-accord), on vide la file des événements émis trop
  // tôt (PageView, ViewContent au chargement direct d'une fiche produit).
  useEffect(() => {
    if (!granted) return
    let tries = 0
    const t = setInterval(() => {
      tries += 1
      if (typeof window.fbq === 'function') {
        metaFlushQueue()
        clearInterval(t)
      } else if (tries > 40) {
        clearInterval(t) // ~4 s : on abandonne (script bloqué)
      }
    }, 100)
    return () => clearInterval(t)
  }, [granted])

  // Flag éteint OU pas d'accord publicité → rien (donc aucune requête réseau).
  if (!PIXEL_ID || !granted) return null
  everLoaded.current = true

  return (
    <>
      <Script id="meta-pixel-init" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('set', 'autoConfig', false, '${PIXEL_ID}');
          fbq('init', '${PIXEL_ID}');
        `}
      </Script>
      <Suspense fallback={null}>
        <MetaPageViews />
      </Suspense>
    </>
  )
}

// PageView au premier affichage après accord, puis à chaque navigation client.
function MetaPageViews() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams?.toString() ?? ''

  useEffect(() => {
    metaTrack('PageView')
  }, [pathname, search])

  return null
}
