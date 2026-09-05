'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  User, Package, MapPin, LogOut, ChevronRight, ShoppingBag, Star,
  Gift, Plus, Pencil, Trash2, X, Loader2, Save, Wallet, BadgeCheck, ShieldCheck
} from 'lucide-react'
import { CagnottePanel } from '@/components/account/CagnottePanel'
import { ReferralPanel } from '@/components/account/ReferralPanel'
import { AmbassadorPanel } from '@/components/account/AmbassadorPanel'
import { AdminAmbassadorsPanel } from '@/components/account/AdminAmbassadorsPanel'
import { useAmbassador } from '@/hooks/useAmbassador'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import nextDynamic from 'next/dynamic'
// Import dynamique : PhoneField embarque libphonenumber-js (~116 Ko) — chargé
// seulement quand l'onglet profil le rend, hors bundle initial de /account.
const PhoneField = nextDynamic(() => import('@/components/ui/PhoneField'), {
  ssr: false,
  loading: () => (
    <div className="h-[50px] rounded-xl border border-spruce/20 bg-sage/40 animate-pulse" aria-hidden="true" />
  ),
})
import { useCustomer } from '@/context/CustomerContext'
import { updateCustomer, getStoredToken } from '@/lib/shopify/customer'
import type { AddressInput } from '@/lib/shopify/customer'
import { formatPrice, cn } from '@/lib/utils'
import { toast } from '@/lib/toast'

type Tab = 'overview' | 'orders' | 'order-detail' | 'addresses' | 'profile' | 'reviews' | 'referral' | 'cagnotte' | 'ambassador' | 'admin'

// Styles de statut (sémantiques, conservés) — sentence case géré côté rendu.
const STATUS_MAP: Record<string, { label: string; style: string }> = {
  PAID: { label: 'Payé', style: 'bg-green-50 text-green-700 border-green-200' },
  PENDING: { label: 'En attente', style: 'bg-amber-50 text-amber-700 border-amber-200' },
  REFUNDED: { label: 'Remboursé', style: 'bg-canvas text-ink-mute border-spruce/15' },
  FULFILLED: { label: 'Expédié', style: 'bg-blue-50 text-blue-700 border-blue-200' },
  UNFULFILLED: { label: 'Préparation', style: 'bg-amber-50 text-amber-700 border-amber-200' },
}
const getStatus = (s: string) => STATUS_MAP[s] ?? { label: s, style: 'bg-canvas text-ink-mute border-spruce/15' }
const STATUS_BADGE = 'text-[10px] font-semibold border px-2.5 py-1 rounded-full'

// ═══════════════════════════════════════════════════════════
// PANNEAU : Aperçu (dernières commandes)
// ═══════════════════════════════════════════════════════════
function OverviewPanel({ customer, onViewOrders, onViewOrderDetail }: {
  customer: NonNullable<ReturnType<typeof useCustomer>['customer']>
  onViewOrders: () => void
  onViewOrderDetail: (id: string) => void
}) {
  const recentOrders = customer.orders?.nodes?.slice(0, 3) ?? []

  return (
    <div className="rounded-2xl overflow-hidden border bg-white border-spruce/10">
      <div className="flex items-center justify-between px-8 py-6 border-b border-spruce/10">
        <h2 className="font-display font-extrabold tracking-tight text-xl flex items-center gap-2 text-spruce">
          <ShoppingBag className="w-5 h-5 text-spruce" />
          Dernières commandes
        </h2>
        {recentOrders.length > 0 && (
          <button onClick={onViewOrders} className="text-[12px] font-semibold text-ink-mute hover:text-spruce transition-colors">
            Voir tout →
          </button>
        )}
      </div>

      {recentOrders.length === 0 ? (
        <div className="py-20 text-center px-6">
          <div className="w-20 h-20 rounded-full bg-sage flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-8 h-8 text-spruce" />
          </div>
          <p className="font-display font-bold text-lg mb-2 text-spruce">Aucune commande</p>
          <p className="text-sm font-medium mb-8 text-ink-mute">Tu n&apos;as pas encore passé de commande.</p>
          <Link href="/products" className="inline-flex items-center gap-2 text-[14px] font-semibold px-7 py-3.5 rounded-full bg-fresh text-white hover:bg-fresh-deep transition-colors">
            Découvrir nos produits
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-spruce/10">
          {recentOrders.map((order) => {
            const financial = getStatus(order.financialStatus)
            const fulfillment = getStatus(order.fulfillmentStatus)
            return (
              <div key={order.id} className="p-6 md:p-8 hover:bg-canvas/60 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-display font-bold text-sm text-ink">
                      Commande #{order.orderNumber}
                    </p>
                    <p className="text-[12px] font-medium text-ink-mute mt-1">
                      {new Date(order.processedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <span className={`${STATUS_BADGE} ${financial.style}`}>{financial.label}</span>
                    <span className={`${STATUS_BADGE} ${fulfillment.style}`}>{fulfillment.label}</span>
                  </div>
                </div>
                <div className="flex gap-3 mb-6">
                  {order.lineItems.nodes.slice(0, 4).map((item, i) => (
                    <div key={i} className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border bg-canvas border-spruce/10">
                      {item.variant?.image ? (
                        <Image src={item.variant.image.url} alt={item.title} width={56} height={56} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink-mute text-xs font-bold">BS</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-display font-extrabold text-xl text-spruce">{formatPrice(order.currentTotalPrice)}</p>
                  <button onClick={() => onViewOrderDetail(order.id)} className="text-[13px] font-semibold px-5 py-2.5 rounded-full border border-spruce/20 text-spruce hover:bg-spruce/5 transition-all">
                    Détails →
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// PANNEAU : Toutes les commandes
// ═══════════════════════════════════════════════════════════
function OrdersPanel({ customer, onViewOrderDetail }: {
  customer: NonNullable<ReturnType<typeof useCustomer>['customer']>
  onViewOrderDetail: (id: string) => void
}) {
  const orders = customer.orders?.nodes ?? []

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-spruce/10 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-sage flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-8 h-8 text-spruce" />
        </div>
        <p className="font-display font-bold text-spruce text-lg mb-2">Aucune commande</p>
        <p className="text-ink-mute text-sm mb-8 font-medium">Tes commandes apparaîtront ici.</p>
        <Link href="/products" className="inline-flex items-center gap-2 px-7 py-3.5 bg-fresh text-white text-[14px] font-semibold rounded-full hover:bg-fresh-deep transition-colors">
          Découvrir nos produits
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const financial = getStatus(order.financialStatus)
        const fulfillment = getStatus(order.fulfillmentStatus)
        return (
          <div key={order.id} className="bg-white rounded-2xl border border-spruce/10 p-6 md:p-8 transition-all">
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div>
                <p className="font-display font-bold text-ink">Commande #{order.orderNumber}</p>
                <p className="text-[12px] font-medium text-ink-mute mt-1">
                  {new Date(order.processedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className={`${STATUS_BADGE} ${financial.style}`}>{financial.label}</span>
                <span className={`${STATUS_BADGE} ${fulfillment.style}`}>{fulfillment.label}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-5">
              {order.lineItems.nodes.slice(0, 5).map((item, i) => (
                <div key={i} className="w-14 h-14 rounded-xl overflow-hidden bg-canvas border border-spruce/10 flex-shrink-0">
                  {item.variant?.image ? (
                    <Image src={item.variant.image.url} alt={item.title} width={56} height={56} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-ink-mute">BS</div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <p className="font-display font-extrabold text-xl text-spruce">{formatPrice(order.currentTotalPrice)}</p>
              <button onClick={() => onViewOrderDetail(order.id)} className="text-[13px] font-semibold px-5 py-2.5 rounded-full border border-spruce/20 text-spruce hover:bg-spruce/5 transition-all">
                Détails →
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// PANNEAU : Détail commande
// ═══════════════════════════════════════════════════════════
function OrderDetailPanel({ customer, orderId, onBack }: {
  customer: NonNullable<ReturnType<typeof useCustomer>['customer']>
  orderId: string
  onBack: () => void
}) {
  const order = customer.orders?.nodes.find((o) => o.id === orderId)

  if (!order) {
    return (
      <div className="bg-white rounded-2xl border border-spruce/10 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-sage flex items-center justify-center mx-auto mb-6">
          <Package className="w-8 h-8 text-spruce" />
        </div>
        <p className="font-display font-bold text-spruce text-lg mb-2">Commande introuvable</p>
        <button onClick={onBack} className="mt-4 text-[13px] font-semibold text-ink-mute hover:text-spruce transition-colors">
          ← Retour aux commandes
        </button>
      </div>
    )
  }

  const financial = getStatus(order.financialStatus)
  const fulfillment = getStatus(order.fulfillmentStatus)

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-[13px] font-semibold text-ink-mute hover:text-spruce transition-colors">
        ← Retour aux commandes
      </button>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-[28px] md:text-[34px] font-extrabold tracking-tight text-spruce leading-[1.1]">
            Commande #{order.orderNumber}
          </h2>
          <p className="text-sm font-medium text-ink-mute mt-2">
            {new Date(order.processedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`${STATUS_BADGE} ${financial.style}`}>{financial.label}</span>
          <span className={`${STATUS_BADGE} ${fulfillment.style}`}>{fulfillment.label}</span>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-spruce/10 overflow-hidden">
        <div className="px-6 md:px-8 py-5 border-b border-spruce/10">
          <h3 className="font-display font-bold text-spruce text-sm">Articles ({order.lineItems.nodes.length})</h3>
        </div>
        <div className="divide-y divide-spruce/10">
          {order.lineItems.nodes.map((item, i) => (
            <div key={i} className="px-6 md:px-8 py-5 flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-canvas border border-spruce/10 flex-shrink-0">
                {item.variant?.image ? (
                  <Image src={item.variant.image.url} alt={item.title} width={64} height={64} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-ink-mute" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-ink text-sm truncate">{item.title}</p>
                <p className="text-[12px] text-ink-mute font-medium mt-0.5">Quantité : {item.quantity}</p>
              </div>
              {item.variant?.price && (
                <p className="font-semibold text-spruce text-sm flex-shrink-0">
                  {formatPrice({ amount: (parseFloat(item.variant.price.amount) * item.quantity).toFixed(2), currencyCode: item.variant.price.currencyCode })}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-spruce/10 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-ink text-sm">Total</span>
          <span className="font-display font-extrabold text-2xl text-spruce">{formatPrice(order.currentTotalPrice)}</span>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// PANNEAU : Adresses
// ═══════════════════════════════════════════════════════════
function AddressesPanel({ customer }: { customer: NonNullable<ReturnType<typeof useCustomer>['customer']> }) {
  const { addAddress, editAddress, removeAddress, makeDefaultAddress } = useCustomer()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  type AddressSuggestion = { label: string; name: string; postcode: string; city: string }
  const EMPTY: AddressInput = { firstName: '', lastName: '', address1: '', address2: '', city: '', zip: '', country: 'France', phone: '', company: '' }
  const [form, setForm] = useState<AddressInput>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Destinataire alternatif (cadeau/travail) : masqué par défaut → le destinataire
  // est le client (nom/prénom du profil renseignés silencieusement).
  const [otherRecipient, setOtherRecipient] = useState(false)
  // Autocomplétion adresse via l'API Adresse (gouv) — gratuite, sans clé.
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [showSug, setShowSug] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const addresses = customer.addresses?.nodes ?? []
  const inputClass = "w-full px-4 py-3 rounded-xl border border-spruce/20 text-[16px] md:text-sm font-medium text-ink bg-white focus:outline-none focus:border-fresh focus:ring-1 focus:ring-fresh/30 placeholder:text-ink-mute/60 transition-all"
  const labelClass = "block text-[12px] font-semibold text-ink mb-2"
  const profileFullName = `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim()

  const resetAutocomplete = () => { setSuggestions([]); setShowSug(false) }

  // Pré-remplit prénom/nom + téléphone depuis le profil (silencieux).
  const openAdd = () => {
    setEditingId(null)
    setForm({ ...EMPTY, firstName: customer.firstName ?? '', lastName: customer.lastName ?? '', phone: customer.phone ?? '' })
    setOtherRecipient(false)
    resetAutocomplete()
    setError(null); setShowForm(true)
  }
  const openEdit = (addr: typeof addresses[0]) => {
    setEditingId(addr.id)
    setForm({ firstName: addr.name?.split(' ')[0] ?? '', lastName: addr.name?.split(' ').slice(1).join(' ') ?? '', address1: addr.address1, address2: addr.address2 ?? '', city: addr.city, zip: addr.zip, country: addr.country, phone: addr.phone ?? customer.phone ?? '', company: '' })
    // Déplie le bloc destinataire si l'adresse porte un nom ≠ du profil.
    const addrName = (addr.name ?? '').trim()
    setOtherRecipient(addrName !== '' && addrName !== profileFullName)
    resetAutocomplete()
    setError(null); setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditingId(null); setOtherRecipient(false); resetAutocomplete(); setError(null) }

  // ─── Autocomplétion API Adresse (debounce 300 ms, min 3 caractères) ───
  const fetchSuggestions = async (q: string) => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5`, { signal: ctrl.signal })
      if (!res.ok) return
      const data = (await res.json()) as { features?: { properties: AddressSuggestion }[] }
      const items = (data.features ?? []).map((f) => ({
        label: f.properties.label,
        name: f.properties.name,
        postcode: f.properties.postcode,
        city: f.properties.city,
      }))
      setSuggestions(items)
      setShowSug(items.length > 0)
    } catch {
      // abort / réseau : on ignore, la saisie manuelle reste possible
    }
  }
  const onAddressChange = (v: string) => {
    setForm((f) => ({ ...f, address1: v }))
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = v.trim()
    if (q.length < 3) { resetAutocomplete(); return }
    debounceRef.current = setTimeout(() => fetchSuggestions(q), 300)
  }
  const selectSuggestion = (s: AddressSuggestion) => {
    setForm((f) => ({ ...f, address1: s.name, zip: s.postcode, city: s.city }))
    resetAutocomplete()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.address1 || !form.city || !form.zip) { setError('Remplis les champs obligatoires.'); return }
    setSubmitting(true); setError(null)
    // Téléphone non saisi ici : repris du profil si dispo, sinon omis.
    const payload: AddressInput = { ...form }
    if (!payload.phone || !payload.phone.trim()) delete payload.phone
    const { errors } = editingId ? await editAddress(editingId, payload) : await addAddress(payload)
    setSubmitting(false)
    if (errors.length > 0) setError(errors[0].message); else closeForm()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[28px] font-extrabold tracking-tight text-spruce leading-[1.1]">Mes adresses</h2>
        {!showForm && (
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-3 bg-fresh text-white text-[14px] font-semibold rounded-full hover:bg-fresh-deep transition-colors">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        )}
      </div>
      {error && <div className="bg-terracotta/10 border border-terracotta/20 text-terracotta text-sm font-medium rounded-xl px-5 py-3">{error}</div>}

      {showForm && (
        <div className="bg-white rounded-2xl border border-spruce/10 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-spruce text-lg">{editingId ? "Modifier l'adresse" : 'Nouvelle adresse'}</h3>
            <button onClick={closeForm} className="w-8 h-8 rounded-full bg-sage flex items-center justify-center hover:bg-spruce/10 transition-colors"><X className="w-4 h-4 text-spruce" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Adresse avec autocomplétion (API Adresse gouv) */}
            <div>
              <label className={labelClass}>Adresse *</label>
              <div className="relative">
                <input
                  type="text"
                  value={form.address1}
                  onChange={(e) => onAddressChange(e.target.value)}
                  onFocus={() => { if (suggestions.length > 0) setShowSug(true) }}
                  onBlur={() => setTimeout(() => setShowSug(false), 150)}
                  required
                  autoComplete="off"
                  placeholder="Commence à taper ton adresse…"
                  className={inputClass}
                />
                {showSug && suggestions.length > 0 && (
                  <ul className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-spruce/15 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                    {suggestions.map((s, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s) }}
                          className="w-full text-left px-4 py-2.5 text-[13px] text-ink hover:bg-sage transition-colors flex items-start gap-2"
                        >
                          <MapPin className="w-4 h-4 text-spruce flex-shrink-0 mt-0.5" />
                          <span>{s.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div><label className={labelClass}>Complément <span className="text-ink-mute font-medium">(optionnel)</span></label><input type="text" value={form.address2 ?? ''} onChange={(e) => setForm({ ...form, address2: e.target.value })} className={inputClass} /></div>

            <div className="grid grid-cols-3 gap-4">
              <div><label className={labelClass}>CP *</label><input type="text" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} required className={inputClass} /></div>
              <div className="col-span-2"><label className={labelClass}>Ville *</label><input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required className={inputClass} /></div>
            </div>

            {/* Destinataire alternatif (cadeau/travail) — masqué par défaut */}
            {!otherRecipient ? (
              <button type="button" onClick={() => setOtherRecipient(true)} className="text-[13px] font-medium text-spruce hover:text-fresh-deep underline underline-offset-4">
                Livrer à un autre destinataire ?
              </button>
            ) : (
              <div className="space-y-3 rounded-xl bg-canvas border border-spruce/10 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-ink">Destinataire</p>
                  <button type="button" onClick={() => { setOtherRecipient(false); setForm((f) => ({ ...f, firstName: customer.firstName ?? '', lastName: customer.lastName ?? '' })) }} className="text-[12px] text-ink-mute hover:text-spruce transition-colors">
                    Utiliser mon nom
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelClass}>Prénom</label><input type="text" value={form.firstName ?? ''} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputClass} /></div>
                  <div><label className={labelClass}>Nom</label><input type="text" value={form.lastName ?? ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputClass} /></div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting} className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 bg-fresh text-white text-[14px] font-semibold rounded-full hover:bg-fresh-deep transition-colors disabled:opacity-50">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? 'Enregistrer' : "Ajouter l'adresse"}
              </button>
              <button type="button" onClick={closeForm} className="px-6 py-3.5 text-[14px] font-semibold text-ink-mute rounded-full hover:bg-spruce/5 transition-colors">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-spruce/10 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-sage flex items-center justify-center mx-auto mb-6"><MapPin className="w-8 h-8 text-spruce" /></div>
          <p className="font-display font-bold text-spruce text-lg mb-2">Aucune adresse</p>
          <p className="text-sm text-ink-mute mb-8 font-medium max-w-sm mx-auto">Ajoute une adresse de livraison pour faciliter tes prochaines commandes.</p>
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-7 py-3.5 bg-fresh text-white text-[14px] font-semibold rounded-full hover:bg-fresh-deep transition-colors">
            <Plus className="w-4 h-4" /> Ajouter une adresse
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => {
            const isDefault = customer.defaultAddress?.id === addr.id
            return (
              <div key={addr.id} className="bg-white rounded-2xl border border-spruce/10 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-sage flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5 text-spruce" /></div>
                    <div>
                      {addr.name && <p className="font-display font-bold text-ink mb-1">{addr.name}</p>}
                      <p className="text-[13px] text-ink-mute font-medium">{addr.address1}</p>
                      {addr.address2 && <p className="text-[13px] text-ink-mute font-medium">{addr.address2}</p>}
                      <p className="text-[13px] text-ink-mute font-medium">{addr.zip} {addr.city}</p>
                      <p className="text-[13px] text-ink-mute font-medium">{addr.country}</p>
                      {addr.phone && <p className="text-[13px] text-ink-mute font-medium mt-1">{addr.phone}</p>}
                      {isDefault && <span className="inline-flex items-center gap-1 mt-3 text-[11px] font-semibold text-spruce bg-sage px-3 py-1 rounded-full"><Star className="w-3 h-3" /> Adresse par défaut</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isDefault && (
                      <button onClick={async () => { setSettingDefaultId(addr.id); await makeDefaultAddress(addr.id); setSettingDefaultId(null) }} disabled={settingDefaultId === addr.id} title="Définir par défaut" className="w-9 h-9 rounded-full bg-sage flex items-center justify-center hover:bg-spruce/10 transition-colors disabled:opacity-50">
                        {settingDefaultId === addr.id ? <Loader2 className="w-4 h-4 text-spruce animate-spin" /> : <Star className="w-4 h-4 text-ink-mute" />}
                      </button>
                    )}
                    <button onClick={() => openEdit(addr)} title="Modifier" className="w-9 h-9 rounded-full bg-sage flex items-center justify-center hover:bg-spruce/10 transition-colors"><Pencil className="w-4 h-4 text-spruce" /></button>
                    <button onClick={async () => { setDeletingId(addr.id); const { errors } = await removeAddress(addr.id); setDeletingId(null); if (errors.length > 0) setError(errors[0].message) }} disabled={deletingId === addr.id} title="Supprimer" className="w-9 h-9 rounded-full bg-terracotta/10 flex items-center justify-center hover:bg-terracotta/20 transition-colors disabled:opacity-50">
                      {deletingId === addr.id ? <Loader2 className="w-4 h-4 text-terracotta animate-spin" /> : <Trash2 className="w-4 h-4 text-terracotta" />}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// PANNEAU : Profil
// ═══════════════════════════════════════════════════════════
function ProfilePanel({ customer }: { customer: NonNullable<ReturnType<typeof useCustomer>['customer']> }) {
  const { refreshCustomer } = useCustomer()
  const [form, setForm] = useState({ firstName: customer.firstName ?? '', lastName: customer.lastName ?? '', email: customer.email ?? '', phone: customer.phone ?? '' })
  const [phoneValid, setPhoneValid] = useState(true)
  const [saving, setSaving] = useState(false)
  const inputClass = "w-full px-5 py-3.5 rounded-xl border border-spruce/20 text-[16px] md:text-sm font-medium text-ink bg-white focus:outline-none focus:border-fresh focus:ring-1 focus:ring-fresh/30 placeholder:text-ink-mute/60 transition-all"
  const labelClass = "block text-[12px] font-semibold text-ink mb-2"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phoneValid) { toast.error('Numéro de téléphone invalide.'); return }
    const token = getStoredToken()
    if (!token) return
    setSaving(true)
    // form.phone est déjà en E.164 (ou '') grâce à PhoneField ; updateCustomer
    // l'omet s'il est vide (téléphone optionnel) → plus de "phone can't be blank".
    const { success, errors } = await updateCustomer(token, form)
    if (success) {
      await refreshCustomer()
      toast.success('Profil mis à jour !')
      // Synchronise le numéro côté cagnotte (UN seul numéro par client).
      try {
        const res = await fetch('/api/loyalty/me/phone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ phone: form.phone }),
        })
        if (res.status === 409) toast.error('Ce numéro est déjà associé à une autre cagnotte.')
      } catch {
        // non bloquant
      }
    } else {
      toast.error(errors[0]?.message ?? 'Erreur lors de la mise à jour')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      <h2 className="font-display text-[28px] font-extrabold tracking-tight text-spruce leading-[1.1]">Mon profil</h2>
      <div className="bg-white rounded-2xl border border-spruce/10 p-8 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Prénom</label><input type="text" className={inputClass} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
            <div><label className={labelClass}>Nom</label><input type="text" className={inputClass} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
          </div>
          <div><label className={labelClass}>Email</label><input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className={labelClass}>Téléphone <span className="font-medium text-ink-mute">(optionnel)</span></label><PhoneField value={form.phone} onChange={(e164, valid) => { setForm((f) => ({ ...f, phone: e164 })); setPhoneValid(valid) }} inputClassName={inputClass} /></div>
          <div className="pt-2">
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-fresh text-white text-[14px] font-semibold rounded-full hover:bg-fresh-deep transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
      <div className="bg-white rounded-2xl border border-spruce/10 p-8 md:p-10">
        <h3 className="font-display font-bold text-spruce mb-4 text-lg">Sécurité</h3>
        <Link href="/forgot-password" className="inline-flex items-center gap-2 px-6 py-3 border border-spruce text-spruce text-[14px] font-semibold rounded-full hover:bg-spruce/5 transition-all">
          Changer mon mot de passe
        </Link>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// PANNEAU : Avis
// ═══════════════════════════════════════════════════════════
function ReviewsPanel() {
  return (
    <div className="bg-white rounded-2xl border border-spruce/10 p-12 text-center">
      <div className="w-20 h-20 rounded-full bg-sage flex items-center justify-center mx-auto mb-6"><Star className="w-8 h-8 text-spruce" /></div>
      <h2 className="font-display font-bold text-spruce text-lg mb-2">Aucun avis pour le moment</h2>
      <p className="text-sm text-ink-mute mb-8 max-w-sm mx-auto font-medium">Après avoir reçu une commande, tu pourras noter et commenter les produits achetés.</p>
      <Link href="/products" className="inline-flex items-center gap-2 px-7 py-3.5 bg-fresh text-white text-[14px] font-semibold rounded-full hover:bg-fresh-deep transition-colors">
        <Package className="w-4 h-4" /> Découvrir nos produits
      </Link>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════
// Tabs adressables via ?tab=... (exclut 'order-detail' qui est un sub-state interne)
const URL_TABS: readonly Tab[] = ['overview','orders','addresses','profile','reviews','referral','cagnotte','ambassador','admin'] as const
function isUrlTab(value: string | null | undefined): value is Tab {
  return !!value && (URL_TABS as readonly string[]).includes(value)
}

function AccountContent() {
  const router = useRouter()
  const pathname = usePathname()
  const { customer, isLoading, isLoggedIn, logout } = useCustomer()
  const ambassadorState = useAmbassador()
  const adminState = useIsAdmin()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const t = searchParams.get('tab')
    return isUrlTab(t) ? t : 'overview'
  })
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  // Sync activeTab quand l'URL change (deep-links internes Cagnotte <-> Parrainage,
  // widget panier, page /parrainage). useState ne re-lit pas son initialiseur,
  // donc on a besoin d'un useEffect reactif a searchParams.
  useEffect(() => {
    const t = searchParams.get('tab')
    if (isUrlTab(t)) {
      setActiveTab((prev) => {
        if (prev === t) return prev
        // Scroll en haut au changement d'onglet (UX : on ne reste pas en bas du panneau precedent)
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        return t
      })
    }
  }, [searchParams])

  // Garde d'auth cote client = source de verite unique (le token nutrition vit
  // en localStorage, lu par useCustomer -> isLoggedIn). On NE redirige QUE quand
  // l'auth est determinee (!isLoading) ET negative -> pas de rebond avant
  // hydratation. router.replace (pas push) pour ne pas polluer l'historique,
  // et ?redirect pour revenir ici apres connexion. Le middleware ne gate plus
  // /account cote serveur : meme comportement en nav soft qu'en hard-load.
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      // ?tab= inclus dans le redirect : « Mes commandes » (footer) déconnecté
      // doit atterrir sur l'onglet Commandes après connexion, pas sur l'aperçu
      // (usePathname ne contient jamais la query string).
      const qs = searchParams.toString()
      router.replace(`/login?redirect=${encodeURIComponent(qs ? `${pathname}?${qs}` : pathname)}`)
    }
  }, [isLoading, isLoggedIn, router, pathname, searchParams])

  async function handleLogout() {
    await logout()
    router.push('/')
  }

  const handleViewOrderDetail = (id: string) => {
    setSelectedOrderId(id)
    setActiveTab('order-detail')
  }

  // Sélection d'onglet via la nav : écrit AUSSI l'URL (replaceState natif,
  // synchronisé avec useSearchParams depuis Next 14.1, zéro requête serveur).
  // Sans ça, un pull-to-refresh mobile ramenait systématiquement sur
  // « Aperçu » — incohérent avec /products qui persiste ses filtres.
  // ('order-detail' reste un état interne, jamais dans l'URL.)
  const selectTab = (tab: Tab) => {
    setActiveTab(tab)
    if (isUrlTab(tab)) {
      window.history.replaceState(null, '', `/account?tab=${tab}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-fresh animate-spin" />
          <p className="text-[13px] font-medium text-ink-mute">Chargement de ton espace…</p>
        </div>
      </div>
    )
  }

  if (!customer) return null

  const navItems: { icon: typeof Package; label: string; tab: Tab; count?: number }[] = [
    { icon: Package, label: 'Mes commandes', tab: 'orders', count: customer.orders?.nodes?.length },
    { icon: MapPin, label: 'Mes adresses', tab: 'addresses' },
    { icon: Wallet, label: 'Ma cagnotte', tab: 'cagnotte' },
    { icon: Gift, label: 'Parrainage', tab: 'referral' },
    // Onglet ambassadeur : visible uniquement si l'email correspond a un ambassadeur
    ...(ambassadorState.kind === 'ambassador'
      ? [{ icon: BadgeCheck, label: 'Espace ambassadeur', tab: 'ambassador' as Tab }]
      : []),
    { icon: Star, label: 'Mes avis', tab: 'reviews' },
    // Onglet admin : visible uniquement si l'email connecté est admin (gate serveur).
    ...(adminState.isAdmin
      ? [{ icon: ShieldCheck, label: 'Gérer les ambassadeurs', tab: 'admin' as Tab }]
      : []),
  ]

  const renderPanel = () => {
    switch (activeTab) {
      case 'overview': return <OverviewPanel customer={customer} onViewOrders={() => setActiveTab('orders')} onViewOrderDetail={handleViewOrderDetail} />
      case 'orders': return <OrdersPanel customer={customer} onViewOrderDetail={handleViewOrderDetail} />
      case 'order-detail': return selectedOrderId ? <OrderDetailPanel customer={customer} orderId={selectedOrderId} onBack={() => setActiveTab('orders')} /> : null
      case 'addresses': return <AddressesPanel customer={customer} />
      case 'profile': return <ProfilePanel customer={customer} />
      case 'reviews': return <ReviewsPanel />
      case 'referral': return <ReferralPanel />
      case 'cagnotte': return <CagnottePanel />
      case 'ambassador': return <AmbassadorPanel />
      case 'admin': return <AdminAmbassadorsPanel />
      default: return null
    }
  }

  return (
    <div className="bg-canvas min-h-screen">
      {/* ─── Bandeau profil (clair) ─── */}
      <div className="bg-white border-b border-spruce/10">
        <div className="container py-8 md:py-10 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-sage flex items-center justify-center font-display font-extrabold text-xl text-spruce flex-shrink-0">
              {customer.firstName?.charAt(0)}{customer.lastName?.charAt(0)}
            </div>
            <div>
              <h1 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-spruce leading-tight">
                {customer.firstName} {customer.lastName}
              </h1>
              <p className="text-ink-mute text-[14px] font-medium mt-1">{customer.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold border rounded-full transition-colors text-spruce border-spruce hover:bg-spruce/5">
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </div>

      <div className="container py-10 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* ─── Colonne gauche : Nav ─── */}
          <div>
            {/* Mobile : pastilles horizontales scrollables — la liste verticale
                (~10 items empilés) laissait le contenu de l'onglet sous la
                ligne de flottaison : on tapait un onglet sans rien voir changer. */}
            <nav
              aria-label="Sections du compte"
              className="lg:hidden -mx-4 px-4 flex gap-2 overflow-x-auto snap-x pb-1"
            >
              {[{ icon: User, label: 'Mon profil', tab: 'profile' as Tab, count: undefined as number | undefined }, ...navItems].map(
                ({ icon: Icon, label, tab, count }) => (
                  <button
                    key={tab}
                    onClick={() => selectTab(tab)}
                    aria-pressed={activeTab === tab}
                    className={cn(
                      'flex-shrink-0 snap-start inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold border transition-colors whitespace-nowrap',
                      activeTab === tab
                        ? 'bg-spruce text-white border-spruce'
                        : 'bg-white text-ink border-spruce/15 hover:border-spruce/40'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', activeTab === tab ? 'text-white' : 'text-ink-mute')} />
                    {label}
                    {count !== undefined && count > 0 && (
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full',
                          activeTab === tab ? 'bg-white/20 text-white' : 'bg-sage text-spruce'
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                )
              )}
            </nav>

            <nav className="hidden lg:block rounded-2xl overflow-hidden bg-white border border-spruce/10 sticky top-24">
              {/* Profil en premier */}
              <button
                onClick={() => selectTab('profile')}
                className={cn(
                  "flex items-center justify-between w-full px-5 py-4 transition-colors border-b border-spruce/10 group",
                  activeTab === 'profile' ? 'bg-sage' : 'hover:bg-canvas'
                )}
              >
                <span className={cn("flex items-center gap-3 text-[13px] font-semibold", activeTab === 'profile' ? 'text-spruce' : 'text-ink')}>
                  <User className={cn("w-4 h-4", activeTab === 'profile' ? 'text-spruce' : 'text-ink-mute')} />
                  Mon profil
                </span>
                <ChevronRight className={cn("w-4 h-4 transition-transform group-hover:translate-x-1", activeTab === 'profile' ? 'text-spruce' : 'text-ink-mute')} />
              </button>

              {navItems.map(({ icon: Icon, label, tab, count }) => (
                <button
                  key={tab}
                  onClick={() => selectTab(tab)}
                  className={cn(
                    "flex items-center justify-between w-full px-5 py-4 transition-colors border-b last:border-0 group border-spruce/10",
                    activeTab === tab ? 'bg-sage' : 'hover:bg-canvas'
                  )}
                >
                  <span className={cn(
                    "flex items-center gap-3 text-[13px] font-semibold",
                    activeTab === tab ? 'text-spruce' : 'text-ink'
                  )}>
                    <Icon className={cn("w-4 h-4", activeTab === tab ? 'text-spruce' : 'text-ink-mute')} />
                    {label}
                  </span>
                  <div className="flex items-center gap-3">
                    {count !== undefined && count > 0 && (
                      <span className={cn(
                        "text-[10px] font-bold px-2.5 py-0.5 rounded-full",
                        activeTab === tab ? 'bg-spruce/15 text-spruce' : 'bg-sage text-spruce'
                      )}>
                        {count}
                      </span>
                    )}
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform group-hover:translate-x-1",
                      activeTab === tab ? 'text-spruce' : 'text-ink-mute'
                    )} />
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* ─── Colonne droite : Panneau dynamique ─── */}
          <div>
            {renderPanel()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-canvas"><div className="font-display font-semibold text-lg text-ink-mute animate-pulse">Chargement…</div></div>}>
      <AccountContent />
    </Suspense>
  )
}
