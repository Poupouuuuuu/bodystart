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
      <div className="min-h-[60vh] flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-brand-700" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  const orders = customer.orders?.nodes ?? []

  const getStatusStyle = (status: string) => {
    const map: Record<string, string> = {
      PAID: 'bg-brand-100 text-brand-700',
      PENDING: 'bg-yellow-100 text-yellow-700',
      REFUNDED: 'bg-gray-100 text-gray-600',
      FULFILLED: 'bg-blue-100 text-blue-700',
      UNFULFILLED: 'bg-yellow-100 text-yellow-700',
    }
    return map[status] ?? 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="container py-10 md:py-14 max-w-3xl">
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-700 mb-7 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Mon espace
      </Link>

      <h1 className="font-display text-2xl font-bold text-gray-900 mb-7 flex items-center gap-2">
        <Package className="w-6 h-6 text-brand-700" />
        Mes commandes ({orders.length})
      </h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
          <ShoppingBag className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="font-semibold text-gray-700 mb-2">Aucune commande pour le moment</p>
          <p className="text-gray-400 text-sm mb-6">Vos commandes apparaîtront ici.</p>
          <Link href="/products" className="btn-primary">Découvrir nos produits</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-brand-200 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                <div>
                  <p className="font-bold text-gray-900">Commande #{order.orderNumber}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(order.processedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusStyle(order.financialStatus)}`}>
                    {order.financialStatus}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusStyle(order.fulfillmentStatus)}`}>
                    {order.fulfillmentStatus}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                {order.lineItems.nodes.slice(0, 5).map((item, i) => (
                  <div key={i} className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                    {item.variant?.image ? (
                      <Image src={item.variant.image.url} alt={item.title} width={56} height={56} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-300">BS</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <p className="font-bold text-lg text-gray-900">{formatPrice(order.currentTotalPrice)}</p>
                <Link href={`/account/orders/${order.id}`} className="btn-secondary text-sm py-2 px-4">
                  Voir le détail →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
