'use client'

import { useState, useEffect } from 'react'

interface StoreStatusV2Props {
  hours: { day: string; open: string; close: string }[]
}

function formatHour(t: string): string {
  const [h, m] = t.split(':').map(Number)
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

/**
 * Statut d'ouverture temps réel (heure de Paris) + heure de réouverture.
 * - Ouvert → "Ouvert" (sage)
 * - Fermé avant l'ouverture du jour → "Fermé · Ouvre à 11h"
 * - Fermé après la fermeture → "Fermé · Ouvre demain à 11h"
 * (générique : déduit l'heure d'ouverture depuis les créneaux fournis.)
 */
function computeStatus(hours: StoreStatusV2Props['hours']): { open: boolean; reopen: string | null } {
  const paris = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
  const cur = paris.getHours() * 60 + paris.getMinutes()

  const windows = hours
    .filter((h) => h.open !== 'Fermé')
    .map((h) => {
      const [oh, om] = h.open.split(':').map(Number)
      const [ch, cm] = h.close.split(':').map(Number)
      return { open: oh * 60 + om, close: ch * 60 + cm, openStr: h.open }
    })

  if (windows.some((w) => cur >= w.open && cur < w.close)) return { open: true, reopen: null }
  if (windows.length === 0) return { open: false, reopen: null }

  // Fermé : prochain créneau d'ouverture plus tard aujourd'hui, sinon demain.
  const laterToday = windows.filter((w) => w.open > cur).sort((a, b) => a.open - b.open)[0]
  if (laterToday) return { open: false, reopen: `Ouvre à ${formatHour(laterToday.openStr)}` }
  const earliest = windows.reduce((a, b) => (a.open <= b.open ? a : b))
  return { open: false, reopen: `Ouvre demain à ${formatHour(earliest.openStr)}` }
}

export default function StoreStatusV2({ hours }: StoreStatusV2Props) {
  const [status, setStatus] = useState<{ open: boolean; reopen: string | null } | null>(null)

  useEffect(() => {
    setStatus(computeStatus(hours))
    const id = setInterval(() => setStatus(computeStatus(hours)), 60_000)
    return () => clearInterval(id)
  }, [hours])

  // Avant hydratation : "Ouvert" neutre (7j/7 11h-19h), remplacé au montage.
  const open = status?.open ?? true
  const label = open ? 'Ouvert' : status?.reopen ? `Fermé · ${status.reopen}` : 'Fermé'

  return (
    <span
      className={
        open
          ? 'inline-flex items-center gap-2 bg-sage text-spruce text-[12px] font-semibold px-3 py-1 rounded-full'
          : 'inline-flex items-center gap-2 bg-terracotta/10 text-terracotta text-[12px] font-semibold px-3 py-1 rounded-full'
      }
    >
      <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-fresh' : 'bg-terracotta'}`} />
      {label}
    </span>
  )
}
