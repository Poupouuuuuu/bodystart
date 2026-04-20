'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  intakeId: string
  userId: string
  typeProgramme: 'sport' | 'nutrition' | 'complet'
  existingProgramId: string | null
}

export function ProgramUploadForm({ intakeId, userId, typeProgramme, existingProgramId }: Props) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [coachNotes, setCoachNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!file) {
      toast.error('Sélectionne un PDF avant de valider.')
      return
    }
    if (file.type !== 'application/pdf') {
      toast.error('Format invalide : seuls les PDF sont acceptés.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('PDF trop lourd (max 10 MB).')
      return
    }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('intakeId', intakeId)
      fd.append('userId', userId)
      fd.append('typeProgramme', typeProgramme)
      fd.append('coachNotes', coachNotes)
      if (existingProgramId) fd.append('existingProgramId', existingProgramId)

      const res = await fetch('/api/coaching/admin/upload-program', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)

      toast.success('Programme livré au client ✅')
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur'
      toast.error(`Échec : ${msg}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-bold text-[#1a2e23] mb-2">
          Fichier PDF du programme <span className="text-rose-600">*</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-[#1a2e23] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#1a2e23]/10 file:text-[#1a2e23] hover:file:bg-[#1a2e23]/20 cursor-pointer"
          />
        </div>
        {file && (
          <p className="text-xs text-[#1a2e23]/60 mt-2">
            ✓ {file.name} · {(file.size / 1024).toFixed(0)} KB
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-bold text-[#1a2e23] mb-2">
          Notes coach (interne, ne s&apos;affiche pas au client)
        </label>
        <textarea
          value={coachNotes}
          onChange={(e) => setCoachNotes(e.target.value)}
          rows={3}
          maxLength={2000}
          className="w-full px-4 py-2.5 border border-[#1a2e23]/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e23]/30"
          placeholder="Ex: utilisation de Claude Sonnet 4.5, ajustement perso sur la récup, etc."
        />
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
        ⚠️ <strong>Action irréversible :</strong> en cliquant sur &laquo; Valider et envoyer &raquo;, tu :
        <ul className="mt-2 ml-4 list-disc">
          <li>Crées le programme dans la base</li>
          <li>Marques l&apos;intake comme &laquo; delivered &raquo;</li>
          <li>Envoies un email au client avec le lien vers son espace</li>
        </ul>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || !file}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-emerald-700 text-white text-sm font-bold uppercase tracking-wider hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Upload + envoi…
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" /> Valider et envoyer au client
          </>
        )}
      </button>
    </div>
  )
}
