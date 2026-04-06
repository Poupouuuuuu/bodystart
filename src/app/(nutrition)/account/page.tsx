'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  User, Package, MapPin, LogOut, ChevronRight, ShoppingBag, Star,
  Gift, Dumbbell, Plus, Pencil, Trash2, X, Loader2, Save, Copy, Users
} from 'lucide-react'
import { useCustomer } from '@/context/CustomerContext'
import { updateCustomer, getStoredToken } from '@/lib/shopify/customer'
import type { AddressInput } from '@/lib/shopify/customer'
import { formatPrice, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

type Tab = 'overview' | 'orders' | 'order-detail' | 'addresses' | 'profile' | 'reviews' | 'referral' | 'coaching'

// ═══════════════════════════════════════════════════════════
// PANNEAU : Aperçu (dernières commandes)
// ═══════════════════════════════════════════════════════════
function OverviewPanel({ customer, onViewOrders, onViewOrderDetail }: {
  customer: NonNullable<ReturnType<typeof useCustomer>['customer']>
  onViewOrders: () => void
  onViewOrderDetail: (id: string) => void
}) {
  const recentOrders = customer.orders?.nodes?.slice(0, 3) ?? []
  const getStatus = (s: string) => {
    const map: Record<string, { label: string; style: string }> = {
      PAID: { label: 'Payé', style: 'bg-green-50 text-green-700 border-green-200' },
      PENDING: { label: 'En attente', style: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      REFUNDED: { label: 'Remboursé', style: 'bg-gray-50 text-gray-600 border-gray-200' },
      FULFILLED: { label: 'Expédié', style: 'bg-blue-50 text-blue-700 border-blue-200' },
      UNFULFILLED: { label: 'Préparation', style: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    }
    return map[s] ?? { label: s, style: 'bg-gray-50 text-gray-600 border-gray-200' }
  }

  return (
    <div className="rounded-[24px] overflow-hidden border bg-white border-[#1a2e23]/5 shadow-sm">
      <div className="flex items-center justify-between px-8 py-6 border-b border-[#1a2e23]/5">
        <h2 className="font-display font-black uppercase tracking-tighter text-xl flex items-center gap-2 leading-none text-[#1a2e23]">
          <ShoppingBag className="w-5 h-5 text-[#89a890]" />
          Dernières commandes
        </h2>
        {recentOrders.length > 0 && (
          <button onClick={onViewOrders} className="text-[11px] font-bold uppercase tracking-widest text-[#89a890] hover:text-[#1a2e23] transition-colors">
            Voir tout →
          </button>
        )}
      </div>

      {recentOrders.length === 0 ? (
        <div className="py-20 text-center px-6">
          <div className="w-20 h-20 rounded-full bg-[#1a2e23]/5 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-8 h-8 text-[#89a890]" />
          </div>
          <p className="font-display font-black uppercase tracking-tight text-lg mb-2 text-[#1a2e23]">Aucune commande</p>
          <p className="text-sm font-medium mb-8 text-[#4a5f4c]">Vous n'avez pas encore passé de commande.</p>
          <Link href="/products" className="inline-flex text-[11px] font-bold uppercase tracking-widest px-8 py-4 rounded-full bg-[#1a2e23] text-white shadow-lg hover:bg-[#2e4f3c] transition-all hover:-translate-y-0.5">
            DÉCOUVRIR NOS PRODUITS
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-[#1a2e23]/5">
          {recentOrders.map((order) => {
            const financial = getStatus(order.financialStatus)
            const fulfillment = getStatus(order.fulfillmentStatus)
            return (
              <div key={order.id} className="p-6 md:p-8 hover:bg-[#f4f6f1]/50 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-display font-bold uppercase tracking-tight text-sm text-[#1a2e23]">
                      Commande #{order.orderNumber}
                    </p>
                    <p className="text-[11px] font-medium text-[#89a890] mt-1">
                      {new Date(order.processedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <span className={`text-[10px] font-bold uppercase tracking-wider border px-2.5 py-1 rounded-full ${financial.style}`}>{financial.label}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider border px-2.5 py-1 rounded-full ${fulfillment.style}`}>{fulfillment.label}</span>
                  </div>
                </div>
                <div className="flex gap-3 mb-6">
                  {order.lineItems.nodes.slice(0, 4).map((item, i) => (
                    <div key={i} className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 border bg-[#f4f6f1] border-[#1a2e23]/5">
                      {item.variant?.image ? (
                        <Image src={item.variant.image.url} alt={item.title} width={56} height={56} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#89a890] text-xs font-bold">BS</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-black text-xl text-[#1a2e23]">{formatPrice(order.currentTotalPrice)}</p>
                  <button onClick={() => onViewOrderDetail(order.id)} className="text-[11px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-[#1a2e23]/10 text-[#1a2e23] hover:bg-[#1a2e23]/5 transition-all">
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
  const getStatus = (s: string) => {
    const map: Record<string, { label: string; style: string }> = {
      PAID: { label: 'Payé', style: 'bg-green-50 text-green-700 border-green-200' },
      PENDING: { label: 'En attente', style: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      REFUNDED: { label: 'Remboursé', style: 'bg-gray-50 text-gray-600 border-gray-200' },
      FULFILLED: { label: 'Expédié', style: 'bg-blue-50 text-blue-700 border-blue-200' },
      UNFULFILLED: { label: 'Préparation', style: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    }
    return map[s] ?? { label: s, style: 'bg-gray-50 text-gray-600 border-gray-200' }
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 py-20 text-center shadow-sm">
        <div className="w-20 h-20 rounded-full bg-[#1a2e23]/5 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-8 h-8 text-[#89a890]" />
        </div>
        <p className="font-display font-black uppercase tracking-tight text-[#1a2e23] text-lg mb-2">Aucune commande</p>
        <p className="text-[#4a5f4c] text-sm mb-8 font-medium">Vos commandes apparaîtront ici.</p>
        <Link href="/products" className="inline-flex items-center gap-2 px-8 py-4 bg-[#1a2e23] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#2e4f3c] transition-all shadow-lg">
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
          <div key={order.id} className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-6 md:p-8 hover:shadow-md transition-all shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div>
                <p className="font-display font-bold uppercase tracking-tight text-[#1a2e23]">Commande #{order.orderNumber}</p>
                <p className="text-[11px] font-medium text-[#89a890] mt-1">
                  {new Date(order.processedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${financial.style}`}>{financial.label}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${fulfillment.style}`}>{fulfillment.label}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-5">
              {order.lineItems.nodes.slice(0, 5).map((item, i) => (
                <div key={i} className="w-14 h-14 rounded-2xl overflow-hidden bg-[#f4f6f1] border border-[#1a2e23]/5 flex-shrink-0">
                  {item.variant?.image ? (
                    <Image src={item.variant.image.url} alt={item.title} width={56} height={56} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#89a890]">BS</div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <p className="font-black text-xl text-[#1a2e23]">{formatPrice(order.currentTotalPrice)}</p>
              <button onClick={() => onViewOrderDetail(order.id)} className="text-[11px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-[#1a2e23]/10 text-[#1a2e23] hover:bg-[#1a2e23]/5 transition-all">
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
  const getStatus = (s: string) => {
    const map: Record<string, { label: string; style: string }> = {
      PAID: { label: 'Payé', style: 'bg-green-50 text-green-700 border-green-200' },
      PENDING: { label: 'En attente', style: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      REFUNDED: { label: 'Remboursé', style: 'bg-gray-50 text-gray-600 border-gray-200' },
      FULFILLED: { label: 'Expédié', style: 'bg-blue-50 text-blue-700 border-blue-200' },
      UNFULFILLED: { label: 'Préparation', style: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    }
    return map[s] ?? { label: s, style: 'bg-gray-50 text-gray-600 border-gray-200' }
  }

  if (!order) {
    return (
      <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 py-20 text-center shadow-sm">
        <div className="w-20 h-20 rounded-full bg-[#1a2e23]/5 flex items-center justify-center mx-auto mb-6">
          <Package className="w-8 h-8 text-[#89a890]" />
        </div>
        <p className="font-display font-black uppercase tracking-tight text-[#1a2e23] text-lg mb-2">Commande introuvable</p>
        <button onClick={onBack} className="mt-4 text-[11px] font-bold uppercase tracking-widest text-[#89a890] hover:text-[#1a2e23] transition-colors">
          ← Retour aux commandes
        </button>
      </div>
    )
  }

  const financial = getStatus(order.financialStatus)
  const fulfillment = getStatus(order.fulfillmentStatus)

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-[11px] font-bold uppercase tracking-widest text-[#89a890] hover:text-[#1a2e23] transition-colors">
        ← Retour aux commandes
      </button>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-[28px] md:text-[35px] font-black uppercase tracking-tighter text-[#1a2e23] leading-none">
            Commande #{order.orderNumber}
          </h2>
          <p className="text-sm font-medium text-[#89a890] mt-2">
            {new Date(order.processedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${financial.style}`}>{financial.label}</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${fulfillment.style}`}>{fulfillment.label}</span>
        </div>
      </div>
      <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 overflow-hidden shadow-sm">
        <div className="px-6 md:px-8 py-5 border-b border-[#1a2e23]/5">
          <h3 className="font-display font-black uppercase tracking-tight text-[#1a2e23] text-sm">Articles ({order.lineItems.nodes.length})</h3>
        </div>
        <div className="divide-y divide-[#1a2e23]/5">
          {order.lineItems.nodes.map((item, i) => (
            <div key={i} className="px-6 md:px-8 py-5 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#f4f6f1] border border-[#1a2e23]/5 flex-shrink-0">
                {item.variant?.image ? (
                  <Image src={item.variant.image.url} alt={item.title} width={64} height={64} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-[#89a890]" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-[#1a2e23] text-sm truncate">{item.title}</p>
                <p className="text-[12px] text-[#89a890] font-medium mt-0.5">Quantité : {item.quantity}</p>
              </div>
              {item.variant?.price && (
                <p className="font-black text-[#1a2e23] text-sm flex-shrink-0">
                  {formatPrice({ amount: (parseFloat(item.variant.price.amount) * item.quantity).toFixed(2), currencyCode: item.variant.price.currencyCode })}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-display font-black uppercase tracking-tight text-[#1a2e23] text-sm">Total</span>
          <span className="font-black text-2xl text-[#1a2e23]">{formatPrice(order.currentTotalPrice)}</span>
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
  const EMPTY: AddressInput = { firstName: '', lastName: '', address1: '', address2: '', city: '', zip: '', country: 'France', phone: '', company: '' }
  const [form, setForm] = useState<AddressInput>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const addresses = customer.addresses?.nodes ?? []
  const inputClass = "w-full px-4 py-3 rounded-2xl border border-[#1a2e23]/10 text-sm font-medium text-[#1a2e23] bg-[#f4f6f1] focus:outline-none focus:ring-2 focus:ring-[#1a2e23]/20"

  const openAdd = () => { setEditingId(null); setForm(EMPTY); setError(null); setShowForm(true) }
  const openEdit = (addr: typeof addresses[0]) => {
    setEditingId(addr.id)
    setForm({ firstName: addr.name?.split(' ')[0] ?? '', lastName: addr.name?.split(' ').slice(1).join(' ') ?? '', address1: addr.address1, address2: addr.address2 ?? '', city: addr.city, zip: addr.zip, country: addr.country, phone: addr.phone ?? '', company: '' })
    setError(null); setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditingId(null); setError(null) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.address1 || !form.city || !form.zip) { setError('Veuillez remplir les champs obligatoires.'); return }
    setSubmitting(true); setError(null)
    const { errors } = editingId ? await editAddress(editingId, form) : await addAddress(form)
    setSubmitting(false)
    if (errors.length > 0) setError(errors[0].message); else closeForm()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[28px] font-black uppercase tracking-tighter text-[#1a2e23] leading-none">Mes adresses</h2>
        {!showForm && (
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-3 bg-[#1a2e23] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#2e4f3c] transition-all shadow-lg">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        )}
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-2xl px-5 py-3">{error}</div>}

      {showForm && (
        <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-black uppercase tracking-tight text-[#1a2e23] text-lg">{editingId ? "Modifier l'adresse" : 'Nouvelle adresse'}</h3>
            <button onClick={closeForm} className="w-8 h-8 rounded-full bg-[#1a2e23]/5 flex items-center justify-center hover:bg-[#1a2e23]/10 transition-colors"><X className="w-4 h-4 text-[#1a2e23]" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">Prénom</label><input type="text" value={form.firstName ?? ''} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">Nom</label><input type="text" value={form.lastName ?? ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputClass} /></div>
            </div>
            <div><label className="block text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">Adresse *</label><input type="text" value={form.address1} onChange={(e) => setForm({ ...form, address1: e.target.value })} required className={inputClass} /></div>
            <div><label className="block text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">Complément <span className="text-[#89a890] normal-case">(optionnel)</span></label><input type="text" value={form.address2 ?? ''} onChange={(e) => setForm({ ...form, address2: e.target.value })} className={inputClass} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">CP *</label><input type="text" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} required className={inputClass} /></div>
              <div className="col-span-2"><label className="block text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">Ville *</label><input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">Pays</label><input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">Téléphone</label><input type="tel" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting} className="flex-1 inline-flex items-center justify-center gap-2 py-4 bg-[#1a2e23] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#2e4f3c] transition-all shadow-lg disabled:opacity-50">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? 'Enregistrer' : "Ajouter l'adresse"}
              </button>
              <button type="button" onClick={closeForm} className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] rounded-full hover:bg-[#1a2e23]/5 transition-colors">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 py-16 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-[#1a2e23]/5 flex items-center justify-center mx-auto mb-6"><MapPin className="w-8 h-8 text-[#89a890]" /></div>
          <p className="font-display font-black uppercase tracking-tight text-[#1a2e23] text-lg mb-2">Aucune adresse</p>
          <p className="text-sm text-[#4a5f4c] mb-8 font-medium max-w-sm mx-auto">Ajoutez une adresse de livraison pour faciliter vos prochaines commandes.</p>
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-8 py-4 bg-[#1a2e23] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#2e4f3c] transition-all shadow-lg">
            <Plus className="w-4 h-4" /> Ajouter une adresse
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => {
            const isDefault = customer.defaultAddress?.id === addr.id
            return (
              <div key={addr.id} className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-2xl bg-[#1a2e23]/5 flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5 text-[#1a2e23]" /></div>
                    <div>
                      {addr.name && <p className="font-display font-bold text-[#1a2e23] mb-1">{addr.name}</p>}
                      <p className="text-[13px] text-[#4a5f4c] font-medium">{addr.address1}</p>
                      {addr.address2 && <p className="text-[13px] text-[#4a5f4c] font-medium">{addr.address2}</p>}
                      <p className="text-[13px] text-[#4a5f4c] font-medium">{addr.zip} {addr.city}</p>
                      <p className="text-[13px] text-[#4a5f4c] font-medium">{addr.country}</p>
                      {addr.phone && <p className="text-[13px] text-[#89a890] font-medium mt-1">{addr.phone}</p>}
                      {isDefault && <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold uppercase tracking-widest text-[#1a2e23] bg-[#1a2e23]/5 px-3 py-1 rounded-full"><Star className="w-3 h-3" /> Adresse par défaut</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isDefault && (
                      <button onClick={async () => { setSettingDefaultId(addr.id); await makeDefaultAddress(addr.id); setSettingDefaultId(null) }} disabled={settingDefaultId === addr.id} title="Définir par défaut" className="w-9 h-9 rounded-full bg-[#1a2e23]/5 flex items-center justify-center hover:bg-[#1a2e23]/10 transition-colors disabled:opacity-50">
                        {settingDefaultId === addr.id ? <Loader2 className="w-4 h-4 text-[#1a2e23] animate-spin" /> : <Star className="w-4 h-4 text-[#89a890]" />}
                      </button>
                    )}
                    <button onClick={() => openEdit(addr)} title="Modifier" className="w-9 h-9 rounded-full bg-[#1a2e23]/5 flex items-center justify-center hover:bg-[#1a2e23]/10 transition-colors"><Pencil className="w-4 h-4 text-[#1a2e23]" /></button>
                    <button onClick={async () => { setDeletingId(addr.id); const { errors } = await removeAddress(addr.id); setDeletingId(null); if (errors.length > 0) setError(errors[0].message) }} disabled={deletingId === addr.id} title="Supprimer" className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors disabled:opacity-50">
                      {deletingId === addr.id ? <Loader2 className="w-4 h-4 text-red-500 animate-spin" /> : <Trash2 className="w-4 h-4 text-red-500" />}
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
  const [saving, setSaving] = useState(false)
  const inputClass = "w-full px-5 py-3.5 rounded-2xl border border-[#1a2e23]/10 text-sm font-medium text-[#1a2e23] bg-[#f4f6f1] focus:outline-none focus:ring-2 focus:ring-[#1a2e23]/10 focus:border-[#1a2e23]/30 placeholder:text-[#89a890] transition-all"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = getStoredToken()
    if (!token) return
    setSaving(true)
    const { success, errors } = await updateCustomer(token, form)
    if (success) { await refreshCustomer(); toast.success('Profil mis à jour !') }
    else toast.error(errors[0]?.message ?? 'Erreur lors de la mise à jour')
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      <h2 className="font-display text-[28px] font-black uppercase tracking-tighter text-[#1a2e23] leading-none">Mon profil</h2>
      <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-8 md:p-10 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[11px] font-bold uppercase tracking-widest text-[#1a2e23] mb-2">Prénom</label><input type="text" className={inputClass} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
            <div><label className="block text-[11px] font-bold uppercase tracking-widest text-[#1a2e23] mb-2">Nom</label><input type="text" className={inputClass} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
          </div>
          <div><label className="block text-[11px] font-bold uppercase tracking-widest text-[#1a2e23] mb-2">Email</label><input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="block text-[11px] font-bold uppercase tracking-widest text-[#1a2e23] mb-2">Téléphone <span className="font-medium text-[#89a890]">(optionnel)</span></label><input type="tel" className={inputClass} placeholder="+33 6 00 00 00 00" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="pt-2">
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#1a2e23] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#2e4f3c] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
      <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-8 md:p-10 shadow-sm">
        <h3 className="font-display font-black uppercase tracking-tight text-[#1a2e23] mb-4 text-lg">Sécurité</h3>
        <Link href="/forgot-password" className="inline-flex items-center gap-2 px-6 py-3 border border-[#1a2e23]/10 text-[#1a2e23] text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#1a2e23]/5 transition-all">
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
    <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-12 text-center shadow-sm">
      <div className="w-20 h-20 rounded-full bg-[#1a2e23]/5 flex items-center justify-center mx-auto mb-6"><Star className="w-8 h-8 text-[#1a2e23]" /></div>
      <h2 className="font-display font-black uppercase tracking-tight text-[#1a2e23] text-lg mb-2">Aucun avis pour le moment</h2>
      <p className="text-sm text-[#4a5f4c] mb-8 max-w-sm mx-auto font-medium">Après avoir reçu une commande, vous pourrez noter et commenter les produits achetés.</p>
      <Link href="/products" className="inline-flex items-center gap-2 px-8 py-4 bg-[#1a2e23] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#2e4f3c] transition-all shadow-lg">
        <Package className="w-4 h-4" /> Découvrir nos produits
      </Link>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// PANNEAU : Parrainage
// ═══════════════════════════════════════════════════════════
function ReferralPanel({ customer }: { customer: NonNullable<ReturnType<typeof useCustomer>['customer']> }) {
  const referralCode = useMemo(() => {
    const name = customer.firstName?.toUpperCase().slice(0, 4) ?? 'XXXX'
    const idStr = customer.id ?? ''
    let hash = 0
    for (let i = 0; i < idStr.length; i++) hash = ((hash << 5) - hash + idStr.charCodeAt(i)) | 0
    return `BS-${name}${String(Math.abs(hash) % 10000).padStart(4, '0')}`
  }, [customer.id, customer.firstName])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-[28px] font-black uppercase tracking-tighter text-[#1a2e23] leading-none mb-2">Parrainage</h2>
        <p className="text-[#4a5f4c] font-medium text-sm">Invitez vos amis et gagnez des récompenses ensemble.</p>
      </div>
      <div className="bg-[#1a2e23] text-white rounded-[28px] p-8 md:p-10 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#4a5f4c 1px, transparent 1px), linear-gradient(90deg, #4a5f4c 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/10"><Gift className="w-6 h-6" /></div>
            <div>
              <p className="font-display font-black uppercase tracking-tight">Votre code parrainage</p>
              <p className="text-white/50 text-sm font-medium">Partagez-le avec vos amis</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-white/10 border border-white/10 rounded-2xl px-5 py-4 font-mono font-bold text-xl tracking-widest text-center">{referralCode}</code>
            <button onClick={() => { navigator.clipboard.writeText(referralCode); toast.success('Code copié !') }} className="p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-colors"><Copy className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-8 shadow-sm">
        <h3 className="font-display font-black uppercase tracking-tight text-[#1a2e23] mb-6 flex items-center gap-2 text-lg"><Users className="w-5 h-5 text-[#89a890]" /> Comment ça marche ?</h3>
        <div className="space-y-5">
          {[
            { step: '01', title: 'Partagez votre code', desc: 'Envoyez votre code à vos amis sportifs.' },
            { step: '02', title: 'Votre ami commande', desc: 'Il utilise votre code et bénéficie de -10% sur sa première commande.' },
            { step: '03', title: 'Vous êtes récompensé', desc: "Vous recevez un bon d'achat de 10€ crédité sur votre compte." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4">
              <div className="w-10 h-10 bg-[#1a2e23] text-white rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0">{step}</div>
              <div className="pt-1.5">
                <p className="font-display font-bold text-[#1a2e23] text-sm uppercase tracking-tight">{title}</p>
                <p className="text-[#4a5f4c] text-sm font-medium">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#1a2e23]/5 rounded-[20px] p-6 text-center">
        <p className="text-[#1a2e23] font-display font-bold text-sm uppercase tracking-tight">Programme de parrainage — Bientôt actif</p>
        <p className="text-[#4a5f4c] text-[12px] mt-1 font-medium">Le système de récompenses sera lancé prochainement.</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════
function AccountContent() {
  const router = useRouter()
  const { customer, isLoading, isLoggedIn, logout } = useCustomer()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const isCoaching = searchParams.get('theme') === 'coaching'
  const authQuery = isCoaching ? '?theme=coaching' : ''

  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.push(`/login${authQuery}`)
  }, [isLoading, isLoggedIn, router, authQuery])

  async function handleLogout() {
    await logout()
    router.push(isCoaching ? '/coaching' : '/')
  }

  const handleViewOrderDetail = (id: string) => {
    setSelectedOrderId(id)
    setActiveTab('order-detail')
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f4f6f1]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#1a2e23] animate-spin" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c]">Chargement de votre espace...</p>
        </div>
      </div>
    )
  }

  if (!customer) return null

  const navItems: { icon: typeof Package; label: string; tab: Tab; count?: number }[] = [
    { icon: Package, label: 'Mes commandes', tab: 'orders', count: customer.orders?.nodes?.length },
    { icon: MapPin, label: 'Mes adresses', tab: 'addresses' },
    { icon: Star, label: 'Mes avis', tab: 'reviews' },
    { icon: Gift, label: 'Parrainage', tab: 'referral' },
    { icon: Dumbbell, label: 'Mon coaching', tab: 'coaching' },
  ]

  const renderPanel = () => {
    switch (activeTab) {
      case 'overview': return <OverviewPanel customer={customer} onViewOrders={() => setActiveTab('orders')} onViewOrderDetail={handleViewOrderDetail} />
      case 'orders': return <OrdersPanel customer={customer} onViewOrderDetail={handleViewOrderDetail} />
      case 'order-detail': return selectedOrderId ? <OrderDetailPanel customer={customer} orderId={selectedOrderId} onBack={() => setActiveTab('orders')} /> : null
      case 'addresses': return <AddressesPanel customer={customer} />
      case 'profile': return <ProfilePanel customer={customer} />
      case 'reviews': return <ReviewsPanel />
      case 'referral': return <ReferralPanel customer={customer} />
      case 'coaching': return (
        <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-[#1a2e23]/5 flex items-center justify-center mx-auto mb-6"><Dumbbell className="w-8 h-8 text-[#89a890]" /></div>
          <h2 className="font-display font-black uppercase tracking-tight text-[#1a2e23] text-lg mb-2">Coaching</h2>
          <p className="text-sm text-[#4a5f4c] mb-8 max-w-sm mx-auto font-medium">Votre espace coaching sera disponible après souscription à un programme.</p>
          <Link href="/coaching/tarifs" className="inline-flex items-center gap-2 px-8 py-4 bg-[#1a2e23] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#2e4f3c] transition-all shadow-lg">
            Voir les programmes
          </Link>
        </div>
      )
      default: return null
    }
  }

  return (
    <div className="bg-[#f4f6f1] min-h-screen transition-colors">
      {/* ─── Header compte ─── */}
      <div className="bg-[#1a2e23]">
        <div className="container py-8 md:py-10 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-black text-xl text-white flex-shrink-0">
              {customer.firstName?.charAt(0)}{customer.lastName?.charAt(0)}
            </div>
            <div>
              <h1 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-white leading-none">
                {customer.firstName} {customer.lastName}
              </h1>
              <p className="text-white/40 text-[13px] font-medium mt-1">{customer.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="inline-flex items-center gap-2 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest border rounded-full transition-all text-white/50 border-white/10 hover:border-white/30 hover:text-white">
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </div>

      <div className="container py-10 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* ─── Colonne gauche : Nav ─── */}
          <div>
            <nav className="rounded-[24px] overflow-hidden bg-white border border-[#1a2e23]/5 shadow-sm sticky top-24">
              {/* Profil en premier */}
              <button
                onClick={() => setActiveTab('profile')}
                className={cn(
                  "flex items-center justify-between w-full px-5 py-4 transition-all border-b border-[#1a2e23]/5 group",
                  activeTab === 'profile' ? 'bg-[#1a2e23] text-white' : 'hover:bg-[#f4f6f1]'
                )}
              >
                <span className={cn("flex items-center gap-3 text-[12px] font-bold uppercase tracking-widest", activeTab === 'profile' ? 'text-white' : 'text-[#1a2e23]')}>
                  <User className={cn("w-4 h-4", activeTab === 'profile' ? 'text-white' : 'text-[#89a890]')} />
                  Mon profil
                </span>
                <ChevronRight className={cn("w-4 h-4 transition-transform group-hover:translate-x-1", activeTab === 'profile' ? 'text-white' : 'text-[#89a890]')} />
              </button>

              {navItems.map(({ icon: Icon, label, tab, count }) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex items-center justify-between w-full px-5 py-4 transition-all border-b last:border-0 group border-[#1a2e23]/5",
                    activeTab === tab ? 'bg-[#1a2e23] text-white' : 'hover:bg-[#f4f6f1]'
                  )}
                >
                  <span className={cn(
                    "flex items-center gap-3 text-[12px] font-bold uppercase tracking-widest",
                    activeTab === tab ? 'text-white' : 'text-[#1a2e23]'
                  )}>
                    <Icon className={cn("w-4 h-4", activeTab === tab ? 'text-white' : 'text-[#89a890]')} />
                    {label}
                  </span>
                  <div className="flex items-center gap-3">
                    {count !== undefined && count > 0 && (
                      <span className={cn(
                        "text-[10px] font-bold px-2.5 py-0.5 rounded-full",
                        activeTab === tab ? 'bg-white/20 text-white' : 'bg-[#1a2e23]/5 text-[#1a2e23]'
                      )}>
                        {count}
                      </span>
                    )}
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform group-hover:translate-x-1",
                      activeTab === tab ? 'text-white' : 'text-[#89a890]'
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f4f6f1]"><div className="font-display font-black uppercase tracking-widest text-xl text-[#1a2e23] animate-pulse">CHARGEMENT...</div></div>}>
      <AccountContent />
    </Suspense>
  )
}
