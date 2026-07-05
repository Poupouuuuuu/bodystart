'use client'

// Popup de capture d'email : -10 % sur la 1re commande.
// - Déclenchement : ~15 s OU exit-intent (desktop) / remontée rapide (mobile).
// - UNE fois par visiteur (flag localStorage posé dès l'affichage ou la fermeture).
// - Pas sur /staff (caisse) ni pour un client connecté.
// - Soumission → /api/subscribe (abonne le contact dans Shopify). Le code part
//   par email via l'automatisation Shopify Email : on ne l'affiche jamais ici.

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { X, Mail, Check, Loader2 } from 'lucide-react'
import { useCustomer } from '@/context/CustomerContext'

const FLAG = 'bs_newsletter_popup'
const DELAY_MS = 15000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function NewsletterPopup() {
  const pathname = usePathname()
  const { isLoggedIn, isLoading } = useCustomer()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const armedRef = useRef(false)
  const shownRef = useRef(false)

  // Pas de checkout sur notre domaine (hébergé Shopify) ; on exclut par sécurité
  // l'espace caisse et tout chemin checkout éventuel.
  const excluded = !!pathname && (pathname.startsWith('/staff') || pathname.startsWith('/checkout'))

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(FLAG, '1')
    } catch {
      /* localStorage indispo (navigation privée stricte) : on n'insiste pas */
    }
  }, [])

  const show = useCallback(() => {
    if (shownRef.current) return
    shownRef.current = true
    markSeen()
    setOpen(true)
  }, [markSeen])

  const close = useCallback(() => {
    markSeen()
    setOpen(false)
  }, [markSeen])

  // Armement des déclencheurs (une seule fois, si éligible)
  useEffect(() => {
    if (isLoading) return // on attend de savoir si le visiteur est connecté
    if (excluded || isLoggedIn || armedRef.current) return
    let seen = false
    try {
      seen = localStorage.getItem(FLAG) === '1'
    } catch {
      seen = false
    }
    if (seen) return
    armedRef.current = true

    const timer = setTimeout(show, DELAY_MS)

    // Exit-intent desktop : la souris sort par le haut de la fenêtre
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) show()
    }
    // Mobile : remontée rapide vers le haut de page
    let lastY = window.scrollY
    let lastT = Date.now()
    const onScroll = () => {
      const y = window.scrollY
      const t = Date.now()
      const dy = lastY - y // > 0 = scroll vers le haut
      const dt = t - lastT || 1
      if (dy > 60 && dy / dt > 0.45 && y < 400) show()
      lastY = y
      lastT = t
    }
    document.addEventListener('mouseout', onMouseOut)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseout', onMouseOut)
      window.removeEventListener('scroll', onScroll)
    }
  }, [isLoading, excluded, isLoggedIn, show])

  // Fermeture à la touche Échap
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  // A11y : à l'ouverture, déplacer le focus DANS la modale (sinon l'utilisateur
  // clavier/lecteur d'écran continue de naviguer la page derrière l'overlay
  // sans savoir qu'une modale s'affiche).
  const emailInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (open) emailInputRef.current?.focus()
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'loading') return
    const value = email.trim().toLowerCase()
    if (!EMAIL_RE.test(value)) {
      setStatus('error')
      setErrorMsg('Entre un email valide.')
      return
    }
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      })
      if (!res.ok) throw new Error('bad status')
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('Oups, réessaie dans un instant.')
    }
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Offre -10 % sur ta première commande"
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-ink/50 backdrop-blur-sm animate-fade-in"
      onClick={close}
    >
      {/* Mobile : BOTTOM-SHEET (≈ contenu, max 85dvh) au lieu du plein écran —
          l'interstitiel full-screen est pénalisé par Google et interrompt la
          navigation. Desktop : modale centrée inchangée. */}
      <div
        className="relative bg-canvas w-full max-h-[85dvh] rounded-t-2xl sm:max-w-md sm:rounded-2xl overflow-y-auto flex flex-col shadow-2xl animate-slide-up sm:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label="Fermer"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center text-ink-mute bg-white/80 hover:text-spruce hover:bg-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-7 py-10 sm:px-9 sm:py-9 max-w-md mx-auto w-full">
          {status === 'success' ? (
            /* ─── Succès ─── */
            <div className="text-center">
              <span className="inline-flex w-14 h-14 rounded-full bg-fresh/15 items-center justify-center mb-5">
                <Check className="w-7 h-7 text-fresh-deep" />
              </span>
              <h2 className="font-display text-[24px] font-extrabold text-spruce leading-tight mb-3">
                C&apos;est bon !
              </h2>
              <p className="text-[15px] text-ink leading-relaxed mb-7">
                Ton code arrive dans ta boîte mail (pense à regarder les spams).
              </p>
              <button
                onClick={close}
                className="w-full py-3.5 rounded-full bg-fresh text-white text-[15px] font-semibold hover:bg-fresh-deep transition-colors"
              >
                Continuer mes achats
              </button>
            </div>
          ) : (
            /* ─── Formulaire ─── */
            <>
              <span className="inline-flex w-14 h-14 rounded-full bg-sage items-center justify-center mb-5">
                <Mail className="w-7 h-7 text-spruce" />
              </span>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fresh-deep mb-2">
                Offre de bienvenue
              </p>
              <h2 className="font-display text-[26px] sm:text-[28px] font-extrabold text-spruce leading-[1.1] tracking-tight mb-3">
                -10 % sur ta première commande ?
              </h2>
              <p className="text-[15px] text-ink-mute leading-relaxed mb-6">
                Laisse ton email, on t&apos;envoie ton code. Et tu seras au courant des nouveautés
                et bons plans avant tout le monde.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                <input
                  ref={emailInputRef}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (status === 'error') setStatus('idle')
                  }}
                  placeholder="ton@email.fr"
                  aria-label="Ton adresse email"
                  aria-invalid={status === 'error'}
                  aria-describedby={status === 'error' ? 'newsletter-error' : undefined}
                  className="w-full px-5 py-3.5 rounded-full border border-spruce/20 bg-white text-[16px] md:text-[15px] font-medium text-ink placeholder:text-ink-mute/60 focus:outline-none focus:border-fresh focus:ring-1 focus:ring-fresh/30 transition-all"
                />
                {status === 'error' && (
                  <p id="newsletter-error" role="alert" className="text-[13px] font-medium text-terracotta px-1">
                    {errorMsg}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-3.5 rounded-full bg-fresh text-white text-[15px] font-semibold hover:bg-fresh-deep transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Un instant…
                    </>
                  ) : (
                    'Je récupère mes -10 %'
                  )}
                </button>
              </form>

              <p className="text-[11px] text-ink-mute/80 leading-relaxed mt-5">
                En t&apos;inscrivant, tu acceptes de recevoir nos emails. Tu peux te désabonner à
                tout moment.{' '}
                <Link
                  href="/confidentialite"
                  className="underline underline-offset-2 hover:text-spruce"
                  onClick={close}
                >
                  En savoir plus
                </Link>
                .
              </p>
              <button
                onClick={close}
                className="block mx-auto mt-4 text-[12px] font-medium text-ink-mute underline underline-offset-2 hover:text-spruce transition-colors"
              >
                Non merci, plus tard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
