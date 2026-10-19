// STANDBY 2026-05-23 : coaching + vetements masques de la nav
// (cf. tech-specs/site-rewrite-copy-v1.md §2 et brief recentrage)
// Logique `isCoaching` retiree : tout le site est desormais nutrition-only.
// Switcher d'univers retire au profit d'un bandeau promo simple.
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ShoppingBag, Menu, X, ChevronDown, Search, User, Loader2, Phone, Navigation, MapPin } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useCustomer } from '@/context/CustomerContext'
import { cn, formatPrice } from '@/lib/utils'
import { BODY_START_STORES, type ShopifyCollection } from '@/lib/shopify/types'
import { GOOGLE_DIRECTIONS_URL } from '@/lib/store-info'
import { FREE_SHIPPING_LABEL } from '@/lib/shipping'
import { cssSaison, dateSaison, periodeActive, prochainChangement, type PeriodeSaison, type ThemeSaison } from '@/lib/saison'
import DecorSaison from './DecorSaison'
import LogoSaison from '@/components/saison/LogoSaison'

type SearchResult = {
  id: string
  handle: string
  title: string
  image: string | null
  price: string
  currency: string
  /** Les variantes n'ont pas toutes le même prix : « dès ». */
  from?: boolean
  availableForSale?: boolean
  /** « whey vanille » : variante trouvée, la fiche s'ouvre dessus (?variant=). */
  variantId?: string | null
  variantTitle?: string | null
}

type NavCategory = { label: string; href: string; children?: { label: string; href: string }[] }

const NAV_CATEGORIES: NavCategory[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Tous les produits', href: '/products' },
  { label: 'Packs & Économies', href: '/packs' },
  { label: 'La boutique', href: '/stores' },
  { label: 'Conseil gratuit', href: '/conseil' },
]

// Rayons du burger mobile — 1 tap vers la catégorie (le burger est LA nav
// principale sur téléphone : sans ça, « créatine » = ouvrir /products puis
// manipuler les filtres, ou scroller jusqu'au footer).
// Source de vérité des 9 slugs SEO : src/lib/categories.ts (import évité
// exprès — le registre embarque les intros complètes, trop lourd en client).
// Accessoires/Boissons n'ont pas de page SEO → filtre /products?cat=.
const MOBILE_CATEGORY_LINKS: { label: string; href: string }[] = [
  { label: 'Protéines', href: '/categories/proteines' },
  { label: 'Créatine', href: '/categories/creatine' },
  { label: 'Barres protéinées', href: '/categories/barres-proteinees' },
  { label: 'Pré-workout', href: '/categories/pre-workout' },
  { label: 'Acides aminés', href: '/categories/acides-amines' },
  { label: 'Brûleurs', href: '/categories/bruleurs' },
  { label: 'Boosters', href: '/categories/boosters' },
  { label: 'Glucides', href: '/categories/glucides' },
  { label: 'Santé & bien-être', href: '/categories/sante' },
  { label: 'Accessoires', href: '/products?cat=accessoires' },
  { label: 'Boissons', href: '/products?cat=boissons' },
]

interface HeaderProps {
  collections?: ShopifyCollection[]
  /** Mode saison : périodes du metafield bodystart.saison (lib/saison). */
  saison?: PeriodeSaison[]
  /** Période active au moment du rendu serveur (HTML en cache). */
  themeServeur?: ThemeSaison | null
  /** Hors production : ?saison_date=AAAA-MM-JJ force la date (preview). */
  previsualisation?: boolean
}

const STORE = BODY_START_STORES.find((s) => s.isActive) ?? BODY_START_STORES[0]
// « 07 61 84 75 80 » → tel:+33761847580
const STORE_TEL = `tel:+33${STORE.phone.replace(/\s/g, '').replace(/^0/, '')}`

export default function Header({ saison = [], themeServeur = null, previsualisation = false }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchTotal, setSearchTotal] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  // Hauteur des résultats visible au-dessus du clavier (visualViewport).
  const [hauteurResultats, setHauteurResultats] = useState<number | null>(null)

  const { totalQuantity, openCart } = useCart()
  const { isLoggedIn, customer } = useCustomer()
  const router = useRouter()
  const pathname = usePathname()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchResultsRef = useRef<HTMLDivElement>(null)

  // Mode saison : le serveur rend la période active à l'heure du rendu (HTML
  // en cache jusqu'à 15 min) ; le navigateur la recalcule à l'heure pile et
  // rebascule tout seul à la prochaine borne, sans recharger.
  const [theme, setTheme] = useState<ThemeSaison | null>(themeServeur)
  useEffect(() => {
    if (saison.length === 0) return
    const forcee = previsualisation ? new URLSearchParams(window.location.search).get('saison_date') : null
    if (forcee) {
      setTheme(periodeActive(saison, dateSaison(forcee, previsualisation))?.theme ?? null)
      return
    }
    let minuterie: ReturnType<typeof setTimeout> | undefined
    const maj = () => {
      const now = new Date()
      setTheme(periodeActive(saison, now)?.theme ?? null)
      const prochain = prochainChangement(saison, now)
      const delai = prochain ? prochain.getTime() - now.getTime() : null
      // setTimeout plafonne à ~24 j ; au-delà, la page aura été rechargée.
      if (delai !== null && delai < 24 * 3600 * 1000) minuterie = setTimeout(maj, delai + 500)
    }
    maj()
    return () => clearTimeout(minuterie)
  }, [saison, previsualisation])
  const periode = saison.find((p) => p.theme === theme) ?? null

  // Mobile (bug du 17/10/2026) : le clavier restait ouvert et cachait les
  // résultats. Il se ferme sur Entrée/« Rechercher » et dès qu'on fait défiler
  // la liste.
  const fermerClavier = () => {
    if (document.activeElement === searchInputRef.current) searchInputRef.current?.blur()
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // A11y : le dropdown recherche replié (max-h-0 opacity-0) reste dans le DOM —
  // sans inert, son input et ses liens restaient tabbables invisibles.
  // UN SEUL effet inert+focus, dans CET ordre : retirer inert PUIS focus —
  // focus() sur un élément encore inert est silencieusement ignoré (bug attrapé
  // en review : deux effets séparés cassaient l'autofocus à l'ouverture).
  const searchPanelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const panel = searchPanelRef.current
    if (!panel) return
    if (isSearchOpen) {
      panel.removeAttribute('inert')
      searchInputRef.current?.focus()
    } else {
      panel.setAttribute('inert', '')
    }
  }, [isSearchOpen])

  // Live search avec debounce 200ms
  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length < 2) {
      setSearchResults([])
      setSearchTotal(0)
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
        setSearchTotal(data.total ?? data.results?.length ?? 0)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setSearchResults([])
          setSearchTotal(0)
        }
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
      setSearchTotal(0)
    }
  }, [isSearchOpen])

  // Liste des résultats lisible au-dessus du clavier : sur iOS, le clavier ne
  // réduit pas la fenêtre (85vh débordait dessous), seul visualViewport le
  // sait. La liste s'arrête au bord haut du clavier tant qu'il est ouvert.
  const afficheResultats = isSearchOpen && searchQuery.trim().length >= 2
  useEffect(() => {
    const vv = window.visualViewport
    if (!afficheResultats || !vv) {
      setHauteurResultats(null)
      return
    }
    const maj = () => {
      const haut = searchResultsRef.current?.getBoundingClientRect().top ?? 0
      setHauteurResultats(Math.max(160, Math.floor(vv.offsetTop + vv.height - haut - 8)))
    }
    maj()
    vv.addEventListener('resize', maj)
    vv.addEventListener('scroll', maj)
    return () => {
      vv.removeEventListener('resize', maj)
      vv.removeEventListener('scroll', maj)
    }
  }, [afficheResultats])

  useEffect(() => {
    setIsSearchOpen(false)
    // Le Header vit dans le layout : son state survit aux navigations. Sans
    // cette ligne, naviguer via le LOGO (seul lien sans onClick de fermeture)
    // laissait le menu burger déplié par-dessus la nouvelle page.
    setMobileOpen(false)
    setMobileCatsOpen(false)
  }, [pathname])

  return (
    <header className={cn(
      'sticky top-0 z-50 transition-shadow duration-300',
      scrolled ? 'shadow-md' : 'shadow-none'
    )}>
      {/* ─── Bandeau promo (top bar) ─── Mode saison (lib/saison) : même
          bandeau, texte, lien et couleurs de la période ; liseré accent_2 en
          ombre intérieure (hauteur inchangée) ; décor aux deux bouts. */}
      {periode ? (
        <div
          className="relative z-50"
          style={{ backgroundColor: periode.accent, color: periode.texteSurAccent, boxShadow: `inset 0 -2px 0 ${periode.accent2}` }}
          data-saison={periode.theme}
        >
          <style>{cssSaison(periode)}</style>
          <div className="container relative">
            <DecorSaison decor={periode.decor} />
            {periode.lien ? (
              <Link
                href={periode.lien}
                className={cn('block text-center text-[11px] font-semibold py-2 underline-offset-2 hover:underline', periode.decor && 'px-8 sm:px-10')}
              >
                {periode.texte}
              </Link>
            ) : (
              <p className={cn('text-center text-[11px] font-semibold py-2', periode.decor && 'px-8 sm:px-10')}>{periode.texte}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-ink relative z-50">
          <div className="container">
            <p className="text-center text-[11px] text-white/80 font-medium py-2">
              Livraison offerte {FREE_SHIPPING_LABEL} · Click &amp; Collect gratuit · Conseil gratuit en boutique
            </p>
          </div>
        </div>
      )}

      {/* ─── Header principal ─── */}
      {/* saison-entete, saison-lien-nav : liseré et soulignés du thème pendant
          une période décorée (lib/saison, CSS_THEME), rien hors période. */}
      <div className="saison-entete border-b transition-colors relative z-40 bg-white border-spruce/10">
        <nav className="container relative">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo — ferme le burger même si on est DÉJÀ sur '/' (l'effet
                [pathname] ne se déclenche pas quand le pathname ne change pas) */}
            <Link href="/" className="relative flex-shrink-0 flex min-h-[44px] items-center" onClick={() => setMobileOpen(false)}>
              {/* PAS de priority : le hero de la home doit rester le SEUL preload
                  prioritaire (2 preloads high se concurrençaient) ; le logo, 10 Ko,
                  arrive de toute façon très tôt. */}
              <Image
                src="/assets/logos/logo-v2-horizontal.png"
                alt="BodyStart Nutrition"
                width={155}
                height={50}
                className="h-10 w-auto"
              />
              <LogoSaison theme={theme} />
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
                      'saison-lien-nav flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-colors whitespace-nowrap',
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
                className="flex h-11 w-11 items-center justify-center rounded-full transition-colors text-ink hover:text-spruce hover:bg-sage"
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

              {/* Panier — ferme le burger d'abord : sinon le menu restait
                  déplié DERRIÈRE le drawer et réapparaissait à sa fermeture */}
              <button
                onClick={() => {
                  setMobileOpen(false)
                  openCart()
                }}
                className="relative flex h-11 items-center gap-2 px-4 sm:px-5 text-white rounded-full text-sm font-semibold transition-colors ml-1 bg-fresh hover:bg-fresh-deep"
                aria-label={
                  totalQuantity > 0
                    ? `Ouvrir le panier, ${totalQuantity} article${totalQuantity > 1 ? 's' : ''}`
                    : 'Ouvrir le panier'
                }
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
                className="lg:hidden flex h-11 w-11 items-center justify-center rounded-full transition-colors ml-1 text-ink hover:bg-sage"
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
          ref={searchPanelRef}
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
                fermerClavier()
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
                  type="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit, une marque, un objectif..."
                  aria-label="Rechercher un produit"
                  className="w-full text-base font-medium py-4 pl-14 pr-14 rounded-full outline-none border-2 transition-colors bg-canvas border-spruce/15 text-ink focus:border-fresh placeholder-ink-mute [&::-webkit-search-cancel-button]:hidden"
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
              ref={searchResultsRef}
              onTouchMove={fermerClavier}
              onScroll={fermerClavier}
              className="overflow-y-auto overscroll-contain"
              style={{
                maxHeight:
                  hauteurResultats !== null
                    ? `min(calc(85vh - 110px), ${hauteurResultats}px)`
                    : 'calc(85vh - 110px)',
              }}
            >
              <div className="container max-w-5xl mx-auto pb-6">
                {searchResults.length > 0 ? (
                  <>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 text-ink-mute">
                      {searchTotal} produit{searchTotal > 1 ? 's' : ''} trouvé{searchTotal > 1 ? 's' : ''}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                      {searchResults.map((result) => (
                        <Link
                          key={result.id}
                          href={`/products/${result.handle}${result.variantId ? `?variant=${result.variantId}` : ''}`}
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
                            {result.variantTitle && (
                              <p className="text-xs font-medium text-ink-mute line-clamp-1">{result.variantTitle}</p>
                            )}
                            <p className="text-sm font-bold mt-0.5 text-spruce">
                              {result.from && <span className="mr-1 font-medium text-ink-mute">dès</span>}
                              {formatPrice({ amount: result.price, currencyCode: result.currency })}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {searchTotal > searchResults.length && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false)
                          router.push('/search?q=' + encodeURIComponent(searchQuery.trim()))
                        }}
                        className="w-full mt-6 flex items-center justify-center gap-2 text-sm font-semibold py-4 rounded-full transition-colors bg-fresh text-white hover:bg-fresh-deep"
                      >
                        Voir les {searchTotal} résultats
                        <ChevronDown className="w-4 h-4 -rotate-90" />
                      </button>
                    )}
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
                <div key={item.label}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'saison-lien-nav flex items-center justify-between px-4 py-3.5 text-sm transition-colors rounded-2xl',
                      active
                        ? 'text-spruce bg-sage font-semibold'
                        : 'font-medium text-ink hover:text-spruce hover:bg-sage'
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>

                  {/* Rayons en accordéon, juste sous « Tous les produits » */}
                  {item.href === '/products' && (
                    <div>
                      <button
                        onClick={() => setMobileCatsOpen(!mobileCatsOpen)}
                        aria-expanded={mobileCatsOpen}
                        className="flex items-center justify-between w-full px-4 py-3.5 text-sm font-medium text-ink hover:text-spruce hover:bg-sage rounded-2xl transition-colors"
                      >
                        Catégories
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 text-ink-mute transition-transform',
                            mobileCatsOpen && 'rotate-180'
                          )}
                        />
                      </button>
                      {mobileCatsOpen && (
                        <div className="ml-4 pl-3 border-l border-spruce/10 space-y-0.5 pb-1">
                          {MOBILE_CATEGORY_LINKS.map((cat) => (
                            <Link
                              key={cat.href}
                              href={cat.href}
                              onClick={() => setMobileOpen(false)}
                              className="block px-4 py-2.5 text-sm font-medium text-ink-mute hover:text-spruce hover:bg-sage rounded-xl transition-colors"
                            >
                              {cat.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
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

            {/* La boutique, en bas du menu : adresse, horaires, appel, itinéraire */}
            <div className="rounded-[20px] bg-sage p-4">
              <p className="flex items-start gap-2 text-[14px] font-semibold text-spruce">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                {STORE.address}, Coignières
              </p>
              <p className="mt-1 pl-6 text-[14px] text-ink-mute">Du lundi au samedi, 11 h à 19 h</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a
                  href={STORE_TEL}
                  className="press inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-fresh px-4 text-[14px] font-semibold text-white hover:bg-fresh-deep transition-colors"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  Appeler
                </a>
                <a
                  href={GOOGLE_DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-white px-4 text-[14px] font-semibold text-spruce hover:bg-canvas transition-colors"
                >
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  Itinéraire
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
