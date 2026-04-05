'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Package, Loader2 } from 'lucide-react'
import { useCustomer } from '@/context/CustomerContext'
import { formatPrice } from '@/lib/utils'

const STATUS_MAP: Record<string, { label: string; style: string }> = {
  PAID: { label: 'Payé', style: 'bg-green-50 text-green-700 border-green-200' },
  PENDING: { label: 'En attente', style: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  REFUNDED: { label: 'Remboursé', style: 'bg-gray-50 text-gray-600 border-gray-200' },
  FULFILLED: { label: 'Expédié', style: 'bg-blue-50 text-blue-700 border-blue-200' },
  UNFULFILLED: { label: 'Préparation', style: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
}

function getStatusLabel(status: string) {
  return STATUS_MAP[status] ?? { label: status, style: 'bg-gray-50 text-gray-600 border-gray-200' }
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { customer, isLoading, isLoggedIn } = useCustomer()

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

  const orderId = decodeURIComponent(params.id as string)
  const order = customer.orders?.nodes.find((o) => o.id === orderId)

  if (!order) {
    return (
      <div className="bg-[#f4f6f1] min-h-screen">
        <div className="container py-12 md:py-16 max-w-3xl">
          <Link href="/account/orders" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#89a890] hover:text-[#1a2e23] mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Mes commandes
          </Link>
          <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 py-20 text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-[#1a2e23]/5 flex items-center justify-center mx-auto mb-6">
              <Package className="w-8 h-8 text-[#89a890]" />
            </div>
            <p className="font-display font-black uppercase tracking-tight text-[#1a2e23] text-lg mb-2">Commande introuvable</p>
            <p className="text-sm text-[#4a5f4c] font-medium">Cette commande n&apos;existe pas ou n&apos;est plus disponible.</p>
          </div>
        </div>
      </div>
    )
  }

  const financial = getStatusLabel(order.financialStatus)
  const fulfillment = getStatusLabel(order.fulfillmentStatus)
  const items = order.lineItems.nodes

  return (
    <div className="bg-[#f4f6f1] min-h-screen">
      <div className="container py-12 md:py-16 max-w-3xl">
        <Link href="/account/orders" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#89a890] hover:text-[#1a2e23] mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Mes commandes
        </Link>

        {/* ─── En-tête ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-[35px] md:text-[42px] font-black uppercase tracking-tighter text-[#1a2e23] leading-none">
              Commande #{order.orderNumber}
            </h1>
            <p className="text-sm font-medium text-[#89a890] mt-2">
              {new Date(order.processedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${financial.style}`}>
              {financial.label}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${fulfillment.style}`}>
              {fulfillment.label}
            </span>
          </div>
        </div>

        {/* ─── Articles ─── */}
        <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 overflow-hidden shadow-sm mb-6">
          <div className="px-6 md:px-8 py-5 border-b border-[#1a2e23]/5">
            <h2 className="font-display font-black uppercase tracking-tight text-[#1a2e23] text-sm">
              Articles ({items.length})
            </h2>
          </div>

          <div className="divide-y divide-[#1a2e23]/5">
            {items.map((item, i) => (
              <div key={i} className="px-6 md:px-8 py-5 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#f4f6f1] border border-[#1a2e23]/5 flex-shrink-0">
                  {item.variant?.image ? (
                    <Image src={item.variant.image.url} alt={item.title} width={64} height={64} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-[#89a890]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-[#1a2e23] text-sm truncate">{item.title}</p>
                  <p className="text-[12px] text-[#89a890] font-medium mt-0.5">Quantité : {item.quantity}</p>
                </div>
                {item.variant?.price && (
                  <p className="font-black text-[#1a2e23] text-sm flex-shrink-0">
                    {formatPrice({
                      amount: (parseFloat(item.variant.price.amount) * item.quantity).toFixed(2),
                      currencyCode: item.variant.price.currencyCode,
                    })}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ─── Total ─── */}
        <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-display font-black uppercase tracking-tight text-[#1a2e23] text-sm">Total</span>
            <span className="font-black text-2xl text-[#1a2e23]">{formatPrice(order.currentTotalPrice)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
