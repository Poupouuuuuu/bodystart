'use client'

import { useState, type FormEvent } from 'react'
import { BellRing, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * « Me prévenir quand c'est de retour » — affiché dans le bandeau épuisé de
 * la buy box, pour la variante sélectionnée. Le serveur (POST /api/stock-alert)
 * résout lui-même produit et stock depuis l'id de variante ; le formulaire
 * n'envoie que l'email.
 *
 * Mobile first : champ 16 px (pas de zoom iOS), zones tactiles 44 px.
 * Monter avec `key={variantId}` pour repartir à zéro quand on change d'option.
 */
interface StockAlertFormProps {
  variantId: string
}

type Status = 'idle' | 'loading' | 'done' | 'available' | 'error'

export default function StockAlertForm({ variantId }: StockAlertFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'loading') return
    setStatus('loading')
    setMessage(null)
    try {
      const res = await fetch('/api/stock-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), variantId }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; available?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Impossible d’enregistrer ton email, réessaie dans un instant.')
        return
      }
      if (data.available) {
        setStatus('available')
        setMessage('Bonne nouvelle : ce produit vient de revenir en stock. Recharge la page pour l’ajouter au panier.')
        return
      }
      setStatus('done')
    } catch {
      setStatus('error')
      setMessage('Impossible d’enregistrer ton email, réessaie dans un instant.')
    }
  }

  if (status === 'done') {
    return (
      <p className="mt-3 flex items-start gap-2 text-[14px] text-spruce" role="status">
        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <span>
          C&apos;est noté ! On t&apos;écrit dès que c&apos;est de retour. Une seule alerte, pas de newsletter.
        </span>
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3" noValidate>
      <label htmlFor={`stock-alert-${variantId}`} className="block text-[13px] text-ink-mute mb-2">
        Laisse ton email, on te prévient dès qu&apos;il revient.
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id={`stock-alert-${variantId}`}
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ton@email.fr"
          className="flex-1 h-11 rounded-full border border-spruce/20 bg-white px-4 text-[16px] md:text-[14px] text-ink placeholder:text-ink-mute/70 focus:outline-none focus:ring-2 focus:ring-fresh/40"
        />
        <button
          type="submit"
          disabled={status === 'loading' || !email.includes('@')}
          className={cn(
            'h-11 px-5 rounded-full text-[14px] font-semibold text-white inline-flex items-center justify-center gap-2 transition-colors press',
            status === 'loading' || !email.includes('@') ? 'bg-ink-mute/40 cursor-not-allowed' : 'bg-fresh hover:bg-fresh-deep'
          )}
        >
          <BellRing className="w-4 h-4" aria-hidden="true" />
          {status === 'loading' ? 'Un instant…' : 'Me prévenir'}
        </button>
      </div>
      {message && (
        <p className={cn('mt-2 text-[13px]', status === 'error' ? 'text-terracotta' : 'text-spruce')} role="status">
          {message}
        </p>
      )}
    </form>
  )
}
