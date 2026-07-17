'use client'

import { useState, useEffect } from 'react'

interface StoreStatusV2Props {
  hours: { day: string; open: string; close: string }[]
}

function formatHour(t: string): string {
  const [h, m] = t.split(':').map(Number)
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

// getDay() : 0 = dimanche … 6 = samedi → nom FR (doit matcher hours[].day).
const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const

/**
 * Statut d'ouverture temps réel (heure de Paris) + réouverture.
 * CONSCIENT DU JOUR (MAJ 2026-07, fermé le dimanche) : on mappe le jour
 * courant sur hours[].day (nom FR) au lieu d'ignorer le jour. Sans ça, le
 * widget affichait « Ouvert » un dimanche à 14h (dans la fenêtre 11h-19h).
 * - Ouvert → "Ouvert"
 * - Avant l'ouverture d'un jour ouvré → "Fermé · Ouvre à 11h"
 * - Après fermeture / jour fermé → "Fermé · Ouvre demain|<jour> à 11h"
 */
function computeStatus(hours: StoreStatusV2Props['hours']): { open: boolean; reopen: string | null } {
  const paris = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
  const cur = paris.getHours() * 60 + paris.getMinutes()
  const todayIdx = paris.getDay()

  // Créneau OUVERT (≠ 'Fermé') pour un index de jour donné.
  const slotFor = (dayIdx: number) =>
    hours.find((h) => h.day === DAY_NAMES[dayIdx] && h.open !== 'Fermé')

  const today = slotFor(todayIdx)
  if (today) {
    const [oh, om] = today.open.split(':').map(Number)
    const [ch, cm] = today.close.split(':').map(Number)
    const open = oh * 60 + om
    const close = ch * 60 + cm
    if (cur >= open && cur < close) return { open: true, reopen: null }
    if (cur < open) return { open: false, reopen: `Ouvre à ${formatHour(today.open)}` }
    // après la fermeture : on tombe dans la recherche du prochain jour ouvert.
  }

  // Fermé maintenant → prochain jour ouvert (aujourd'hui déjà passé).
  for (let d = 1; d <= 7; d++) {
    const idx = (todayIdx + d) % 7
    const next = slotFor(idx)
    if (next) {
      const when = d === 1 ? 'demain' : DAY_NAMES[idx].toLowerCase()
      return { open: false, reopen: `Ouvre ${when} à ${formatHour(next.open)}` }
    }
  }
  return { open: false, reopen: null }
}

export default function StoreStatusV2({ hours }: StoreStatusV2Props) {
  const [status, setStatus] = useState<{ open: boolean; reopen: string | null } | null>(null)

  useEffect(() => {
    setStatus(computeStatus(hours))
    const id = setInterval(() => setStatus(computeStatus(hours)), 60_000)
    return () => clearInterval(id)
  }, [hours])

  // Avant hydratation : "Ouvert" par défaut, recalculé au montage selon le
  // jour/heure de Paris (un éventuel flash "Ouvert" un dimanche se corrige
  // dès le 1er effet, avant peinture perceptible).
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
