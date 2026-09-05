'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { TOAST_WAKE_EVENT } from '@/lib/toast'

/**
 * Conteneur des toasts, monté seulement quand un premier toast est demandé
 * (événement émis par `@/lib/toast`). react-hot-toast garde les toasts dans un
 * store global : ceux émis pendant le chargement du morceau s'affichent dès
 * que le <Toaster> apparaît. Zéro Ko au chargement initial des pages.
 */
const Toaster = dynamic(() => import('react-hot-toast').then((m) => m.Toaster), { ssr: false })

export default function ToasterLazy() {
  const [needed, setNeeded] = useState(false)

  useEffect(() => {
    if (needed) return
    const on = () => setNeeded(true)
    window.addEventListener(TOAST_WAKE_EVENT, on)
    return () => window.removeEventListener(TOAST_WAKE_EVENT, on)
  }, [needed])

  if (!needed) return null
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          borderRadius: '12px',
          fontFamily: 'var(--font-inter)',
        },
        success: {
          iconTheme: {
            primary: '#15803d',
            secondary: '#fff',
          },
        },
      }}
    />
  )
}
