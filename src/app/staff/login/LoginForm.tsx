'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getLoyaltyBrowserClient } from '@/lib/loyalty/supabase-browser'

interface Props {
  nextUrl: string
}

export function LoginForm({ nextUrl }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const supabase = getLoyaltyBrowserClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (authError) {
        setError(authError.message ?? 'Identifiants incorrects.')
        setSubmitting(false)
        return
      }
      // Redirection vers la caisse (ou ce que le middleware demandait)
      router.push(nextUrl)
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(msg)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-4 text-lg border-2 border-[#1a2e23]/20 rounded-xl focus:outline-none focus:border-[#1a2e23] transition-colors"
          placeholder="staff@bodystartnutrition.fr"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-4 text-lg border-2 border-[#1a2e23]/20 rounded-xl focus:outline-none focus:border-[#1a2e23] transition-colors"
          placeholder="•••••••••"
        />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-900">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !email || !password}
        className="w-full px-6 py-4 bg-[#1a2e23] text-white font-bold uppercase tracking-widest text-sm rounded-xl hover:bg-[#1a2e23]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Connexion…
          </>
        ) : (
          'Se connecter'
        )}
      </button>
    </form>
  )
}
