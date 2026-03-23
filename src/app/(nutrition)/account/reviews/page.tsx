'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Star, ArrowLeft, Package } from 'lucide-react'
import { useCustomer } from '@/context/CustomerContext'

export default function ReviewsPage() {
  const router = useRouter()
  const { isLoading, isLoggedIn } = useCustomer()

  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.push('/login')
  }, [isLoading, isLoggedIn, router])

  if (isLoading) return null

  return (
    <div className="container py-10 max-w-3xl">
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-700 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Mon compte
      </Link>

      <h1 className="font-display text-2xl font-bold text-gray-900 mb-8">Mes avis</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="font-semibold text-gray-900 mb-2">Vous n&apos;avez pas encore laissé d&apos;avis</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
          Après avoir reçu une commande, vous pourrez noter et commenter les produits achetés.
        </p>
        <Link href="/products" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl hover:bg-brand-800 transition-colors">
          <Package className="w-4 h-4" />
          Découvrir nos produits
        </Link>
      </div>
    </div>
  )
}
