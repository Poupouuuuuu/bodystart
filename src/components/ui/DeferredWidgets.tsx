'use client'

import dynamic from 'next/dynamic'

/**
 * Widgets purement client, chargés en lazy et SANS SSR :
 *  - CookieBanner : ne s'affiche que si aucun consentement en localStorage.
 *  - NewsletterPopup : s'arme côté client (timer / exit-intent).
 *
 * Next 15 interdit `next/dynamic` avec `ssr: false` dans un Server Component
 * (le root layout). On isole donc ces imports dans ce wrapper client, importé
 * normalement par le layout.
 */
const CookieBanner = dynamic(() => import('@/components/ui/CookieBanner'), { ssr: false })
const NewsletterPopup = dynamic(() => import('@/components/marketing/NewsletterPopup'), { ssr: false })

export default function DeferredWidgets() {
  return (
    <>
      <CookieBanner />
      <NewsletterPopup />
    </>
  )
}
