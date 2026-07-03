'use client'

// STANDBY 2026-05-23 : coaching masque (cf. middleware redirect 301).
// Le toggle ?theme=coaching a ete retire le 2026-05-25 : auth mono-theme nutrition.
// Re-theme DA claire V2 (2026-05-31) : visuel + copy/tutoiement, logique auth intacte.

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useCustomer } from '@/context/CustomerContext'
import Image from 'next/image'

function LoginContent() {
  const router = useRouter()
  const { login } = useCustomer()
  const searchParams = useSearchParams()

  const rawRedirect = searchParams.get('redirect')
  // Sanitisation : n'accepter que les chemins relatifs internes
  const redirect = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : null

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      setError('Entre une adresse email valide.')
      return
    }
    if (form.password.length < 5) {
      setError('Le mot de passe doit contenir au moins 5 caractères.')
      return
    }

    setLoading(true)
    setError(null)
    const { errors } = await login(form.email, form.password)
    if (errors.length > 0) {
      setError('Email ou mot de passe incorrect.')
    } else {
      router.push(redirect || '/account')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-16 px-4 bg-canvas text-ink">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Image
              src="/assets/logos/Logo_texte.png"
              alt="BodyStart"
              width={160}
              height={48}
              className="h-10 w-auto"
            />
          </Link>
          <h1 className="font-display text-[34px] md:text-[42px] font-extrabold tracking-tight mb-3 leading-[1.05] text-spruce">
            Bon retour !
          </h1>
          <p className="font-medium text-[15px] text-ink-mute">
            Connecte-toi à ton espace client
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 md:p-10 border bg-white border-spruce/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Erreur */}
            {error && (
              <div className="p-4 bg-terracotta/10 border border-terracotta/20 rounded-xl text-[13px] text-terracotta font-medium">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-[12px] font-semibold mb-2 text-ink">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="w-full px-5 py-3.5 rounded-xl border text-[16px] md:text-[14px] font-medium transition-all focus:outline-none bg-white border-spruce/20 text-ink focus:border-fresh focus:ring-1 focus:ring-fresh/30 placeholder:text-ink-mute/60"
                placeholder="ton@email.fr"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-[12px] font-semibold text-ink">
                  Mot de passe
                </label>
                <Link href="/forgot-password" className="text-[12px] font-medium hover:underline underline-offset-4 transition-colors text-ink-mute hover:text-spruce">
                  Oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="w-full px-5 py-3.5 rounded-xl border text-[16px] md:text-[14px] font-medium pr-12 transition-all focus:outline-none bg-white border-spruce/20 text-ink focus:border-fresh focus:ring-1 focus:ring-fresh/30 placeholder:text-ink-mute/60"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors text-ink-mute hover:text-spruce"
                  aria-label={showPwd ? 'Masquer' : 'Afficher'}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3.5 text-[14px] font-semibold mt-4 rounded-full transition-colors bg-fresh text-white hover:bg-fresh-deep disabled:opacity-60"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>

        {/* Lien inscription */}
        <p className="text-center text-[14px] font-medium mt-8 text-ink-mute">
          Pas encore de compte ?{' '}
          <Link href="/register" className="font-semibold hover:underline underline-offset-4 transition-colors text-spruce hover:text-fresh-deep">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-canvas"><div className="font-display font-semibold text-lg text-ink-mute animate-pulse">Chargement…</div></div>}>
      <LoginContent />
    </Suspense>
  )
}
