'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Package, ShoppingBag } from 'lucide-react'
import { useCustomer } from '@/context/CustomerContext'
import { formatPrice } from '@/lib/utils'

export default function OrdersPage() {
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

  const orders = customer.orders?.nodes ?? []

  const getStatusLabel = (status: string) => {
    const map: Record<string, { label: string; style: string }> = {
      PAID: { label: 'Payé', style: 'bg-green-50 text-green-700 border-green-200' },
      PENDING: { label: 'En attente', style: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      REFUNDED: { label: 'Remboursé', style: 'bg-gray-50 text-gray-600 border-gray-200' },
      FULFILLED: { label: 'Expédié', style: 'bg-blue-50 text-blue-700 border-blue-200' },
      UNFULFILLED: { label: 'Préparation', style: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    }
    return map[status] ?? { label: status, style: 'bg-gray-50 text-gray-600 border-gray-200' }
  }

  return (
    <div className="bg-[#f4f6f1] min-h-screen">
      <div className="container py-12 md:py-16 max-w-3xl">
        <Link href="/account" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#89a890] hover:text-[#1a2e23] mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Mon espace
        </Link>

        <h1 className="font-display text-[35px] md:text-[42px] font-black uppercase tracking-tighter text-[#1a2e23] leading-none mb-8">
          Mes commandes
        </h1>

        {orders.length === 0 ? (
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
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const financial = getStatusLabel(order.financialStatus)
              const fulfillment = getStatusLabel(order.fulfillmentStatus)
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
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${financial.style}`}>
                        {financial.label}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${fulfillment.style}`}>
                        {fulfillment.label}
                      </span>
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
                    <Link href={`/account/orders/${order.id}`} className="text-[11px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-[#1a2e23]/10 text-[#1a2e23] hover:bg-[#1a2e23]/5 transition-all">
                      Détails →
                    </Link>
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
