'use client'

// Jeu de la roue en boutique (/jeu) : formulaire → avis Google (facultatif) →
// roue → code à montrer en caisse. Le lot est tiré par /api/jeu, jamais ici :
// la roue ne fait que s'arrêter sur le segment renvoyé par le serveur.

import { useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react'
import { AlertCircle, CheckCircle2, ChevronDown, Loader2, Star } from 'lucide-react'
import Wheel, { type WheelSegment } from './Wheel'
import { LOTS, GOOGLE_REVIEW_URL, type LotId } from '@/lib/jeu-roue/lots'
import { validateEntry, formatDateFr, type EntryField } from '@/lib/jeu-roue/core'
import { frenchSpacing } from '@/lib/typo'
import { cn } from '@/lib/utils'

interface PublicResult {
  lotId: string
  label: string
  code: string
  endsAt: string
}

type Screen = 'form' | 'avis' | 'roue' | 'resultat'
type Variant = 'won' | 'played'

interface FormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  optIn: boolean
}

const STORAGE_KEY = 'bs_jeu_resultat'
const MIN_SPIN_MS = 1200 // suspense minimal avant la décélération
const GENERIC_ERROR = 'Petit souci de connexion. Vérifie ton réseau et réessaie.'

const COLORS: Record<LotId, { fill: string; text: string }> = {
  'canette-abe': { fill: '#3B7A3F', text: '#FFFFFF' },
  'crunch-bar': { fill: '#EEF4EC', text: '#2D5A2D' },
  shaker: { fill: '#2D5A2D', text: '#FFFFFF' },
  'bon-5': { fill: '#F6EBC8', text: '#5C4A14' },
  creatine: { fill: '#A44F33', text: '#FFFFFF' },
  whey: { fill: '#C9A227', text: '#3D3110' },
}

const SEGMENTS: WheelSegment[] = LOTS.map((l) => ({ label: l.wheelLabel, ...COLORS[l.id] }))
const TOTAL_WEIGHT = LOTS.reduce((s, l) => s + l.weight, 0)

interface JeuResponse {
  httpStatus: number
  status?: 'ready' | 'played' | 'won'
  customerId?: string
  result?: PublicResult | null
  error?: string
  field?: EntryField
}

async function postJeu(body: Record<string, unknown>): Promise<JeuResponse> {
  try {
    const res = await fetch('/api/jeu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = (await res.json().catch(() => ({}))) as Omit<JeuResponse, 'httpStatus'>
    return { ...json, httpStatus: res.status }
  } catch {
    return { httpStatus: 0, error: GENERIC_ERROR }
  }
}

function saveResult(result: PublicResult, variant: Variant) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ result, variant }))
  } catch {
    /* navigation privée : l'écran reste affiché tant que l'onglet est ouvert */
  }
}

export default function JeuRoue() {
  const [screen, setScreen] = useState<Screen>('form')
  const [form, setForm] = useState<FormState>({ firstName: '', lastName: '', email: '', phone: '', optIn: false })
  const [fieldError, setFieldError] = useState<{ field: EntryField; message: string } | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [result, setResult] = useState<PublicResult | null>(null)
  const [variant, setVariant] = useState<Variant>('won')
  const [spinning, setSpinning] = useState(false)
  const [target, setTarget] = useState<number | null>(null)
  const [spinError, setSpinError] = useState<{ message: string; restart: boolean } | null>(null)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const fieldRefs = useRef<Partial<Record<EntryField, HTMLInputElement | null>>>({})
  const firstScreen = useRef(true)

  // Retour sur la page (onglet rechargé, téléphone verrouillé) : on réaffiche
  // le code gagné, c'est lui qu'on montre en caisse.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as { result?: PublicResult; variant?: Variant } | null
      if (saved?.result?.code && saved.result.label) {
        setResult(saved.result)
        setVariant(saved.variant === 'played' ? 'played' : 'won')
        setScreen('resultat')
      }
    } catch {
      /* stockage indisponible : on part du formulaire */
    }
  }, [])

  // Changement d'écran : retour en haut et focus sur le titre (lecteurs d'écran).
  useEffect(() => {
    if (firstScreen.current) {
      firstScreen.current = false
      return
    }
    window.scrollTo({ top: 0 })
    headingRef.current?.focus({ preventScroll: true })
  }, [screen])

  const update = (key: keyof FormState) => (value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (fieldError?.field === key) setFieldError(null)
  }

  function showResult(r: PublicResult | null, v: Variant) {
    setResult(r)
    setVariant(v)
    if (r) saveResult(r, v)
    setScreen('resultat')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setFormError(null)
    const v = validateEntry({ ...form })
    if (!v.ok) {
      setFieldError({ field: v.field, message: v.error })
      fieldRefs.current[v.field]?.focus()
      return
    }
    setBusy(true)
    const r = await postJeu({ action: 'register', ...form })
    setBusy(false)
    if (r.status === 'ready' && r.customerId) {
      setCustomerId(r.customerId)
      setScreen('avis')
    } else if (r.status === 'played') {
      showResult(r.result ?? null, 'played')
    } else if (r.field) {
      setFieldError({ field: r.field, message: r.error ?? 'Vérifie ce champ.' })
      fieldRefs.current[r.field]?.focus()
    } else {
      setFormError(r.error ?? GENERIC_ERROR)
    }
  }

  async function spin() {
    if (spinning) return
    setSpinError(null)
    setTarget(null)
    setScreen('roue')
    setSpinning(true)
    const started = Date.now()
    const r = await postJeu({ action: 'spin', ...form, customerId })

    if (r.status === 'won' && r.result) {
      const index = LOTS.findIndex((l) => l.id === r.result!.lotId)
      setResult(r.result)
      setVariant('won')
      saveResult(r.result, 'won')
      if (index < 0) {
        setSpinning(false)
        setScreen('resultat')
        return
      }
      const wait = Math.max(0, MIN_SPIN_MS - (Date.now() - started))
      window.setTimeout(() => setTarget(index), wait)
      return
    }
    setSpinning(false)
    if (r.status === 'played') {
      showResult(r.result ?? null, 'played')
      return
    }
    setSpinError({ message: r.error ?? GENERIC_ERROR, restart: r.httpStatus === 400 })
  }

  function onWheelDone() {
    setSpinning(false)
    setScreen('resultat')
    try {
      navigator.vibrate?.(60)
    } catch {
      /* pas de vibration : sans effet */
    }
  }

  function restart() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* rien à effacer */
    }
    setForm({ firstName: '', lastName: '', email: '', phone: '', optIn: false })
    setCustomerId(null)
    setResult(null)
    setTarget(null)
    setSpinError(null)
    setFieldError(null)
    setFormError(null)
    setScreen('form')
  }

  return (
    <div className="mx-auto w-full max-w-md">
      {screen === 'form' && (
        <section aria-labelledby="jeu-titre">
          <p className="inline-flex items-center gap-1.5 rounded-lg bg-sage px-3 py-1.5 text-[13px] font-semibold text-spruce">
            Jeu en boutique · Coignières
          </p>
          <h1 id="jeu-titre" ref={headingRef} tabIndex={-1} className="display-hero mt-3 text-[2.15rem] leading-[1.08] text-spruce outline-none sm:text-[2.6rem]">
            Tourne la roue, gagne ton cadeau
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-mute">
            {frenchSpacing('Tout le monde gagne : un cadeau à retirer en caisse, ici même.')}
          </p>

          <form noValidate onSubmit={onSubmit} className="mt-6 rounded-[20px] bg-white p-5 shadow-card">
            <div className="grid grid-cols-2 gap-3">
              <Field
                id="jeu-prenom"
                label="Prénom"
                autoComplete="given-name"
                value={form.firstName}
                onChange={update('firstName')}
                error={fieldError?.field === 'firstName' ? fieldError.message : null}
                inputRef={(el) => {
                  fieldRefs.current.firstName = el
                }}
              />
              <Field
                id="jeu-nom"
                label="Nom"
                autoComplete="family-name"
                value={form.lastName}
                onChange={update('lastName')}
                error={fieldError?.field === 'lastName' ? fieldError.message : null}
                inputRef={(el) => {
                  fieldRefs.current.lastName = el
                }}
              />
            </div>
            <Field
              id="jeu-email"
              label="E-mail"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="prenom@exemple.fr"
              value={form.email}
              onChange={update('email')}
              error={fieldError?.field === 'email' ? fieldError.message : null}
              inputRef={(el) => {
                  fieldRefs.current.email = el
                }}
              className="mt-3"
            />
            <Field
              id="jeu-tel"
              label="Téléphone portable"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="06 12 34 56 78"
              value={form.phone}
              onChange={update('phone')}
              error={fieldError?.field === 'phone' ? fieldError.message : null}
              inputRef={(el) => {
                  fieldRefs.current.phone = el
                }}
              className="mt-3"
            />

            <label htmlFor="jeu-optin" className="mt-4 flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl bg-canvas p-3">
              <input
                id="jeu-optin"
                type="checkbox"
                checked={form.optIn}
                onChange={(e) => update('optIn')(e.target.checked)}
                className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-spruce/30 accent-fresh"
              />
              <span className="text-[14px] leading-snug text-ink">
                J&apos;accepte de recevoir les offres et nouveautés BodyStart par e-mail et SMS
              </span>
            </label>

            {formError && <ErrorLine className="mt-4">{formError}</ErrorLine>}

            <button type="submit" disabled={busy} className="btn-primary press mt-5 min-h-[52px] w-full text-[16px]">
              {busy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Un instant…
                </>
              ) : (
                'Je participe'
              )}
            </button>
            <p className="mt-3 text-[12.5px] leading-relaxed text-ink-mute">
              Une participation par personne. Cadeau à retirer en boutique sous 30 jours. Tes coordonnées servent à
              gérer le jeu et, si tu as coché la case, à t&apos;envoyer nos offres.
            </p>
          </form>

          <details className="group mt-4 rounded-[20px] bg-white/70 shadow-soft">
            <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 px-5 text-[14px] font-semibold text-spruce [&::-webkit-details-marker]:hidden">
              Les cadeaux à gagner
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <ul className="px-5 pb-2">
              {LOTS.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 border-t border-spruce/10 py-2.5 text-[14px] text-ink">
                  <span className="flex items-center gap-2.5">
                    <span className="h-3 w-3 flex-shrink-0 rounded-full ring-1 ring-spruce/15" style={{ background: COLORS[l.id].fill }} aria-hidden="true" />
                    {frenchSpacing(l.label)}
                  </span>
                  <span className="font-semibold tabular-nums text-ink-mute">
                    {Math.round((l.weight / TOTAL_WEIGHT) * 100)}&nbsp;%
                  </span>
                </li>
              ))}
            </ul>
            <p className="px-5 pb-4 text-[12.5px] leading-relaxed text-ink-mute">
              Un article qui manque en boutique au moment du tirage est retiré de la roue, le tirage se fait alors
              parmi les autres cadeaux.
            </p>
          </details>
        </section>
      )}

      {screen === 'avis' && (
        <section aria-labelledby="jeu-merci" className="pt-4 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage">
            <CheckCircle2 className="h-8 w-8 text-fresh" aria-hidden="true" />
          </span>
          <h1 id="jeu-merci" ref={headingRef} tabIndex={-1} className="mt-5 text-[2.1rem] leading-tight text-spruce outline-none">
            {frenchSpacing('Merci !')}
          </h1>
          <p className="mt-3 text-[17px] leading-relaxed text-ink">
            Un avis Google nous aide énormément, ça prend 30 secondes.
          </p>
          <p className="mt-2 text-[15px] font-semibold text-spruce">Ton cadeau ne dépend pas de ton avis.</p>

          <div className="mt-8 flex flex-col gap-3">
            <ReviewButton />
            <button type="button" onClick={spin} className="btn-primary press min-h-[56px] w-full text-[16px]">
              Tourner la roue
            </button>
          </div>
        </section>
      )}

      {screen === 'roue' && (
        <section aria-labelledby="jeu-roue-titre" className="pt-2 text-center">
          <h1 id="jeu-roue-titre" ref={headingRef} tabIndex={-1} className="text-[1.9rem] leading-tight text-spruce outline-none">
            {frenchSpacing(`Bonne chance, ${form.firstName.trim()} !`)}
          </h1>
          <div className="mt-8">
            <Wheel segments={SEGMENTS} spinning={spinning} targetIndex={target} onDone={onWheelDone} />
          </div>
          <p className="mt-6 min-h-[1.5rem] text-[15px] font-medium text-ink-mute" aria-live="polite">
            {spinning && 'La roue tourne…'}
          </p>
          {spinError && (
            <div className="mt-2">
              <ErrorLine className="justify-center text-left">{spinError.message}</ErrorLine>
              <button
                type="button"
                onClick={spinError.restart ? () => setScreen('form') : spin}
                className="btn-primary press mt-4 min-h-[52px] w-full text-[16px]"
              >
                {spinError.restart ? 'Revenir au formulaire' : 'Réessayer'}
              </button>
            </div>
          )}
        </section>
      )}

      {screen === 'resultat' && (
        <ResultScreen result={result} variant={variant} headingRef={headingRef} onRestart={restart} />
      )}
    </div>
  )
}

// ─── Écran 4 ──────────────────────────────────────────────────────────────

function ResultScreen({
  result,
  variant,
  headingRef,
  onRestart,
}: {
  result: PublicResult | null
  variant: Variant
  headingRef: RefObject<HTMLHeadingElement | null>
  onRestart: () => void
}) {
  const expired = result ? new Date(result.endsAt).getTime() < Date.now() : false

  return (
    <section aria-labelledby="jeu-resultat" className="pt-2 text-center">
      {variant === 'won' && result && !expired && <Confetti />}

      {result ? (
        <>
          {variant === 'played' && (
            <p className="mb-3 inline-flex items-center rounded-lg bg-mustard/15 px-3 py-1.5 text-[13px] font-semibold text-mustard-ink">
              Tu as déjà participé
            </p>
          )}
          <h1 id="jeu-resultat" ref={headingRef} tabIndex={-1} className="pt-2 text-[1.85rem] leading-[1.15] text-spruce outline-none">
            {variant === 'won' ? frenchSpacing('Bravo, tu as gagné : ') : frenchSpacing('Ton cadeau : ')}
            <span className="text-ink">{frenchSpacing(result.label)}</span>
          </h1>

          <div
            className={cn(
              'relative mt-6 rounded-[20px] border-2 border-dashed bg-white px-4 py-6 shadow-card',
              expired ? 'border-ink-mute/30' : 'border-fresh/40'
            )}
          >
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-mute">Ton code</p>
            <p
              className={cn(
                'mt-2 select-all whitespace-nowrap font-mono text-[clamp(2rem,10.5vw,2.9rem)] font-bold leading-none tracking-[0.04em]',
                expired ? 'text-ink-mute line-through' : 'text-spruce'
              )}
              aria-label={`Code ${result.code.split('').join(' ')}`}
            >
              {result.code}
            </p>
            <p className="mt-4 text-[13px] text-ink-mute">
              {expired ? 'Code expiré le ' : 'Valable jusqu’au '}
              <strong className="font-semibold text-ink">{formatDateFr(result.endsAt)}</strong>
            </p>
          </div>

          {expired ? (
            <p className="mt-5 text-[16px] leading-relaxed text-ink">
              Ce code n&apos;est plus valable. Une participation par personne, merci d&apos;avoir joué.
            </p>
          ) : (
            <p className="mt-5 text-[17px] font-semibold leading-snug text-ink">
              Montre cet écran en caisse. Valable 30 jours, une seule fois.
            </p>
          )}
          {!expired && (
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-mute">
              Astuce : fais une capture d&apos;écran pour garder ton code.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="inline-flex items-center rounded-lg bg-mustard/15 px-3 py-1.5 text-[13px] font-semibold text-mustard-ink">
            Tu as déjà participé
          </p>
          <h1 id="jeu-resultat" ref={headingRef} tabIndex={-1} className="mt-3 text-[1.85rem] leading-[1.15] text-spruce outline-none">
            Une participation par personne
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-ink">
            Ton cadeau t&apos;attend en boutique : donne ton e-mail en caisse, on retrouve ton code.
          </p>
        </>
      )}

      <div className="mt-8">
        <ReviewButton />
      </div>

      <button type="button" onClick={onRestart} className="btn-ghost press mt-6">
        Une autre personne veut jouer ?
      </button>
    </section>
  )
}

// ─── Petits composants ────────────────────────────────────────────────────

function ReviewButton() {
  return (
    <a
      href={GOOGLE_REVIEW_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="press flex min-h-[56px] w-full items-center justify-center gap-3 rounded-full bg-white px-6 text-[16px] font-semibold text-ink shadow-card ring-1 ring-spruce/10 hover:shadow-lift"
    >
      <GoogleG />
      Laisser un avis Google
      <span className="flex gap-0.5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-mustard text-mustard" />
        ))}
      </span>
      <span className="sr-only">(nouvel onglet)</span>
    </a>
  )
}

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5 flex-shrink-0" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

function ErrorLine({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p role="alert" className={cn('flex items-start gap-2 text-[14px] font-medium text-terracotta', className)}>
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  inputRef,
  className,
  type = 'text',
  inputMode,
  autoComplete,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  error: string | null
  inputRef: (el: HTMLInputElement | null) => void
  className?: string
  type?: 'text' | 'email' | 'tel'
  inputMode?: 'text' | 'email' | 'tel'
  autoComplete: string
  placeholder?: string
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        ref={inputRef}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoCapitalize={type === 'text' ? 'words' : 'off'}
        autoCorrect="off"
        spellCheck={false}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-erreur` : undefined}
        className={cn(
          'h-12 w-full rounded-xl border bg-white px-3.5 text-[16px] font-medium text-ink transition-colors placeholder:text-ink-mute/50 focus:outline-none focus:ring-2',
          error ? 'border-terracotta focus:ring-terracotta/25' : 'border-spruce/20 focus:border-fresh focus:ring-fresh/20'
        )}
      />
      {error && (
        <p id={`${id}-erreur`} className="mt-1.5 text-[13px] font-medium text-terracotta">
          {error}
        </p>
      )}
    </div>
  )
}

// Confettis à la victoire : Web Animations API, aucune feuille de style ni
// dépendance. Rien en mouvement réduit.
function Confetti() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = ref.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const colors = ['#3B7A3F', '#C9A227', '#A44F33', '#2D5A2D', '#F6EBC8', '#EEF4EC']
    const width = window.innerWidth
    const height = window.innerHeight
    const animations: Animation[] = []
    for (let i = 0; i < 36; i++) {
      const el = document.createElement('span')
      const size = 6 + Math.random() * 6
      el.style.cssText = `position:absolute;top:-16px;left:${Math.random() * width}px;width:${size}px;height:${size * (Math.random() < 0.5 ? 1 : 0.45)}px;background:${colors[i % colors.length]};border-radius:${Math.random() < 0.3 ? '50%' : '2px'}`
      root.appendChild(el)
      const drift = (Math.random() - 0.5) * 160
      const turn = (Math.random() - 0.5) * 900
      animations.push(
        el.animate(
          [
            { transform: 'translate3d(0,0,0) rotate(0deg)', opacity: 1 },
            { transform: `translate3d(${drift}px,${height * (0.55 + Math.random() * 0.4)}px,0) rotate(${turn}deg)`, opacity: 0 },
          ],
          { duration: 1800 + Math.random() * 1400, delay: Math.random() * 350, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' }
        )
      )
    }
    return () => {
      animations.forEach((a) => a.cancel())
      root.replaceChildren()
    }
  }, [])
  return <div ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden" />
}
