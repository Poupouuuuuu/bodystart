'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Plus, Pencil, Trash2, Star, X, Loader2 } from 'lucide-react'
import { useCustomer } from '@/context/CustomerContext'
import type { AddressInput } from '@/lib/shopify/customer'

const EMPTY_FORM: AddressInput = {
  firstName: '',
  lastName: '',
  address1: '',
  address2: '',
  city: '',
  zip: '',
  country: 'France',
  phone: '',
  company: '',
}

export default function AddressesPage() {
  const router = useRouter()
  const { customer, isLoading, isLoggedIn, addAddress, editAddress, removeAddress, makeDefaultAddress } = useCustomer()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AddressInput>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.push('/login')
  }, [isLoading, isLoggedIn, router])

  if (isLoading || !customer) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f4f6f1]">
        <Loader2 className="w-8 h-8 text-[#1a2e23] animate-spin" />
      </div>
    )
  }

  const addresses = customer.addresses?.nodes ?? []

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
    setShowForm(true)
  }

  const openEdit = (addr: typeof addresses[0]) => {
    setEditingId(addr.id)
    setForm({
      firstName: addr.name?.split(' ')[0] ?? '',
      lastName: addr.name?.split(' ').slice(1).join(' ') ?? '',
      address1: addr.address1,
      address2: addr.address2 ?? '',
      city: addr.city,
      zip: addr.zip,
      country: addr.country,
      phone: addr.phone ?? '',
      company: '',
    })
    setError(null)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.address1 || !form.city || !form.zip) {
      setError('Veuillez remplir les champs obligatoires.')
      return
    }

    setSubmitting(true)
    setError(null)

    const { errors } = editingId
      ? await editAddress(editingId, form)
      : await addAddress(form)

    setSubmitting(false)

    if (errors.length > 0) {
      setError(errors[0].message)
    } else {
      closeForm()
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const { errors } = await removeAddress(id)
    setDeletingId(null)
    if (errors.length > 0) setError(errors[0].message)
  }

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id)
    await makeDefaultAddress(id)
    setSettingDefaultId(null)
  }

  const updateField = (field: keyof AddressInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="bg-[#f4f6f1] min-h-screen">
      <div className="container py-12 md:py-16 max-w-2xl">
        <Link href="/account" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#89a890] hover:text-[#1a2e23] mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Mon espace
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-[35px] md:text-[42px] font-black uppercase tracking-tighter text-[#1a2e23] leading-none">
            Mes adresses
          </h1>
          {!showForm && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#1a2e23] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#2e4f3c] transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-2xl px-5 py-3 mb-6">
            {error}
          </div>
        )}

        {/* ─── Formulaire ajout / édition ─── */}
        {showForm && (
          <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-6 md:p-8 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-black uppercase tracking-tight text-[#1a2e23] text-lg">
                {editingId ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
              </h2>
              <button onClick={closeForm} className="w-8 h-8 rounded-full bg-[#1a2e23]/5 flex items-center justify-center hover:bg-[#1a2e23]/10 transition-colors">
                <X className="w-4 h-4 text-[#1a2e23]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">Prénom</label>
                  <input
                    type="text"
                    value={form.firstName ?? ''}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#1a2e23]/10 text-sm font-medium text-[#1a2e23] bg-[#f4f6f1] focus:outline-none focus:ring-2 focus:ring-[#1a2e23]/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">Nom</label>
                  <input
                    type="text"
                    value={form.lastName ?? ''}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#1a2e23]/10 text-sm font-medium text-[#1a2e23] bg-[#f4f6f1] focus:outline-none focus:ring-2 focus:ring-[#1a2e23]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">Entreprise <span className="text-[#89a890] normal-case">(optionnel)</span></label>
                <input
                  type="text"
                  value={form.company ?? ''}
                  onChange={(e) => updateField('company', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[#1a2e23]/10 text-sm font-medium text-[#1a2e23] bg-[#f4f6f1] focus:outline-none focus:ring-2 focus:ring-[#1a2e23]/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">Adresse *</label>
                <input
                  type="text"
                  value={form.address1}
                  onChange={(e) => updateField('address1', e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-[#1a2e23]/10 text-sm font-medium text-[#1a2e23] bg-[#f4f6f1] focus:outline-none focus:ring-2 focus:ring-[#1a2e23]/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">Complément <span className="text-[#89a890] normal-case">(optionnel)</span></label>
                <input
                  type="text"
                  value={form.address2 ?? ''}
                  onChange={(e) => updateField('address2', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[#1a2e23]/10 text-sm font-medium text-[#1a2e23] bg-[#f4f6f1] focus:outline-none focus:ring-2 focus:ring-[#1a2e23]/20"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">Code postal *</label>
                  <input
                    type="text"
                    value={form.zip}
                    onChange={(e) => updateField('zip', e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-[#1a2e23]/10 text-sm font-medium text-[#1a2e23] bg-[#f4f6f1] focus:outline-none focus:ring-2 focus:ring-[#1a2e23]/20"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">Ville *</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-[#1a2e23]/10 text-sm font-medium text-[#1a2e23] bg-[#f4f6f1] focus:outline-none focus:ring-2 focus:ring-[#1a2e23]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">Pays</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#1a2e23]/10 text-sm font-medium text-[#1a2e23] bg-[#f4f6f1] focus:outline-none focus:ring-2 focus:ring-[#1a2e23]/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">Téléphone <span className="text-[#89a890] normal-case">(optionnel)</span></label>
                  <input
                    type="tel"
                    value={form.phone ?? ''}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#1a2e23]/10 text-sm font-medium text-[#1a2e23] bg-[#f4f6f1] focus:outline-none focus:ring-2 focus:ring-[#1a2e23]/20"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-4 bg-[#1a2e23] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#2e4f3c] transition-all shadow-lg disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Enregistrer' : 'Ajouter l\'adresse'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] rounded-full hover:bg-[#1a2e23]/5 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── Liste des adresses ─── */}
        {addresses.length === 0 && !showForm ? (
          <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 py-16 text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-[#1a2e23]/5 flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-8 h-8 text-[#89a890]" />
            </div>
            <p className="font-display font-black uppercase tracking-tight text-[#1a2e23] text-lg mb-2">Aucune adresse</p>
            <p className="text-sm text-[#4a5f4c] mb-8 font-medium max-w-sm mx-auto">Ajoutez une adresse de livraison pour faciliter vos prochaines commandes.</p>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#1a2e23] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#2e4f3c] transition-all shadow-lg"
            >
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
                      <div className="w-10 h-10 rounded-2xl bg-[#1a2e23]/5 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-[#1a2e23]" />
                      </div>
                      <div>
                        {addr.name && <p className="font-display font-bold text-[#1a2e23] mb-1">{addr.name}</p>}
                        <p className="text-[13px] text-[#4a5f4c] font-medium">{addr.address1}</p>
                        {addr.address2 && <p className="text-[13px] text-[#4a5f4c] font-medium">{addr.address2}</p>}
                        <p className="text-[13px] text-[#4a5f4c] font-medium">{addr.zip} {addr.city}</p>
                        <p className="text-[13px] text-[#4a5f4c] font-medium">{addr.country}</p>
                        {addr.phone && <p className="text-[13px] text-[#89a890] font-medium mt-1">{addr.phone}</p>}
                        {isDefault && (
                          <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold uppercase tracking-widest text-[#1a2e23] bg-[#1a2e23]/5 px-3 py-1 rounded-full">
                            <Star className="w-3 h-3" /> Adresse par défaut
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isDefault && (
                        <button
                          onClick={() => handleSetDefault(addr.id)}
                          disabled={settingDefaultId === addr.id}
                          title="Définir par défaut"
                          className="w-9 h-9 rounded-full bg-[#1a2e23]/5 flex items-center justify-center hover:bg-[#1a2e23]/10 transition-colors disabled:opacity-50"
                        >
                          {settingDefaultId === addr.id ? (
                            <Loader2 className="w-4 h-4 text-[#1a2e23] animate-spin" />
                          ) : (
                            <Star className="w-4 h-4 text-[#89a890]" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(addr)}
                        title="Modifier"
                        className="w-9 h-9 rounded-full bg-[#1a2e23]/5 flex items-center justify-center hover:bg-[#1a2e23]/10 transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-[#1a2e23]" />
                      </button>
                      <button
                        onClick={() => handleDelete(addr.id)}
                        disabled={deletingId === addr.id}
                        title="Supprimer"
                        className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {deletingId === addr.id ? (
                          <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
