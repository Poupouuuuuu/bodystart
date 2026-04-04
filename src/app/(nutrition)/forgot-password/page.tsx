'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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
      "min-h-[calc(100vh-160px)] flex items-center justify-center py-16 px-4 transition-colors",
      isCoaching ? "bg-gray-950 text-white" : "bg-[#f4f6f1] text-[#1a2e23]"
    )}>
      <div className="w-full max-w-md">
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
            Mot de passe oublié
          </h1>
          <p className={cn("font-medium text-sm", isCoaching ? "text-gray-400" : "text-[#4a5f4c]")}>
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <div className={cn(
          "rounded-[28px] p-8 md:p-10 transition-colors border",
          isCoaching 
            ? "bg-gray-900 border-gray-800" 
            : "bg-white border-[#1a2e23]/5 shadow-sm"
        )}>
          {sent ? (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-[#1a2e23]/5 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className={cn("w-10 h-10", isCoaching ? "text-coaching-cyan-400" : "text-[#1a2e23]")} />
              </div>
              <h2 className={cn(
                "font-display font-black text-2xl uppercase tracking-tighter mb-3",
                isCoaching ? "text-white" : "text-[#1a2e23]"
              )}>Email envoyé !</h2>
              <p className={cn("font-medium text-sm mb-8", isCoaching ? "text-gray-400" : "text-[#4a5f4c]")}>
                Si un compte existe pour <strong className={isCoaching ? "text-white" : "text-[#1a2e23]"}>{email}</strong>, vous recevrez un email dans quelques minutes.
              </p>
              <Link 
                href={`/login${authQuery}`} 
                className={cn(
                  "w-full flex items-center justify-center py-4 text-[11px] font-bold uppercase tracking-widest rounded-full transition-all hover:-translate-y-0.5",
                  isCoaching 
                    ? "bg-coaching-cyan-500 text-black hover:bg-coaching-cyan-400 shadow-lg" 
                    : "bg-[#1a2e23] text-white hover:bg-[#2e4f3c] shadow-lg"
                )}
              >
                RETOUR À LA CONNEXION
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 font-bold">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="email" className={cn(
                  "block text-[11px] font-bold uppercase tracking-widest mb-2",
                  isCoaching ? "text-gray-300" : "text-[#1a2e23]"
                )}>Email</label>
                <div className="relative">
                  <Mail className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5", isCoaching ? "text-gray-600" : "text-[#89a890]")} />
                  <input
                    id="email"
                    type="email"
                    required
                    className={cn(
                      "w-full pl-12 pr-5 py-3.5 rounded-2xl border text-sm font-medium transition-all focus:outline-none focus:ring-2",
                      isCoaching 
                        ? "bg-gray-950 border-gray-800 text-white focus:ring-coaching-cyan-500/30 focus:border-coaching-cyan-500 placeholder-gray-600" 
                        : "bg-[#f4f6f1] border-[#1a2e23]/10 text-[#1a2e23] focus:ring-[#1a2e23]/10 focus:border-[#1a2e23]/30 placeholder:text-[#89a890]"
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
                  "w-full flex items-center justify-center py-4 text-[11px] font-bold uppercase tracking-widest mt-6 rounded-full transition-all hover:-translate-y-0.5",
                  isCoaching 
                    ? "bg-coaching-cyan-500 text-black hover:bg-coaching-cyan-400 shadow-lg" 
                    : "bg-[#1a2e23] text-white hover:bg-[#2e4f3c] shadow-lg hover:shadow-xl"
                )}
              >
                {loading ? 'ENVOI...' : 'ENVOYER LE LIEN'}
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-8">
          <Link href={`/login${authQuery}`} className={cn(
            "inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-colors group",
            isCoaching ? "text-gray-400 hover:text-white" : "text-[#89a890] hover:text-[#1a2e23]"
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f4f6f1]"><div className="font-display font-black uppercase tracking-widest text-xl text-[#1a2e23] animate-pulse">CHARGEMENT...</div></div>}>
      <ForgotPasswordContent />
    </Suspense>
  )
}
