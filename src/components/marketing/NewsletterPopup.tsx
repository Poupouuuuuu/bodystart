'use client'

// Popup de capture d'email : -5 % sur la 1re commande (code BIENVENUE5 envoyé
// par l'automatisation Shopify Email ; passé de 10 à 5 % le 2026-09-05 pour
// laisser les codes influenceurs/ambassadeurs à -10 %).
// - Déclenchement (08/10/2026, règles dans lib/newsletter-popup) : à partir de
//   la 2ᵉ page vue de la visite, après 8 s ; sur ordinateur, aussi à
//   l'intention de sortie dès la 1re page. Plus de déclenchement au premier
//   écran sur mobile (le bandeau couvrait les deux tiers de l'écran).
// - Jamais sur /conseil, /jeu, les fiches produit, /staff (caisse), un checkout,
//   ni pour un client connecté, ni avant la réponse au bandeau cookies.
// - Une fois par visiteur tous les 30 jours (date posée dès l'affichage).
// - Soumission → /api/subscribe (abonne le contact dans Shopify). Le code part
//   par email via l'automatisation Shopify Email : on ne l'affiche jamais ici.

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { X, Mail, Check, Loader2 } from 'lucide-react'
import { useCustomer } from '@/context/CustomerContext'
import { CONSENT_EVENT, readConsent } from '@/lib/consent'
import {
  NEWSLETTER_DELAY_MS,
  NEWSLETTER_FLAG,
  PAGE_VIEWS_KEY,
  isExcludedPath,
  seenRecently,
  timerAllowed,
} from '@/lib/newsletter-popup'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function NewsletterPopup() {
  const pathname = usePathname()
  const { isLoggedIn, isLoading } = useCustomer()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const shownRef = useRef(false)
  const [pageViews, setPageViews] = useState(0)

  const excluded = isExcludedPath(pathname)

  // Jamais par-dessus le bandeau cookies : on attend que le visiteur ait fait
  // son choix (accepter, refuser ou personnaliser), puis les règles normales.
  const [consentAnswered, setConsentAnswered] = useState(false)
  useEffect(() => {
    const sync = () => setConsentAnswered(readConsent() !== null)
    sync()
    window.addEventListener(CONSENT_EVENT, sync)
    return () => window.removeEventListener(CONSENT_EVENT, sync)
  }, [])

  // Pages vues de la visite (sessionStorage) : +1 à chaque changement de page.
  useEffect(() => {
    if (!pathname) return
    let n = 1
    try {
      n = Number(sessionStorage.getItem(PAGE_VIEWS_KEY) ?? '0') + 1
      sessionStorage.setItem(PAGE_VIEWS_KEY, String(n))
    } catch {
      /* sessionStorage indispo : on reste à la 1re page, pas de délai armé */
    }
    setPageViews(n)
  }, [pathname])

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(NEWSLETTER_FLAG, String(Date.now()))
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

  // Armement des déclencheurs, page par page (désarmés au changement de page :
  // un délai lancé sur l'accueil ne s'ouvre jamais sur une fiche produit).
  useEffect(() => {
    if (isLoading || pageViews === 0) return // connecté ? page comptée ?
    if (!consentAnswered || excluded || isLoggedIn || shownRef.current) return
    let seen = false
    try {
      const raw = localStorage.getItem(NEWSLETTER_FLAG)
      seen = seenRecently(raw, Date.now())
      // Ancien drapeau sans date : daté d'aujourd'hui (cf. seenRecently)
      if (raw === '1') localStorage.setItem(NEWSLETTER_FLAG, String(Date.now()))
    } catch {
      seen = false
    }
    if (seen) return

    const timer = timerAllowed(pageViews) ? setTimeout(show, NEWSLETTER_DELAY_MS) : undefined

    // Intention de sortie, ordinateur seulement (souris qui sort par le haut)
    const desktop = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) show()
    }
    if (desktop) document.addEventListener('mouseout', onMouseOut)
    return () => {
      if (timer) clearTimeout(timer)
      document.removeEventListener('mouseout', onMouseOut)
    }
  }, [isLoading, consentAnswered, excluded, isLoggedIn, show, pageViews])

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
      aria-label="Offre -5 % sur ta première commande"
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-ink/50 backdrop-blur-sm animate-fade-in"
      onClick={close}
    >
      {/* Mobile : BOTTOM-SHEET compact (≈ 40 % de l'écran, 08/10/2026) : pas
          d'icône, texte court, marges serrées. L'interstitiel plein écran est
          pénalisé par Google et interrompt la navigation. Desktop : modale
          centrée inchangée. */}
      <div
        className="relative bg-canvas w-full max-h-[85dvh] rounded-t-2xl sm:max-w-md sm:rounded-2xl overflow-y-auto flex flex-col shadow-2xl animate-slide-up sm:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label="Fermer"
          className="absolute top-3 right-3 z-10 w-11 h-11 rounded-full flex items-center justify-center text-ink-mute bg-white/80 hover:text-spruce hover:bg-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-9 sm:py-9 max-w-md mx-auto w-full">
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
              <span className="hidden sm:inline-flex w-14 h-14 rounded-full bg-sage items-center justify-center mb-5">
                <Mail className="w-7 h-7 text-spruce" />
              </span>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fresh-deep mb-1.5 sm:mb-2 pr-12 sm:pr-0">
                Offre de bienvenue
              </p>
              <h2 className="font-display text-[22px] sm:text-[28px] font-extrabold text-spruce leading-[1.1] tracking-tight mb-2 sm:mb-3 pr-10 sm:pr-0">
                -5 % sur ta première commande ?
              </h2>
              <p className="text-[14px] sm:text-[15px] text-ink-mute leading-relaxed mb-4 sm:mb-6">
                Laisse ton email, on t&apos;envoie ton code.
                <span className="hidden sm:inline">
                  {' '}Et tu seras au courant des nouveautés et bons plans avant tout le monde.
                </span>
              </p>

              <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3" noValidate>
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
                  className="w-full px-5 py-3 sm:py-3.5 rounded-full border border-spruce/20 bg-white text-[16px] md:text-[15px] font-medium text-ink placeholder:text-ink-mute/60 focus:outline-none focus:border-fresh focus:ring-1 focus:ring-fresh/30 transition-all"
                />
                {status === 'error' && (
                  <p id="newsletter-error" role="alert" className="text-[13px] font-medium text-terracotta px-1">
                    {errorMsg}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-3 sm:py-3.5 rounded-full bg-fresh text-white text-[15px] font-semibold hover:bg-fresh-deep transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Un instant…
                    </>
                  ) : (
                    'Je récupère mes -5 %'
                  )}
                </button>
              </form>

              <p className="text-[11px] text-ink-mute/80 leading-snug sm:leading-relaxed mt-3 sm:mt-5">
                En t&apos;inscrivant, tu acceptes de recevoir nos emails. Tu peux te désabonner à
                tout moment.{' '}
                {/* Lien au fil du texte : py-4 agrandit la zone tactile à 44 px sans
                    changer la hauteur de ligne (padding vertical d'un élément inline). */}
                <Link
                  href="/confidentialite"
                  className="py-4 underline underline-offset-2 hover:text-spruce"
                  onClick={close}
                >
                  En savoir plus
                </Link>
                .
              </p>
              <button
                onClick={close}
                className="mx-auto sm:mt-2 flex w-fit min-h-[44px] items-center px-3 text-[12px] font-medium text-ink-mute underline underline-offset-2 hover:text-spruce transition-colors"
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
