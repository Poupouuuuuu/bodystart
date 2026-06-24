'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Plus, ShieldCheck, Power, Wallet, TrendingUp, Search, ChevronDown, ChevronUp } from 'lucide-react'
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
interface CustomerHit {
  id: string
  name: string
  email: string
}
interface CommissionRow {
  orderId: string
  orderName: string | null
  subtotalCents: number
  commissionCents: number
  isNewCustomer: boolean
  status: string
  createdAt: string
}

const euros = (cents: number) =>
  (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €'
const dateFr = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function messageFor(json: { error?: string }): string {
  switch (json.error) {
    case 'email_exists':
      return 'Un ambassadeur existe déjà avec cet email.'
    case 'code_exists':
      return 'Ce code est déjà utilisé. Choisis-en un autre.'
    case 'invalid_code':
      return 'Code invalide (lettres et chiffres).'
    case 'invalid_body':
      return 'Champs invalides (nom + email valide requis).'
    case 'shopify_failed':
      return 'Échec de création du code Shopify. Réessaie.'
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

  // Form
  const [trackingMode, setTrackingMode] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('') // email du compte client — TOUJOURS présent (repli garanti)
  const [phone, setPhone] = useState('') // tél optionnel — anti auto-commission (match email OU tél)
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Recherche client = enhancement (si l'Admin API Customer est dispo)
  const [custQuery, setCustQuery] = useState('')
  const [custResults, setCustResults] = useState<CustomerHit[]>([])
  const [custSearching, setCustSearching] = useState(false)
  const [custError, setCustError] = useState<string | null>(null)
  const [picked, setPicked] = useState<string | null>(null) // email du dernier client choisi (anti re-recherche)
  // null = sonde en cours ; true = recherche dispo ; false = repli email manuel.
  const [searchAvailable, setSearchAvailable] = useState<boolean | null>(null)

  // Toggle / détail
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [commissions, setCommissions] = useState<Record<string, CommissionRow[] | 'loading' | 'error'>>({})

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      const r = await fetch('/api/loyalty/admin/ambassadors', { cache: 'no-store', credentials: 'include' })
      if (!r.ok) { setLoadError('Accès refusé ou erreur de chargement.'); setList([]); return }
      const j = await r.json()
      setList(j.ambassadors ?? [])
    } catch { setLoadError('Erreur de chargement.'); setList([]) }
  }, [])
  useEffect(() => { load() }, [load])

  // Sonde la dispo de la recherche clients. Forfait Basic → l'Admin API refuse
  // l'objet Customer (route 502) → searchAvailable=false → on n'affiche QUE le
  // champ email manuel. (Le champ email est de toute façon TOUJOURS présent.)
  useEffect(() => {
    let cancelled = false
    fetch('/api/loyalty/admin/customers?q=zz', { cache: 'no-store', credentials: 'include' })
      .then((r) => { if (!cancelled) setSearchAvailable(r.ok) })
      .catch(() => { if (!cancelled) setSearchAvailable(false) })
    return () => { cancelled = true }
  }, [])

  // Recherche debouncée (seulement si dispo + mode normal)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (trackingMode || searchAvailable !== true) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = custQuery.trim()
    if (q.length < 2 || picked === custQuery) { setCustResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setCustSearching(true); setCustError(null)
      try {
        const r = await fetch(`/api/loyalty/admin/customers?q=${encodeURIComponent(q)}`, { cache: 'no-store', credentials: 'include' })
        const j = await r.json()
        if (!r.ok) { setCustError('Recherche indisponible — saisis l’email manuellement ci-dessous.'); setCustResults([]); return }
        setCustResults(j.customers ?? [])
      } catch { setCustError('Erreur de recherche — saisis l’email manuellement.'); setCustResults([]) }
      finally { setCustSearching(false) }
    }, 320)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [custQuery, trackingMode, searchAvailable, picked])

  function pickCustomer(c: CustomerHit) {
    setEmail(c.email)
    setName(c.name)
    setCustQuery(c.name)
    setPicked(c.name)
    setCustResults([])
    setFormError(null)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    let normalEmail: string | undefined
    if (trackingMode) {
      if (!code.trim()) { setFormError('Indique le code existant à suivre.'); return }
    } else {
      normalEmail = email.trim().toLowerCase()
      if (!EMAIL_RE.test(normalEmail)) { setFormError('Saisis un email valide (celui du compte client).'); return }
    }
    setSubmitting(true)
    try {
      const payload = trackingMode
        ? { name: name.trim() || code.trim(), code: code.trim(), trackingOnly: true }
        : { name: name.trim(), email: normalEmail, phone: phone.trim() || undefined, code: code.trim() || undefined }
      const r = await fetch('/api/loyalty/admin/ambassadors', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(payload),
      })
      const j = await r.json()
      if (!r.ok || !j.ok) { setFormError(messageFor(j)); return }
      toast.success(trackingMode ? 'Code de suivi ajouté !' : 'Ambassadeur créé !')
      setName(''); setEmail(''); setPhone(''); setCode(''); setCustQuery(''); setPicked(null); setCustResults([])
      setList((prev) => (prev ? [j.ambassador, ...prev] : [j.ambassador]))
    } catch { setFormError('Une erreur est survenue. Réessaie.') }
    finally { setSubmitting(false) }
  }

  async function toggle(a: AdminAmb) {
    setTogglingId(a.id)
    try {
      const r = await fetch(`/api/loyalty/admin/ambassadors/${a.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ active: !a.active }),
      })
      const j = await r.json()
      if (!r.ok || !j.ok) { toast.error('Action impossible.'); return }
      setList((prev) => prev?.map((x) => (x.id === a.id ? { ...x, active: j.active } : x)) ?? null)
      toast.success(j.active ? 'Réactivé' : 'Désactivé')
    } catch { toast.error('Action impossible.') }
    finally { setTogglingId(null) }
  }

  async function toggleExpand(a: AdminAmb) {
    if (expandedId === a.id) { setExpandedId(null); return }
    setExpandedId(a.id)
    if (!commissions[a.id]) {
      setCommissions((p) => ({ ...p, [a.id]: 'loading' }))
      try {
        const r = await fetch(`/api/loyalty/admin/ambassadors/${a.id}/commissions`, { cache: 'no-store', credentials: 'include' })
        const j = await r.json()
        setCommissions((p) => ({ ...p, [a.id]: r.ok ? (j.commissions ?? []) : 'error' }))
      } catch { setCommissions((p) => ({ ...p, [a.id]: 'error' })) }
    }
  }

  const inputCls = 'w-full bg-white border border-spruce/15 rounded-xl px-4 py-3 text-spruce font-medium focus:outline-none focus:ring-2 focus:ring-fresh/40'

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-6 h-6 text-fresh" />
          <h2 className="font-display text-[28px] font-extrabold tracking-tight text-spruce leading-[1.1]">Gérer les ambassadeurs</h2>
        </div>
        <p className="text-ink-mute font-medium text-sm">
          Crée un ambassadeur (code −10 % généré, cagnotte 10 %), ou ajoute un code de suivi à 0 %.
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={submit} className="bg-white border border-spruce/10 rounded-2xl p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display font-bold text-spruce">{trackingMode ? 'Ajouter un code de suivi (0 %)' : 'Ajouter un ambassadeur'}</p>
          <label className="inline-flex items-center gap-2 text-[12px] font-medium text-ink-mute cursor-pointer">
            <input type="checkbox" checked={trackingMode} onChange={(e) => { setTrackingMode(e.target.checked); setFormError(null) }} className="accent-fresh" />
            Entrée de suivi (0 %, code existant)
          </label>
        </div>

        {trackingMode ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="t-name" className="block text-[12px] text-ink-mute font-medium mb-1">Libellé</label>
              <input id="t-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Code perso BODYSTART15" className={inputCls} />
            </div>
            <div>
              <label htmlFor="t-code" className="block text-[12px] text-ink-mute font-medium mb-1">Code existant (déjà dans Shopify)</label>
              <input id="t-code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={40} placeholder="BODYSTART15"
                className="w-full bg-white border border-spruce/15 rounded-xl px-4 py-3 font-mono font-semibold tracking-wider uppercase text-spruce focus:outline-none focus:ring-2 focus:ring-fresh/40" />
            </div>
          </div>
        ) : (
          <>
            {/* Recherche client : enhancement, affichée seulement si l'API le permet */}
            {searchAvailable === true && (
              <div className="relative">
                <label htmlFor="cust-q" className="block text-[12px] text-ink-mute font-medium mb-1">Rechercher un compte client (remplit l’email)</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-ink-mute absolute left-3 top-1/2 -translate-y-1/2" />
                  <input id="cust-q" value={custQuery} autoComplete="off"
                    onChange={(e) => { setCustQuery(e.target.value); setPicked(null) }}
                    placeholder="Tape un nom ou un email…"
                    className="w-full bg-white border border-spruce/15 rounded-xl pl-9 pr-4 py-3 text-spruce font-medium focus:outline-none focus:ring-2 focus:ring-fresh/40" />
                  {custSearching && <Loader2 className="w-4 h-4 text-fresh animate-spin absolute right-3 top-1/2 -translate-y-1/2" />}
                </div>
                {custError && <p className="text-terracotta text-[12px] font-medium mt-1">{custError}</p>}
                {custResults.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-spruce/15 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                    {custResults.map((c) => (
                      <li key={c.id}>
                        <button type="button" onClick={() => pickCustomer(c)} className="w-full text-left px-4 py-2.5 hover:bg-sage/60 transition-colors">
                          <span className="block text-[14px] font-semibold text-ink">{c.name}</span>
                          <span className="block text-[12px] text-ink-mute">{c.email}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Nom + EMAIL : TOUJOURS présents → la création marche en Basic. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="n-name" className="block text-[12px] text-ink-mute font-medium mb-1">Nom</label>
                <input id="n-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Julie Coaching" className={inputCls} />
              </div>
              <div>
                <label htmlFor="n-email" className="block text-[12px] text-ink-mute font-medium mb-1">Email du compte client</label>
                <input id="n-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={180} placeholder="julie@email.com" className={inputCls} />
              </div>
            </div>
            {searchAvailable === false && (
              <p className="text-[12px] text-ink-mute">
                Saisis l’email <span className="font-semibold text-spruce">exact</span> du compte client (copie-le depuis Shopify pour éviter toute faute). La recherche automatique de comptes nécessite un forfait Shopify supérieur.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="n-phone" className="block text-[12px] text-ink-mute font-medium mb-1">Téléphone (optionnel — anti-triche)</label>
                <input id="n-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} placeholder="06 12 34 56 78" className={inputCls} />
              </div>
              <div>
                <label htmlFor="n-code" className="block text-[12px] text-ink-mute font-medium mb-1">Code (optionnel — sinon prénom)</label>
                <input id="n-code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={40} placeholder="COACHJULIE"
                  className="w-full bg-white border border-spruce/15 rounded-xl px-4 py-3 font-mono font-semibold tracking-wider uppercase text-spruce focus:outline-none focus:ring-2 focus:ring-fresh/40" />
              </div>
            </div>
            <p className="text-[12px] text-ink-mute">
              Le téléphone bloque le contournement « 2ᵉ compte, autre email » : une commande passée avec son propre code est refusée si l’email <span className="font-semibold text-spruce">ou</span> le téléphone correspond.
            </p>
          </>
        )}

        {formError && <p className="text-terracotta text-[13px] font-semibold">{formError}</p>}
        <button type="submit" disabled={submitting}
          className="inline-flex items-center gap-2 h-12 px-5 text-[14px] font-semibold rounded-full bg-fresh text-white hover:bg-fresh-deep disabled:opacity-60 transition-colors">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {submitting ? 'Enregistrement…' : trackingMode ? 'Ajouter le code de suivi' : 'Créer l’ambassadeur'}
        </button>
      </form>

      {/* Liste */}
      <div className="bg-white rounded-2xl border border-spruce/10 p-6 md:p-8">
        <h3 className="font-display font-bold text-spruce mb-5 text-lg">Ambassadeurs &amp; codes suivis</h3>
        {list === null ? (
          <div className="py-10 text-center"><Loader2 className="w-6 h-6 text-fresh animate-spin mx-auto" /></div>
        ) : loadError ? (
          <p className="text-terracotta text-sm font-semibold">{loadError}</p>
        ) : list.length === 0 ? (
          <p className="text-ink-mute text-sm font-medium">Aucune entrée pour l’instant.</p>
        ) : (
          <ul className="divide-y divide-spruce/8">
            {list.map((a) => {
              const tracking = a.ratePct === 0
              const detail = commissions[a.id]
              return (
                <li key={a.id} className="py-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex-1 min-w-[180px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-display font-bold text-ink text-[15px]">{a.name}</p>
                        {tracking ? (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-spruce bg-spruce/10 px-2 py-0.5 rounded-full">Suivi · 0 %</span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-fresh bg-fresh/10 px-2 py-0.5 rounded-full">{a.ratePct} %</span>
                        )}
                        {!a.active && <span className="text-[10px] font-bold uppercase tracking-wide text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-full">inactif</span>}
                      </div>
                      {!tracking && <p className="text-[12px] text-ink-mute">{a.email}</p>}
                      <code className="text-[12px] font-mono font-bold text-spruce">{a.code}</code>
                    </div>
                    <div className="flex items-center gap-4 text-[12px] text-ink-mute">
                      {!tracking && (
                        <span className="inline-flex items-center gap-1" title="Cagnotte"><Wallet className="w-3.5 h-3.5" /> {euros(a.balanceCents)}</span>
                      )}
                      <span className="inline-flex items-center gap-1" title="Ventes / CA"><TrendingUp className="w-3.5 h-3.5" /> {a.ordersCount} · {euros(a.revenueCents)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleExpand(a)} className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-[12px] font-semibold text-spruce border border-spruce/20 hover:bg-spruce/5 transition-colors">
                        {expandedId === a.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} Détail
                      </button>
                      <button onClick={() => toggle(a)} disabled={togglingId === a.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-semibold transition-colors disabled:opacity-50 ${a.active ? 'text-terracotta border border-terracotta/30 hover:bg-terracotta/5' : 'text-fresh border border-fresh/30 hover:bg-fresh/5'}`}>
                        {togglingId === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                        {a.active ? 'Désactiver' : 'Réactiver'}
                      </button>
                    </div>
                  </div>

                  {expandedId === a.id && (
                    <div className="mt-3 bg-sage/40 rounded-xl p-4">
                      {detail === 'loading' || detail === undefined ? (
                        <div className="py-4 text-center"><Loader2 className="w-5 h-5 text-fresh animate-spin mx-auto" /></div>
                      ) : detail === 'error' ? (
                        <p className="text-terracotta text-[13px] font-semibold">Erreur de chargement du détail.</p>
                      ) : detail.length === 0 ? (
                        <p className="text-ink-mute text-[13px] font-medium">Aucune commande pour l’instant.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-[12px]">
                            <thead>
                              <tr className="text-ink-mute text-left">
                                <th className="font-semibold py-1 pr-3">Commande</th>
                                <th className="font-semibold py-1 pr-3">Date</th>
                                <th className="font-semibold py-1 pr-3 text-right">CA attribué</th>
                                <th className="font-semibold py-1 pr-3 text-right">Commission</th>
                                <th className="font-semibold py-1 pr-3">Client</th>
                                <th className="font-semibold py-1">Statut</th>
                              </tr>
                            </thead>
                            <tbody className="text-ink">
                              {detail.map((c) => (
                                <tr key={c.orderId} className="border-t border-spruce/8">
                                  <td className="py-1.5 pr-3 font-mono font-semibold">{c.orderName ?? `#${c.orderId.slice(-6)}`}</td>
                                  <td className="py-1.5 pr-3 text-ink-mute">{dateFr(c.createdAt)}</td>
                                  <td className="py-1.5 pr-3 text-right">{euros(c.subtotalCents)}</td>
                                  <td className="py-1.5 pr-3 text-right font-semibold">{euros(c.commissionCents)}</td>
                                  <td className="py-1.5 pr-3">{c.isNewCustomer ? 'Nouveau' : 'Existant'}</td>
                                  <td className="py-1.5">{c.status === 'revoked' ? <span className="text-terracotta">remboursé</span> : <span className="text-fresh">crédité</span>}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
