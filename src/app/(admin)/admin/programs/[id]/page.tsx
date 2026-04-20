/**
 * /admin/programs/[id]
 *
 * Détail d'un intake + interface pour uploader le PDF du programme final.
 *
 * Le coach voit :
 *   - Toutes les réponses du client
 *   - Le programme déjà créé (s'il existe)
 *   - Un bouton upload PDF + champ coach_notes
 *   - Un bouton "Valider et envoyer au client"
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireAdmin } from '@/lib/coaching/auth/require-admin'
import { getSupabaseAdminClient } from '@/lib/coaching/supabase/admin'
import { ProgramUploadForm } from './ProgramUploadForm'

export const dynamic = 'force-dynamic'

interface Intake {
  id: string
  user_id: string
  status: string
  source: string
  age: number | null
  sexe: string | null
  poids_kg: number | null
  taille_cm: number | null
  objectif: string
  type_programme: string
  niveau: string
  dispo_hebdo: number | null
  contraintes_alimentaires: unknown
  blessures_antecedents: unknown
  notes_libres: string | null
  created_at: string
  submitted_at: string | null
}

interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
}

interface Program {
  id: string
  type: string
  pdf_url: string | null
  pdf_generated_at: string | null
  validated_by_coach_at: string | null
  delivered_at: string | null
  coach_adjustments: string | null
}

export default async function AdminProgramDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin()
  const admin = getSupabaseAdminClient()

  const { data: intake } = await admin
    .from('intakes')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (!intake) notFound()
  const intakeRow = intake as Intake

  const { data: profile } = await admin
    .from('profiles')
    .select('id, email, first_name, last_name')
    .eq('id', intakeRow.user_id)
    .maybeSingle()
  const profileRow = profile as Profile | null

  const { data: existingProgram } = await admin
    .from('programs')
    .select('id, type, pdf_url, pdf_generated_at, validated_by_coach_at, delivered_at, coach_adjustments')
    .eq('intake_id', intakeRow.id)
    .maybeSingle()
  const programRow = existingProgram as Program | null

  const fullName = [profileRow?.first_name, profileRow?.last_name].filter(Boolean).join(' ')

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/programs"
        className="inline-flex items-center gap-2 text-sm text-[#1a2e23]/60 hover:text-[#1a2e23] mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à la liste
      </Link>

      <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#1a2e23] mb-2">
        Intake {fullName || profileRow?.email}
      </h1>
      <p className="text-sm text-[#1a2e23]/60 mb-8">
        {profileRow?.email} · Offre :{' '}
        {intakeRow.source === 'monthly_89' ? '89€/mois' : '49€ one-shot'} · ID : <code className="text-xs">{intakeRow.id.slice(0, 8)}</code>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* ─── Données client ─── */}
        <div className="bg-white border border-[#1a2e23]/10 rounded-2xl p-5 space-y-2 text-sm">
          <h2 className="font-display font-bold uppercase text-[#1a2e23] mb-3">Profil</h2>
          <Field label="Âge" value={intakeRow.age} />
          <Field label="Sexe" value={intakeRow.sexe} />
          <Field label="Taille" value={intakeRow.taille_cm ? `${intakeRow.taille_cm} cm` : null} />
          <Field label="Poids" value={intakeRow.poids_kg ? `${intakeRow.poids_kg} kg` : null} />
        </div>

        <div className="bg-white border border-[#1a2e23]/10 rounded-2xl p-5 space-y-2 text-sm">
          <h2 className="font-display font-bold uppercase text-[#1a2e23] mb-3">Objectif</h2>
          <Field label="Objectif" value={intakeRow.objectif} />
          <Field label="Type" value={intakeRow.type_programme} />
          <Field label="Niveau" value={intakeRow.niveau} />
          <Field label="Dispo / sem" value={intakeRow.dispo_hebdo ? `${intakeRow.dispo_hebdo} séances` : null} />
        </div>
      </div>

      {/* ─── Notes libres (toutes les réponses détaillées) ─── */}
      {intakeRow.notes_libres && (
        <div className="bg-white border border-[#1a2e23]/10 rounded-2xl p-5 mb-6">
          <h2 className="font-display font-bold uppercase text-[#1a2e23] mb-3 text-sm">
            Réponses détaillées
          </h2>
          <pre className="text-xs whitespace-pre-wrap text-[#1a2e23]/80 font-mono leading-relaxed">
            {intakeRow.notes_libres}
          </pre>
        </div>
      )}

      {/* ─── Contraintes alimentaires ─── */}
      {Array.isArray(intakeRow.contraintes_alimentaires) &&
        intakeRow.contraintes_alimentaires.length > 0 && (
          <div className="bg-white border border-[#1a2e23]/10 rounded-2xl p-5 mb-6">
            <h2 className="font-display font-bold uppercase text-[#1a2e23] mb-3 text-sm">
              Contraintes alimentaires
            </h2>
            <div className="flex flex-wrap gap-2">
              {(intakeRow.contraintes_alimentaires as string[]).map((c) => (
                <span key={c} className="px-3 py-1 rounded-full bg-[#1a2e23]/10 text-xs">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

      {/* ─── Blessures (sensible) ─── */}
      {Array.isArray(intakeRow.blessures_antecedents) &&
        intakeRow.blessures_antecedents.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
            <h2 className="font-display font-bold uppercase text-amber-900 mb-3 text-sm">
              ⚠️ Blessures / antécédents (donnée santé)
            </h2>
            <pre className="text-xs whitespace-pre-wrap text-amber-900/90">
              {JSON.stringify(intakeRow.blessures_antecedents, null, 2)}
            </pre>
          </div>
        )}

      {/* ─── Programme existant ou upload ─── */}
      <div className="bg-white border-2 border-[#1a2e23]/20 rounded-2xl p-6">
        <h2 className="font-display text-lg font-black uppercase text-[#1a2e23] mb-4">
          {programRow?.delivered_at ? '✅ Programme délivré' : 'Upload du programme PDF'}
        </h2>

        {programRow?.delivered_at ? (
          <div className="space-y-2 text-sm">
            <p>📥 PDF disponible : <a href={programRow.pdf_url ?? '#'} className="underline text-[#1a2e23]" target="_blank" rel="noopener noreferrer">{programRow.pdf_url}</a></p>
            <p className="text-[#1a2e23]/60">Délivré le {new Date(programRow.delivered_at).toLocaleString('fr-FR')}</p>
            {programRow.coach_adjustments && (
              <div className="mt-4 p-3 bg-[#1a2e23]/5 rounded-xl">
                <p className="text-xs font-bold uppercase mb-1">Tes notes coach :</p>
                <p className="text-xs">{programRow.coach_adjustments}</p>
              </div>
            )}
          </div>
        ) : (
          <ProgramUploadForm
            intakeId={intakeRow.id}
            userId={intakeRow.user_id}
            typeProgramme={intakeRow.type_programme as 'sport' | 'nutrition' | 'complet'}
            existingProgramId={programRow?.id ?? null}
          />
        )}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[#1a2e23]/60 font-medium">{label}</span>
      <span className="text-[#1a2e23] font-bold text-right">{value === null || value === '' || value === undefined ? '—' : String(value)}</span>
    </div>
  )
}
