'use client'

import Link from 'next/link'
import { useId, useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const CHAMP =
  'w-full rounded-xl border border-spruce/15 bg-white px-4 py-3 text-[16px] text-ink placeholder:text-ink-mute/60 transition-colors focus:border-fresh focus:outline-none focus:ring-1 focus:ring-fresh/30 md:text-[14px]'

interface Props {
  /** Libellé de l'objectif (champ « objectif » de /api/contact). */
  objectif: string
  /**
   * Contexte joint au message : objectif, budget, sélection proposée. JAMAIS
   * les contraintes alimentaires (données de santé possibles).
   */
  contexte: string
}

/**
 * « Être rappelé », facultatif : envoie à /api/contact (name, email, phone,
 * objectif, message). Prénom et téléphone obligatoires, e-mail facultatif
 * (08/10/2026) : sans e-mail, pas de confirmation, la boutique rappelle.
 */
export default function RappelForm({ objectif, contexte }: Props) {
  const id = useId()
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [etat, setEtat] = useState<'repos' | 'envoi' | 'envoye' | 'erreur'>('repos')

  async function envoyer(e: React.FormEvent) {
    e.preventDefault()
    setEtat('envoi')
    const message = [contexte, form.message.trim() ? `Message du client :\n${form.message.trim()}` : '']
      .filter(Boolean)
      .join('\n\n')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          objectif,
          message,
        }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setEtat('envoye')
    } catch {
      setEtat('erreur')
    }
  }

  if (etat === 'envoye') {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-sage p-5" role="status">
        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-spruce" aria-hidden="true" />
        <p className="text-[15px] leading-[1.6] text-ink">
          C&apos;est noté, on te rappelle pour en parler. Tu peux aussi passer directement en boutique.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={envoyer} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-nom`} className="mb-1.5 block text-[13px] font-semibold text-ink">
            Ton prénom
          </label>
          <input
            id={`${id}-nom`}
            type="text"
            required
            autoComplete="given-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={CHAMP}
          />
        </div>
        <div>
          <label htmlFor={`${id}-tel`} className="mb-1.5 block text-[13px] font-semibold text-ink">
            Ton téléphone
          </label>
          <input
            id={`${id}-tel`}
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="06 00 00 00 00"
            className={CHAMP}
          />
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-email`} className="mb-1.5 block text-[13px] font-semibold text-ink">
          Ton e-mail (facultatif)
        </label>
        <input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className={CHAMP}
        />
      </div>
      <div>
        <label htmlFor={`${id}-message`} className="mb-1.5 block text-[13px] font-semibold text-ink">
          Un mot à ajouter (facultatif)
        </label>
        <textarea
          id={`${id}-message`}
          rows={3}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className={cn(CHAMP, 'resize-none')}
        />
      </div>

      {etat === 'erreur' && (
        <p role="alert" className="rounded-xl bg-terracotta/10 px-4 py-3 text-[14px] font-medium text-terracotta">
          L&apos;envoi n&apos;a pas marché. Réessaie, ou appelle-nous directement.
        </p>
      )}

      <button type="submit" disabled={etat === 'envoi'} className="btn-secondary press min-h-[44px] w-full">
        {etat === 'envoi' ? 'Envoi…' : 'Être rappelé'}
      </button>
      <p className="text-[12px] leading-[1.5] text-ink-mute">
        Tes coordonnées servent seulement à te recontacter pour ce conseil.{' '}
        <Link href="/confidentialite" className="py-3 font-semibold text-spruce underline underline-offset-2">
          Confidentialité
        </Link>
      </p>
    </form>
  )
}
