'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, UserPlus, Check } from 'lucide-react'
import { useCustomer } from '@/context/CustomerContext'
import Image from 'next/image'
import { cn } from '@/lib/utils'

function RegisterContent() {
  const router = useRouter()
  const { register } = useCustomer()
  const searchParams = useSearchParams()

  const isCoaching = searchParams.get('theme') === 'coaching'
  const authQuery = isCoaching ? '?theme=coaching' : ''

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
    if (form.password.length < 5) {
      setErrors(['Le mot de passe doit contenir au moins 5 caractères.'])
      return
    }
    setLoading(true)
    setErrors([])
    const { errors: apiErrors } = await register(form)
    if (apiErrors.length > 0) {
      setErrors(apiErrors.map((err) => err.message))
    } else {
      router.push(`/account${authQuery}`)
    }
    setLoading(false)
  }

  return (
    <div className={cn(
      "min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 transition-colors",
      isCoaching ? "bg-gray-950 text-white" : "text-gray-900"
    )}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href={isCoaching ? "/coaching" : "/"} className={cn("inline-flex items-center gap-2 mb-6", isCoaching && "bg-white p-1 rounded-sm")}>
            <Image
              src={isCoaching ? "/assets/logos/logo-coaching.png" : "/assets/logos/logo-nutrition.png"}
              alt="Body Start"
              width={160}
              height={48}
              className="h-10 w-auto"
            />
          </Link>
          <h1 className={cn(
            "font-display text-3xl md:text-4xl font-black uppercase tracking-tight mb-2",
            isCoaching ? "text-white" : "text-gray-900"
          )}>
            Créer un compte
          </h1>
          <p className={cn("font-medium", isCoaching ? "text-gray-400" : "text-gray-500")}>
            Rejoignez la communauté Body Start
          </p>
        </div>

        <div className={cn(
          "rounded-sm border-2 p-8 md:p-10 transition-colors",
          isCoaching 
            ? "bg-gray-900 border-gray-800 shadow-[8px_8px_0_theme(colors.black)]" 
            : "bg-white border-gray-900 shadow-[8px_8px_0_theme(colors.gray.900)]"
        )}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.length > 0 && (
              <div className="p-4 bg-white border-2 border-red-500 rounded-sm shadow-[4px_4px_0_theme(colors.red.500)] space-y-2">
                {errors.map((err, i) => (
                  <p key={i} className="text-xs font-black uppercase tracking-widest text-red-600">{err}</p>
                ))}
              </div>
            )}

            {/* Prénom + Nom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className={cn(
                  "block text-[10px] font-black uppercase tracking-widest mb-2",
                  isCoaching ? "text-gray-300" : "text-gray-900"
                )}>Prénom</label>
                <input
                  id="firstName"
                  type="text"
                  required
                  className={cn(
                    "input transition-colors",
                    isCoaching ? "bg-gray-950 border-gray-800 text-white focus:border-coaching-cyan-500 placeholder-gray-600" : ""
                  )}
                  placeholder="Jean"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="lastName" className={cn(
                  "block text-[10px] font-black uppercase tracking-widest mb-2",
                  isCoaching ? "text-gray-300" : "text-gray-900"
                )}>Nom</label>
                <input
                  id="lastName"
                  type="text"
                  required
                  className={cn(
                    "input transition-colors",
                    isCoaching ? "bg-gray-950 border-gray-800 text-white focus:border-coaching-cyan-500 placeholder-gray-600" : ""
                  )}
                  placeholder="Dupont"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={cn(
                "block text-[10px] font-black uppercase tracking-widest mb-2",
                isCoaching ? "text-gray-300" : "text-gray-900"
              )}>Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className={cn(
                  "input transition-colors",
                  isCoaching ? "bg-gray-950 border-gray-800 text-white focus:border-coaching-cyan-500 placeholder-gray-600" : ""
                )}
                placeholder="vous@exemple.fr"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className={cn(
                "block text-[10px] font-black uppercase tracking-widest mb-2",
                isCoaching ? "text-gray-300" : "text-gray-900"
              )}>
                Mot de passe
                <span className={cn("font-medium ml-2", isCoaching ? "text-gray-500" : "text-gray-500")}>(min. 5 caractères)</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  required
                  minLength={5}
                  autoComplete="new-password"
                  className={cn(
                    "input pr-11 transition-colors",
                    isCoaching ? "bg-gray-950 border-gray-800 text-white focus:border-coaching-cyan-500 placeholder-gray-600" : ""
                  )}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Newsletter */}
            <label className="flex items-start gap-4 cursor-pointer group mt-4">
              <div className={cn(
                "w-5 h-5 rounded-sm border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors",
                form.acceptsMarketing 
                  ? (isCoaching ? 'bg-coaching-cyan-500 border-coaching-cyan-500 text-black' : 'bg-gray-900 border-gray-900') 
                  : (isCoaching ? 'border-gray-700 bg-gray-950 group-hover:border-coaching-cyan-500' : 'border-gray-300 group-hover:border-gray-500')
              )}>
                {form.acceptsMarketing && <Check className={cn("w-3.5 h-3.5", isCoaching ? "text-black" : "text-white")} />}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={form.acceptsMarketing}
                onChange={(e) => setForm({ ...form, acceptsMarketing: e.target.checked })}
              />
              <span className={cn(
                "text-xs font-bold leading-snug",
                isCoaching ? "text-gray-400" : "text-gray-600"
              )}>
                Je souhaite recevoir les offres exclusives et l'actualité Body Start
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full flex items-center justify-center py-4 text-sm font-black uppercase tracking-widest mt-6 rounded-sm border-2 transition-all hover:-translate-y-0.5",
                isCoaching 
                  ? "bg-coaching-cyan-500 border-coaching-cyan-500 text-black hover:bg-coaching-cyan-400 shadow-[4px_4px_0_theme(colors.black)]" 
                  : "bg-brand-700 border-brand-700 text-white hover:bg-brand-800 shadow-[4px_4px_0_theme(colors.gray.900)]"
              )}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <UserPlus className="w-5 h-5 mr-2" />
              )}
              {loading ? 'CRÉATION...' : 'CRÉER MON COMPTE'}
            </button>
          </form>
        </div>

        <p className={cn(
          "text-center text-sm font-medium mt-8",
          isCoaching ? "text-gray-400" : "text-gray-500"
        )}>
          Déjà un compte ?{' '}
          <Link href={`/login${authQuery}`} className={cn(
            "font-black uppercase tracking-tight hover:underline underline-offset-4 transition-colors",
            isCoaching ? "text-coaching-cyan-400 hover:text-white" : "text-brand-700 hover:text-gray-900"
          )}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest text-2xl animate-pulse">CHARGEMENT...</div>}>
      <RegisterContent />
    </Suspense>
  )
}
