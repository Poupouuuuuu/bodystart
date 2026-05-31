'use client'

import { useState } from 'react'
import { Loader2, Phone } from 'lucide-react'
import toast from 'react-hot-toast'

interface EnrollmentBlockProps {
  onEnrolled: () => void
}

export function EnrollmentBlock({ onEnrolled }: EnrollmentBlockProps) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/loyalty/me/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (res.status === 429) {
          setError('Trop d\'essais. Réessaye dans quelques minutes.')
        } else if (json.error === 'invalid_phone') {
          setError('Numéro invalide. Vérifie le format.')
        } else {
          setError(json.detail ?? 'Erreur. Réessaye dans un instant.')
        }
        return
      }
      toast.success('Programme activé !')
      onEnrolled()
    } catch {
      setError('Problème réseau. Réessaye.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-spruce/10 p-8 md:p-10">
      <div className="w-14 h-14 rounded-full bg-sage flex items-center justify-center mb-6">
        <Phone className="w-6 h-6 text-spruce" />
      </div>

      <h2 className="font-display text-[28px] font-extrabold tracking-tight text-spruce leading-[1.1] mb-3">
        Rejoins le programme
      </h2>

      <p className="text-ink-mute text-sm font-medium mb-6 max-w-md">
        Pour gagner et utiliser ta cagnotte, on a juste besoin de ton numéro
        de téléphone. C&apos;est ta carte de fidélité, donc pas de carte
        physique à trimballer.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-[12px] font-semibold text-ink mb-2">
            Téléphone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+33 6 12 34 56 78"
            required
            className="w-full px-5 py-3.5 rounded-xl border border-spruce/20 text-sm font-medium text-ink bg-white focus:outline-none focus:border-fresh focus:ring-1 focus:ring-fresh/30 placeholder:text-ink-mute/60 transition-all"
          />
        </div>

        {error && (
          <div className="bg-terracotta/10 border border-terracotta/20 text-terracotta text-sm font-medium rounded-xl px-5 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || phone.trim().length < 5}
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-fresh text-white text-[14px] font-semibold rounded-full hover:bg-fresh-deep transition-colors disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Activer mon programme
        </button>
      </form>

      <p className="text-[12px] text-ink-mute font-medium mt-6 max-w-md">
        Ton numéro reste chez nous, on ne le partage pas. Il sert aussi à
        te reconnaître quand tu passes en boutique.
      </p>
    </div>
  )
}
