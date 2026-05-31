'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

/**
 * Capture email "2e boutique" — version DA claire V2.
 *
 * Réutilise EXACTEMENT la logique de capture existante (cf. NotifyForm) :
 * state local + toast de confirmation + reset. Aucune logique métier touchée,
 * on adapte seulement la présentation (surfaces claires, vert en accent,
 * sentence case). On conserve l'id #newsletter-boutique-b.
 */
export default function NotifyFormV2() {
  const [email, setEmail] = useState('')

  function handleNotify() {
    if (!email) return
    toast.success('Parfait ! Tu seras prévenu·e en premier de l’ouverture.', { duration: 4000 })
    setEmail('')
  }

  return (
    <div
      id="newsletter-boutique-b"
      className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto"
    >
      <label htmlFor="notify-email-b" className="sr-only">
        Ton adresse email
      </label>
      <input
        id="notify-email-b"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleNotify()}
        placeholder="ton@email.fr"
        className="flex-1 px-5 py-3 rounded-full border border-spruce/15 bg-white text-[14px] text-ink placeholder:text-ink-mute/60 focus:outline-none focus:border-fresh focus:ring-1 focus:ring-fresh/30"
      />
      <button
        type="button"
        onClick={handleNotify}
        className="px-6 py-3 bg-fresh text-white text-[14px] font-semibold rounded-full hover:bg-fresh-deep transition-colors whitespace-nowrap"
      >
        Me prévenir
      </button>
    </div>
  )
}
