// STANDBY 2026-05-23 : coaching + vetements masques de la nav
// (cf. tech-specs/site-rewrite-copy-v1.md §2 et brief recentrage)
// Logique `isCoaching` retiree : tout le site est desormais nutrition-only.
// Switcher d'univers retire au profit d'un bandeau promo simple.
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Suspense, useState, useEffect, useRef } from 'react'
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
  availableForSale?: boolean
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
    <Suspense fallback={<div className="h-[104px] bg-white border-b border-spruce/10" />}>
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
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Focus réel du champ à l'ouverture (autoFocus ne s'applique qu'au montage,
  // or l'input est toujours monté — replié en max-h-0).
  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus()
  }, [isSearchOpen])

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
      <div className="bg-ink relative z-50">
        <div className="container">
          <p className="text-center text-[11px] text-white/80 font-medium py-2">
            Livraison offerte dès 85€ · Click &amp; Collect gratuit · Conseil gratuit en boutique
          </p>
        </div>
      </div>

      {/* ─── Header principal ─── */}
      <div className="border-b transition-colors relative z-40 bg-white border-spruce/10">
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
              {NAV_CATEGORIES.map((item) => {
                const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-colors whitespace-nowrap',
                      active
                        ? 'text-spruce bg-sage font-semibold'
                        : 'font-medium text-ink hover:text-spruce hover:bg-sage'
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>

            {/* Actions droite */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Recherche — visible sur TOUTES les tailles (était hidden md:flex :
                  sous 768px il n'existait AUCUN moyen d'atteindre la recherche). */}
              <button
                onClick={() => {
                  // Exclusion mutuelle avec le menu burger : le dropdown recherche
                  // (z-30) se rendrait DERRIÈRE le panneau mobile (z-50) → clavier
                  // ouvert sur un champ invisible.
                  setMobileOpen(false)
                  setIsSearchOpen(!isSearchOpen)
                }}
                className="flex p-2 rounded-full transition-colors text-ink hover:text-spruce hover:bg-sage"
                aria-label="Rechercher"
                aria-expanded={isSearchOpen}
              >
                {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </button>

              {/* Mon compte */}
              {isLoggedIn ? (
                <Link
                  href="/account"
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full transition-colors text-sm font-medium text-ink hover:bg-sage"
                  aria-label="Mon compte"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-fresh text-white">
                    {customer?.firstName?.[0]?.toUpperCase() ?? <User className="w-3.5 h-3.5" />}
                  </div>
                  <span className="hidden lg:inline">{customer?.firstName ?? 'Compte'}</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="hidden md:flex p-2 rounded-full transition-colors text-ink hover:text-spruce hover:bg-sage"
                  aria-label="Connexion"
                >
                  <User className="w-5 h-5" />
                </Link>
              )}

              {/* Panier */}
              <button
                onClick={openCart}
                className="relative flex items-center gap-2 px-5 py-2.5 text-white rounded-full text-sm font-semibold transition-colors ml-1 bg-fresh hover:bg-fresh-deep"
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
                className="lg:hidden p-2 rounded-full transition-colors ml-1 text-ink hover:bg-sage"
                onClick={() => {
                  setIsSearchOpen(false) // exclusion mutuelle avec la recherche
                  setMobileOpen(!mobileOpen)
                }}
                aria-label="Menu"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </nav>

        {/* ─── Inline Search Dropdown ─── */}
        <div
          className={cn(
            "absolute left-0 w-full border-b transition-[max-height,opacity] duration-300 ease-out z-30 shadow-xl bg-white border-spruce/10",
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
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-mute" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit, une marque, un objectif..."
                  aria-label="Rechercher un produit"
                  className="w-full text-base font-medium py-4 pl-14 pr-14 rounded-full outline-none border-2 transition-colors bg-canvas border-spruce/15 text-ink focus:border-fresh placeholder-ink-mute"
                />
                {isSearching ? (
                  <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-fresh" />
                ) : searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors text-ink-mute hover:bg-sage"
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
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 text-ink-mute">
                      {searchResults.length} produit{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                      {searchResults.map((result) => (
                        <Link
                          key={result.id}
                          href={`/products/${result.handle}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="group relative flex flex-col rounded-2xl border overflow-hidden transition-all hover:-translate-y-0.5 bg-white border-spruce/10 hover:border-spruce/30 hover:shadow-[0_8px_30px_rgba(45,90,45,0.08)]"
                        >
                          <div className="relative aspect-square overflow-hidden bg-canvas">
                            {result.availableForSale === false && (
                              <span className="absolute top-2 left-2 z-10 inline-flex items-center bg-ink text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
                                Épuisé
                              </span>
                            )}
                            {result.image ? (
                              <Image
                                src={result.image}
                                alt={result.title}
                                fill
                                sizes="(min-width: 768px) 200px, 50vw"
                                className={cn("object-contain p-3 transition-transform duration-300 group-hover:scale-105", result.availableForSale === false && "opacity-60")}
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Search className="w-8 h-8 text-spruce/20" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 p-3">
                            <p className="text-sm font-semibold line-clamp-2 leading-snug min-h-[2.5rem] text-ink">
                              {result.title}
                            </p>
                            <p className="text-sm font-bold mt-0.5 text-spruce">
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
                      className="w-full mt-6 flex items-center justify-center gap-2 text-sm font-semibold py-4 rounded-full transition-colors bg-fresh text-white hover:bg-fresh-deep"
                    >
                      Voir tous les résultats pour « {searchQuery.trim()} »
                      <ChevronDown className="w-4 h-4 -rotate-90" />
                    </button>
                  </>
                ) : (
                  !isSearching && (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-sage">
                        <Search className="w-6 h-6 text-ink-mute" />
                      </div>
                      <p className="text-sm font-semibold mb-1 text-ink">
                        Aucun produit trouvé
                      </p>
                      <p className="text-xs text-ink-mute">
                        Essaie avec un autre mot-clé
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
        <div className="lg:hidden border-t max-h-[80vh] overflow-y-auto animate-slide-up relative z-50 bg-white border-spruce/10">
          <div className="container py-4 space-y-1">
            {NAV_CATEGORIES.map((item) => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center justify-between px-4 py-3.5 text-sm transition-colors rounded-2xl',
                    active
                      ? 'text-spruce bg-sage font-semibold'
                      : 'font-medium text-ink hover:text-spruce hover:bg-sage'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              )
            })}

            {/* Mobile Auth */}
            <div className="border-y py-4 my-4 border-spruce/10">
              <Link
                href={isLoggedIn ? '/account' : '/login'}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-2xl text-ink hover:text-spruce hover:bg-sage"
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
