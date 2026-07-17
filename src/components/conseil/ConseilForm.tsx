'use client'

import { useState } from 'react'
import {
  CheckCircle,
  ArrowRight,
  MapPin,
  Phone,
  Clock,
  Dumbbell,
  Flame,
  Zap,
  Moon,
  Shield,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const OBJECTIFS = [
  { value: 'prise-de-muscle', label: 'Prise de muscle', desc: 'Gagner en masse et en force', icon: Dumbbell },
  { value: 'perte-de-poids', label: 'Perte de poids', desc: 'Affiner et garder le muscle', icon: Flame },
  { value: 'energie', label: 'Énergie & Endurance', desc: 'Performer plus longtemps', icon: Zap },
  { value: 'recuperation', label: 'Récupération', desc: "Mieux récupérer après l'effort", icon: Moon },
  { value: 'immunite', label: 'Immunité & Santé', desc: 'Renforcer les défenses naturelles', icon: Shield },
  { value: 'autre', label: 'Autre / Je ne sais pas', desc: 'On te guide', icon: HelpCircle },
]

/**
 * Formulaire "Conseil gratuit" — DA claire V2.
 * Re-theme + copy + tutoiement uniquement. La LOGIQUE (2 étapes, validation,
 * soumission POST /api/contact, capture des leads) est strictement inchangée.
 */
export default function ConseilForm() {
  const [step, setStep] = useState<1 | 2>(1)
  const [objectif, setObjectif] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, objectif }),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
    } catch {
      setError('Une erreur est survenue. Réessaie ou appelle-nous directement.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-canvas">
        <div className="text-center max-w-lg mx-auto px-4 py-20">
          <div className="w-20 h-20 bg-sage rounded-full mx-auto mb-8 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-spruce" />
          </div>
          <h1 className="font-display text-[32px] md:text-[40px] font-extrabold tracking-tight text-spruce mb-4 leading-[1.1]">
            Message envoyé !
          </h1>
          <p className="text-ink-mute text-[17px] leading-[1.6] mb-8">
            On te recontacte sous <strong className="text-ink font-semibold">24-48h</strong> pour caler
            ton rendez-vous en boutique.
          </p>
          <div className="bg-white rounded-2xl border border-spruce/10 p-6 text-left mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mustard-ink mb-2">
              Notre boutique
            </p>
            <p className="font-semibold text-ink">8 Rue du Pont des Landes, 78310 Coignières</p>
            <p className="text-ink-mute text-[14px] mt-1">Ouvert du lundi au samedi · 11h – 19h</p>
          </div>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-fresh text-white font-semibold text-[15px] px-7 py-3.5 rounded-full hover:bg-fresh-deep transition-colors"
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-canvas min-h-screen">
      {/* ─── Hero ─── */}
      <div className="pt-12 md:pt-16 pb-10 md:pb-12">
        <div className="container text-center max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mustard-ink mb-3">
            Conseil gratuit · Coignières
          </p>
          <h1 className="font-display text-[36px] sm:text-[44px] lg:text-[52px] font-extrabold text-spruce tracking-tight leading-[1.05] mb-5">
            Dis-nous ton objectif, on prépare le reste
          </h1>
          <p className="text-ink-mute font-medium text-[16px] md:text-[18px] max-w-xl mx-auto leading-[1.6]">
            En 2 minutes, on te prépare une sélection sur-mesure. Tu passes en boutique récupérer,
            on prend le temps de t&apos;expliquer.
          </p>
        </div>
      </div>

      <div className="container pb-16 md:pb-24">
        <div className="max-w-2xl mx-auto">
          {/* Stepper */}
          <div className="flex items-center gap-4 mb-10 md:mb-12">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-[13px] transition-all',
                    step >= s ? 'bg-fresh text-white' : 'bg-white text-ink-mute border border-spruce/15'
                  )}
                >
                  {s}
                </div>
                <span
                  className={cn(
                    'text-[13px] font-semibold',
                    step >= s ? 'text-spruce' : 'text-ink-mute'
                  )}
                >
                  {s === 1 ? 'Ton objectif' : 'Tes coordonnées'}
                </span>
                {s < 2 && <ArrowRight className="w-4 h-4 text-ink-mute/50 ml-1" />}
              </div>
            ))}
          </div>

          {/* Étape 1 — Objectif */}
          {step === 1 && (
            <div>
              <h2 className="font-display text-[22px] md:text-[26px] font-extrabold tracking-tight text-spruce mb-8">
                Quel est ton objectif principal ?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {OBJECTIFS.map((obj) => {
                  const Icon = obj.icon
                  const selected = objectif === obj.value
                  return (
                    <button
                      key={obj.value}
                      onClick={() => setObjectif(obj.value)}
                      aria-pressed={selected}
                      className={cn(
                        'text-left p-5 rounded-2xl border transition-all',
                        selected
                          ? 'border-fresh border-2 bg-sage'
                          : 'bg-white border-spruce/10 hover:border-spruce/30'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                            selected ? 'bg-fresh/15' : 'bg-sage'
                          )}
                        >
                          <Icon className={cn('w-5 h-5', selected ? 'text-fresh-deep' : 'text-spruce')} />
                        </div>
                        <div>
                          <p className="font-bold text-[16px] text-ink mb-0.5">{obj.label}</p>
                          <p className="text-[14px] text-ink-mute">{obj.desc}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              <button
                disabled={!objectif}
                onClick={() => {
                  setStep(2)
                  // Remonter en haut : sinon on atterrit au milieu de l'étape 2,
                  // sans voir le stepper ni le récap (désorientant sur mobile).
                  window.scrollTo({
                    top: 0,
                    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                      ? 'auto'
                      : 'smooth',
                  })
                }}
                className={cn(
                  'w-full flex items-center justify-center gap-2 font-semibold text-[15px] px-8 py-3.5 rounded-full transition-colors',
                  objectif
                    ? 'bg-fresh text-white hover:bg-fresh-deep'
                    : 'bg-ink-mute/15 text-ink-mute/60 cursor-not-allowed'
                )}
              >
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Étape 2 — Coordonnées */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-[22px] md:text-[26px] font-extrabold tracking-tight text-spruce">
                  Tes coordonnées
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    window.scrollTo({
                      top: 0,
                      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                        ? 'auto'
                        : 'smooth',
                    })
                  }}
                  className="text-[13px] font-semibold text-ink-mute hover:text-spruce transition-colors underline underline-offset-4"
                >
                  Modifier l&apos;objectif
                </button>
              </div>

              {/* Résumé objectif */}
              <div className="bg-sage rounded-2xl p-5 mb-8 flex items-center gap-4">
                {(() => {
                  const selected = OBJECTIFS.find((o) => o.value === objectif)
                  if (!selected) return null
                  const Icon = selected.icon
                  return (
                    <>
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-spruce" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-spruce/70">
                          Objectif sélectionné
                        </p>
                        <p className="font-bold text-spruce">{selected.label}</p>
                      </div>
                    </>
                  )
                })()}
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="conseil-name" className="block text-[12px] font-semibold text-ink mb-2">
                      Ton prénom et nom <span className="text-fresh">*</span>
                    </label>
                    <input
                      id="conseil-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Jean Dupont"
                      className="w-full bg-white border border-spruce/15 rounded-xl px-4 py-3.5 text-[16px] md:text-[14px] text-ink placeholder:text-ink-mute/60 focus:border-fresh focus:ring-1 focus:ring-fresh/30 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="conseil-phone" className="block text-[12px] font-semibold text-ink mb-2">Ton téléphone</label>
                    <input
                      id="conseil-phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="06 00 00 00 00"
                      className="w-full bg-white border border-spruce/15 rounded-xl px-4 py-3.5 text-[16px] md:text-[14px] text-ink placeholder:text-ink-mute/60 focus:border-fresh focus:ring-1 focus:ring-fresh/30 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="conseil-email" className="block text-[12px] font-semibold text-ink mb-2">
                    Ton email <span className="text-fresh">*</span>
                  </label>
                  <input
                    id="conseil-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="jean@exemple.com"
                    className="w-full bg-white border border-spruce/15 rounded-xl px-4 py-3.5 text-[16px] md:text-[14px] text-ink placeholder:text-ink-mute/60 focus:border-fresh focus:ring-1 focus:ring-fresh/30 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="conseil-message" className="block text-[12px] font-semibold text-ink mb-2">
                    Ton message (facultatif)
                  </label>
                  <textarea
                    id="conseil-message"
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Décris ta situation, tes habitudes sportives, tes contraintes…"
                    className="w-full bg-white border border-spruce/15 rounded-xl px-4 py-3.5 text-[16px] md:text-[14px] text-ink placeholder:text-ink-mute/60 focus:border-fresh focus:ring-1 focus:ring-fresh/30 focus:outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="mt-4 text-[14px] font-medium text-terracotta bg-terracotta/10 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'w-full mt-8 flex items-center justify-center gap-2 bg-fresh text-white font-semibold text-[15px] px-8 py-3.5 rounded-full transition-colors',
                  loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-fresh-deep'
                )}
              >
                {loading ? 'Envoi en cours…' : 'Envoyer ma demande de conseil'}
              </button>

              <p className="text-center text-[12px] text-ink-mute mt-4">
                Réponse sous 24 à 48h, aucun engagement.
              </p>
            </form>
          )}

          {/* Infos boutique */}
          <div className="mt-16 pt-10 border-t border-spruce/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: MapPin, label: 'Adresse', value: '8 Rue du Pont des Landes\n78310 Coignières' },
              { icon: Clock, label: 'Horaires', value: 'Lun–Sam, 11h à 19h' },
              { icon: Phone, label: 'Téléphone', value: '07 61 84 75 80', href: 'tel:+33761847580' },
            ].map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="bg-white rounded-2xl border border-spruce/10 p-5 flex items-start gap-4">
                <div className="w-10 h-10 bg-sage rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-spruce" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mustard-ink mb-1">
                    {label}
                  </p>
                  {href ? (
                    <a href={href} className="font-semibold text-ink hover:text-spruce transition-colors text-[14px]">
                      {value}
                    </a>
                  ) : (
                    <p className="font-semibold text-ink text-[14px] whitespace-pre-line">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
