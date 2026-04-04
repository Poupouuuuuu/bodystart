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
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f4f6f1]">
        <svg className="animate-spin h-8 w-8 text-[#1a2e23]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  const inputClass = "w-full px-5 py-3.5 rounded-2xl border border-[#1a2e23]/10 text-sm font-medium text-[#1a2e23] bg-[#f4f6f1] focus:outline-none focus:ring-2 focus:ring-[#1a2e23]/10 focus:border-[#1a2e23]/30 placeholder:text-[#89a890] transition-all"
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-[#1a2e23] mb-2"

  return (
    <div className="bg-[#f4f6f1] min-h-screen">
      <div className="container py-12 md:py-16 max-w-2xl">
        <Link href="/account" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#89a890] hover:text-[#1a2e23] mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Mon espace
        </Link>

        <h1 className="font-display text-[35px] md:text-[42px] font-black uppercase tracking-tighter text-[#1a2e23] leading-none mb-8">
          Mon profil
        </h1>

        <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-8 md:p-10 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Prénom</label>
                <input type="text" className={inputClass} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Nom</label>
                <input type="text" className={inputClass} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>

            <div>
              <label className={labelClass}>
                Téléphone <span className="font-medium text-[#89a890]">(optionnel)</span>
              </label>
              <input type="tel" className={inputClass} placeholder="+33 6 00 00 00 00" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#1a2e23] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#2e4f3c] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
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

        {/* Section sécurité */}
        <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-8 md:p-10 mt-5 shadow-sm">
          <h2 className="font-display font-black uppercase tracking-tight text-[#1a2e23] mb-4 text-lg">Sécurité</h2>
          <Link href="/forgot-password" className="inline-flex items-center gap-2 px-6 py-3 border border-[#1a2e23]/10 text-[#1a2e23] text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#1a2e23]/5 transition-all">
            Changer mon mot de passe
          </Link>
        </div>
      </div>
    </div>
  )
}
