'use client'

/**
 * /products catalogue V2 — DA claire.
 * Cf. tech-specs/redesign-v2-direction-artistique.md §B.Catalogue
 *
 * Refonte 2026-05-26 : logique de filtrage/state inchangee, refonte
 * visuelle complete (sentence case partout, palette V2, carte produit
 * allegee sans note pseudo-aleatoire ni selecteur qty, badges DA).
 */
import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { SlidersHorizontal, X, ChevronDown, Search, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductCardShop } from '@/components/product/ProductCardShop'
import type { ShopifyProduct, ShopifyCollection } from '@/lib/shopify/types'

// ─── Objectifs (bandeau haut) ───
const GOALS: { key: string; label: string; image: string | null; linkedCategories: string[] }[] = [
  { key: 'all', label: 'Tout voir', image: null, linkedCategories: [] },
  { key: 'muscle', label: 'Muscle', image: '/Logomuscle.png', linkedCategories: ['proteines', 'creatine', 'acides-amines'] },
  { key: 'energie', label: 'Énergie', image: '/Logoenergy.png', linkedCategories: ['boosters', 'pre-workout'] },
  { key: 'recuperation', label: 'Récupération', image: '/Logo-recuperation.png', linkedCategories: ['acides-amines', 'sante'] },
  { key: 'sante', label: 'Santé', image: '/Logo-sante-vitalite.png', linkedCategories: ['sante', 'bruleurs'] },
]

// ─── Tri ───
const SORT_OPTIONS = [
  { key: 'best', label: 'Meilleures ventes' },
  { key: 'price-asc', label: 'Prix croissant' },
  { key: 'price-desc', label: 'Prix décroissant' },
  { key: 'name', label: 'Nom A-Z' },
  { key: 'newest', label: 'Nouveautés' },
]

// ─── Catégories ───
// Filtre niveau 1 = champ natif Shopify `productType` (rempli partout).
// Sous-filtres = `tags` réels (lowercase, sans accent au catalogue).
// Le matching normalise des deux côtés (casse + diacritiques), donc les
// libellés d'affichage peuvent garder accents/pluriels sans casser le match.
type SubCategory = { key: string; label: string; tags: string[] }
type Category = { key: string; label: string; productTypes: string[]; subcategories: SubCategory[] }

const CATEGORIES: Category[] = [
  { key: 'proteines', label: 'Protéines', productTypes: ['Protéines'], subcategories: [
    { key: 'whey', label: 'Whey', tags: ['whey'] },
    { key: 'isolate', label: 'Isolate', tags: ['isolate'] },
    { key: 'gainer', label: 'Gainer', tags: ['gainer'] },
    { key: 'caseine', label: 'Caséine', tags: ['caseine'] },
  ]},
  { key: 'glucides', label: 'Glucides', productTypes: ['Glucides'], subcategories: [
    { key: 'riz', label: 'Riz', tags: ['riz'] },
  ]},
  { key: 'creatine', label: 'Créatine', productTypes: ['Créatine'], subcategories: [
    { key: 'monohydrate', label: 'Monohydrate', tags: ['monohydrate'] },
  ]},
  { key: 'pre-workout', label: 'Pré-workout', productTypes: ['Pré-workout'], subcategories: [] },
  { key: 'acides-amines', label: 'Acides aminés', productTypes: ['Acides aminés'], subcategories: [
    { key: 'bcaa', label: 'BCAA', tags: ['bcaa'] },
    { key: 'eaa', label: 'EAA', tags: ['eaa'] },
    { key: 'glutamine', label: 'Glutamine', tags: ['glutamine'] },
    { key: 'citrulline', label: 'Citrulline', tags: ['citrulline'] },
    { key: 'beta-alanine', label: 'Bêta-alanine', tags: ['beta-alanine'] },
  ]},
  { key: 'bruleurs', label: 'Brûleurs de graisse', productTypes: ['Brûleur'], subcategories: [
    { key: 'carnitine', label: 'Carnitine', tags: ['carnitine'] },
    { key: 'cla', label: 'CLA', tags: ['cla'] },
    { key: 'thermo-draineur', label: 'Thermo / Draineur', tags: ['thermo', 'draineur'] },
  ]},
  { key: 'boosters', label: 'Boosters', productTypes: ['Boosters'], subcategories: [
    { key: 'pump', label: 'Pump', tags: ['pump'] },
    { key: 'testo', label: 'Testo', tags: ['testo'] },
  ]},
  { key: 'sante', label: 'Santé & bien-être', productTypes: ['Santé'], subcategories: [
    { key: 'omega', label: 'Oméga', tags: ['omega'] },
    { key: 'vitamine', label: 'Vitamines', tags: ['vitamine'] },
    { key: 'multivitamine', label: 'Multivitamines', tags: ['multivitamine'] },
    { key: 'collagene', label: 'Collagène', tags: ['collagene'] },
    { key: 'magnesium', label: 'Magnésium', tags: ['magnesium'] },
    { key: 'zinc', label: 'Zinc', tags: ['zinc'] },
    { key: 'mineraux', label: 'Minéraux', tags: ['mineraux'] },
    { key: 'electrolytes', label: 'Électrolytes', tags: ['electrolytes'] },
  ]},
  { key: 'snacks', label: 'Snacks', productTypes: ['Snacks'], subcategories: [
    { key: 'barre', label: 'Barres', tags: ['barre'] },
  ]},
]

// Normalisation casse + diacritiques (accents) → matching robuste.
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function productMatchesCategory(p: ShopifyProduct, cat: Category): boolean {
  const pt = normalize(p.productType ?? '')
  return cat.productTypes.some((t) => normalize(t) === pt)
}

function productMatchesTags(p: ShopifyProduct, tags: string[]): boolean {
  const productTags = (p.tags ?? []).map(normalize)
  return tags.some((tag) => productTags.includes(normalize(tag)))
}

interface Props {
  products: ShopifyProduct[]
  collections: ShopifyCollection[]
  /** Stock total a Coignieres par productId (fetch server side via getInventoryForVariants) */
  stockByProductId?: Record<string, number>
}

export default function ProductsPageClient({ products, stockByProductId = {} }: Props) {
  const searchParams = useSearchParams()

  const initialCat = searchParams?.get('cat') ?? null
  const initialObj = searchParams?.get('obj') ?? 'all'
  const initialTag = searchParams?.get('tag') ?? null

  const [activeGoal, setActiveGoal] = useState(initialObj)
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCat)
  const [activeTag, setActiveTag] = useState<string | null>(initialTag)
  const [sortKey, setSortKey] = useState('best')
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200])
  const [visibleCount, setVisibleCount] = useState(12)
  const [searchQuery, setSearchQuery] = useState('')
  const [openSections, setOpenSections] = useState<Set<string>>(
    initialCat ? new Set([initialCat]) : new Set()
  )

  useEffect(() => {
    const cat = searchParams?.get('cat') ?? null
    const obj = searchParams?.get('obj') ?? 'all'
    const tag = searchParams?.get('tag') ?? null
    setActiveCategory(cat)
    setActiveGoal(obj)
    setActiveTag(tag)
    if (cat) setOpenSections((prev) => new Set(prev).add(cat))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const hasProducts = products.length > 0

  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const currentCategory = useMemo(
    () => CATEGORIES.find((c) => c.key === activeCategory) ?? null,
    [activeCategory]
  )

  useEffect(() => {
    setVisibleCount(12)
  }, [activeGoal, activeCategory, activeTag, priceRange, sortKey, searchQuery])

  const handleGoalClick = (key: string) => {
    setActiveGoal(key)
    setActiveCategory(null)
    setActiveTag(null)
  }

  const handleCategoryClick = (key: string) => {
    if (activeCategory === key) {
      toggleSection(key)
    } else {
      setActiveCategory(key)
      setActiveTag(null)
      setOpenSections((prev) => {
        const next = new Set(prev)
        next.add(key)
        return next
      })
    }
  }

  const selectTag = (categoryKey: string, tag: string) => {
    if (activeCategory !== categoryKey) {
      setActiveCategory(categoryKey)
      setOpenSections((prev) => {
        const next = new Set(prev)
        next.add(categoryKey)
        return next
      })
    }
    setActiveTag(activeTag === tag ? null : tag)
  }

  // ─── Filtrage (logique inchangee de la V1) ───
  const filtered = useMemo(() => {
    let result = [...products]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.productType?.toLowerCase().includes(q) ||
          p.vendor?.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    if (activeGoal !== 'all') {
      const goal = GOALS.find((g) => g.key === activeGoal)
      if (goal && goal.linkedCategories.length > 0) {
        const linkedCats = goal.linkedCategories
          .map((catKey) => CATEGORIES.find((c) => c.key === catKey))
          .filter(Boolean) as Category[]
        result = result.filter((p) => linkedCats.some((c) => productMatchesCategory(p, c)))
      }
    }

    if (currentCategory) {
      result = result.filter((p) => productMatchesCategory(p, currentCategory))
      if (activeTag) {
        const sub = currentCategory.subcategories.find((s) => s.key === activeTag)
        if (sub) result = result.filter((p) => productMatchesTags(p, sub.tags))
      }
    }

    result = result.filter((p) => {
      const price = parseFloat(p.priceRange.minVariantPrice.amount)
      return price >= priceRange[0] && price <= priceRange[1]
    })

    switch (sortKey) {
      case 'price-asc':
        result.sort(
          (a, b) =>
            parseFloat(a.priceRange.minVariantPrice.amount) -
            parseFloat(b.priceRange.minVariantPrice.amount)
        )
        break
      case 'price-desc':
        result.sort(
          (a, b) =>
            parseFloat(b.priceRange.minVariantPrice.amount) -
            parseFloat(a.priceRange.minVariantPrice.amount)
        )
        break
      case 'name':
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'newest':
        result.reverse()
        break
    }

    return result
  }, [products, activeGoal, currentCategory, activeTag, sortKey, priceRange, searchQuery])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cat of CATEGORIES) {
      counts[cat.key] = products.filter((p) => productMatchesCategory(p, cat)).length
    }
    return counts
  }, [products])

  // Compte par sous-filtre (catégorie + tag) → masque les sous-filtres vides.
  const subCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cat of CATEGORIES) {
      for (const sub of cat.subcategories) {
        counts[`${cat.key}:${sub.key}`] = products.filter(
          (p) => productMatchesCategory(p, cat) && productMatchesTags(p, sub.tags)
        ).length
      }
    }
    return counts
  }, [products])

  // N'affiche que les catégories ayant au moins un produit (cf. #4 du brief).
  const visibleCategories = useMemo(() => {
    let cats = CATEGORIES.filter((cat) => (categoryCounts[cat.key] ?? 0) > 0)
    if (activeGoal !== 'all') {
      const goal = GOALS.find((g) => g.key === activeGoal)
      if (goal && goal.linkedCategories.length > 0) {
        cats = cats.filter((cat) => goal.linkedCategories.includes(cat.key))
      }
    }
    return cats
  }, [activeGoal, categoryCounts])

  return (
    <div>
      {/* Hero (eyebrow + H1 « Tous les produits ») rendu côté serveur dans
          products/page.tsx → H1 présent dans le HTML SSR (cette vue passe en
          client-rendering via useSearchParams). La logique activeGoal/objectifs
          reste active pour les deep-links ?obj=... venant de la home. */}
      <div className="container pb-10">
        {/* ─── Barre de contrôle ─── */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <p className="text-[13px] text-ink-mute">
            {Math.min(visibleCount, filtered.length)} sur {filtered.length} produit
            {filtered.length > 1 ? 's' : ''}
          </p>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-[13px] font-semibold text-spruce border border-spruce/15 hover:border-spruce/40 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtres
            </button>

            <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-mute" />
              <input
                type="text"
                placeholder="Rechercher…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white rounded-full text-[13px] text-ink border border-spruce/15 pl-10 pr-4 py-2 w-[200px] focus:outline-none focus:border-spruce/40 focus:w-[260px] transition-all placeholder:text-ink-mute"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label="Effacer la recherche"
                >
                  <X className="w-3.5 h-3.5 text-ink-mute hover:text-spruce" />
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="appearance-none bg-white rounded-full text-[13px] text-ink border border-spruce/15 pl-4 pr-10 py-2 cursor-pointer focus:outline-none focus:border-spruce/40"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-mute pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Recherche mobile */}
        <div className="md:hidden mb-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-mute" />
            <input
              type="text"
              placeholder="Rechercher un produit…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-full text-[16px] text-ink border border-spruce/15 pl-10 pr-10 py-2.5 focus:outline-none focus:border-spruce/40 placeholder:text-ink-mute"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-label="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5 text-ink-mute" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-8">
          {/* ─── Sidebar ─── */}
          <aside
            className={cn(
              'w-[240px] flex-shrink-0 transition-all',
              showFilters
                ? 'fixed inset-0 z-50 bg-ink/40 lg:relative lg:bg-transparent lg:z-auto'
                : 'hidden lg:block'
            )}
          >
            <div
              className={cn(
                'bg-white rounded-2xl border border-spruce/10 p-6',
                showFilters &&
                  'fixed right-0 top-0 h-full w-[300px] rounded-none z-50 overflow-y-auto lg:relative lg:rounded-2xl lg:h-auto lg:w-auto'
              )}
            >
              {/* Close mobile */}
              <div className="flex items-center justify-between mb-5 lg:hidden">
                <span className="font-display font-extrabold text-[18px] text-spruce">Filtres</span>
                <button onClick={() => setShowFilters(false)} aria-label="Fermer les filtres">
                  <X className="w-5 h-5 text-ink-mute" />
                </button>
              </div>

              {/* Prix */}
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('prix')}
                  className="flex items-center justify-between w-full mb-2.5"
                >
                  <h4 className="text-[12px] font-semibold uppercase tracking-[0.15em] text-ink">
                    Prix
                  </h4>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-ink-mute transition-transform',
                      openSections.has('prix') && 'rotate-180'
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'overflow-hidden transition-all',
                    openSections.has('prix') ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                  <div className="flex items-center justify-between text-[12px] text-ink-mute mb-2">
                    <span>{priceRange[0]} €</span>
                    <span>{priceRange[1]} €</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full accent-fresh"
                  />
                </div>
              </div>

              <div className="border-t border-spruce/10 my-3" />

              {/* Tous les produits */}
              <button
                onClick={() => {
                  setActiveCategory(null)
                  setActiveTag(null)
                }}
                className={cn(
                  'flex items-center justify-between w-full text-left text-[13px] py-2 px-3 rounded-xl transition-colors mb-1 font-semibold',
                  !activeCategory ? 'bg-spruce text-white' : 'text-ink hover:bg-spruce/5'
                )}
              >
                <span>Tous les produits</span>
                <span className={cn('text-[11px]', !activeCategory ? 'text-white/70' : 'text-ink-mute')}>
                  {products.length}
                </span>
              </button>

              {/* Catégories */}
              {visibleCategories.map((cat) => {
                const isActive = activeCategory === cat.key
                const count = categoryCounts[cat.key] ?? 0
                const visibleSubs = cat.subcategories.filter(
                  (s) => (subCounts[`${cat.key}:${s.key}`] ?? 0) > 0
                )
                return (
                  <div key={cat.key}>
                    <button
                      onClick={() => handleCategoryClick(cat.key)}
                      className={cn(
                        'flex items-center justify-between w-full text-left text-[13px] py-2 px-3 rounded-xl transition-colors font-semibold',
                        isActive && !activeTag
                          ? 'bg-spruce text-white'
                          : isActive
                            ? 'text-spruce bg-sage/40'
                            : 'text-ink hover:bg-spruce/5'
                      )}
                    >
                      <span>{cat.label}</span>
                      <div className="flex items-center gap-2">
                        {count > 0 && (
                          <span
                            className={cn(
                              'text-[11px]',
                              isActive && !activeTag ? 'text-white/70' : 'text-ink-mute'
                            )}
                          >
                            {count}
                          </span>
                        )}
                        {visibleSubs.length > 0 && (
                          <ChevronDown
                            className={cn(
                              'w-3.5 h-3.5 transition-transform',
                              isActive && !activeTag ? 'text-white/70' : 'text-ink-mute',
                              openSections.has(cat.key) && 'rotate-180'
                            )}
                          />
                        )}
                      </div>
                    </button>

                    {visibleSubs.length > 0 && (
                      <div
                        className={cn(
                          'overflow-hidden transition-all',
                          openSections.has(cat.key)
                            ? 'max-h-[400px] opacity-100 mt-1 mb-1'
                            : 'max-h-0 opacity-0'
                        )}
                      >
                        <div className="space-y-0.5 pl-3 ml-3 border-l border-spruce/10">
                          {visibleSubs.map((sub) => (
                            <button
                              key={sub.key}
                              onClick={() => selectTag(cat.key, sub.key)}
                              className={cn(
                                'flex items-center w-full text-left text-[13px] py-1.5 px-3 rounded-lg transition-colors',
                                isActive && activeTag === sub.key
                                  ? 'bg-sage text-spruce font-semibold'
                                  : 'text-ink-mute hover:text-spruce hover:bg-spruce/5'
                              )}
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="border-t border-spruce/10 my-4" />

              <button
                onClick={() => {
                  setActiveGoal('all')
                  setActiveCategory(null)
                  setActiveTag(null)
                  setPriceRange([0, 200])
                  setSortKey('best')
                  setSearchQuery('')
                }}
                className="w-full py-2.5 text-[12px] font-semibold text-spruce border border-spruce/20 rounded-full hover:bg-spruce/5 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </aside>

          {/* ─── Grille produits ─── */}
          <div className="flex-1 min-w-0">
            {/* Chips filtres actifs - palette claire */}
            {(activeGoal !== 'all' ||
              activeCategory ||
              activeTag ||
              searchQuery ||
              priceRange[1] < 200) && (
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className="text-[12px] text-ink-mute mr-1">Filtres :</span>
                {activeGoal !== 'all' && (
                  <button
                    onClick={() => setActiveGoal('all')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-sage text-spruce rounded-full text-[12px] font-medium border border-spruce/10 hover:bg-sage/70 transition-colors"
                  >
                    {GOALS.find((g) => g.key === activeGoal)?.label}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {currentCategory && (
                  <button
                    onClick={() => {
                      setActiveCategory(null)
                      setActiveTag(null)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-sage text-spruce rounded-full text-[12px] font-medium border border-spruce/10 hover:bg-sage/70 transition-colors"
                  >
                    {currentCategory.label}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {activeTag && currentCategory && (
                  <button
                    onClick={() => setActiveTag(null)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-sage text-spruce rounded-full text-[12px] font-medium border border-spruce/10 hover:bg-sage/70 transition-colors"
                  >
                    {currentCategory.subcategories.find((s) => s.key === activeTag)?.label ?? activeTag}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-sage text-spruce rounded-full text-[12px] font-medium border border-spruce/10 hover:bg-sage/70 transition-colors"
                  >
                    « {searchQuery} »
                    <X className="w-3 h-3" />
                  </button>
                )}
                {priceRange[1] < 200 && (
                  <button
                    onClick={() => setPriceRange([0, 200])}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-sage text-spruce rounded-full text-[12px] font-medium border border-spruce/10 hover:bg-sage/70 transition-colors"
                  >
                    Max {priceRange[1]} €
                    <X className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setActiveGoal('all')
                    setActiveCategory(null)
                    setActiveTag(null)
                    setPriceRange([0, 200])
                    setSearchQuery('')
                  }}
                  className="text-[12px] text-ink-mute hover:text-spruce underline underline-offset-4 ml-1"
                >
                  Tout effacer
                </button>
              </div>
            )}

            {hasProducts && filtered.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5 lg:gap-6">
                  {filtered.slice(0, visibleCount).map((product) => (
                    <ProductCardShop
                      key={product.id}
                      product={product}
                      stockAtStore={stockByProductId[product.id]}
                    />
                  ))}
                </div>

                {visibleCount < filtered.length && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 12)}
                      className="inline-flex items-center gap-2 px-8 py-3 bg-fresh text-white rounded-full text-[14px] font-semibold hover:bg-fresh-deep transition-colors"
                    >
                      Voir plus
                    </button>
                    <p className="text-[12px] text-ink-mute mt-2.5">
                      {Math.min(visibleCount, filtered.length)} sur {filtered.length} produits
                      affichés
                    </p>
                  </div>
                )}
              </>
            ) : hasProducts && filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-sage flex items-center justify-center mx-auto mb-5">
                  <Package className="w-7 h-7 text-spruce" />
                </div>
                <h3 className="font-display font-extrabold text-[20px] text-spruce mb-2">
                  {activeCategory ? 'Cette catégorie arrive bientôt' : 'Aucun produit trouvé'}
                </h3>
                <p className="text-ink-mute text-[14px] mb-6 max-w-sm mx-auto">
                  {activeCategory
                    ? 'On prépare cette sélection. Inscris-toi à la newsletter pour être notifié.'
                    : 'Essaie de modifier tes filtres ou ta recherche.'}
                </p>
                <button
                  onClick={() => {
                    setActiveGoal('all')
                    setActiveCategory(null)
                    setActiveTag(null)
                    setPriceRange([0, 200])
                    setSearchQuery('')
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-fresh text-white rounded-full text-[14px] font-semibold hover:bg-fresh-deep transition-colors"
                >
                  Voir tous les produits
                </button>
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-ink-mute">Connecte Shopify pour afficher tes produits.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Carte produit V2 (allegee, palette DA) ────────────────────────
