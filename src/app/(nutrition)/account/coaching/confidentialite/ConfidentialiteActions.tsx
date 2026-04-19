'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export function ConfidentialiteActions({ action }: { action: 'export' | 'delete' }) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [reason, setReason] = useState('')

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch('/api/coaching/export', { credentials: 'include' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `HTTP ${res.status}`)
      }
      // Téléchargement
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download =
        res.headers
          .get('content-disposition')
          ?.match(/filename="(.+?)"/)?.[1] ?? 'bodystart-coaching-export.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Export téléchargé')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur'
      toast.error(`Échec export : ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteRequest() {
    setLoading(true)
    try {
      const res = await fetch('/api/coaching/delete-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`)
      toast.success(j.message ?? 'Demande envoyée')
      setShowConfirm(false)
      setReason('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur'
      toast.error(`Échec : ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  if (action === 'export') {
    return (
      <button
        onClick={handleExport}
        disabled={loading}
        className="inline-flex items-center px-5 py-2 rounded-full bg-[#1a2e23] text-white text-sm font-medium hover:bg-[#1a2e23]/90 disabled:opacity-50"
      >
        {loading ? 'Export…' : 'Télécharger mes données (JSON)'}
      </button>
    )
  }

  // action === 'delete'
  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="inline-flex items-center px-5 py-2 rounded-full bg-rose-700 text-white text-sm font-medium hover:bg-rose-800 disabled:opacity-50"
      >
        Demander la suppression
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motif (facultatif — nous aide à améliorer le service)"
        maxLength={500}
        rows={3}
        className="w-full p-3 border border-[#1a2e23]/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-700/30"
      />
      <div className="flex gap-3">
        <button
          onClick={handleDeleteRequest}
          disabled={loading}
          className="inline-flex items-center px-5 py-2 rounded-full bg-rose-700 text-white text-sm font-medium hover:bg-rose-800 disabled:opacity-50"
        >
          {loading ? 'Envoi…' : 'Confirmer la demande'}
        </button>
        <button
          onClick={() => {
            setShowConfirm(false)
            setReason('')
          }}
          disabled={loading}
          className="inline-flex items-center px-5 py-2 rounded-full bg-[#1a2e23]/10 text-[#1a2e23] text-sm font-medium hover:bg-[#1a2e23]/20"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
