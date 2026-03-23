'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { User, Package, MapPin, LogOut, ChevronRight, ShoppingBag, Star, Gift } from 'lucide-react'
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
      <div className={cn("min-h-[60vh] flex items-center justify-center", isCoaching ? "bg-gray-950 text-white" : "bg-white")}>
        <div className="flex flex-col items-center gap-3">
          <svg className={cn("animate-spin h-8 w-8", isCoaching ? "text-coaching-cyan-500" : "text-brand-700")} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-[10px] font-black uppercase tracking-widest">Chargement de votre espace...</p>
        </div>
      </div>
    )
  }

  if (!customer) return null

  const recentOrders = customer.orders?.nodes?.slice(0, 3) ?? []

  const getOrderStatusLabel = (status: string) => {
    const map: Record<string, { label: string; color: string; colorDark: string }> = {
      PAID: { label: 'Payé', color: 'bg-brand-100 text-brand-700', colorDark: 'bg-coaching-cyan-900 border-coaching-cyan-500 text-coaching-cyan-400' },
      PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', colorDark: 'border-yellow-500 text-yellow-400' },
      REFUNDED: { label: 'Remboursé', color: 'bg-gray-100 text-gray-600', colorDark: 'border-gray-500 text-gray-400' },
      PARTIALLY_REFUNDED: { label: 'Partiel. remboursé', color: 'bg-orange-100 text-orange-700', colorDark: 'border-orange-500 text-orange-400' },
      FULFILLED: { label: 'Expédié', color: 'bg-blue-100 text-blue-700', colorDark: 'border-blue-500 text-blue-400' },
      UNFULFILLED: { label: 'Préparation', color: 'bg-yellow-100 text-yellow-700', colorDark: 'border-yellow-500 text-yellow-400' },
    }
    return map[status] ?? { label: status, color: 'bg-gray-100 text-gray-600', colorDark: 'border-gray-500 text-gray-400' }
  }

  return (
    <div className={cn("transition-colors", isCoaching ? "bg-gray-950 text-white pb-20" : "")}>
      <div className="container py-10 md:py-14">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-12 gap-4 flex-wrap">
          <div>
            <p className={cn(
              "text-[10px] font-black uppercase tracking-widest border-l-4 pl-2 mb-2",
              isCoaching ? "text-coaching-cyan-400 border-coaching-cyan-500" : "text-brand-700 border-brand-500"
            )}>Mon espace</p>
            <h1 className={cn(
              "font-display text-4xl font-black uppercase tracking-tight leading-none",
              isCoaching ? "text-white" : "text-gray-900"
            )}>
              Bonjour, {customer.firstName} 👋
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest border-2 rounded-sm transition-all hover:-translate-y-0.5",
              isCoaching 
                ? "text-gray-400 border-gray-800 hover:border-gray-600 hover:text-white shadow-[2px_2px_0_theme(colors.transparent)] hover:shadow-[4px_4px_0_theme(colors.black)]" 
                : "text-gray-500 border-gray-200 hover:border-gray-900 hover:text-gray-900 shadow-[2px_2px_0_theme(colors.transparent)] hover:shadow-[4px_4px_0_theme(colors.gray.900)]"
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
              "rounded-sm border-2 p-6 transition-colors",
              isCoaching 
                ? "bg-gray-900 border-gray-800 shadow-[4px_4px_0_theme(colors.black)]" 
                : "bg-white border-gray-200 shadow-[4px_4px_0_theme(colors.gray.200)]"
            )}>
              <div className="flex items-center gap-4 mb-6">
                <div className={cn(
                  "w-12 h-12 border-2 rounded-sm flex items-center justify-center font-black text-xl flex-shrink-0 transition-colors",
                  isCoaching ? "bg-gray-950 border-gray-800 text-white" : "bg-gray-900 border-gray-900 text-white"
                )}>
                  {customer.firstName?.charAt(0)}{customer.lastName?.charAt(0)}
                </div>
                <div>
                  <p className={cn("font-black uppercase tracking-tight text-lg leading-tight", isCoaching ? "text-white" : "text-gray-900")}>
                    {customer.firstName} {customer.lastName}
                  </p>
                  <p className={cn("text-sm font-medium", isCoaching ? "text-gray-400" : "text-gray-500")}>
                    {customer.email}
                  </p>
                </div>
              </div>
              <Link 
                href={`/account/profile${authQuery}`} 
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-sm border-2 border-transparent text-[10px] font-black uppercase tracking-widest transition-all group",
                  isCoaching ? "text-white hover:border-gray-800 hover:bg-gray-950" : "text-gray-900 hover:border-gray-900 hover:bg-gray-50"
                )}
              >
                <span className="flex items-center gap-2">
                  <User className={cn("w-4 h-4", isCoaching ? "text-coaching-cyan-400" : "text-brand-700")} />
                  Modifier mon profil
                </span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Navigation compte */}
            <div className={cn(
              "rounded-sm border-2 overflow-hidden transition-colors",
              isCoaching 
                ? "bg-gray-900 border-gray-800 shadow-[4px_4px_0_theme(colors.black)]" 
                : "bg-white border-gray-200 shadow-[4px_4px_0_theme(colors.gray.200)]"
            )}>
              {[
                { Icon: Package, label: 'Mes commandes', href: `/account/orders${authQuery}`, count: customer.orders?.nodes?.length },
                { Icon: MapPin, label: 'Mes adresses', href: `/account/addresses${authQuery}` },
                { Icon: Star, label: 'Mes avis', href: `/account/reviews${authQuery}` },
                { Icon: Gift, label: 'Parrainage', href: `/account/referral${authQuery}` },
              ].map(({ Icon, label, href, count }) => (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    "flex items-center justify-between px-6 py-4 transition-colors border-b-2 last:border-0 group",
                    isCoaching 
                      ? "hover:bg-gray-950 border-gray-800" 
                      : "hover:bg-gray-50 border-gray-100"
                  )}
                >
                  <span className={cn(
                    "flex items-center gap-3 text-xs font-black uppercase tracking-tight",
                    isCoaching ? "text-white group-hover:text-coaching-cyan-400" : "text-gray-900 group-hover:text-brand-700"
                  )}>
                    <Icon className={cn("w-4 h-4 transition-colors", isCoaching ? "text-coaching-cyan-500 group-hover:text-coaching-cyan-400" : "text-brand-700")} />
                    {label}
                  </span>
                  <div className="flex items-center gap-3">
                    {count !== undefined && count > 0 && (
                      <span className={cn(
                        "text-[10px] border-2 font-black px-2 py-0.5 rounded-sm",
                        isCoaching ? "bg-gray-950 border-coaching-cyan-500 text-coaching-cyan-400" : "bg-brand-50 border-brand-200 text-brand-700"
                      )}>
                        {count}
                      </span>
                    )}
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform group-hover:translate-x-1",
                      isCoaching ? "text-gray-600 group-hover:text-white" : "text-gray-400 group-hover:text-gray-900"
                    )} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ─── Colonne droite : Dernières commandes ─── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Commandes récentes */}
            <div className={cn(
              "rounded-sm border-2 overflow-hidden transition-colors",
              isCoaching 
                ? "bg-gray-900 border-gray-800 shadow-[4px_4px_0_theme(colors.black)]" 
                : "bg-white border-gray-200 shadow-[4px_4px_0_theme(colors.gray.200)]"
            )}>
              <div className={cn(
                "flex items-center justify-between px-6 py-5 border-b-2 transition-colors",
                isCoaching ? "bg-gray-950 border-gray-800" : "bg-gray-50 border-gray-100"
              )}>
                <h2 className={cn(
                  "font-display font-black uppercase tracking-tight text-xl flex items-center gap-2 leading-none",
                  isCoaching ? "text-white" : "text-gray-900"
                )}>
                  <ShoppingBag className={cn("w-5 h-5", isCoaching ? "text-coaching-cyan-500" : "text-brand-700")} />
                  Dernières commandes
                </h2>
                {recentOrders.length > 0 && (
                  <Link href={`/account/orders${authQuery}`} className={cn(
                    "text-[10px] font-black uppercase tracking-widest hover:underline underline-offset-4 transition-colors",
                    isCoaching ? "text-coaching-cyan-400 hover:text-white" : "text-brand-700 hover:text-gray-900"
                  )}>
                    Voir tout →
                  </Link>
                )}
              </div>

              {recentOrders.length === 0 ? (
                <div className="py-20 text-center px-6">
                  <ShoppingBag className={cn("w-12 h-12 mx-auto mb-4", isCoaching ? "text-gray-700" : "text-gray-300")} />
                  <p className={cn("font-black uppercase tracking-tight text-lg mb-2", isCoaching ? "text-white" : "text-gray-900")}>Aucune commande</p>
                  <p className={cn("text-sm font-medium mb-8", isCoaching ? "text-gray-400" : "text-gray-500")}>Vous n'avez pas encore passé de commande.</p>
                  <Link href={isCoaching ? "/coaching" : "/products"} className={cn(
                    "inline-flex font-black text-[10px] uppercase tracking-widest px-8 py-4 rounded-sm border-2 transition-all hover:-translate-y-0.5",
                    isCoaching 
                      ? "bg-coaching-cyan-500 border-coaching-cyan-500 text-black shadow-[4px_4px_0_theme(colors.black)] hover:bg-coaching-cyan-400" 
                      : "bg-brand-700 border-brand-700 text-white shadow-[4px_4px_0_theme(colors.gray.900)] hover:bg-brand-800"
                  )}>
                    {isCoaching ? "VOIR LES PROGRAMMES" : "DÉCOUVRIR NOS PRODUITS"}
                  </Link>
                </div>
              ) : (
                <div className={cn("divide-y-2", isCoaching ? "divide-gray-800" : "divide-gray-100")}>
                  {recentOrders.map((order) => {
                    const financial = getOrderStatusLabel(order.financialStatus)
                    const fulfillment = getOrderStatusLabel(order.fulfillmentStatus)
                    return (
                      <div key={order.id} className={cn("p-6 transition-colors", isCoaching ? "hover:bg-gray-950/50" : "hover:bg-gray-50/50")}>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <p className={cn("font-black uppercase tracking-tight text-sm", isCoaching ? "text-white" : "text-gray-900")}>
                              Commande #{order.orderNumber}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                              {new Date(order.processedAt).toLocaleDateString('fr-FR', {
                                day: 'numeric', month: 'long', year: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-wrap justify-end">
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-widest border-2 px-2 py-1 rounded-sm",
                              isCoaching ? financial.colorDark : financial.color.replace('bg-', 'border-').replace(/bg-\w+-100/, 'bg-white')
                            )}>
                              {financial.label}
                            </span>
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-widest border-2 px-2 py-1 rounded-sm",
                              isCoaching ? fulfillment.colorDark : fulfillment.color.replace('bg-', 'border-').replace(/bg-\w+-100/, 'bg-white')
                            )}>
                              {fulfillment.label}
                            </span>
                          </div>
                        </div>

                        {/* Produits */}
                        <div className="flex gap-3 mb-6">
                          {order.lineItems.nodes.slice(0, 4).map((item, i) => (
                            <div key={i} className={cn(
                              "w-14 h-14 rounded-sm overflow-hidden flex-shrink-0 border-2",
                              isCoaching ? "bg-gray-950 border-gray-800" : "bg-gray-50 border-gray-200"
                            )}>
                              {item.variant?.image ? (
                                <Image src={item.variant.image.url} alt={item.title} width={56} height={56} className="object-cover w-full h-full" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">BS</div>
                              )}
                            </div>
                          ))}
                          {order.lineItems.nodes.length > 4 && (
                            <div className={cn(
                              "w-14 h-14 border-2 rounded-sm flex items-center justify-center text-sm font-black",
                              isCoaching ? "bg-gray-950 border-gray-800 text-gray-500" : "bg-gray-100 border-gray-200 text-gray-500"
                            )}>
                              +{order.lineItems.nodes.length - 4}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <p className={cn("font-black text-lg", isCoaching ? "text-white" : "text-gray-900")}>
                            {formatPrice(order.currentTotalPrice)}
                          </p>
                          <Link href={`/account/orders/${order.id}${authQuery}`} className={cn(
                            "text-[10px] font-black uppercase tracking-widest border-2 px-4 py-2 rounded-sm transition-all hover:-translate-y-0.5",
                            isCoaching 
                              ? "text-white border-gray-800 hover:border-gray-500 shadow-[2px_2px_0_theme(colors.transparent)] hover:shadow-[4px_4px_0_theme(colors.black)]" 
                              : "text-gray-900 border-gray-200 hover:border-gray-900 shadow-[2px_2px_0_theme(colors.transparent)] hover:shadow-[4px_4px_0_theme(colors.gray.900)]"
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest text-2xl animate-pulse">CHARGEMENT...</div>}>
      <AccountContent />
    </Suspense>
  )
}
