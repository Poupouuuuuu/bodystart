'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, TrendingUp, Loader2, Calendar, Dumbbell, Flame, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkoutEntry {
  id: string
  date: string
  type: string
  duration: number
  notes: string
  intensity: 'light' | 'moderate' | 'intense'
}

const WORKOUT_TYPES = [
  'Musculation — Haut du corps',
  'Musculation — Bas du corps',
  'Musculation — Full body',
  'Cardio — HIIT',
  'Cardio — Endurance',
  'Stretching / Mobilité',
  'Autre',
]

function SuiviContent() {
  const [entries, setEntries] = useState<WorkoutEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState(WORKOUT_TYPES[0])
  const [formDuration, setFormDuration] = useState(60)
  const [formIntensity, setFormIntensity] = useState<'light' | 'moderate' | 'intense'>('moderate')
  const [formNotes, setFormNotes] = useState('')

  function addEntry() {
    const entry: WorkoutEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: formType,
      duration: formDuration,
      notes: formNotes,
      intensity: formIntensity,
    }
    setEntries((prev) => [entry, ...prev])
    setShowForm(false)
    setFormNotes('')
  }

  const totalSessions = entries.length
  const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0)
  const thisWeek = entries.filter((e) => {
    const d = new Date(e.date)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return d >= weekAgo
  }).length

  return (
    <div className="container py-10 md:py-14">
      <Link href="/account/coaching" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors mb-10 group">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Retour au coaching
      </Link>

      <div className="flex items-start justify-between mb-10 gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-coaching-cyan-600 border-l-4 border-coaching-cyan-500 pl-2 mb-2">
            Suivi
          </p>
          <h1 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tight text-gray-900">
            Ma progression
          </h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-5 py-3 bg-coaching-cyan-500 text-black font-black text-[10px] uppercase tracking-widest rounded-sm border-2 border-coaching-cyan-500 hover:bg-coaching-cyan-400 transition-colors shadow-[4px_4px_0_theme(colors.gray.200)]"
        >
          <Plus className="w-4 h-4" />
          ENREGISTRER UNE SÉANCE
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {[
          { Icon: Dumbbell, label: 'Séances totales', value: totalSessions },
          { Icon: Timer, label: 'Minutes totales', value: totalMinutes },
          { Icon: Flame, label: 'Cette semaine', value: thisWeek },
        ].map(({ Icon, label, value }) => (
          <div key={label} className="p-6 border-2 border-gray-200 rounded-sm shadow-[4px_4px_0_theme(colors.gray.200)] flex items-center gap-4">
            <div className="w-12 h-12 bg-coaching-cyan-500 rounded-sm flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-black" />
            </div>
            <div>
              <p className="font-display font-black text-3xl text-gray-900">{value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="mb-10 p-6 border-2 border-coaching-cyan-500 rounded-sm shadow-[4px_4px_0_#99e5e5] bg-white">
          <h3 className="font-black text-sm uppercase tracking-tight text-gray-900 mb-6">Nouvelle séance</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-sm text-sm font-bold text-gray-900 focus:outline-none focus:border-coaching-cyan-500 transition-colors"
              >
                {WORKOUT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Durée (min)</label>
              <input
                type="number"
                value={formDuration}
                onChange={(e) => setFormDuration(Number(e.target.value))}
                min={10}
                max={240}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-sm text-sm font-bold text-gray-900 focus:outline-none focus:border-coaching-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Intensité</label>
            <div className="flex gap-3">
              {(['light', 'moderate', 'intense'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setFormIntensity(level)}
                  className={cn(
                    'flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest border-2 rounded-sm transition-colors',
                    formIntensity === level
                      ? 'bg-coaching-cyan-500 border-coaching-cyan-500 text-black'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                  )}
                >
                  {level === 'light' ? 'Légère' : level === 'moderate' ? 'Modérée' : 'Intense'}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Notes (optionnel)</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={3}
              placeholder="Exercices, sensations, PR..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-sm text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-coaching-cyan-500 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={addEntry}
              className="px-6 py-3 bg-coaching-cyan-500 text-black font-black text-[10px] uppercase tracking-widest rounded-sm border-2 border-coaching-cyan-500 hover:bg-coaching-cyan-400 transition-colors shadow-[4px_4px_0_theme(colors.gray.200)]"
            >
              ENREGISTRER
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-3 bg-white text-gray-500 font-black text-[10px] uppercase tracking-widest rounded-sm border-2 border-gray-200 hover:border-gray-400 transition-colors"
            >
              ANNULER
            </button>
          </div>
        </div>
      )}

      {/* Historique */}
      <div className="rounded-sm border-2 border-gray-200 overflow-hidden shadow-[4px_4px_0_theme(colors.gray.200)]">
        <div className="px-6 py-5 bg-gray-50 border-b-2 border-gray-100">
          <h2 className="font-display font-black text-xl uppercase tracking-tight text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-coaching-cyan-500" />
            Historique des séances
          </h2>
        </div>

        {entries.length === 0 ? (
          <div className="py-20 text-center px-6">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="font-black uppercase tracking-tight text-lg text-gray-900 mb-2">Aucune séance enregistrée</p>
            <p className="text-sm text-gray-500 font-medium">
              Commencez à enregistrer vos séances pour suivre votre progression.
            </p>
          </div>
        ) : (
          <div className="divide-y-2 divide-gray-100">
            {entries.map((entry) => (
              <div key={entry.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-black text-sm uppercase tracking-tight text-gray-900">{entry.type}</p>
                  <span className={cn(
                    'text-[10px] font-black uppercase tracking-widest border-2 px-2 py-0.5 rounded-sm',
                    entry.intensity === 'intense'
                      ? 'border-red-300 text-red-600 bg-red-50'
                      : entry.intensity === 'moderate'
                        ? 'border-yellow-300 text-yellow-600 bg-yellow-50'
                        : 'border-green-300 text-green-600 bg-green-50'
                  )}>
                    {entry.intensity === 'light' ? 'Légère' : entry.intensity === 'moderate' ? 'Modérée' : 'Intense'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <span>{new Date(entry.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
                  <span>{entry.duration} min</span>
                </div>
                {entry.notes && (
                  <p className="text-xs text-gray-500 font-bold mt-2">{entry.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SuiviPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-coaching-cyan-500" /></div>}>
      <SuiviContent />
    </Suspense>
  )
}
