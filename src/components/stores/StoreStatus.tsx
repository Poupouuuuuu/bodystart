'use client'

import { useState, useEffect } from 'react'

interface StoreStatusProps {
  hours: { day: string; open: string; close: string }[]
}

function isStoreOpen(hours: StoreStatusProps['hours']): boolean {
  const now = new Date()
  const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
  const currentHour = parisTime.getHours()
  const currentMinute = parisTime.getMinutes()
  const currentTime = currentHour * 60 + currentMinute

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

export default function StoreStatus({ hours }: StoreStatusProps) {
  const [isOpen, setIsOpen] = useState<boolean | null>(null)

  useEffect(() => {
    setIsOpen(isStoreOpen(hours))
    const interval = setInterval(() => setIsOpen(isStoreOpen(hours)), 60_000)
    return () => clearInterval(interval)
  }, [hours])

  if (isOpen === null) return null

  return isOpen ? (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-[10px] font-bold uppercase tracking-widest text-green-700 mb-3">
      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
      Ouverte
    </div>
  ) : (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 rounded-full text-[10px] font-bold uppercase tracking-widest text-red-600 mb-3">
      <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
      Fermée
    </div>
  )
}
