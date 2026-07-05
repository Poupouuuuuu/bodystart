'use client'

// STANDBY 2026-05-23 : coaching masque (cf. middleware redirect 301).
// Le toggle ?theme=coaching a ete retire le 2026-05-25 : auth mono-theme nutrition.
// Re-theme DA claire V2 (2026-05-31) : visuel + copy/tutoiement, logique auth intacte.

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, UserPlus, Check } from 'lucide-react'
import { useCustomer } from '@/context/CustomerContext'
import Image from 'next/image'
import { cn } from '@/lib/utils'

function RegisterContent() {
  const router = useRouter()
  const { register } = useCustomer()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    acceptsMarketing: false,
  })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors: string[] = []

    if (!form.firstName.trim() || !form.lastName.trim()) {
      validationErrors.push('Le prénom et le nom sont obligatoires.')
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      validationErrors.push('Entre une adresse email valide.')
    }
    if (form.password.length < 5) {
      validationErrors.push('Le mot de passe doit contenir au moins 5 caractères.')
    }
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    setErrors([])
    const { errors: apiErrors } = await register(form)
    if (apiErrors.length > 0) {
      setErrors(apiErrors.map((err) => err.message))
    } else {
      // Abonnement marketing si coché — système unifié : consentement enregistré
      // dans Shopify (même pipeline que la popup), plus d'audience Resend.
      if (form.acceptsMarketing) {
        try {
          await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: form.email }),
          })
        } catch {
          // Non bloquant — on continue
        }
      }
      router.push('/account')
    }
    setLoading(false)
  }

  const inputBase = "w-full px-5 py-3.5 rounded-xl border text-[16px] md:text-[14px] font-medium transition-all focus:outline-none bg-white border-spruce/20 text-ink focus:border-fresh focus:ring-1 focus:ring-fresh/30 placeholder:text-ink-mute/60"

  const labelBase = "block text-[12px] font-semibold mb-2 text-ink"

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-16 px-4 bg-canvas text-ink">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Image
              src="/assets/logos/logo-texte-240.png"
              alt="BodyStart"
              width={160}
              height={48}
              className="h-10 w-auto"
            />
          </Link>
          <h1 className="font-display text-[34px] md:text-[42px] font-extrabold tracking-tight mb-3 leading-[1.05] text-spruce">
            Crée ton compte
          </h1>
          <p className="font-medium text-[15px] text-ink-mute">
            Rejoins la communauté BodyStart
          </p>
        </div>

        <div className="rounded-2xl p-8 md:p-10 border bg-white border-spruce/10">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.length > 0 && (
              <div className="p-4 bg-terracotta/10 border border-terracotta/20 rounded-xl space-y-1">
                {errors.map((err, i) => (
                  <p key={i} className="text-[13px] font-medium text-terracotta">{err}</p>
                ))}
              </div>
            )}

            {/* Prénom + Nom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className={labelBase}>Prénom</label>
                <input
                  id="firstName"
                  type="text"
                  required
                  className={inputBase}
                  placeholder="Jean"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="lastName" className={labelBase}>Nom</label>
                <input
                  id="lastName"
                  type="text"
                  required
                  className={inputBase}
                  placeholder="Dupont"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelBase}>Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className={inputBase}
                placeholder="ton@email.fr"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className={labelBase}>
                Mot de passe
                <span className="font-medium ml-2 text-ink-mute">(min. 5 caractères)</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  required
                  minLength={5}
                  autoComplete="new-password"
                  className={cn(inputBase, "pr-12")}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors text-ink-mute hover:text-spruce"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Newsletter */}
            <label className="flex items-start gap-3 cursor-pointer group mt-2">
              <div className={cn(
                "w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 flex-shrink-0 transition-all",
                form.acceptsMarketing
                  ? 'bg-fresh border-fresh'
                  : 'border-spruce/25 bg-white group-hover:border-spruce/40'
              )}>
                {form.acceptsMarketing && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={form.acceptsMarketing}
                onChange={(e) => setForm({ ...form, acceptsMarketing: e.target.checked })}
              />
              <span className="text-[12px] font-medium leading-snug text-ink-mute">
                Je souhaite recevoir les offres exclusives et l&apos;actualité BodyStart
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3.5 text-[14px] font-semibold mt-6 rounded-full transition-colors bg-fresh text-white hover:bg-fresh-deep disabled:opacity-60"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Création…' : 'Créer un compte'}
            </button>
          </form>
        </div>

        <p className="text-center text-[14px] font-medium mt-8 text-ink-mute">
          Déjà un compte ?{' '}
          <Link href="/login" className="font-semibold hover:underline underline-offset-4 transition-colors text-spruce hover:text-fresh-deep">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-canvas"><div className="font-display font-semibold text-lg text-ink-mute animate-pulse">Chargement…</div></div>}>
      <RegisterContent />
    </Suspense>
  )
}
