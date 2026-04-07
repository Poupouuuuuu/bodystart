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
  { value: 'energie', label: 'Energie & Endurance', desc: 'Performer plus longtemps', icon: Zap },
  { value: 'recuperation', label: 'Recuperation', desc: 'Mieux recuperer apres l\'effort', icon: Moon },
  { value: 'immunite', label: 'Immunite & Sante', desc: 'Renforcer les defenses naturelles', icon: Shield },
  { value: 'autre', label: 'Autre / Je ne sais pas', desc: 'On vous guide', icon: HelpCircle },
]

export default function ConseilPage() {
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
      setError('Une erreur est survenue. Veuillez reessayer ou nous appeler directement.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f4f6f1]">
        <div className="text-center max-w-lg mx-auto px-4 py-20">
          <div className="w-20 h-20 bg-[#89a890]/20 rounded-full mx-auto mb-8 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-[#4a5f4c]" />
          </div>
          <h1 className="font-display text-4xl font-black uppercase tracking-tight text-[#1a2e23] mb-4 leading-none">
            Message envoye !
          </h1>
          <p className="text-[#4a5f4c] text-lg mb-8">
            Nous vous recontactons sous <strong className="text-[#1a2e23]">24-48h</strong> pour fixer un rendez-vous en boutique.
          </p>
          <div className="bg-white rounded-[20px] p-6 text-left mb-8 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#89a890] mb-3">Notre boutique</p>
            <p className="font-bold text-[#1a2e23]">8 Rue du Pont des Landes, 78310 Coignieres</p>
            <p className="text-[#4a5f4c] text-sm mt-1">Ouvert 7j/7 -- 11h-19h</p>
          </div>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-[#1a2e23] text-white font-bold text-sm px-8 py-3.5 rounded-full hover:bg-[#1a2e23]/90 transition-colors"
          >
            Retour a l&apos;accueil
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#f4f6f1] min-h-screen">
      {/* ─── Hero ─── */}
      <div className="pt-16 pb-12 md:pt-20 md:pb-16">
        <div className="container text-center max-w-3xl">
          <h1 className="font-display text-[45px] md:text-[65px] lg:text-[80px] font-black uppercase text-[#1a2e23] tracking-tighter leading-none mb-6">
            CONSEIL PERSONNALISÉ
          </h1>
          <p className="text-[#4a5f4c] font-medium text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            En 2 minutes, on prépare votre programme sur mesure. Vous venez en boutique, on s&apos;occupe du reste.
          </p>
        </div>
      </div>

      <div className="container py-14">
        <div className="max-w-2xl mx-auto">

          {/* Etapes */}
          <div className="flex items-center gap-4 mb-12">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all',
                  step >= s
                    ? 'bg-[#1a2e23] text-white'
                    : 'bg-white text-[#89a890] border border-[#89a890]/30'
                )}>
                  {s}
                </div>
                <span className={cn(
                  'text-[11px] font-black uppercase tracking-widest',
                  step >= s ? 'text-[#1a2e23]' : 'text-[#89a890]'
                )}>
                  {s === 1 ? 'Mon objectif' : 'Mes coordonnees'}
                </span>
                {s < 2 && <ArrowRight className="w-4 h-4 text-[#89a890] ml-1" />}
              </div>
            ))}
          </div>

          {/* Etape 1 -- Objectif */}
          {step === 1 && (
            <div>
              <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1a2e23] mb-8">
                Quel est votre objectif principal ?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {OBJECTIFS.map((obj) => {
                  const Icon = obj.icon
                  return (
                    <button
                      key={obj.value}
                      onClick={() => setObjectif(obj.value)}
                      className={cn(
                        'text-left p-5 rounded-[20px] transition-all',
                        objectif === obj.value
                          ? 'bg-[#1a2e23] text-white shadow-lg scale-[1.02]'
                          : 'bg-white border border-transparent hover:border-[#89a890]/40 hover:shadow-md'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                          objectif === obj.value
                            ? 'bg-white/15'
                            : 'bg-[#89a890]/10'
                        )}>
                          <Icon className={cn(
                            'w-5 h-5',
                            objectif === obj.value ? 'text-white' : 'text-[#4a5f4c]'
                          )} />
                        </div>
                        <div>
                          <p className={cn(
                            'font-bold text-base mb-0.5',
                            objectif === obj.value ? 'text-white' : 'text-[#1a2e23]'
                          )}>
                            {obj.label}
                          </p>
                          <p className={cn(
                            'text-sm',
                            objectif === obj.value ? 'text-white/70' : 'text-[#4a5f4c]'
                          )}>
                            {obj.desc}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              <button
                disabled={!objectif}
                onClick={() => setStep(2)}
                className={cn(
                  'w-full flex items-center justify-center gap-2 bg-[#1a2e23] text-white font-bold text-sm px-8 py-4 rounded-full transition-all',
                  objectif
                    ? 'hover:bg-[#1a2e23]/90 hover:shadow-lg'
                    : 'opacity-40 cursor-not-allowed'
                )}
              >
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Etape 2 -- Coordonnees */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1a2e23]">
                  Vos coordonnees
                </h2>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[11px] font-black uppercase tracking-widest text-[#4a5f4c] hover:text-[#1a2e23] transition-colors underline underline-offset-4"
                >
                  Modifier l&apos;objectif
                </button>
              </div>

              {/* Resume objectif */}
              <div className="bg-[#1a2e23] rounded-[20px] p-5 mb-8 flex items-center gap-4">
                {(() => {
                  const selected = OBJECTIFS.find(o => o.value === objectif)
                  if (!selected) return null
                  const Icon = selected.icon
                  return (
                    <>
                      <div className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-[#89a890]">Objectif selectionne</p>
                        <p className="font-bold text-white">{selected.label}</p>
                      </div>
                    </>
                  )
                })()}
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#4a5f4c] mb-2">
                      Prenom & Nom <span className="text-[#7cb98b]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Jean Dupont"
                      className="w-full bg-white border border-[#89a890]/20 rounded-[14px] px-4 py-3.5 text-sm text-[#1a2e23] placeholder:text-[#89a890] focus:border-[#4a5f4c] focus:ring-1 focus:ring-[#4a5f4c] focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#4a5f4c] mb-2">
                      Telephone
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="06 00 00 00 00"
                      className="w-full bg-white border border-[#89a890]/20 rounded-[14px] px-4 py-3.5 text-sm text-[#1a2e23] placeholder:text-[#89a890] focus:border-[#4a5f4c] focus:ring-1 focus:ring-[#4a5f4c] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#4a5f4c] mb-2">
                    Email <span className="text-[#7cb98b]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="jean@exemple.com"
                    className="w-full bg-white border border-[#89a890]/20 rounded-[14px] px-4 py-3.5 text-sm text-[#1a2e23] placeholder:text-[#89a890] focus:border-[#4a5f4c] focus:ring-1 focus:ring-[#4a5f4c] focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#4a5f4c] mb-2">
                    Message (facultatif)
                  </label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Decrivez votre situation, vos habitudes sportives, vos contraintes..."
                    className="w-full bg-white border border-[#89a890]/20 rounded-[14px] px-4 py-3.5 text-sm text-[#1a2e23] placeholder:text-[#89a890] focus:border-[#4a5f4c] focus:ring-1 focus:ring-[#4a5f4c] focus:outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm font-medium text-red-700 bg-red-50 rounded-[14px] px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'w-full mt-8 flex items-center justify-center gap-2 bg-[#1a2e23] text-white font-bold text-sm px-8 py-4 rounded-full transition-all',
                  loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#1a2e23]/90 hover:shadow-lg'
                )}
              >
                {loading ? 'Envoi en cours...' : 'Envoyer ma demande de conseil'}
              </button>

              <p className="text-center text-[11px] font-black uppercase tracking-widest text-[#89a890] mt-4">
                Reponse sous 24-48h -- Aucun engagement
              </p>
            </form>
          )}

          {/* Infos boutique */}
          <div className="mt-16 pt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: MapPin, label: 'Adresse', value: '8 Rue du Pont des Landes\n78310 Coignieres' },
              { icon: Clock, label: 'Horaires', value: '7j/7 -- 11h-19h' },
              { icon: Phone, label: 'Telephone', value: '07 61 84 75 80', href: 'tel:+33761847580' },
            ].map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="bg-white rounded-[20px] p-5 flex items-start gap-4">
                <div className="w-10 h-10 bg-[#89a890]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[#4a5f4c]" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#89a890] mb-1">{label}</p>
                  {href ? (
                    <a href={href} className="font-bold text-[#1a2e23] hover:text-[#7cb98b] transition-colors text-sm">
                      {value}
                    </a>
                  ) : (
                    <p className="font-bold text-[#1a2e23] text-sm whitespace-pre-line">{value}</p>
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
