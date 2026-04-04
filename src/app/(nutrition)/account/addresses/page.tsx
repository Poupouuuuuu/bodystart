'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import { useCustomer } from '@/context/CustomerContext'

export default function AddressesPage() {
  const router = useRouter()
  const { customer, isLoading, isLoggedIn } = useCustomer()

  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.push('/login')
  }, [isLoading, isLoggedIn, router])

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

  const addresses = customer.addresses?.nodes ?? []

  return (
    <div className="bg-[#f4f6f1] min-h-screen">
      <div className="container py-12 md:py-16 max-w-2xl">
        <Link href="/account" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#89a890] hover:text-[#1a2e23] mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Mon espace
        </Link>

        <h1 className="font-display text-[35px] md:text-[42px] font-black uppercase tracking-tighter text-[#1a2e23] leading-none mb-8">
          Mes adresses
        </h1>

        {addresses.length === 0 ? (
          <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 py-16 text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-[#1a2e23]/5 flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-8 h-8 text-[#89a890]" />
            </div>
            <p className="font-display font-black uppercase tracking-tight text-[#1a2e23] text-lg mb-2">Aucune adresse</p>
            <p className="text-sm text-[#4a5f4c] mb-8 font-medium max-w-sm mx-auto">Vos adresses de livraison seront sauvegardées automatiquement lors de vos commandes.</p>
            <Link href="/products" className="inline-flex items-center gap-2 px-8 py-4 bg-[#1a2e23] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#2e4f3c] transition-all shadow-lg">
              Passer une commande
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <div key={addr.id} className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#1a2e23]/5 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[#1a2e23]" />
                  </div>
                  <div>
                    {addr.name && <p className="font-display font-bold text-[#1a2e23] mb-1">{addr.name}</p>}
                    <p className="text-[13px] text-[#4a5f4c] font-medium">{addr.address1}</p>
                    {addr.address2 && <p className="text-[13px] text-[#4a5f4c] font-medium">{addr.address2}</p>}
                    <p className="text-[13px] text-[#4a5f4c] font-medium">{addr.zip} {addr.city}</p>
                    <p className="text-[13px] text-[#4a5f4c] font-medium">{addr.country}</p>
                    {customer.defaultAddress?.id === addr.id && (
                      <span className="inline-block mt-3 text-[10px] font-bold uppercase tracking-widest text-[#1a2e23] bg-[#1a2e23]/5 px-3 py-1 rounded-full">
                        Adresse par défaut
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
