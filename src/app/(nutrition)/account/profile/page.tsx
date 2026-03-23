'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Save } from 'lucide-react'
import { useCustomer } from '@/context/CustomerContext'
import { updateCustomer, getStoredToken } from '@/lib/shopify/customer'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const router = useRouter()
  const { customer, isLoading, isLoggedIn, refreshCustomer } = useCustomer()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.push('/login')
    if (customer) {
      setForm({
        firstName: customer.firstName ?? '',
        lastName: customer.lastName ?? '',
        email: customer.email ?? '',
        phone: customer.phone ?? '',
      })
    }
  }, [isLoading, isLoggedIn, customer, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = getStoredToken()
    if (!token) return
    setSaving(true)
    const { success, errors } = await updateCustomer(token, form)
    if (success) {
      await refreshCustomer()
      toast.success('Profil mis à jour !')
    } else {
      toast.error(errors[0]?.message ?? 'Erreur lors de la mise à jour')
    }
    setSaving(false)
  }

  if (isLoading || !customer) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-brand-700" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="container py-10 md:py-14 max-w-2xl">
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-700 mb-7 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Mon espace
      </Link>

      <h1 className="font-display text-2xl font-bold text-gray-900 mb-7 flex items-center gap-2">
        <User className="w-6 h-6 text-brand-700" />
        Mon profil
      </h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom</label>
              <input type="text" className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom</label>
              <input type="text" className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Téléphone <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <input type="tel" className="input" placeholder="+33 6 00 00 00 00" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>

          <div className="pt-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>

      {/* Section mot de passe */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 mt-5">
        <h2 className="font-display font-bold text-gray-900 mb-4">Sécurité</h2>
        <Link href="/forgot-password" className="btn-secondary text-sm">
          Changer mon mot de passe
        </Link>
      </div>
    </div>
  )
}
