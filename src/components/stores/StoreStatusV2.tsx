'use client'

import { useState, useEffect } from 'react'

interface StoreStatusV2Props {
  hours: { day: string; open: string; close: string }[]
}

/**
 * Badge d'ouverture temps réel — DA claire V2 (sage + sapin, sentence case).
 * Réutilise la même logique horaire que StoreStatus (heure de Paris).
 */
function isStoreOpen(hours: StoreStatusV2Props['hours']): boolean {
  const now = new Date()
  const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
  const currentTime = parisTime.getHours() * 60 + parisTime.getMinutes()

  for (const h of hours) {
    if (h.open === 'Fermé') continue
    const [openH, openM] = h.open.split(':').map(Number)
    const [closeH, closeM] = h.close.split(':').map(Number)
    const openTime = openH * 60 + openM
    const closeTime = closeH * 60 + closeM
    if (currentTime >= openTime && currentTime < closeTime) return true
  }
  return false
}

export default function StoreStatusV2({ hours }: StoreStatusV2Props) {
  const [isOpen, setIsOpen] = useState<boolean | null>(null)

  useEffect(() => {
    setIsOpen(isStoreOpen(hours))
    const interval = setInterval(() => setIsOpen(isStoreOpen(hours)), 60_000)
    return () => clearInterval(interval)
  }, [hours])

  // Avant hydratation : on affiche "Ouvert" neutre (le store est 7j/7 11h-19h),
  // remplacé par l'état réel dès le montage. Évite le flash + le CLS.
  const open = isOpen ?? true

  return (
    <span
      className={
        open
          ? 'inline-flex items-center gap-2 bg-sage text-spruce text-[12px] font-semibold px-3 py-1 rounded-full'
          : 'inline-flex items-center gap-2 bg-terracotta/10 text-terracotta text-[12px] font-semibold px-3 py-1 rounded-full'
      }
    >
      <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-fresh' : 'bg-terracotta'}`} />
      {open ? 'Ouvert' : 'Fermé maintenant'}
    </span>
  )
}
