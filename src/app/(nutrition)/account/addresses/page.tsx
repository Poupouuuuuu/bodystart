'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Plus } from 'lucide-react'
import { useCustomer } from '@/context/CustomerContext'

export default function AddressesPage() {
  const router = useRouter()
  const { customer, isLoading, isLoggedIn } = useCustomer()

  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.push('/login')
  }, [isLoading, isLoggedIn, router])

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

  const addresses = customer.addresses?.nodes ?? []

  return (
    <div className="container py-10 md:py-14 max-w-2xl">
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-700 mb-7 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Mon espace
      </Link>

      <div className="flex items-center justify-between mb-7">
        <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-brand-700" /> Mes adresses
        </h1>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-700 mb-1">Aucune adresse enregistrée</p>
          <p className="text-sm text-gray-400 mb-6">Vos adresses de livraison seront sauvegardées automatiquement lors de vos commandes.</p>
          <Link href="/products" className="btn-primary">Passer une commande</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              {addr.name && <p className="font-semibold text-gray-900 mb-1">{addr.name}</p>}
              <p className="text-sm text-gray-600">{addr.address1}</p>
              {addr.address2 && <p className="text-sm text-gray-600">{addr.address2}</p>}
              <p className="text-sm text-gray-600">{addr.zip} {addr.city}</p>
              <p className="text-sm text-gray-600">{addr.country}</p>
              {customer.defaultAddress?.id === addr.id && (
                <span className="inline-block mt-2 text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
                  Adresse par défaut
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
