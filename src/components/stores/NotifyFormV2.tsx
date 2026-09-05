'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'

/**
 * Capture email "2e boutique" — version DA claire V2.
 *
 * BRANCHÉ pour de vrai depuis 2026-07-03 : POST /api/subscribe (contact Shopify
 * abonné marketing) avec le tag 'boutique-b' → Adam retrouve la liste
 * d'intention dans Shopify (Clients → tag boutique-b). Avant, le formulaire
 * affichait un toast de succès puis JETAIT l'email (aucun appel réseau).
 * On conserve l'id #newsletter-boutique-b.
 */
export default function NotifyFormV2() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  async function handleNotify() {
    const value = email.trim()
    if (!value || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, tag: 'boutique-b' }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error ?? 'Oups, réessaie dans un instant.')
        return
      }
      toast.success('Parfait ! Tu seras prévenu·e en premier de l’ouverture.', { duration: 4000 })
      setEmail('')
    } catch {
      toast.error('Oups, réessaie dans un instant.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div id="newsletter-boutique-b" className="max-w-md mx-auto">
      <div className="flex flex-col sm:flex-row gap-2.5">
      <label htmlFor="notify-email-b" className="sr-only">
        Ton adresse email
      </label>
      <input
        id="notify-email-b"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleNotify()}
        placeholder="ton@email.fr"
        className="flex-1 px-5 py-3 rounded-full border border-spruce/15 bg-white text-[16px] md:text-[14px] text-ink placeholder:text-ink-mute/60 focus:outline-none focus:border-fresh focus:ring-1 focus:ring-fresh/30"
      />
      <button
        type="button"
        onClick={handleNotify}
        disabled={sending}
        className="px-6 py-3 bg-fresh text-white text-[14px] font-semibold rounded-full hover:bg-fresh-deep transition-colors whitespace-nowrap inline-flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {sending && <Loader2 className="w-4 h-4 animate-spin" />}
        {sending ? 'Un instant…' : 'Me prévenir'}
      </button>
      </div>
      {/* Consentement honnête : l'inscription crée un contact marketing Shopify,
          pas seulement une alerte ouverture — on le dit (RGPD). */}
      <p className="mt-2.5 text-[12px] text-ink-mute text-center">
        En t&apos;inscrivant, tu acceptes de recevoir nos emails (ouverture de la boutique,
        nouveautés, bons plans). Désinscription en un clic, à tout moment.
      </p>
    </div>
  )
}
