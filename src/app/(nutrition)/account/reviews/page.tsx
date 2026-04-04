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
    <div className="bg-[#f4f6f1] min-h-screen">
      <div className="container py-12 md:py-16 max-w-3xl">
        <Link href="/account" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#89a890] hover:text-[#1a2e23] mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Mon compte
        </Link>

        <h1 className="font-display text-[35px] md:text-[42px] font-black uppercase tracking-tighter text-[#1a2e23] leading-none mb-8">
          Mes avis
        </h1>

        <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-[#1a2e23]/5 flex items-center justify-center mx-auto mb-6">
            <Star className="w-8 h-8 text-[#1a2e23]" />
          </div>
          <h2 className="font-display font-black uppercase tracking-tight text-[#1a2e23] text-lg mb-2">Aucun avis pour le moment</h2>
          <p className="text-sm text-[#4a5f4c] mb-8 max-w-sm mx-auto font-medium">
            Après avoir reçu une commande, vous pourrez noter et commenter les produits achetés.
          </p>
          <Link href="/products" className="inline-flex items-center gap-2 px-8 py-4 bg-[#1a2e23] text-white text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#2e4f3c] transition-all shadow-lg">
            <Package className="w-4 h-4" />
            Découvrir nos produits
          </Link>
        </div>
      </div>
    </div>
  )
}
