'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
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
  { label: '💪 Prise de muscle', href: '/objectifs/prise-de-muscle' },
  { label: '🔥 Perte de poids', href: '/objectifs/perte-de-poids' },
  { label: '⚡ Énergie & Endurance', href: '/objectifs/energie' },
  { label: '🌙 Récupération', href: '/objectifs/recuperation' },
  { label: '🛡️ Immunité', href: '/objectifs/immunite' },
]

// Construit la navigation dynamiquement depuis les collections Shopify
function buildNutritionCategories(collections: ShopifyCollection[]): NavCategory[] {
  const nav: NavCategory[] = []

  nav.push({ label: 'Tous les produits', href: '/products' })

  if (collections.length > 0) {
    nav.push({
      label: 'Nos collections',
      href: '/collections',
      children: collections.map((c) => ({ label: c.title, href: `/collections/${c.handle}` })),
    })
  }

  nav.push({
    label: 'Par objectif',
    href: '/objectifs',
    children: OBJECTIFS_CHILDREN,
  })

  nav.push({ label: 'Nos conseils', href: '/blog' })
  nav.push({ label: 'La boutique', href: '/stores' })
  nav.push({ label: 'Conseil gratuit', href: '/conseil' })

  return nav
}

interface HeaderProps {
  collections?: ShopifyCollection[]
}

export default function Header({ collections = [] }: HeaderProps) {
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
  const nutritionCategories = buildNutritionCategories(collections)
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
      <div className="bg-gray-950 border-b border-white/10 relative z-50">
        <div className="container">
          <div className="flex items-center justify-between">
            {/* Switcher univers */}
            <div className="flex items-center">
              <Link
                href="/"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors",
                  !isCoaching ? "text-white border-b-2 border-brand-500" : "text-white/50 hover:text-white/80"
                )}
              >
                {!isCoaching && <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />}
                Nutrition
              </Link>
              <Link
                href="/coaching"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors",
                  isCoaching ? "text-white border-b-2 border-coaching-cyan-400" : "text-white/50 hover:text-white/80"
                )}
              >
                {isCoaching && <span className="w-1.5 h-1.5 bg-coaching-cyan-400 rounded-full" />}
                Coaching
                {!isCoaching && <span className="hidden sm:inline text-[9px] bg-coaching-cyan-400/20 text-coaching-cyan-400 px-1.5 py-0.5 rounded-full font-bold">Bientôt</span>}
              </Link>
              <Link
                href="/vetements"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white/50 hover:text-white/80 transition-colors whitespace-nowrap"
              >
                Vêtements
                <span className="hidden sm:inline text-[9px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded-full font-bold">Bientôt</span>
              </Link>
            </div>
            {/* Promo droite */}
            <p className="hidden md:block text-xs text-white/60 font-medium py-2">
              🚚 Livraison offerte dès 60€ · Click &amp; Collect disponible
            </p>
          </div>
        </div>
      </div>

      {/* ─── Header principal ─── */}
      <div className={cn(
        "border-b transition-colors relative z-40",
        isCoaching ? "bg-gray-950 border-white/10" : "bg-white border-gray-100"
      )}>
        <nav className="container relative">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <Link href={isCoaching ? "/coaching" : "/"} className="flex items-center flex-shrink-0">
              <Image
                src={isCoaching ? "/assets/logos/logo-coaching.png" : "/assets/logos/logo-nutrition.png"}
                alt={isCoaching ? "Body Start Coaching" : "Body Start Nutrition"}
                width={160}
                height={48}
                className="h-8 w-auto"
                priority
              />
            </Link>

            {/* Nav desktop */}
            <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
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
                      "flex items-center gap-1.5 px-3 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-colors whitespace-nowrap",
                      isCoaching ? "text-white hover:text-coaching-cyan-400 hover:bg-white/5" : "text-gray-900 hover:text-brand-700 hover:bg-brand-50"
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

                  {/* Méga menu — toujours dans le DOM, visible/invisible via CSS */}
                  {item.children && (
                    <div className={cn(
                      "absolute top-full left-1/2 -translate-x-1/2 pt-2 w-64 z-50",
                      "transition-all duration-150 ease-out",
                      activeDropdown === item.label
                        ? "opacity-100 visible translate-y-0 pointer-events-auto"
                        : "opacity-0 invisible -translate-y-1 pointer-events-none"
                    )}>
                      <div className={cn(
                        "rounded-sm py-2 border-2 max-h-80 overflow-y-auto",
                        isCoaching ? "bg-gray-950 shadow-[6px_6px_0_theme(colors.coaching-cyan.400)] border-coaching-cyan-400"
                                   : "bg-white shadow-[6px_6px_0_theme(colors.gray.900)] border-gray-900"
                      )}>
                        {item.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className={cn(
                              "block px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-colors",
                              isCoaching ? "text-white hover:bg-white/5 hover:text-coaching-cyan-400"
                                         : "text-gray-900 hover:bg-brand-50 hover:text-brand-700"
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
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Recherche */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={cn(
                  "hidden md:flex p-2 rounded-sm transition-colors border-2 border-transparent",
                  isCoaching ? "text-white hover:text-coaching-cyan-400 hover:bg-white/5 hover:border-white/20"
                             : "text-gray-900 hover:text-brand-700 hover:bg-brand-50 hover:border-gray-200"
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
                    "hidden md:flex items-center gap-2 px-3 py-2 rounded-sm transition-colors text-[10px] font-black uppercase tracking-widest border-2 border-transparent",
                    isCoaching ? "text-white hover:bg-white/5 hover:border-white/20" : "text-gray-900 hover:bg-brand-50 hover:border-gray-200"
                  )}
                  aria-label="Mon compte"
                >
                  <div className={cn(
                    "w-6 h-6 rounded-sm flex items-center justify-center text-[10px] font-bold border-2",
                    isCoaching ? "bg-white text-gray-950 border-white" : "bg-gray-900 text-white border-gray-900"
                  )}>
                    {customer?.firstName?.[0]?.toUpperCase() ?? <User className="w-3 h-3" />}
                  </div>
                  <span className="hidden lg:inline">{customer?.firstName ?? 'Compte'}</span>
                </Link>
              ) : (
                <Link
                  href={`/login${authQuery}`}
                  className={cn(
                    "hidden md:flex p-2 rounded-sm transition-colors border-2 border-transparent",
                    isCoaching ? "text-white hover:text-coaching-cyan-400 hover:bg-white/5 hover:border-white/20"
                               : "text-gray-900 hover:text-brand-700 hover:bg-brand-50 hover:border-gray-200"
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
                  "relative flex items-center gap-2 px-4 py-2 text-white rounded-sm text-[10px] font-black uppercase tracking-widest border-2 transition-all ml-2",
                  isCoaching
                    ? "bg-coaching-cyan-500 border-coaching-cyan-500 hover:bg-coaching-cyan-400 hover:border-coaching-cyan-400 shadow-[2px_2px_0_theme(colors.black)] hover:shadow-[4px_4px_0_theme(colors.black)] hover:-translate-y-0.5 text-black"
                    : "bg-brand-700 border-brand-700 hover:bg-brand-800 hover:border-brand-900 shadow-[2px_2px_0_theme(colors.black)] hover:shadow-[4px_4px_0_theme(colors.black)] hover:-translate-y-0.5"
                )}
                aria-label="Ouvrir le panier"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Panier</span>
                {totalQuantity > 0 && (
                  <span className={cn(
                    "absolute -top-2 -right-2 w-5 h-5 text-white border-2 text-[10px] rounded-sm flex items-center justify-center font-bold leading-none",
                    isCoaching ? "bg-gray-950 border-coaching-cyan-500" : "bg-gray-900 border-white"
                  )}>
                    {totalQuantity > 9 ? '9+' : totalQuantity}
                  </span>
                )}
              </button>

              {/* Burger mobile */}
              <button
                className={cn(
                  "lg:hidden p-2 rounded-sm border-2 border-transparent transition-colors ml-2",
                  isCoaching ? "text-white hover:bg-white/10 hover:border-white/20" : "text-gray-900 hover:bg-gray-100 hover:border-gray-200"
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
            isCoaching ? "bg-gray-950 border-white/10" : "bg-white border-gray-100"
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
                placeholder={isCoaching ? "RECHERCHER UN PROGRAMME..." : "RECHERCHER UN PRODUIT..."}
                className={cn(
                  "w-full text-sm font-black uppercase tracking-widest py-4 pl-12 pr-6 rounded-sm outline-none border-2 transition-colors",
                  isCoaching
                    ? "bg-gray-900 border-gray-800 text-white focus:border-coaching-cyan-500 placeholder-gray-600 shadow-[4px_4px_0_theme(colors.black)]"
                    : "bg-gray-50 border-gray-200 text-gray-900 focus:border-brand-500 placeholder-gray-400 shadow-[4px_4px_0_theme(colors.gray.200)]"
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
          isCoaching ? "bg-gray-950 border-white/10" : "bg-white border-gray-100"
        )}>
          <div className="container py-4 space-y-1">
            {activeCategories.map((item) => (
              <div key={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-4 py-4 text-[10px] font-black uppercase tracking-widest transition-colors border-b-2",
                    isCoaching ? "text-white hover:bg-white/5 hover:text-coaching-cyan-400 border-white/5"
                               : "text-gray-900 hover:bg-brand-50 hover:text-brand-700 border-gray-50"
                  )}
                  onClick={() => !item.children && setMobileOpen(false)}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <div className={cn(
                    "ml-4 pl-4 border-l-4 space-y-0.5 mb-2 mt-2",
                    isCoaching ? "border-coaching-cyan-500" : "border-brand-500"
                  )}>
                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className={cn(
                          "block py-3 text-[10px] font-black uppercase tracking-widest transition-colors",
                          isCoaching ? "text-gray-400 hover:text-coaching-cyan-400" : "text-gray-500 hover:text-brand-700"
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

            {/* Mobile Auth Links */}
            <div className={cn(
              "border-y-2 py-4 my-4",
              isCoaching ? "border-white/10" : "border-gray-100"
            )}>
              {isLoggedIn ? (
                <Link
                  href={`/account${authQuery}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors",
                    isCoaching ? "text-white hover:text-coaching-cyan-400" : "text-gray-900 hover:text-brand-700"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Mon Compte
                </Link>
              ) : (
                <Link
                  href={`/login${authQuery}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors",
                    isCoaching ? "text-white hover:text-coaching-cyan-400" : "text-gray-900 hover:text-brand-700"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Connexion / Inscription
                </Link>
              )}
            </div>

            {/* Liens univers */}
            <div className={cn(
              "border-t-2 pt-4 mt-2",
              isCoaching ? "border-white/10" : "border-gray-100"
            )}>
              {!isCoaching && (
                <Link href="/coaching" className="flex items-center justify-between px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-colors" onClick={() => setMobileOpen(false)}>
                  Coaching <span className="text-[9px] bg-gray-100 border-2 border-gray-200 text-gray-500 px-1.5 py-0.5 rounded-sm font-black uppercase tracking-widest">Bientôt</span>
                </Link>
              )}
              <Link href="/vetements" className={cn(
                "flex items-center justify-between px-4 py-4 text-[10px] font-black uppercase tracking-widest transition-colors",
                isCoaching ? "text-gray-500 hover:bg-white/5" : "text-gray-400 hover:bg-gray-50"
              )} onClick={() => setMobileOpen(false)}>
                Vêtements <span className={cn(
                  "text-[9px] border-2 px-1.5 py-0.5 rounded-sm font-black uppercase tracking-widest",
                  isCoaching ? "bg-white/5 border-white/10 text-gray-500" : "bg-gray-100 border-gray-200 text-gray-500"
                )}>Bientôt</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
