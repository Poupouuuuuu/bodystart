'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Suspense, useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ShoppingBag, Menu, X, ChevronDown, Search, User } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useCustomer } from '@/context/CustomerContext'
import { cn } from '@/lib/utils'
import type { ShopifyCollection } from '@/lib/shopify/types'

type NavCategory = { label: string; href: string; children?: { label: string; href: string }[] }

const COACHING_CATEGORIES: NavCategory[] = [
  { label: 'Programmes', href: '/coaching/programmes' },
  { label: 'Le Suivi', href: '/coaching/suivi' },
  { label: 'Résultats', href: '/coaching/resultats' },
  { label: 'Tarifs', href: '/coaching/tarifs' },
]

const OBJECTIFS_CHILDREN = [
  { label: 'Prise de muscle', href: '/objectifs/prise-de-muscle' },
  { label: 'Perte de poids', href: '/objectifs/perte-de-poids' },
  { label: 'Énergie & Endurance', href: '/objectifs/energie' },
  { label: 'Récupération', href: '/objectifs/recuperation' },
  { label: 'Immunité', href: '/objectifs/immunite' },
]

const EXCLUDED_NAV_COLLECTIONS = ['frontpage', 'home-page', 'homepage', 'selections', 'all']

function buildNutritionCategories(): NavCategory[] {
  return [
    { label: 'Tous les produits', href: '/products' },
    { label: 'La boutique', href: '/stores' },
    { label: 'Conseil gratuit', href: '/conseil' },
  ]
}

interface HeaderProps {
  collections?: ShopifyCollection[]
}

export default function Header(props: HeaderProps) {
  return (
    <Suspense fallback={<div className="h-[104px] bg-white border-b border-cream-300" />}>
      <HeaderInner {...props} />
    </Suspense>
  )
}

function HeaderInner({ collections = [] }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)

  const { totalQuantity, openCart } = useCart()
  const { isLoggedIn, customer } = useCustomer()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isCoaching = pathname?.startsWith('/coaching') || searchParams?.get('theme') === 'coaching'
  const nutritionCategories = buildNutritionCategories()
  const activeCategories = isCoaching ? COACHING_CATEGORIES : nutritionCategories
  const authQuery = isCoaching ? '?theme=coaching' : ''

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={cn(
      'sticky top-0 z-50 transition-shadow duration-300',
      scrolled ? 'shadow-md' : 'shadow-none'
    )}>
      {/* ─── Barre switcher univers ─── */}
      <div className="bg-[#1A1A1A] relative z-50">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors",
                  !isCoaching ? "text-white" : "text-white/50 hover:text-white/80"
                )}
              >
                {!isCoaching && <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />}
                Nutrition
              </Link>
              <Link
                href="/coaching"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors",
                  isCoaching ? "text-white" : "text-white/50 hover:text-white/80"
                )}
              >
                {isCoaching && <span className="w-1.5 h-1.5 bg-coaching-500 rounded-full" />}
                Coaching
              </Link>
              <Link
                href="/vetements"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white/50 hover:text-white/80 transition-colors whitespace-nowrap"
              >
                Vêtements
                <span className="hidden sm:inline text-[10px] bg-white/10 text-white/50 px-2 py-0.5 rounded-full font-medium">Bientôt</span>
              </Link>
            </div>
            <p className="hidden md:block text-xs text-white/60 font-medium py-2">
              Livraison offerte dès 60€ · Click &amp; Collect disponible
            </p>
          </div>
        </div>
      </div>

      {/* ─── Header principal ─── */}
      <div className={cn(
        "border-b transition-colors relative z-40",
        isCoaching ? "bg-gray-950 border-white/10" : "bg-white border-cream-300"
      )}>
        <nav className="container relative">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <Link href={isCoaching ? "/coaching" : "/"} className="flex-shrink-0">
              <Image
                src={isCoaching ? "/assets/logos/logo-coaching.png" : "/assets/logos/logo-nutrition.png"}
                alt={isCoaching ? "Body Start Coaching" : "Body Start Nutrition"}
                width={180}
                height={48}
                className={cn(
                  "h-10 w-auto",
                  isCoaching && "brightness-0 invert"
                )}
                priority
              />
            </Link>

            {/* Nav desktop */}
            <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {activeCategories.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => item.children && setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                      isCoaching ? "text-white hover:text-coaching-500 hover:bg-white/5" : "text-gray-700 hover:text-brand-500 hover:bg-brand-50"
                    )}
                  >
                    {item.label}
                    {item.children && (
                      <ChevronDown className={cn(
                        'w-3.5 h-3.5 transition-transform duration-200',
                        activeDropdown === item.label && 'rotate-180'
                      )} />
                    )}
                  </Link>

                  {item.children && (
                    <div className={cn(
                      "absolute top-full left-1/2 -translate-x-1/2 pt-2 w-56 z-50",
                      "transition-all duration-150 ease-out",
                      activeDropdown === item.label
                        ? "opacity-100 visible translate-y-0 pointer-events-auto"
                        : "opacity-0 invisible -translate-y-1 pointer-events-none"
                    )}>
                      <div className={cn(
                        "rounded-2xl py-2 border shadow-lg",
                        isCoaching ? "bg-gray-950 border-white/10" : "bg-white border-cream-300"
                      )}>
                        {item.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className={cn(
                              "block px-4 py-2.5 text-sm font-medium transition-colors",
                              isCoaching ? "text-white hover:bg-white/5 hover:text-coaching-500"
                                         : "text-gray-700 hover:bg-brand-50 hover:text-brand-500"
                            )}
                            onClick={() => setActiveDropdown(null)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Actions droite */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Recherche */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={cn(
                  "hidden md:flex p-2 rounded-full transition-colors",
                  isCoaching ? "text-white hover:text-coaching-500 hover:bg-white/5"
                             : "text-gray-700 hover:text-brand-500 hover:bg-brand-50"
                )}
                aria-label="Rechercher"
              >
                {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </button>

              {/* Mon compte */}
              {isLoggedIn ? (
                <Link
                  href={`/account${authQuery}`}
                  className={cn(
                    "hidden md:flex items-center gap-2 px-3 py-2 rounded-full transition-colors text-sm font-medium",
                    isCoaching ? "text-white hover:bg-white/5" : "text-gray-700 hover:bg-brand-50"
                  )}
                  aria-label="Mon compte"
                >
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                    isCoaching ? "bg-coaching-500 text-white" : "bg-brand-500 text-white"
                  )}>
                    {customer?.firstName?.[0]?.toUpperCase() ?? <User className="w-3.5 h-3.5" />}
                  </div>
                  <span className="hidden lg:inline">{customer?.firstName ?? 'Compte'}</span>
                </Link>
              ) : (
                <Link
                  href={`/login${authQuery}`}
                  className={cn(
                    "hidden md:flex p-2 rounded-full transition-colors",
                    isCoaching ? "text-white hover:text-coaching-500 hover:bg-white/5"
                               : "text-gray-700 hover:text-brand-500 hover:bg-brand-50"
                  )}
                  aria-label="Connexion"
                >
                  <User className="w-5 h-5" />
                </Link>
              )}

              {/* Panier */}
              <button
                onClick={openCart}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-2.5 text-white rounded-full text-sm font-bold transition-all ml-1",
                  isCoaching
                    ? "bg-coaching-500 hover:bg-coaching-cyan-400"
                    : "bg-brand-500 hover:bg-brand-600 shadow-md hover:shadow-lg"
                )}
                aria-label="Ouvrir le panier"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Panier</span>
                {totalQuantity > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none border-2 border-white">
                    {totalQuantity > 9 ? '9+' : totalQuantity}
                  </span>
                )}
              </button>

              {/* Burger mobile */}
              <button
                className={cn(
                  "lg:hidden p-2 rounded-full transition-colors ml-1",
                  isCoaching ? "text-white hover:bg-white/10" : "text-gray-700 hover:bg-cream-200"
                )}
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </nav>

        {/* ─── Inline Search Dropdown ─── */}
        <div
          className={cn(
            "absolute left-0 w-full border-b transition-all overflow-hidden z-30",
            isSearchOpen ? "max-h-32 opacity-100 py-4" : "max-h-0 opacity-0 py-0",
            isCoaching ? "bg-gray-950 border-white/10" : "bg-white border-cream-300"
          )}
          style={{ top: '100%' }}
        >
          <form
            className="container relative max-w-2xl mx-auto"
            onSubmit={(e) => {
              e.preventDefault()
              const input = e.currentTarget.querySelector('input') as HTMLInputElement
              const q = input?.value?.trim()
              if (q) {
                setIsSearchOpen(false)
                router.push('/search?q=' + encodeURIComponent(q))
              }
            }}
          >
            <div className="relative">
              <Search className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5",
                isCoaching ? "text-gray-500" : "text-gray-400"
              )} />
              <input
                type="text"
                placeholder={isCoaching ? "Rechercher un programme..." : "Rechercher un produit..."}
                className={cn(
                  "w-full text-sm font-medium py-4 pl-12 pr-6 rounded-full outline-none border transition-colors",
                  isCoaching
                    ? "bg-gray-900 border-white/10 text-white focus:border-coaching-500 placeholder-gray-600"
                    : "bg-cream-100 border-cream-300 text-gray-900 focus:border-brand-500 placeholder-gray-400"
                )}
                autoFocus={isSearchOpen}
              />
            </div>
          </form>
        </div>
      </div>

      {/* ─── Menu mobile ─── */}
      {mobileOpen && (
        <div className={cn(
          "lg:hidden border-t max-h-[80vh] overflow-y-auto animate-slide-up relative z-50",
          isCoaching ? "bg-gray-950 border-white/10" : "bg-white border-cream-300"
        )}>
          <div className="container py-4 space-y-1">
            {activeCategories.map((item) => (
              <div key={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-4 py-3.5 text-sm font-medium transition-colors rounded-2xl",
                    isCoaching ? "text-white hover:bg-white/5 hover:text-coaching-500"
                               : "text-gray-700 hover:bg-brand-50 hover:text-brand-500"
                  )}
                  onClick={() => !item.children && setMobileOpen(false)}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <div className="ml-4 pl-4 border-l-2 border-cream-300 space-y-0.5 mb-2 mt-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className={cn(
                          "block py-2.5 text-sm font-medium transition-colors",
                          isCoaching ? "text-gray-400 hover:text-coaching-500" : "text-gray-500 hover:text-brand-500"
                        )}
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Mobile Auth */}
            <div className={cn(
              "border-y py-4 my-4",
              isCoaching ? "border-white/10" : "border-cream-300"
            )}>
              <Link
                href={isLoggedIn ? `/account${authQuery}` : `/login${authQuery}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-2xl",
                  isCoaching ? "text-white hover:text-coaching-500" : "text-gray-700 hover:text-brand-500"
                )}
                onClick={() => setMobileOpen(false)}
              >
                <User className="w-4 h-4" />
                {isLoggedIn ? 'Mon Compte' : 'Connexion / Inscription'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
