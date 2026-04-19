'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCustomer } from '@/context/CustomerContext'
import { useCoachingAuth } from '@/lib/coaching/auth/CoachingAuthProvider'
import toast from 'react-hot-toast'

export function ConsentForm() {
  const router = useRouter()
  const { isLoggedIn, isLoading: customerLoading } = useCustomer()
  const { hasConsented, refresh } = useCoachingAuth()
  const [healthAck, setHealthAck] = useState(false)
  const [dataAck, setDataAck] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ─── Chargement initial ───
  if (customerLoading) {
    return <p className="text-sm text-[#1a2e23]/60">Chargement…</p>
  }

  // ─── Pas connecté ───
  if (!isLoggedIn) {
    return (
      <div className="p-4 rounded-xl bg-[#1a2e23]/5">
        <p className="text-sm text-[#1a2e23]/80 mb-3">
          Vous devez être connecté pour donner votre consentement.
        </p>
        <button
          onClick={() => router.push('/login?redirect=/coaching/consentement')}
          className="inline-flex items-center px-5 py-2 rounded-full bg-[#1a2e23] text-white text-sm font-medium hover:bg-[#1a2e23]/90"
        >
          Se connecter
        </button>
      </div>
    )
  }

  // ─── Déjà consenti ───
  if (hasConsented) {
    return (
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
        <p className="text-sm text-emerald-900 mb-3">
          ✅ Votre consentement est déjà enregistré. Vous pouvez accéder au formulaire d&apos;intake.
        </p>
        <button
          onClick={() => router.push('/coaching/intake')}
          className="inline-flex items-center px-5 py-2 rounded-full bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800"
        >
          Continuer vers l&apos;intake
        </button>
      </div>
    )
  }

  // ─── Soumission ───
  async function handleSubmit() {
    if (!healthAck || !dataAck) {
      toast.error('Vous devez cocher les deux cases pour continuer.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/coaching/consent', {
        method: 'POST',
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? 'Erreur inconnue')
      }
      // Refresh la session pour récupérer le nouvel état hasConsented
      await refresh()
      toast.success('Consentement enregistré')
      router.push('/coaching/intake')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur'
      toast.error(`Échec : ${msg}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={healthAck}
          onChange={(e) => setHealthAck(e.target.checked)}
          className="mt-1 h-5 w-5 rounded border-[#1a2e23]/30 text-[#1a2e23] focus:ring-[#1a2e23]"
        />
        <span className="text-sm text-[#1a2e23]/90 leading-relaxed">
          Je reconnais avoir lu l&apos;avertissement santé ci-dessus. Je m&apos;engage à consulter
          mon médecin avant toute nouvelle activité physique ou changement alimentaire significatif.
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={dataAck}
          onChange={(e) => setDataAck(e.target.checked)}
          className="mt-1 h-5 w-5 rounded border-[#1a2e23]/30 text-[#1a2e23] focus:ring-[#1a2e23]"
        />
        <span className="text-sm text-[#1a2e23]/90 leading-relaxed">
          J&apos;autorise Body Start à traiter mes données de santé (RGPD art. 9) pour la génération
          et le suivi de mon programme personnalisé. Je peux retirer ce consentement à tout moment
          via mon espace client.
        </span>
      </label>

      <div className="pt-4">
        <button
          onClick={handleSubmit}
          disabled={!healthAck || !dataAck || submitting}
          className="inline-flex items-center px-6 py-3 rounded-full bg-[#1a2e23] text-white text-sm font-medium hover:bg-[#1a2e23]/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? 'Enregistrement…' : 'Je consens et je continue'}
        </button>
      </div>
    </div>
  )
}
