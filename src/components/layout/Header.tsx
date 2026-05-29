// STANDBY 2026-05-23 : coaching + vetements masques de la nav
// (cf. tech-specs/site-rewrite-copy-v1.md §2 et brief recentrage)
// Logique `isCoaching` retiree : tout le site est desormais nutrition-only.
// Switcher d'univers retire au profit d'un bandeau promo simple.
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Suspense, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ShoppingBag, Menu, X, ChevronDown, Search, User, Loader2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useCustomer } from '@/context/CustomerContext'
import { cn, formatPrice } from '@/lib/utils'
import type { ShopifyCollection } from '@/lib/shopify/types'

type SearchResult = {
  id: string
  handle: string
  title: string
  image: string | null
  price: string
  currency: string
}

type NavCategory = { label: string; href: string; children?: { label: string; href: string }[] }

const NAV_CATEGORIES: NavCategory[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Tous les produits', href: '/products' },
  { label: 'Packs & Économies', href: '/packs' },
  { label: 'La boutique', href: '/stores' },
  { label: 'Conseil gratuit', href: '/conseil' },
]

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

function HeaderInner(_props: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const { totalQuantity, openCart } = useCart()
  const { isLoggedIn, customer } = useCustomer()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Live search avec debounce 200ms
  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/search?q=' + encodeURIComponent(q), {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setSearchResults(data.results ?? [])
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 200)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [searchQuery])

  // Reset search en fermeture / changement de page
  useEffect(() => {
    if (!isSearchOpen) {
      setSearchQuery('')
      setSearchResults([])
    }
  }, [isSearchOpen])

  useEffect(() => {
    setIsSearchOpen(false)
  }, [pathname])

  return (
    <header className={cn(
      'sticky top-0 z-50 transition-shadow duration-300',
      scrolled ? 'shadow-md' : 'shadow-none'
    )}>
      {/* ─── Bandeau promo (top bar) ─── */}
      <div className="bg-[#1A1A1A] relative z-50">
        <div className="container">
          <p className="text-center text-[11px] text-white/80 font-medium py-2">
            Livraison offerte dès 85€ · Click &amp; Collect gratuit · Conseil gratuit en boutique
          </p>
        </div>
      </div>

      {/* ─── Header principal ─── */}
      <div className="border-b transition-colors relative z-40 bg-white border-cream-300">
        <nav className="container relative">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/assets/logos/Logo_texte.png"
                alt="BodyStart"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>

            {/* Nav desktop */}
            <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {NAV_CATEGORIES.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap text-gray-700 hover:text-brand-500 hover:bg-brand-50"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Actions droite */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Recherche */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="hidden md:flex p-2 rounded-full transition-colors text-gray-700 hover:text-brand-500 hover:bg-brand-50"
                aria-label="Rechercher"
              >
                {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </button>

              {/* Mon compte */}
              {isLoggedIn ? (
                <Link
                  href="/account"
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full transition-colors text-sm font-medium text-gray-700 hover:bg-brand-50"
                  aria-label="Mon compte"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-brand-500 text-white">
                    {customer?.firstName?.[0]?.toUpperCase() ?? <User className="w-3.5 h-3.5" />}
                  </div>
                  <span className="hidden lg:inline">{customer?.firstName ?? 'Compte'}</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="hidden md:flex p-2 rounded-full transition-colors text-gray-700 hover:text-brand-500 hover:bg-brand-50"
                  aria-label="Connexion"
                >
                  <User className="w-5 h-5" />
                </Link>
              )}

              {/* Panier */}
              <button
                onClick={openCart}
                className="relative flex items-center gap-2 px-5 py-2.5 text-white rounded-full text-sm font-bold transition-all ml-1 bg-brand-500 hover:bg-brand-600 shadow-md hover:shadow-lg"
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
                className="lg:hidden p-2 rounded-full transition-colors ml-1 text-gray-700 hover:bg-cream-200"
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
            "absolute left-0 w-full border-b transition-[max-height,opacity] duration-300 ease-out z-30 shadow-xl bg-white border-cream-300",
            isSearchOpen ? "max-h-[85vh] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
          )}
          style={{ top: '100%' }}
        >
          <div className="container max-w-5xl mx-auto pt-5 pb-2">
            <form
              className="relative"
              onSubmit={(e) => {
                e.preventDefault()
                const q = searchQuery.trim()
                if (q) {
                  setIsSearchOpen(false)
                  router.push('/search?q=' + encodeURIComponent(q))
                }
              }}
            >
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit, une marque, un objectif..."
                  className="w-full text-base font-medium py-4 pl-14 pr-14 rounded-full outline-none border-2 transition-colors bg-cream-100 border-cream-200 text-gray-900 focus:border-brand-500 placeholder-gray-400"
                  autoFocus={isSearchOpen}
                />
                {isSearching ? (
                  <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-brand-500" />
                ) : searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors text-gray-500 hover:bg-cream-200"
                    aria-label="Effacer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Zone scrollable des résultats */}
          {searchQuery.trim().length >= 2 && (
            <div
              className="overflow-y-auto overscroll-contain"
              style={{ maxHeight: 'calc(85vh - 110px)' }}
            >
              <div className="container max-w-5xl mx-auto pb-6">
                {searchResults.length > 0 ? (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-4 text-gray-400">
                      {searchResults.length} produit{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                      {searchResults.map((result) => (
                        <Link
                          key={result.id}
                          href={`/products/${result.handle}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="group relative flex flex-col rounded-2xl border overflow-hidden transition-all hover:-translate-y-0.5 bg-white border-cream-200 hover:border-brand-500/40 hover:shadow-lg"
                        >
                          <div className="relative aspect-square overflow-hidden bg-cream-100">
                            {result.image ? (
                              <Image
                                src={result.image}
                                alt={result.title}
                                fill
                                sizes="(min-width: 768px) 200px, 50vw"
                                className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Search className="w-8 h-8 text-cream-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 p-3">
                            <p className="text-sm font-semibold line-clamp-2 leading-snug min-h-[2.5rem] text-gray-900">
                              {result.title}
                            </p>
                            <p className="text-sm font-bold mt-0.5 text-brand-500">
                              {formatPrice({ amount: result.price, currencyCode: result.currency })}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false)
                        router.push('/search?q=' + encodeURIComponent(searchQuery.trim()))
                      }}
                      className="w-full mt-6 flex items-center justify-center gap-2 text-sm font-bold py-4 rounded-full transition-all bg-brand-500 text-white hover:bg-brand-600 shadow-md hover:shadow-lg"
                    >
                      Voir tous les résultats pour « {searchQuery.trim()} »
                      <ChevronDown className="w-4 h-4 -rotate-90" />
                    </button>
                  </>
                ) : (
                  !isSearching && (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-cream-100">
                        <Search className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold mb-1 text-gray-900">
                        Aucun produit trouvé
                      </p>
                      <p className="text-xs text-gray-500">
                        Essayez avec un autre mot-clé
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Menu mobile ─── */}
      {mobileOpen && (
        <div className="lg:hidden border-t max-h-[80vh] overflow-y-auto animate-slide-up relative z-50 bg-white border-cream-300">
          <div className="container py-4 space-y-1">
            {NAV_CATEGORIES.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between px-4 py-3.5 text-sm font-medium transition-colors rounded-2xl text-gray-700 hover:bg-brand-50 hover:text-brand-500"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile Auth */}
            <div className="border-y py-4 my-4 border-cream-300">
              <Link
                href={isLoggedIn ? '/account' : '/login'}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-2xl text-gray-700 hover:text-brand-500"
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
