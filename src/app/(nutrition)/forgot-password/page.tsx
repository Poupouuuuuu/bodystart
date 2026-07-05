'use client'

// STANDBY 2026-05-23 : coaching masque (cf. middleware redirect 301).
// Le toggle ?theme=coaching a ete retire le 2026-05-25 : auth mono-theme nutrition.
// Re-theme DA claire V2 (2026-06-03, go-live) : visuel + copy/tutoiement,
// logique customerRecover intacte.

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { recoverCustomerPassword } from '@/lib/shopify/customer'
import Image from 'next/image'

function ForgotPasswordContent() {
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
      setError('Une erreur est survenue. Réessaie.')
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
              src="/assets/logos/logo-texte-240.png"
              alt="BodyStart"
              width={160}
              height={48}
              className="h-10 w-auto"
            />
          </Link>
          <h1 className="font-display text-[34px] md:text-[42px] font-extrabold tracking-tight mb-3 leading-[1.05] text-spruce">
            Mot de passe oublié
          </h1>
          <p className="font-medium text-[15px] text-ink-mute">
            Entre ton email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 md:p-10 border bg-white border-spruce/10">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-sage flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-spruce" />
              </div>
              <h2 className="font-display font-extrabold text-2xl tracking-tight mb-3 text-spruce">Email envoyé !</h2>
              <p className="font-medium text-[14px] mb-8 text-ink-mute">
                Si un compte existe pour <strong className="text-spruce">{email}</strong>, tu recevras un email dans quelques minutes.
              </p>
              <Link
                href="/login"
                className="w-full flex items-center justify-center py-3.5 text-[14px] font-semibold rounded-full transition-colors bg-fresh text-white hover:bg-fresh-deep"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-terracotta/10 border border-terracotta/20 rounded-xl text-[13px] text-terracotta font-medium">
                  {error}
                </div>
              )}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3.5 text-[14px] font-semibold mt-2 rounded-full transition-colors bg-fresh text-white hover:bg-fresh-deep disabled:opacity-60"
              >
                {loading ? 'Envoi…' : 'Envoyer le lien'}
              </button>
            </form>
          )}
        </div>

        {/* Lien retour */}
        <div className="text-center mt-8">
          <Link href="/login" className="inline-flex items-center gap-2 text-[14px] font-medium transition-colors group text-ink-mute hover:text-spruce">
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-canvas"><div className="font-display font-semibold text-lg text-ink-mute animate-pulse">Chargement…</div></div>}>
      <ForgotPasswordContent />
    </Suspense>
  )
}
