'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, ShieldCheck, Power, Wallet, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

interface AdminAmb {
  id: string
  name: string
  email: string
  code: string
  ratePct: number
  balanceCents: number
  active: boolean
  ordersCount: number
  revenueCents: number
}

const euros = (cents: number) =>
  (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €'

function messageFor(json: { error?: string }): string {
  switch (json.error) {
    case 'email_exists':
      return 'Un ambassadeur existe déjà avec cet email.'
    case 'code_exists':
      return 'Ce code est déjà utilisé. Choisis-en un autre.'
    case 'invalid_code':
      return 'Code invalide (utilise lettres et chiffres).'
    case 'invalid_body':
      return 'Champs invalides (nom + email requis, email valide).'
    case 'shopify_failed':
      return 'Échec de création du code de réduction Shopify. Réessaie.'
    case 'conflict':
      return 'Email ou code déjà pris.'
    case 'forbidden':
      return 'Accès refusé.'
    default:
      return 'Une erreur est survenue. Réessaie.'
  }
}

export function AdminAmbassadorsPanel() {
  const [list, setList] = useState<AdminAmb[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      const r = await fetch('/api/loyalty/admin/ambassadors', { cache: 'no-store', credentials: 'include' })
      if (!r.ok) {
        setLoadError('Accès refusé ou erreur de chargement.')
        setList([])
        return
      }
      const j = await r.json()
      setList(j.ambassadors ?? [])
    } catch {
      setLoadError('Erreur de chargement.')
      setList([])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      const r = await fetch('/api/loyalty/admin/ambassadors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), email: email.trim(), code: code.trim() || undefined }),
      })
      const j = await r.json()
      if (!r.ok || !j.ok) {
        setFormError(messageFor(j))
        return
      }
      toast.success('Ambassadeur créé !')
      setName('')
      setEmail('')
      setCode('')
      setList((prev) => (prev ? [j.ambassador, ...prev] : [j.ambassador]))
    } catch {
      setFormError('Une erreur est survenue. Réessaie.')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggle(a: AdminAmb) {
    setTogglingId(a.id)
    try {
      const r = await fetch(`/api/loyalty/admin/ambassadors/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !a.active }),
      })
      const j = await r.json()
      if (!r.ok || !j.ok) {
        toast.error('Action impossible.')
        return
      }
      setList((prev) => prev?.map((x) => (x.id === a.id ? { ...x, active: j.active } : x)) ?? null)
      toast.success(j.active ? 'Ambassadeur réactivé' : 'Ambassadeur désactivé')
    } catch {
      toast.error('Action impossible.')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-6 h-6 text-fresh" />
          <h2 className="font-display text-[28px] font-extrabold tracking-tight text-spruce leading-[1.1]">
            Gérer les ambassadeurs
          </h2>
        </div>
        <p className="text-ink-mute font-medium text-sm">
          Crée un ambassadeur : code de réduction −10 % généré automatiquement côté Shopify, et cagnotte 10 % activée.
        </p>
      </div>

      {/* Formulaire d'ajout */}
      <form onSubmit={submit} className="bg-white border border-spruce/10 rounded-2xl p-6 md:p-8 space-y-4">
        <p className="font-display font-bold text-spruce">Ajouter un ambassadeur</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="amb-name" className="block text-[12px] text-ink-mute font-medium mb-1">Nom</label>
            <input
              id="amb-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
              placeholder="Julie Coaching"
              className="w-full bg-white border border-spruce/15 rounded-xl px-4 py-3 text-spruce font-medium focus:outline-none focus:ring-2 focus:ring-fresh/40"
            />
          </div>
          <div>
            <label htmlFor="amb-email" className="block text-[12px] text-ink-mute font-medium mb-1">Email</label>
            <input
              id="amb-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={180}
              placeholder="julie@email.com"
              className="w-full bg-white border border-spruce/15 rounded-xl px-4 py-3 text-spruce font-medium focus:outline-none focus:ring-2 focus:ring-fresh/40"
            />
          </div>
        </div>
        <div>
          <label htmlFor="amb-code" className="block text-[12px] text-ink-mute font-medium mb-1">
            Code promo (optionnel — sinon généré depuis le prénom)
          </label>
          <input
            id="amb-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={40}
            placeholder="COACHJULIE"
            className="w-full bg-white border border-spruce/15 rounded-xl px-4 py-3 font-mono font-semibold tracking-wider uppercase text-spruce focus:outline-none focus:ring-2 focus:ring-fresh/40"
          />
        </div>
        {formError && <p className="text-terracotta text-[13px] font-semibold">{formError}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 h-12 px-5 text-[14px] font-semibold rounded-full bg-fresh text-white hover:bg-fresh-deep disabled:opacity-60 transition-colors"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {submitting ? 'Création…' : 'Créer l’ambassadeur'}
        </button>
      </form>

      {/* Liste */}
      <div className="bg-white rounded-2xl border border-spruce/10 p-6 md:p-8">
        <h3 className="font-display font-bold text-spruce mb-5 text-lg">Ambassadeurs</h3>
        {list === null ? (
          <div className="py-10 text-center">
            <Loader2 className="w-6 h-6 text-fresh animate-spin mx-auto" />
          </div>
        ) : loadError ? (
          <p className="text-terracotta text-sm font-semibold">{loadError}</p>
        ) : list.length === 0 ? (
          <p className="text-ink-mute text-sm font-medium">Aucun ambassadeur pour l’instant.</p>
        ) : (
          <ul className="divide-y divide-spruce/8">
            {list.map((a) => (
              <li key={a.id} className="py-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex-1 min-w-[180px]">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-bold text-ink text-[15px]">{a.name}</p>
                    {!a.active && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-full">
                        inactif
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-ink-mute">{a.email}</p>
                  <code className="text-[12px] font-mono font-bold text-spruce">{a.code}</code>
                  <span className="text-[12px] text-ink-mute"> · {a.ratePct}%</span>
                </div>
                <div className="flex items-center gap-4 text-[12px] text-ink-mute">
                  <span className="inline-flex items-center gap-1" title="Cagnotte">
                    <Wallet className="w-3.5 h-3.5" /> {euros(a.balanceCents)}
                  </span>
                  <span className="inline-flex items-center gap-1" title="Ventes / CA">
                    <TrendingUp className="w-3.5 h-3.5" /> {a.ordersCount} · {euros(a.revenueCents)}
                  </span>
                </div>
                <button
                  onClick={() => toggle(a)}
                  disabled={togglingId === a.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-semibold transition-colors disabled:opacity-50 ${
                    a.active
                      ? 'text-terracotta border border-terracotta/30 hover:bg-terracotta/5'
                      : 'text-fresh border border-fresh/30 hover:bg-fresh/5'
                  }`}
                >
                  {togglingId === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                  {a.active ? 'Désactiver' : 'Réactiver'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
