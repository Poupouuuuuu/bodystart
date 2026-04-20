'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

// ============================================================
// Types et état initial
// ============================================================
type Sexe = 'homme' | 'femme' | 'autre' | 'non_precise'
type Niveau = 'debutant' | 'intermediaire' | 'avance'
type Materiel = 'maison' | 'salle' | 'mixte'
type Objectif = 'perte_poids' | 'prise_masse' | 'performance' | 'remise_forme' | 'recomposition'
type TypeProg = 'sport' | 'nutrition' | 'complet'

interface IntakeData {
  // Section 1 — Identité & morphologie
  age: number | ''
  sexe: Sexe | ''
  taille_cm: number | ''
  poids_kg: number | ''
  // Section 2 — Objectif
  objectif: Objectif | ''
  objectif_chiffre: string
  echeance_semaines: number | ''
  type_programme: TypeProg | ''
  // Section 3 — Activité
  niveau: Niveau | ''
  sports_pratiques: string[]
  frequence_actuelle: string
  dispo_hebdo: number | ''
  // Section 4 — Nutrition
  type_regime: string
  contraintes_alimentaires: string[]
  nb_repas_jour: number | ''
  complements_actuels: string
  // Section 5 — Santé
  blessures_antecedents: string
  pathologies: string
  medicaments: string
  sommeil_heures: number | ''
  // Section 6 — Contexte
  stress_niveau: number | ''
  motivation_pourquoi: string
  blocages_passes: string
  notes_libres: string
}

const INITIAL: IntakeData = {
  age: '', sexe: '', taille_cm: '', poids_kg: '',
  objectif: '', objectif_chiffre: '', echeance_semaines: '', type_programme: '',
  niveau: '', sports_pratiques: [], frequence_actuelle: '', dispo_hebdo: '',
  type_regime: '', contraintes_alimentaires: [], nb_repas_jour: '', complements_actuels: '',
  blessures_antecedents: '', pathologies: '', medicaments: '', sommeil_heures: '',
  stress_niveau: '', motivation_pourquoi: '', blocages_passes: '', notes_libres: '',
}

const SPORT_OPTIONS = [
  'Musculation', 'Crossfit', 'Course / Running', 'Vélo', 'Natation', 'Football',
  'Rugby', 'Basket', 'Tennis', 'Boxe / MMA', 'Yoga / Pilates', 'Calisthénie',
  'Randonnée', 'Trail', 'Autre',
]

const CONSTRAINT_OPTIONS = [
  'Aucune', 'Végétarien', 'Végan', 'Sans gluten', 'Sans lactose', 'Halal',
  'Casher', 'Allergie aux fruits à coque', 'Allergie aux fruits de mer', 'Autre',
]

interface Props {
  intakeId: string
  source: 'oneshot_49' | 'monthly_89'
  firstName: string | null
  lastName: string | null
}

// ============================================================
// Composant principal
// ============================================================
export function IntakeForm({ intakeId, source, firstName }: Props) {
  const router = useRouter()
  const [data, setData] = useState<IntakeData>(INITIAL)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const sections = [
    'Identité & morphologie',
    'Objectif',
    'Activité actuelle',
    'Nutrition & habitudes',
    'Santé & contraintes',
    'Contexte & motivation',
  ]

  function update<K extends keyof IntakeData>(key: K, value: IntakeData[K]) {
    setData((d) => ({ ...d, [key]: value }))
  }

  function toggleArray(key: 'sports_pratiques' | 'contraintes_alimentaires', value: string) {
    setData((d) => {
      const current = d[key]
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
      return { ...d, [key]: next }
    })
  }

  // ─── Validation par section ───
  function isStepValid(s: number): boolean {
    switch (s) {
      case 0:
        return !!(data.age && data.sexe && data.taille_cm && data.poids_kg)
      case 1:
        return !!(data.objectif && data.echeance_semaines && data.type_programme)
      case 2:
        return !!(data.niveau && data.dispo_hebdo)
      case 3:
        return !!(data.type_regime && data.nb_repas_jour)
      case 4:
        return !!data.sommeil_heures
      case 5:
        return !!(data.stress_niveau && data.motivation_pourquoi.length > 5)
      default:
        return true
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/coaching/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ intakeId, data }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      toast.success('Intake envoyé ! Notre coach prend le relais.')
      router.push('/account/coaching?intake_submitted=true')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur'
      toast.error(`Échec : ${msg}`)
      setSubmitting(false)
    }
  }

  // ─── Composants UI réutilisables ───
  const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label className="block text-sm font-bold text-[#1a2e23] mb-2">
      {children} {required && <span className="text-rose-600">*</span>}
    </label>
  )

  const inputCls =
    'w-full px-4 py-2.5 border border-[#1a2e23]/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e23]/30'

  return (
    <div className="bg-white border border-[#1a2e23]/10 rounded-2xl p-6 md:p-8 shadow-sm">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 text-xs font-bold text-[#1a2e23]/60">
          <span>Étape {step + 1} / {sections.length}</span>
          <span>{sections[step]}</span>
        </div>
        <div className="h-2 bg-[#1a2e23]/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1a2e23] transition-all"
            style={{ width: `${((step + 1) / sections.length) * 100}%` }}
          />
        </div>
      </div>

      {/* ─── Section 0 — Identité ─── */}
      {step === 0 && (
        <div className="space-y-5">
          <p className="text-sm text-[#1a2e23]/60 mb-4">
            Salut {firstName ?? ''} ! On commence avec quelques infos de base sur toi.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Âge</Label>
              <input
                type="number"
                min={14}
                max={100}
                value={data.age}
                onChange={(e) => update('age', e.target.value === '' ? '' : Number(e.target.value))}
                className={inputCls}
                placeholder="Ex: 28"
              />
            </div>
            <div>
              <Label required>Sexe</Label>
              <select
                value={data.sexe}
                onChange={(e) => update('sexe', e.target.value as Sexe)}
                className={inputCls}
              >
                <option value="">— Choisir —</option>
                <option value="homme">Homme</option>
                <option value="femme">Femme</option>
                <option value="autre">Autre</option>
                <option value="non_precise">Préfère ne pas préciser</option>
              </select>
            </div>
            <div>
              <Label required>Taille (cm)</Label>
              <input
                type="number"
                min={120}
                max={230}
                value={data.taille_cm}
                onChange={(e) => update('taille_cm', e.target.value === '' ? '' : Number(e.target.value))}
                className={inputCls}
                placeholder="Ex: 178"
              />
            </div>
            <div>
              <Label required>Poids actuel (kg)</Label>
              <input
                type="number"
                step="0.1"
                min={30}
                max={250}
                value={data.poids_kg}
                onChange={(e) => update('poids_kg', e.target.value === '' ? '' : Number(e.target.value))}
                className={inputCls}
                placeholder="Ex: 75.5"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Section 1 — Objectif ─── */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <Label required>Quel est ton objectif principal ?</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { val: 'perte_poids', label: '🔥 Perte de poids' },
                { val: 'prise_masse', label: '💪 Prise de masse' },
                { val: 'performance', label: '⚡ Performance sportive' },
                { val: 'remise_forme', label: '🎯 Remise en forme' },
                { val: 'recomposition', label: '🔄 Recomposition' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => update('objectif', opt.val as Objectif)}
                  className={`p-3 border-2 rounded-xl text-sm font-medium text-left transition-colors ${
                    data.objectif === opt.val
                      ? 'border-[#1a2e23] bg-[#1a2e23]/5 text-[#1a2e23]'
                      : 'border-[#1a2e23]/20 hover:border-[#1a2e23]/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Objectif chiffré (facultatif mais utile)</Label>
            <input
              type="text"
              value={data.objectif_chiffre}
              onChange={(e) => update('objectif_chiffre', e.target.value)}
              className={inputCls}
              placeholder="Ex: -8 kg, +5 kg de muscle, courir 10km en 50 min..."
              maxLength={120}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Échéance souhaitée</Label>
              <select
                value={data.echeance_semaines}
                onChange={(e) => update('echeance_semaines', e.target.value === '' ? '' : Number(e.target.value))}
                className={inputCls}
              >
                <option value="">— Choisir —</option>
                <option value={4}>4 semaines</option>
                <option value={8}>8 semaines</option>
                <option value={12}>12 semaines</option>
                <option value={16}>16 semaines</option>
                <option value={24}>24 semaines (6 mois)</option>
                <option value={52}>1 an</option>
              </select>
            </div>
            <div>
              <Label required>Type de programme</Label>
              <select
                value={data.type_programme}
                onChange={(e) => update('type_programme', e.target.value as TypeProg)}
                className={inputCls}
              >
                <option value="">— Choisir —</option>
                <option value="sport">Sport seulement</option>
                <option value="nutrition">Nutrition seulement</option>
                <option value="complet">Sport + Nutrition (complet)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ─── Section 2 — Activité ─── */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <Label required>Niveau actuel</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'debutant', label: '🌱 Débutant' },
                { val: 'intermediaire', label: '⚙️ Intermédiaire' },
                { val: 'avance', label: '🚀 Avancé' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => update('niveau', opt.val as Niveau)}
                  className={`p-3 border-2 rounded-xl text-sm font-medium transition-colors ${
                    data.niveau === opt.val
                      ? 'border-[#1a2e23] bg-[#1a2e23]/5 text-[#1a2e23]'
                      : 'border-[#1a2e23]/20 hover:border-[#1a2e23]/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Sports/activités déjà pratiqués (multi-choix)</Label>
            <div className="flex flex-wrap gap-2">
              {SPORT_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleArray('sports_pratiques', s)}
                  className={`px-3 py-1.5 border rounded-full text-xs font-medium transition-colors ${
                    data.sports_pratiques.includes(s)
                      ? 'border-[#1a2e23] bg-[#1a2e23] text-white'
                      : 'border-[#1a2e23]/20 hover:border-[#1a2e23]/40'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Fréquence d&apos;entraînement actuelle</Label>
            <input
              type="text"
              value={data.frequence_actuelle}
              onChange={(e) => update('frequence_actuelle', e.target.value)}
              className={inputCls}
              placeholder="Ex: 3 séances de muscu/sem + 1 sortie running"
              maxLength={200}
            />
          </div>

          <div>
            <Label required>Combien de séances par semaine peux-tu réellement faire ?</Label>
            <select
              value={data.dispo_hebdo}
              onChange={(e) => update('dispo_hebdo', e.target.value === '' ? '' : Number(e.target.value))}
              className={inputCls}
            >
              <option value="">— Choisir —</option>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n} séance{n > 1 ? 's' : ''}/semaine
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ─── Section 3 — Nutrition ─── */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <Label required>Type d&apos;alimentation</Label>
            <select
              value={data.type_regime}
              onChange={(e) => update('type_regime', e.target.value)}
              className={inputCls}
            >
              <option value="">— Choisir —</option>
              <option value="omnivore">Omnivore (tout)</option>
              <option value="flexitarien">Flexitarien</option>
              <option value="vegetarien">Végétarien</option>
              <option value="vegan">Végan</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div>
            <Label>Allergies, intolérances, préférences (multi-choix)</Label>
            <div className="flex flex-wrap gap-2">
              {CONSTRAINT_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleArray('contraintes_alimentaires', c)}
                  className={`px-3 py-1.5 border rounded-full text-xs font-medium transition-colors ${
                    data.contraintes_alimentaires.includes(c)
                      ? 'border-[#1a2e23] bg-[#1a2e23] text-white'
                      : 'border-[#1a2e23]/20 hover:border-[#1a2e23]/40'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label required>Combien de repas par jour ?</Label>
            <select
              value={data.nb_repas_jour}
              onChange={(e) => update('nb_repas_jour', e.target.value === '' ? '' : Number(e.target.value))}
              className={inputCls}
            >
              <option value="">— Choisir —</option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} repas</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Compléments alimentaires actuels</Label>
            <textarea
              value={data.complements_actuels}
              onChange={(e) => update('complements_actuels', e.target.value)}
              className={inputCls}
              placeholder="Ex: whey protéine, créatine, multivitamines... (ou rien)"
              maxLength={500}
              rows={2}
            />
          </div>
        </div>
      )}

      {/* ─── Section 4 — Santé ─── */}
      {step === 4 && (
        <div className="space-y-5">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
            ⚠️ Ces informations sont strictement confidentielles et stockées en EU (chiffrées at-rest).
            Elles ne servent qu&apos;à adapter ton programme et ne seront jamais partagées.
          </div>

          <div>
            <Label>Blessures passées (importantes)</Label>
            <textarea
              value={data.blessures_antecedents}
              onChange={(e) => update('blessures_antecedents', e.target.value)}
              className={inputCls}
              placeholder="Ex: déchirure ischio gauche en 2022, tendinite épaule récidivante..."
              maxLength={1000}
              rows={2}
            />
          </div>

          <div>
            <Label>Pathologies en cours</Label>
            <textarea
              value={data.pathologies}
              onChange={(e) => update('pathologies', e.target.value)}
              className={inputCls}
              placeholder="Ex: hypothyroïdie, diabète type 2, asthme... (ou rien)"
              maxLength={500}
              rows={2}
            />
          </div>

          <div>
            <Label>Médicaments en cours</Label>
            <textarea
              value={data.medicaments}
              onChange={(e) => update('medicaments', e.target.value)}
              className={inputCls}
              placeholder="Ex: lévothyroxine, metformine... (ou rien)"
              maxLength={500}
              rows={2}
            />
          </div>

          <div>
            <Label required>Sommeil moyen (heures/nuit)</Label>
            <select
              value={data.sommeil_heures}
              onChange={(e) => update('sommeil_heures', e.target.value === '' ? '' : Number(e.target.value))}
              className={inputCls}
            >
              <option value="">— Choisir —</option>
              <option value={4}>Moins de 5h</option>
              <option value={5}>5-6h</option>
              <option value={6.5}>6-7h</option>
              <option value={7.5}>7-8h</option>
              <option value={8.5}>8-9h</option>
              <option value={10}>Plus de 9h</option>
            </select>
          </div>
        </div>
      )}

      {/* ─── Section 5 — Contexte ─── */}
      {step === 5 && (
        <div className="space-y-5">
          <div>
            <Label required>Niveau de stress quotidien (1 = zen, 10 = explosé)</Label>
            <input
              type="range"
              min={1}
              max={10}
              value={data.stress_niveau || 5}
              onChange={(e) => update('stress_niveau', Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-2xl font-bold text-[#1a2e23] mt-2">
              {data.stress_niveau || 5} / 10
            </div>
          </div>

          <div>
            <Label required>Pourquoi maintenant ? Qu&apos;est-ce qui te motive ?</Label>
            <textarea
              value={data.motivation_pourquoi}
              onChange={(e) => update('motivation_pourquoi', e.target.value)}
              className={inputCls}
              placeholder="Plus tu es honnête, mieux on t'aide. Ex: événement familial dans 3 mois, je veux retrouver ma forme d'avant les enfants..."
              maxLength={1000}
              rows={3}
            />
          </div>

          <div>
            <Label>Qu&apos;est-ce qui t&apos;a déjà bloqué auparavant ?</Label>
            <textarea
              value={data.blocages_passes}
              onChange={(e) => update('blocages_passes', e.target.value)}
              className={inputCls}
              placeholder="Ex: manque de temps, manque de constance, programmes trop intenses, alimentation difficile à suivre..."
              maxLength={1000}
              rows={3}
            />
          </div>

          <div>
            <Label>Quelque chose à ajouter ? (facultatif)</Label>
            <textarea
              value={data.notes_libres}
              onChange={(e) => update('notes_libres', e.target.value)}
              className={inputCls}
              placeholder="Tout ce que tu juges important pour notre coach"
              maxLength={1000}
              rows={2}
            />
          </div>
        </div>
      )}

      {/* ─── Navigation ─── */}
      <div className="mt-8 flex justify-between items-center">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#1a2e23]/10 text-[#1a2e23] text-sm font-medium hover:bg-[#1a2e23]/20 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" /> Précédent
          </button>
        ) : (
          <div />
        )}

        {step < sections.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!isStepValid(step)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1a2e23] text-white text-sm font-medium hover:bg-[#1a2e23]/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Suivant <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isStepValid(step) || submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Envoi…
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Soumettre l&apos;intake
              </>
            )}
          </button>
        )}
      </div>

      {/* Source info */}
      <p className="mt-6 text-center text-xs text-[#1a2e23]/40">
        Offre : {source === 'monthly_89' ? 'Suivi Personnalisé 89€/mois' : 'Programme Personnalisé 49€'}
      </p>
    </div>
  )
}
