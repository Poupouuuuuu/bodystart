'use client'

// STANDBY 2026-05-23 : coaching masque (cf. middleware redirect 301).
// Le toggle ?theme=coaching a ete retire le 2026-05-25 : auth mono-theme nutrition.

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
      validationErrors.push('Veuillez entrer une adresse email valide.')
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
      // Ajout à l'audience newsletter si acceptsMarketing
      if (form.acceptsMarketing) {
        try {
          await fetch('/api/newsletter', {
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

  const inputBase = "w-full px-5 py-3.5 rounded-2xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 bg-[#f4f6f1] border-[#1a2e23]/10 text-[#1a2e23] focus:ring-[#1a2e23]/10 focus:border-[#1a2e23]/30 placeholder:text-[#89a890]"

  const labelBase = "block text-[11px] font-bold uppercase tracking-widest mb-2 text-[#1a2e23]"

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-16 px-4 bg-[#f4f6f1] text-[#1a2e23]">
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
          <h1 className="font-display text-[35px] md:text-[42px] font-black uppercase tracking-tighter mb-3 leading-none text-[#1a2e23]">
            Créer un compte
          </h1>
          <p className="font-medium text-sm text-[#4a5f4c]">
            Rejoignez la communauté BodyStart
          </p>
        </div>

        <div className="rounded-[28px] p-8 md:p-10 border bg-white border-[#1a2e23]/5 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-1">
                {errors.map((err, i) => (
                  <p key={i} className="text-xs font-bold text-red-600">{err}</p>
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
                placeholder="vous@exemple.fr"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className={labelBase}>
                Mot de passe
                <span className="font-medium ml-2 text-[#89a890]">(min. 5 caractères)</span>
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors text-[#89a890] hover:text-[#1a2e23]"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Newsletter */}
            <label className="flex items-start gap-3 cursor-pointer group mt-2">
              <div className={cn(
                "w-5 h-5 rounded-lg border flex items-center justify-center mt-0.5 flex-shrink-0 transition-all",
                form.acceptsMarketing
                  ? 'bg-[#1a2e23] border-[#1a2e23]'
                  : 'border-[#1a2e23]/20 bg-[#f4f6f1] group-hover:border-[#1a2e23]/40'
              )}>
                {form.acceptsMarketing && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={form.acceptsMarketing}
                onChange={(e) => setForm({ ...form, acceptsMarketing: e.target.checked })}
              />
              <span className="text-[12px] font-medium leading-snug text-[#4a5f4c]">
                Je souhaite recevoir les offres exclusives et l&apos;actualité BodyStart
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-4 text-[11px] font-bold uppercase tracking-widest mt-6 rounded-full transition-all hover:-translate-y-0.5 bg-[#1a2e23] text-white hover:bg-[#2e4f3c] shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {loading ? 'CRÉATION...' : 'CRÉER MON COMPTE'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm font-medium mt-8 text-[#4a5f4c]">
          Déjà un compte ?{' '}
          <Link href="/login" className="font-bold uppercase tracking-wide hover:underline underline-offset-4 transition-colors text-[#1a2e23] hover:text-[#4a5f4c]">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f4f6f1]"><div className="font-display font-black uppercase tracking-widest text-xl text-[#1a2e23] animate-pulse">CHARGEMENT...</div></div>}>
      <RegisterContent />
    </Suspense>
  )
}
