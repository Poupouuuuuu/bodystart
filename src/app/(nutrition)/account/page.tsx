'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { User, Package, MapPin, LogOut, ChevronRight, ShoppingBag, Star, Gift, Dumbbell } from 'lucide-react'
import { useCustomer } from '@/context/CustomerContext'
import { formatPrice, cn } from '@/lib/utils'

function AccountContent() {
  const router = useRouter()
  const { customer, isLoading, isLoggedIn, logout } = useCustomer()
  const searchParams = useSearchParams()

  const isCoaching = searchParams.get('theme') === 'coaching'
  const authQuery = isCoaching ? '?theme=coaching' : ''

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push(`/login${authQuery}`)
    }
  }, [isLoading, isLoggedIn, router, authQuery])

  async function handleLogout() {
    await logout()
    router.push(isCoaching ? '/coaching' : '/')
  }

  if (isLoading) {
    return (
      <div className={cn("min-h-[60vh] flex items-center justify-center", isCoaching ? "bg-gray-950 text-white" : "bg-[#f4f6f1]")}>
        <div className="flex flex-col items-center gap-3">
          <svg className={cn("animate-spin h-8 w-8", isCoaching ? "text-coaching-cyan-500" : "text-[#1a2e23]")} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c]">Chargement de votre espace...</p>
        </div>
      </div>
    )
  }

  if (!customer) return null

  const recentOrders = customer.orders?.nodes?.slice(0, 3) ?? []

  const getOrderStatusLabel = (status: string) => {
    const map: Record<string, { label: string; color: string; colorDark: string }> = {
      PAID: { label: 'Payé', color: 'bg-green-50 text-green-700 border-green-200', colorDark: 'bg-coaching-cyan-900 border-coaching-cyan-500 text-coaching-cyan-400' },
      PENDING: { label: 'En attente', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', colorDark: 'border-yellow-500 text-yellow-400' },
      REFUNDED: { label: 'Remboursé', color: 'bg-gray-50 text-gray-600 border-gray-200', colorDark: 'border-gray-500 text-gray-400' },
      PARTIALLY_REFUNDED: { label: 'Partiel. remboursé', color: 'bg-orange-50 text-orange-700 border-orange-200', colorDark: 'border-orange-500 text-orange-400' },
      FULFILLED: { label: 'Expédié', color: 'bg-blue-50 text-blue-700 border-blue-200', colorDark: 'border-blue-500 text-blue-400' },
      UNFULFILLED: { label: 'Préparation', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', colorDark: 'border-yellow-500 text-yellow-400' },
    }
    return map[status] ?? { label: status, color: 'bg-gray-50 text-gray-600 border-gray-200', colorDark: 'border-gray-500 text-gray-400' }
  }

  return (
    <div className={cn("transition-colors min-h-screen", isCoaching ? "bg-gray-950 text-white pb-20" : "bg-[#f4f6f1]")}>
      <div className="container py-12 md:py-16">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-12 gap-4 flex-wrap">
          <div>
            <h1 className={cn(
              "font-display text-[35px] md:text-[45px] font-black uppercase tracking-tighter leading-none",
              isCoaching ? "text-white" : "text-[#1a2e23]"
            )}>
              Bonjour, {customer.firstName} 👋
            </h1>
            <p className={cn("text-sm font-medium mt-2", isCoaching ? "text-gray-400" : "text-[#4a5f4c]")}>
              Gérez votre compte, vos commandes et vos adresses.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className={cn(
              "inline-flex items-center gap-2 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest border rounded-full transition-all hover:-translate-y-0.5",
              isCoaching 
                ? "text-gray-400 border-gray-800 hover:border-gray-600 hover:text-white" 
                : "text-[#4a5f4c] border-[#1a2e23]/10 hover:border-[#1a2e23]/30 hover:text-[#1a2e23]"
            )}
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ─── Colonne gauche : Nav + Infos ─── */}
          <div className="space-y-6">
            {/* Profil */}
            <div className={cn(
              "rounded-[24px] p-6 transition-colors border",
              isCoaching 
                ? "bg-gray-900 border-gray-800" 
                : "bg-white border-[#1a2e23]/5 shadow-sm"
            )}>
              <div className="flex items-center gap-4 mb-6">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0 transition-colors",
                  isCoaching ? "bg-gray-950 text-white" : "bg-[#1a2e23] text-white"
                )}>
                  {customer.firstName?.charAt(0)}{customer.lastName?.charAt(0)}
                </div>
                <div>
                  <p className={cn("font-display font-black uppercase tracking-tight text-lg leading-tight", isCoaching ? "text-white" : "text-[#1a2e23]")}>
                    {customer.firstName} {customer.lastName}
                  </p>
                  <p className={cn("text-sm font-medium", isCoaching ? "text-gray-400" : "text-[#4a5f4c]")}>
                    {customer.email}
                  </p>
                </div>
              </div>
              <Link 
                href={`/account/profile${authQuery}`} 
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all group",
                  isCoaching ? "text-white hover:bg-gray-950" : "text-[#1a2e23] hover:bg-[#f4f6f1]"
                )}
              >
                <span className="flex items-center gap-2">
                  <User className={cn("w-4 h-4", isCoaching ? "text-coaching-cyan-400" : "text-[#89a890]")} />
                  Modifier mon profil
                </span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Navigation compte */}
            <div className={cn(
              "rounded-[24px] overflow-hidden transition-colors border",
              isCoaching 
                ? "bg-gray-900 border-gray-800" 
                : "bg-white border-[#1a2e23]/5 shadow-sm"
            )}>
              {[
                { Icon: Package, label: 'Mes commandes', href: `/account/orders${authQuery}`, count: customer.orders?.nodes?.length },
                { Icon: MapPin, label: 'Mes adresses', href: `/account/addresses${authQuery}` },
                { Icon: Star, label: 'Mes avis', href: `/account/reviews${authQuery}` },
                { Icon: Gift, label: 'Parrainage', href: `/account/referral${authQuery}` },
                { Icon: Dumbbell, label: 'Mon coaching', href: `/account/coaching${authQuery}` },
              ].map(({ Icon, label, href, count }) => (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    "flex items-center justify-between px-6 py-4 transition-colors border-b last:border-0 group",
                    isCoaching 
                      ? "hover:bg-gray-950 border-gray-800" 
                      : "hover:bg-[#f4f6f1] border-[#1a2e23]/5"
                  )}
                >
                  <span className={cn(
                    "flex items-center gap-3 text-[12px] font-bold uppercase tracking-widest",
                    isCoaching ? "text-white group-hover:text-coaching-cyan-400" : "text-[#1a2e23] group-hover:text-[#4a5f4c]"
                  )}>
                    <Icon className={cn("w-4 h-4 transition-colors", isCoaching ? "text-coaching-cyan-500" : "text-[#89a890]")} />
                    {label}
                  </span>
                  <div className="flex items-center gap-3">
                    {count !== undefined && count > 0 && (
                      <span className={cn(
                        "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                        isCoaching ? "bg-gray-950 border-coaching-cyan-500 text-coaching-cyan-400" : "bg-[#1a2e23]/5 border-[#1a2e23]/10 text-[#1a2e23]"
                      )}>
                        {count}
                      </span>
                    )}
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform group-hover:translate-x-1",
                      isCoaching ? "text-gray-600 group-hover:text-white" : "text-[#89a890] group-hover:text-[#1a2e23]"
                    )} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ─── Colonne droite : Dernières commandes ─── */}
          <div className="lg:col-span-2 space-y-6">
            <div className={cn(
              "rounded-[24px] overflow-hidden transition-colors border",
              isCoaching 
                ? "bg-gray-900 border-gray-800" 
                : "bg-white border-[#1a2e23]/5 shadow-sm"
            )}>
              <div className={cn(
                "flex items-center justify-between px-8 py-6 border-b transition-colors",
                isCoaching ? "border-gray-800" : "border-[#1a2e23]/5"
              )}>
                <h2 className={cn(
                  "font-display font-black uppercase tracking-tighter text-xl flex items-center gap-2 leading-none",
                  isCoaching ? "text-white" : "text-[#1a2e23]"
                )}>
                  <ShoppingBag className={cn("w-5 h-5", isCoaching ? "text-coaching-cyan-500" : "text-[#89a890]")} />
                  Dernières commandes
                </h2>
                {recentOrders.length > 0 && (
                  <Link href={`/account/orders${authQuery}`} className={cn(
                    "text-[11px] font-bold uppercase tracking-widest hover:underline underline-offset-4 transition-colors",
                    isCoaching ? "text-coaching-cyan-400 hover:text-white" : "text-[#89a890] hover:text-[#1a2e23]"
                  )}>
                    Voir tout →
                  </Link>
                )}
              </div>

              {recentOrders.length === 0 ? (
                <div className="py-20 text-center px-6">
                  <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6", isCoaching ? "bg-gray-800" : "bg-[#1a2e23]/5")}>
                    <ShoppingBag className={cn("w-8 h-8", isCoaching ? "text-gray-600" : "text-[#89a890]")} />
                  </div>
                  <p className={cn("font-display font-black uppercase tracking-tight text-lg mb-2", isCoaching ? "text-white" : "text-[#1a2e23]")}>Aucune commande</p>
                  <p className={cn("text-sm font-medium mb-8", isCoaching ? "text-gray-400" : "text-[#4a5f4c]")}>Vous n'avez pas encore passé de commande.</p>
                  <Link href={isCoaching ? "/coaching" : "/products"} className={cn(
                    "inline-flex text-[11px] font-bold uppercase tracking-widest px-8 py-4 rounded-full transition-all hover:-translate-y-0.5",
                    isCoaching 
                      ? "bg-coaching-cyan-500 text-black shadow-lg hover:bg-coaching-cyan-400" 
                      : "bg-[#1a2e23] text-white shadow-lg hover:bg-[#2e4f3c] hover:shadow-xl"
                  )}>
                    {isCoaching ? "VOIR LES PROGRAMMES" : "DÉCOUVRIR NOS PRODUITS"}
                  </Link>
                </div>
              ) : (
                <div className={cn("divide-y", isCoaching ? "divide-gray-800" : "divide-[#1a2e23]/5")}>
                  {recentOrders.map((order) => {
                    const financial = getOrderStatusLabel(order.financialStatus)
                    const fulfillment = getOrderStatusLabel(order.fulfillmentStatus)
                    return (
                      <div key={order.id} className={cn("p-6 md:p-8 transition-colors", isCoaching ? "hover:bg-gray-950/50" : "hover:bg-[#f4f6f1]/50")}>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <p className={cn("font-display font-bold uppercase tracking-tight text-sm", isCoaching ? "text-white" : "text-[#1a2e23]")}>
                              Commande #{order.orderNumber}
                            </p>
                            <p className="text-[11px] font-medium text-[#89a890] mt-1">
                              {new Date(order.processedAt).toLocaleDateString('fr-FR', {
                                day: 'numeric', month: 'long', year: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-wrap justify-end">
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wider border px-2.5 py-1 rounded-full",
                              isCoaching ? financial.colorDark : financial.color
                            )}>
                              {financial.label}
                            </span>
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wider border px-2.5 py-1 rounded-full",
                              isCoaching ? fulfillment.colorDark : fulfillment.color
                            )}>
                              {fulfillment.label}
                            </span>
                          </div>
                        </div>

                        {/* Produits */}
                        <div className="flex gap-3 mb-6">
                          {order.lineItems.nodes.slice(0, 4).map((item, i) => (
                            <div key={i} className={cn(
                              "w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 border",
                              isCoaching ? "bg-gray-950 border-gray-800" : "bg-[#f4f6f1] border-[#1a2e23]/5"
                            )}>
                              {item.variant?.image ? (
                                <Image src={item.variant.image.url} alt={item.title} width={56} height={56} className="object-cover w-full h-full" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#89a890] text-xs font-bold">BS</div>
                              )}
                            </div>
                          ))}
                          {order.lineItems.nodes.length > 4 && (
                            <div className={cn(
                              "w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-bold border",
                              isCoaching ? "bg-gray-950 border-gray-800 text-gray-500" : "bg-[#f4f6f1] border-[#1a2e23]/5 text-[#89a890]"
                            )}>
                              +{order.lineItems.nodes.length - 4}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <p className={cn("font-black text-xl", isCoaching ? "text-white" : "text-[#1a2e23]")}>
                            {formatPrice(order.currentTotalPrice)}
                          </p>
                          <Link href={`/account/orders/${order.id}${authQuery}`} className={cn(
                            "text-[11px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border transition-all hover:-translate-y-0.5",
                            isCoaching 
                              ? "text-white border-gray-800 hover:border-gray-500" 
                              : "text-[#1a2e23] border-[#1a2e23]/10 hover:border-[#1a2e23]/30 hover:bg-[#1a2e23]/5"
                          )}>
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
        </div>
      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f4f6f1]"><div className="font-display font-black uppercase tracking-widest text-xl text-[#1a2e23] animate-pulse">CHARGEMENT...</div></div>}>
      <AccountContent />
    </Suspense>
  )
}
