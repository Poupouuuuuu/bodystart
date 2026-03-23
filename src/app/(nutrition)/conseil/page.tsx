'use client'

import { useState } from 'react'
import { CheckCircle, ArrowRight, MapPin, Phone, Clock } from 'lucide-react'

const OBJECTIFS = [
  { value: 'prise-de-muscle', label: '💪 Prise de muscle', desc: 'Gagner en masse et en force' },
  { value: 'perte-de-poids', label: '🔥 Perte de poids', desc: 'Affiner et garder le muscle' },
  { value: 'energie', label: '⚡ Énergie & Endurance', desc: 'Performer plus longtemps' },
  { value: 'recuperation', label: '🌙 Récupération', desc: 'Mieux récupérer après l\'effort' },
  { value: 'immunite', label: '🛡️ Immunité & Santé', desc: 'Renforcer les défenses naturelles' },
  { value: 'autre', label: '❓ Autre / Je ne sais pas', desc: 'On vous guide' },
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
      setError('Une erreur est survenue. Veuillez réessayer ou nous appeler directement.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto px-4">
          <div className="w-20 h-20 bg-brand-50 border-4 border-brand-600 rounded-sm mx-auto mb-8 flex items-center justify-center shadow-[6px_6px_0_theme(colors.brand.600)]">
            <CheckCircle className="w-10 h-10 text-brand-600" />
          </div>
          <h1 className="font-display text-4xl font-black uppercase tracking-tight text-gray-900 mb-4 leading-none">
            Message envoyé !
          </h1>
          <p className="text-gray-600 font-medium text-lg mb-6">
            Nous vous recontactons sous <strong>24–48h</strong> pour fixer un rendez-vous en boutique.
          </p>
          <div className="bg-brand-50 border-2 border-brand-200 rounded-sm p-5 text-left mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-700 mb-3">Notre boutique</p>
            <p className="font-bold text-gray-900">8 Rue du Pont des Landes, 78310 Coignières</p>
            <p className="text-gray-500 font-medium text-sm mt-1">Ouvert 7j/7 · 11h–19h</p>
          </div>
          <a href="/" className="btn-primary inline-flex">Retour à l&apos;accueil</a>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Hero */}
      <div className="bg-gray-950 text-white py-16 border-b-4 border-gray-900">
        <div className="container max-w-3xl text-center">
          <span className="text-brand-500 text-[10px] font-black uppercase tracking-widest block border-l-4 border-brand-500 pl-3 text-left inline-block mb-6">
            Conseil personnalisé
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 leading-none">
            Parlez-nous de votre objectif
          </h1>
          <p className="text-gray-300 font-medium text-lg max-w-xl mx-auto">
            En 2 minutes, on prépare votre programme sur mesure. Vous venez en boutique, on s&apos;occupe du reste.
          </p>
        </div>
      </div>

      <div className="container py-14">
        <div className="max-w-2xl mx-auto">

          {/* Étapes */}
          <div className="flex items-center gap-4 mb-12">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-sm border-2 flex items-center justify-center font-black text-sm transition-all ${
                  step >= s
                    ? 'bg-gray-900 border-gray-900 text-white shadow-[2px_2px_0_theme(colors.brand.500)]'
                    : 'bg-white border-gray-200 text-gray-400'
                }`}>{s}</div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${step >= s ? 'text-gray-900' : 'text-gray-400'}`}>
                  {s === 1 ? 'Mon objectif' : 'Mes coordonnées'}
                </span>
                {s < 2 && <ArrowRight className="w-4 h-4 text-gray-300 ml-1" />}
              </div>
            ))}
          </div>

          {/* Étape 1 — Objectif */}
          {step === 1 && (
            <div>
              <h2 className="font-display text-2xl font-black uppercase tracking-tight text-gray-900 mb-8">
                Quel est votre objectif principal ?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {OBJECTIFS.map((obj) => (
                  <button
                    key={obj.value}
                    onClick={() => setObjectif(obj.value)}
                    className={`text-left p-5 rounded-sm border-2 transition-all ${
                      objectif === obj.value
                        ? 'border-gray-900 shadow-[6px_6px_0_theme(colors.gray.900)] bg-white -translate-y-0.5'
                        : 'border-gray-200 shadow-[4px_4px_0_theme(colors.gray.200)] bg-white hover:border-gray-400 hover:-translate-y-0.5'
                    }`}
                  >
                    <p className="font-black text-lg text-gray-900 mb-1">{obj.label}</p>
                    <p className="text-sm text-gray-500 font-medium">{obj.desc}</p>
                  </button>
                ))}
              </div>
              <button
                disabled={!objectif}
                onClick={() => setStep(2)}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
              >
                Continuer <ArrowRight className="w-4 h-4 ml-2 inline-block" />
              </button>
            </div>
          )}

          {/* Étape 2 — Coordonnées */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-gray-900">
                  Vos coordonnées
                </h2>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[10px] font-black uppercase tracking-widest text-brand-700 hover:text-gray-900 transition-colors underline underline-offset-2"
                >
                  ← Modifier l&apos;objectif
                </button>
              </div>

              {/* Résumé objectif */}
              <div className="bg-brand-50 border-2 border-brand-200 rounded-sm p-4 mb-8 flex items-center gap-3">
                <span className="text-2xl">{OBJECTIFS.find(o => o.value === objectif)?.label.split(' ')[0]}</span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-700">Objectif sélectionné</p>
                  <p className="font-black text-gray-900">{OBJECTIFS.find(o => o.value === objectif)?.label}</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-700 mb-2">
                      Prénom & Nom <span className="text-brand-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Jean Dupont"
                      className="w-full border-2 border-gray-200 rounded-sm px-4 py-3 text-sm font-medium focus:border-gray-900 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="06 00 00 00 00"
                      className="w-full border-2 border-gray-200 rounded-sm px-4 py-3 text-sm font-medium focus:border-gray-900 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-700 mb-2">
                    Email <span className="text-brand-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="jean@exemple.com"
                    className="w-full border-2 border-gray-200 rounded-sm px-4 py-3 text-sm font-medium focus:border-gray-900 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-700 mb-2">
                    Message (facultatif)
                  </label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Décrivez votre situation, vos habitudes sportives, vos contraintes..."
                    className="w-full border-2 border-gray-200 rounded-sm px-4 py-3 text-sm font-medium focus:border-gray-900 focus:outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm font-medium text-red-600 bg-red-50 border-2 border-red-200 rounded-sm px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer ma demande de conseil'}
              </button>

              <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 mt-4">
                Réponse sous 24–48h · Aucun engagement
              </p>
            </form>
          )}

          {/* Infos boutique */}
          <div className="mt-16 border-t-4 border-gray-900 pt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: MapPin, label: 'Adresse', value: '8 Rue du Pont des Landes\n78310 Coignières' },
              { icon: Clock, label: 'Horaires', value: '7j/7 · 11h–19h' },
              { icon: Phone, label: 'Téléphone', value: '07 61 84 75 80', href: 'tel:+33761847580' },
            ].map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-brand-50 border-2 border-brand-200 rounded-sm flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-brand-700" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{label}</p>
                  {href ? (
                    <a href={href} className="font-bold text-gray-900 hover:text-brand-700 transition-colors text-sm">
                      {value}
                    </a>
                  ) : (
                    <p className="font-bold text-gray-900 text-sm whitespace-pre-line">{value}</p>
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
