'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { recoverCustomerPassword } from '@/lib/shopify/customer'
import Image from 'next/image'
import { cn } from '@/lib/utils'

function ForgotPasswordContent() {
  const searchParams = useSearchParams()
  const isCoaching = searchParams.get('theme') === 'coaching'
  const authQuery = isCoaching ? '?theme=coaching' : ''

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await recoverCustomerPassword(email)
      setSent(true)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    }
    setLoading(false)
  }

  return (
    <div className={cn(
      "min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 transition-colors",
      isCoaching ? "bg-gray-950 text-white" : "text-gray-900"
    )}>
      <div className="w-full max-w-md">
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
            Mot de passe oublié
          </h1>
          <p className={cn("font-medium", isCoaching ? "text-gray-400" : "text-gray-500")}>
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <div className={cn(
          "rounded-sm border-2 p-8 md:p-10 transition-colors",
          isCoaching 
            ? "bg-gray-900 border-gray-800 shadow-[8px_8px_0_theme(colors.black)]" 
            : "bg-white border-gray-900 shadow-[8px_8px_0_theme(colors.gray.900)]"
        )}>
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle2 className={cn("w-16 h-16 mx-auto mb-6", isCoaching ? "text-coaching-cyan-400" : "text-brand-600")} />
              <h2 className={cn(
                "font-display font-black text-2xl uppercase tracking-tight mb-3",
                isCoaching ? "text-white" : "text-gray-900"
              )}>Email envoyé !</h2>
              <p className={cn("font-medium mb-8", isCoaching ? "text-gray-400" : "text-gray-600")}>
                Si un compte existe pour <strong className={isCoaching ? "text-white" : "text-gray-900"}>{email}</strong>, vous recevrez un email dans quelques minutes.
              </p>
              <Link 
                href={`/login${authQuery}`} 
                className={cn(
                  "w-full flex items-center justify-center py-4 text-sm font-black uppercase tracking-widest rounded-sm border-2 transition-all hover:-translate-y-0.5",
                  isCoaching 
                    ? "bg-coaching-cyan-500 border-coaching-cyan-500 text-black hover:bg-coaching-cyan-400 shadow-[4px_4px_0_theme(colors.black)]" 
                    : "bg-brand-700 border-brand-700 text-white hover:bg-brand-800 shadow-[4px_4px_0_theme(colors.gray.900)]"
                )}
              >
                RETOUR À LA CONNEXION
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-white border-2 border-red-500 rounded-sm shadow-[4px_4px_0_theme(colors.red.500)] text-sm text-red-600 font-bold uppercase tracking-tight">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="email" className={cn(
                  "block text-[10px] font-black uppercase tracking-widest mb-2",
                  isCoaching ? "text-gray-300" : "text-gray-900"
                )}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    className={cn(
                      "input pl-12 transition-colors",
                      isCoaching ? "bg-gray-950 border-gray-800 text-white focus:border-coaching-cyan-500 placeholder-gray-600" : ""
                    )}
                    placeholder="vous@exemple.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
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
                {loading ? 'ENVOI...' : 'ENVOYER LE LIEN'}
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-8">
          <Link href={`/login${authQuery}`} className={cn(
            "inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-gray-900 transition-colors group",
            isCoaching ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
          )}>
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest text-2xl animate-pulse">CHARGEMENT...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  )
}
