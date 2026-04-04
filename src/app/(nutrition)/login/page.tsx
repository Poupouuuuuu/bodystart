'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useCustomer } from '@/context/CustomerContext'
import Image from 'next/image'
import { cn } from '@/lib/utils'

function LoginContent() {
  const router = useRouter()
  const { login } = useCustomer()
  const searchParams = useSearchParams()

  const redirect = searchParams.get('redirect')
  const isCoaching = searchParams.get('theme') === 'coaching' || (redirect?.startsWith('/coaching') ?? false)
  const authQuery = isCoaching ? '?theme=coaching' : ''

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { errors } = await login(form.email, form.password)
    if (errors.length > 0) {
      setError('Email ou mot de passe incorrect.')
    } else {
      router.push(redirect || `/account${authQuery}`)
    }
    setLoading(false)
  }

  return (
    <div className={cn(
      "min-h-[calc(100vh-160px)] flex items-center justify-center py-16 px-4 transition-colors",
      isCoaching ? "bg-gray-950 text-white" : "bg-[#f4f6f1] text-[#1a2e23]"
    )}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href={isCoaching ? "/coaching" : "/"} className="inline-flex items-center gap-2 mb-6">
            <Image
              src={isCoaching ? "/assets/logos/logo-coaching.png" : "/assets/logos/logo-nutrition.png"}
              alt="Body Start"
              width={160}
              height={48}
              className="h-10 w-auto"
            />
          </Link>
          <h1 className={cn(
            "font-display text-[35px] md:text-[42px] font-black uppercase tracking-tighter mb-3 leading-none",
            isCoaching ? "text-white" : "text-[#1a2e23]"
          )}>
            Bon retour !
          </h1>
          <p className={cn("font-medium text-sm", isCoaching ? "text-gray-400" : "text-[#4a5f4c]")}>
            Connectez-vous à votre espace client
          </p>
        </div>

        {/* Card */}
        <div className={cn(
          "rounded-[28px] p-8 md:p-10 transition-colors border",
          isCoaching 
            ? "bg-gray-900 border-gray-800" 
            : "bg-white border-[#1a2e23]/5 shadow-sm"
        )}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Erreur */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 font-bold">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className={cn(
                "block text-[11px] font-bold uppercase tracking-widest mb-2",
                isCoaching ? "text-gray-300" : "text-[#1a2e23]"
              )}>
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className={cn(
                  "w-full px-5 py-3.5 rounded-2xl border text-sm font-medium transition-all focus:outline-none focus:ring-2",
                  isCoaching 
                    ? "bg-gray-950 border-gray-800 text-white focus:ring-coaching-cyan-500/30 focus:border-coaching-cyan-500 placeholder-gray-600" 
                    : "bg-[#f4f6f1] border-[#1a2e23]/10 text-[#1a2e23] focus:ring-[#1a2e23]/10 focus:border-[#1a2e23]/30 placeholder:text-[#89a890]"
                )}
                placeholder="vous@exemple.fr"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className={cn(
                  "block text-[11px] font-bold uppercase tracking-widest",
                  isCoaching ? "text-gray-300" : "text-[#1a2e23]"
                )}>
                  Mot de passe
                </label>
                <Link href={`/forgot-password${authQuery}`} className={cn(
                  "text-[11px] font-bold uppercase tracking-widest hover:underline underline-offset-4 transition-colors",
                  isCoaching ? "text-coaching-cyan-400 hover:text-white" : "text-[#89a890] hover:text-[#1a2e23]"
                )}>
                  Oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className={cn(
                    "w-full px-5 py-3.5 rounded-2xl border text-sm font-medium pr-12 transition-all focus:outline-none focus:ring-2",
                    isCoaching 
                      ? "bg-gray-950 border-gray-800 text-white focus:ring-coaching-cyan-500/30 focus:border-coaching-cyan-500 placeholder-gray-600" 
                      : "bg-[#f4f6f1] border-[#1a2e23]/10 text-[#1a2e23] focus:ring-[#1a2e23]/10 focus:border-[#1a2e23]/30 placeholder:text-[#89a890]"
                  )}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className={cn("absolute right-4 top-1/2 -translate-y-1/2 transition-colors", isCoaching ? "text-gray-500 hover:text-gray-300" : "text-[#89a890] hover:text-[#1a2e23]")}
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
              className={cn(
                "w-full flex items-center justify-center py-4 text-[11px] font-bold uppercase tracking-widest mt-4 rounded-full transition-all hover:-translate-y-0.5",
                isCoaching 
                  ? "bg-coaching-cyan-500 text-black hover:bg-coaching-cyan-400 shadow-lg" 
                  : "bg-[#1a2e23] text-white hover:bg-[#2e4f3c] shadow-lg hover:shadow-xl"
              )}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              {loading ? 'CONNEXION...' : 'SE CONNECTER'}
            </button>
          </form>
        </div>

        {/* Lien inscription */}
        <p className={cn(
          "text-center text-sm font-medium mt-8",
          isCoaching ? "text-gray-400" : "text-[#4a5f4c]"
        )}>
          Pas encore de compte ?{' '}
          <Link href={`/register${authQuery}`} className={cn(
            "font-bold uppercase tracking-wide hover:underline underline-offset-4 transition-colors",
            isCoaching ? "text-coaching-cyan-400 hover:text-white" : "text-[#1a2e23] hover:text-[#4a5f4c]"
          )}>
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f4f6f1]"><div className="font-display font-black uppercase tracking-widest text-xl text-[#1a2e23] animate-pulse">CHARGEMENT...</div></div>}>
      <LoginContent />
    </Suspense>
  )
}
