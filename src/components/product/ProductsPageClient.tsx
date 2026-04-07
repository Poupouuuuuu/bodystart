'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { SlidersHorizontal, X, ChevronDown, Search, Minus, Plus, ShoppingCart, Package, Star } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import type { ShopifyProduct, ShopifyCollection } from '@/lib/shopify/types'

// ─── Objectifs / Goals (bandeau haut) ───
const GOALS: { key: string; label: string; image: string | null; linkedCategories: string[] }[] = [
  { key: 'all', label: 'Tout voir', image: null, linkedCategories: [] },
  {
    key: 'muscle',
    label: 'Muscle',
    image: '/Logomuscle.png',
    linkedCategories: ['proteines', 'creatine', 'acides-amines'],
  },
  {
    key: 'energie',
    label: 'Énergie',
    image: '/Logoenergy.png',
    linkedCategories: ['boosters', 'snacks'],
  },
  {
    key: 'recuperation',
    label: 'Récupération',
    image: '/Logo-recuperation.png',
    linkedCategories: ['acides-amines', 'sante'],
  },
  {
    key: 'sante',
    label: 'Santé',
    image: '/Logo-sante-vitalite.png',
    linkedCategories: ['sante', 'bruleurs'],
  },
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
const CATEGORIES = [
  {
    key: 'proteines',
    label: 'Protéines',
    collectionHandle: 'proteines',
    subcategories: [
      { tag: 'whey', label: 'Whey classique' },
      { tag: 'isolate', label: 'Isolate' },
      { tag: 'gainer', label: 'Gainer' },
      { tag: 'caseine', label: 'Caséine' },
    ],
  },
  {
    key: 'creatine',
    label: 'Créatine',
    collectionHandle: 'creatine',
    subcategories: [
      { tag: 'monohydrate', label: 'Monohydrate' },
    ],
  },
  {
    key: 'acides-amines',
    label: 'Acides Aminés',
    collectionHandle: 'acides-amines',
    subcategories: [
      { tag: 'bcaa', label: 'BCAA' },
      { tag: 'eaa', label: 'EAA' },
      { tag: 'glutamine', label: 'Glutamine' },
      { tag: 'citrulline', label: 'Citrulline' },
    ],
  },
  {
    key: 'sante',
    label: 'Santé & Bien-être',
    collectionHandle: 'sante-bien-etre',
    subcategories: [
      { tag: 'omega', label: 'Oméga' },
      { tag: 'vitamine', label: 'Vitamines' },
      { tag: 'collagene', label: 'Collagènes' },
      { tag: 'magnesium', label: 'Magnésium' },
      { tag: 'mineraux', label: 'Minéraux' },
      { tag: 'electrolytes', label: 'Électrolytes' },
      { tag: 'multivitamine', label: 'Multivitamines' },
    ],
  },
  {
    key: 'boosters',
    label: 'Boosters',
    collectionHandle: 'boosters',
    subcategories: [
      { tag: 'pre-workout', label: 'Pré-workout' },
      { tag: 'pump', label: 'Pump' },
      { tag: 'testo', label: 'Testo booster' },
    ],
  },
  {
    key: 'bruleurs',
    label: 'Brûleurs de graisse',
    collectionHandle: 'bruleurs-de-graisse',
    subcategories: [
      { tag: 'carnitine', label: 'Carnitine' },
      { tag: 'cla', label: 'CLA' },
      { tag: 'thermo', label: 'Thermo / Draineur' },
    ],
  },
  {
    key: 'snacks',
    label: 'Snacks & Barres',
    collectionHandle: 'snacks-barres',
    subcategories: [
      { tag: 'barre', label: 'Barres' },
      { tag: 'boisson', label: 'Boissons' },
    ],
  },
  {
    key: 'accessoires',
    label: 'Accessoires',
    collectionHandle: 'accessoires',
    subcategories: [
      { tag: 'shaker', label: 'Shakers' },
      { tag: 'sangle', label: 'Sangles' },
      { tag: 'ceinture', label: 'Ceintures' },
    ],
  },
]

interface Props {
  products: ShopifyProduct[]
  collections: ShopifyCollection[]
}

export default function ProductsPageClient({ products, collections }: Props) {
  const searchParams = useSearchParams()

  // ─── Lecture initiale des query params (?cat=proteines, ?obj=muscle, ?tag=whey) ───
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

  // Resync si l'URL change (navigation interne via Link vers /products?cat=...)
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

  const currentCategory = useMemo(() =>
    CATEGORIES.find((c) => c.key === activeCategory) ?? null,
    [activeCategory]
  )

  useEffect(() => { setVisibleCount(12) }, [activeGoal, activeCategory, activeTag, priceRange, sortKey, searchQuery])

  // Sélection d'un objectif → reset catégorie/tag (sans interférer avec l'init URL)
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

  // ─── Filtrage ───
  const filtered = useMemo(() => {
    let result = [...products]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.productType?.toLowerCase().includes(q) ||
        p.vendor?.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    if (activeGoal !== 'all') {
      const goal = GOALS.find((g) => g.key === activeGoal)
      if (goal && goal.linkedCategories.length > 0) {
        const linkedHandles = goal.linkedCategories
          .map((catKey) => CATEGORIES.find((c) => c.key === catKey)?.collectionHandle)
          .filter(Boolean) as string[]
        result = result.filter((p) =>
          p.collections?.nodes?.some((c) => linkedHandles.includes(c.handle))
        )
      }
    }

    if (currentCategory) {
      result = result.filter((p) =>
        p.collections?.nodes?.some((c) => c.handle === currentCategory.collectionHandle)
      )
      if (activeTag) {
        result = result.filter((p) =>
          p.tags.some((t) => t.toLowerCase() === activeTag)
        )
      }
    }

    result = result.filter((p) => {
      const price = parseFloat(p.priceRange.minVariantPrice.amount)
      return price >= priceRange[0] && price <= priceRange[1]
    })

    switch (sortKey) {
      case 'price-asc':
        result.sort((a, b) => parseFloat(a.priceRange.minVariantPrice.amount) - parseFloat(b.priceRange.minVariantPrice.amount))
        break
      case 'price-desc':
        result.sort((a, b) => parseFloat(b.priceRange.minVariantPrice.amount) - parseFloat(a.priceRange.minVariantPrice.amount))
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

  const visibleCategories = useMemo(() => {
    if (activeGoal === 'all') return CATEGORIES
    const goal = GOALS.find((g) => g.key === activeGoal)
    if (!goal || goal.linkedCategories.length === 0) return CATEGORIES
    return CATEGORIES.filter((cat) => goal.linkedCategories.includes(cat.key))
  }, [activeGoal])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cat of CATEGORIES) {
      counts[cat.key] = products.filter((p) =>
        p.collections?.nodes?.some((c) => c.handle === cat.collectionHandle)
      ).length
    }
    return counts
  }, [products])

  return (
    <div className="bg-[#f4f6f1] min-h-screen">
      
      {/* ─── Hero Header Premium ─── */}
      <div className="pt-12 pb-10 md:pt-16 md:pb-14 bg-[#f4f6f1]">
        <div className="container">
          <h1 className="font-display text-[45px] md:text-[65px] lg:text-[80px] font-black uppercase text-[#1a2e23] tracking-tighter leading-none mb-10 text-center">
            NOS PRODUITS
          </h1>

          {/* Objectifs — Pilules élégantes */}
          <div className="flex items-center justify-center gap-3 md:gap-4 flex-wrap">
            {GOALS.map(({ key, label, image }) => (
              <button
                key={key}
                onClick={() => handleGoalClick(key)}
                className={cn(
                  'flex items-center gap-2.5 px-5 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 border',
                  activeGoal === key
                    ? 'bg-[#1a2e23] text-white border-[#1a2e23] shadow-lg'
                    : 'bg-white/60 text-[#4a5f4c] border-[#1a2e23]/10 hover:bg-white hover:border-[#1a2e23]/30'
                )}
              >
                {image && (
                  <Image src={image} alt={label} width={24} height={24} className="w-6 h-6 object-contain" />
                )}
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container pb-16">
        {/* ─── Barre de contrôle ─── */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <p className="text-[13px] text-[#4a5f4c] font-medium">
            {Math.min(visibleCount, filtered.length)} sur {filtered.length} produit{filtered.length > 1 ? 's' : ''}
          </p>

          <div className="flex items-center gap-3">
            {/* Bouton filtres mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-5 py-2.5 bg-white rounded-full text-[11px] font-bold uppercase tracking-widest text-[#1a2e23] border border-[#1a2e23]/10 shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtres
            </button>

            {/* Recherche Desktop */}
            <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#89a890]" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white rounded-full text-sm font-medium text-[#1a2e23] border border-[#1a2e23]/10 shadow-sm pl-10 pr-4 py-2.5 w-[200px] focus:outline-none focus:border-[#1a2e23]/30 focus:w-[260px] transition-all placeholder:text-[#89a890]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5 text-[#89a890] hover:text-[#1a2e23]" />
                </button>
              )}
            </div>

            {/* Tri */}
            <div className="relative">
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="appearance-none bg-white rounded-full text-sm font-medium text-[#1a2e23] border border-[#1a2e23]/10 shadow-sm pl-4 pr-10 py-2.5 cursor-pointer focus:outline-none focus:border-[#1a2e23]/30"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#89a890] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Recherche mobile */}
        <div className="md:hidden mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#89a890]" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-full text-sm font-medium text-[#1a2e23] border border-[#1a2e23]/10 shadow-sm pl-10 pr-10 py-2.5 focus:outline-none focus:border-[#1a2e23]/30 placeholder:text-[#89a890]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5 text-[#89a890]" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-8">
          {/* ─── Sidebar filtres ─── */}
          <aside className={cn(
            'w-[240px] flex-shrink-0 transition-all',
            showFilters ? 'fixed inset-0 z-50 bg-black/50 lg:relative lg:bg-transparent lg:z-auto' : 'hidden lg:block'
          )}>
            <div className={cn(
              'bg-white/70 backdrop-blur-xl rounded-[24px] border border-[#1a2e23]/5 p-6 shadow-sm',
              showFilters && 'fixed right-0 top-0 h-full w-[300px] rounded-none z-50 overflow-y-auto lg:relative lg:rounded-[24px] lg:h-auto lg:w-auto'
            )}>
              {/* Close mobile */}
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <span className="font-display font-black text-lg uppercase text-[#1a2e23] tracking-tight">Filtres</span>
                <button onClick={() => setShowFilters(false)}>
                  <X className="w-5 h-5 text-[#4a5f4c]" />
                </button>
              </div>

              {/* ── Prix ── */}
              <div className="mb-5">
                <button
                  onClick={() => toggleSection('prix')}
                  className="flex items-center justify-between w-full mb-3"
                >
                  <h4 className="font-display font-black text-[11px] uppercase tracking-widest text-[#1a2e23]">
                    Prix
                  </h4>
                  <ChevronDown className={cn('w-4 h-4 text-[#89a890] transition-transform duration-200', openSections.has('prix') && 'rotate-180')} />
                </button>
                <div className={cn('overflow-hidden transition-all duration-200', openSections.has('prix') ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0')}>
                  <div className="flex items-center justify-between text-[12px] text-[#4a5f4c] font-medium mb-3">
                    <span>{priceRange[0]}€</span>
                    <span>{priceRange[1]}€</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full accent-[#1a2e23]"
                  />
                </div>
              </div>

              <div className="border-t border-[#1a2e23]/5 my-3" />

              {/* ── Bouton "Tous les produits" ── */}
              <button
                onClick={() => { setActiveCategory(null); setActiveTag(null) }}
                className={cn(
                  'flex items-center justify-between w-full text-left text-[13px] py-2.5 px-4 rounded-2xl transition-all mb-3 font-bold',
                  !activeCategory
                    ? 'bg-[#1a2e23] text-white'
                    : 'text-[#1a2e23] hover:bg-[#1a2e23]/5'
                )}
              >
                <span>Tous les produits</span>
                <span className={cn('text-[11px]', !activeCategory ? 'text-white/60' : 'text-[#89a890]')}>
                  {products.length}
                </span>
              </button>

              {/* ── Catégories ── */}
              {visibleCategories.map((cat, index) => {
                const isActive = activeCategory === cat.key
                const count = categoryCounts[cat.key] ?? 0

                return (
                  <div key={cat.key}>
                    <button
                      onClick={() => handleCategoryClick(cat.key)}
                      className={cn(
                        'flex items-center justify-between w-full text-left text-[13px] py-2.5 px-4 rounded-2xl transition-all font-bold',
                        isActive && !activeTag
                          ? 'bg-[#1a2e23] text-white'
                          : isActive
                            ? 'text-[#1a2e23] bg-[#1a2e23]/5'
                            : 'text-[#1a2e23] hover:bg-[#1a2e23]/5'
                      )}
                    >
                      <span>{cat.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[11px]', isActive ? (activeTag ? 'text-[#1a2e23]/40' : 'text-white/60') : 'text-[#89a890]')}>
                          {count}
                        </span>
                        {cat.subcategories.length > 0 && (
                          <ChevronDown className={cn(
                            'w-3.5 h-3.5 transition-transform duration-200',
                            isActive ? (activeTag ? 'text-[#1a2e23]/40' : 'text-white/60') : 'text-[#89a890]',
                            openSections.has(cat.key) && 'rotate-180'
                          )} />
                        )}
                      </div>
                    </button>

                    {/* Sous-catégories (tags) */}
                    {cat.subcategories.length > 0 && (
                      <div className={cn(
                        'overflow-hidden transition-all duration-200',
                        openSections.has(cat.key) ? 'max-h-[400px] opacity-100 mt-1' : 'max-h-0 opacity-0'
                      )}>
                        <div className="space-y-0.5 pl-4 border-l-2 border-[#1a2e23]/10 ml-4">
                          {cat.subcategories.map((sub) => (
                            <button
                              key={sub.tag}
                              onClick={() => selectTag(cat.key, sub.tag)}
                              className={cn(
                                'flex items-center w-full text-left text-[13px] py-1.5 px-3 rounded-xl transition-all',
                                isActive && activeTag === sub.tag
                                  ? 'bg-[#1a2e23] text-white font-bold'
                                  : 'text-[#4a5f4c] hover:text-[#1a2e23] hover:bg-[#1a2e23]/5'
                              )}
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {index < visibleCategories.length - 1 && (
                      <div className="border-t border-[#1a2e23]/5 my-1.5" />
                    )}
                  </div>
                )
              })}

              <div className="border-t border-[#1a2e23]/5 my-4" />

              {/* Reset */}
              <button
                onClick={() => {
                  setActiveGoal('all')
                  setActiveCategory(null)
                  setActiveTag(null)
                  setPriceRange([0, 200])
                  setSortKey('best')
                  setSearchQuery('')
                }}
                className="w-full py-2.5 text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] hover:text-[#1a2e23] border border-[#1a2e23]/10 rounded-full transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </aside>

          {/* ─── Grille produits ─── */}
          <div className="flex-1 min-w-0">
            {/* Chips filtres actifs */}
            {(activeGoal !== 'all' || activeCategory || activeTag || searchQuery || priceRange[1] < 200) && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-[11px] text-[#89a890] font-bold uppercase tracking-widest mr-1">Filtres :</span>
                {activeGoal !== 'all' && (
                  <button
                    onClick={() => setActiveGoal('all')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a2e23]/10 text-[#1a2e23] rounded-full text-[11px] font-bold hover:bg-[#1a2e23]/20 transition-colors"
                  >
                    {GOALS.find((g) => g.key === activeGoal)?.label}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {currentCategory && (
                  <button
                    onClick={() => { setActiveCategory(null); setActiveTag(null) }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a2e23]/10 text-[#1a2e23] rounded-full text-[11px] font-bold hover:bg-[#1a2e23]/20 transition-colors"
                  >
                    {currentCategory.label}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {activeTag && currentCategory && (
                  <button
                    onClick={() => setActiveTag(null)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a2e23]/10 text-[#1a2e23] rounded-full text-[11px] font-bold hover:bg-[#1a2e23]/20 transition-colors"
                  >
                    {currentCategory.subcategories.find((s) => s.tag === activeTag)?.label ?? activeTag}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a2e23]/10 text-[#1a2e23] rounded-full text-[11px] font-bold hover:bg-[#1a2e23]/20 transition-colors"
                  >
                    &quot;{searchQuery}&quot;
                    <X className="w-3 h-3" />
                  </button>
                )}
                {priceRange[1] < 200 && (
                  <button
                    onClick={() => setPriceRange([0, 200])}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a2e23]/10 text-[#1a2e23] rounded-full text-[11px] font-bold hover:bg-[#1a2e23]/20 transition-colors"
                  >
                    Max {priceRange[1]}€
                    <X className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => { setActiveGoal('all'); setActiveCategory(null); setActiveTag(null); setPriceRange([0, 200]); setSearchQuery('') }}
                  className="text-[11px] text-[#89a890] hover:text-[#1a2e23] underline underline-offset-4 ml-1 font-medium"
                >
                  Tout effacer
                </button>
              </div>
            )}

            {hasProducts && filtered.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5 lg:gap-6">
                  {filtered.slice(0, visibleCount).map((product) => (
                    <ProductCardShop key={product.id} product={product} />
                  ))}
                </div>

                {/* Charger plus */}
                {visibleCount < filtered.length && (
                  <div className="text-center mt-12">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 12)}
                      className="inline-flex items-center gap-2 px-10 py-4 bg-[#1a2e23] text-white rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-[#2e4f3c] transition-all shadow-lg hover:-translate-y-0.5"
                    >
                      Charger plus
                    </button>
                    <p className="text-[11px] text-[#89a890] mt-3 font-medium">
                      {Math.min(visibleCount, filtered.length)} sur {filtered.length} produits affichés
                    </p>
                  </div>
                )}
              </>
            ) : hasProducts && filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-full bg-[#1a2e23]/5 flex items-center justify-center mx-auto mb-6">
                  <Package className="w-8 h-8 text-[#89a890]" />
                </div>
                <h3 className="font-display font-black text-xl text-[#1a2e23] mb-2 uppercase tracking-tight">
                  {activeCategory ? 'Cette catégorie arrive bientôt' : 'Aucun produit trouvé'}
                </h3>
                <p className="text-[#4a5f4c] text-sm mb-8 max-w-sm mx-auto font-medium">
                  {activeCategory
                    ? 'Nous préparons cette sélection. Inscris-toi à la newsletter pour être notifié dès leur arrivée !'
                    : 'Essaie de modifier tes filtres ou ta recherche pour trouver ce que tu cherches.'
                  }
                </p>
                <button
                  onClick={() => { setActiveGoal('all'); setActiveCategory(null); setActiveTag(null); setPriceRange([0, 200]); setSearchQuery('') }}
                  className="px-8 py-4 bg-[#1a2e23] text-white rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-[#2e4f3c] transition-all shadow-lg"
                >
                  Voir tous les produits
                </button>
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-[#4a5f4c] font-medium">Connectez Shopify pour afficher vos produits</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Note pseudo-aléatoire déterministe basée sur le handle du produit ───
function getProductRating(handle: string): { rating: number; count: number; badge: string | null } {
  let hash = 0
  for (let i = 0; i < handle.length; i++) {
    hash = ((hash << 5) - hash) + handle.charCodeAt(i)
    hash |= 0
  }
  const rating = 4.0 + (Math.abs(hash % 10) / 10)
  const count = 8 + Math.abs(hash % 45)
  
  const badgeVal = Math.abs(hash % 100)
  let badge: string | null = null
  if (badgeVal < 10) badge = 'Nouveau'
  else if (badgeVal < 25) badge = 'Best-Seller'
  
  return { rating: Math.round(rating * 10) / 10, count, badge }
}

// ─── Card produit premium DNVB ───
function ProductCardShop({ product }: { product: ShopifyProduct }) {
  const variant = product.variants.nodes[0]
  const { addItem } = useCart()
  const [adding, setAdding] = useState(false)
  const [qty, setQty] = useState(1)
  const { rating, count: reviewCount, badge: randomBadge } = getProductRating(product.handle)

  const isNew = product.tags.some(t => t.toLowerCase().includes('nouveau') || t.toLowerCase().includes('new'))
  const isBest = product.tags.some(t => t.toLowerCase().includes('best-seller') || t.toLowerCase().includes('bestseller'))
  const finalBadge = isNew ? 'Nouveau' : isBest ? 'Best-Seller' : randomBadge

  const productLabel = product.collections?.nodes?.[0]?.title || product.productType || 'Nutrition'

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!variant?.availableForSale) return
    setAdding(true)
    for (let i = 0; i < qty; i++) {
      await addItem(variant.id)
    }
    setAdding(false)
    setQty(1)
  }

  return (
    <div className="rounded-[28px] overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-[#1a2e23]/5 group bg-white">
      {/* Zone image avec Background.webp */}
      <Link
        href={`/products/${product.handle}`}
        className="relative w-full aspect-[4/5] bg-cover bg-bottom bg-no-repeat overflow-hidden block"
        style={{ backgroundImage: "url('/Background.webp')" }}
      >
        <div className="absolute inset-0 flex items-end justify-center pb-4">
          {product.featuredImage ? (
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              width={200}
              height={200}
              className="relative z-10 w-auto h-[65%] object-contain drop-shadow-2xl transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="relative z-10 w-20 h-20 bg-white/30 rounded-full flex items-center justify-center mb-8">
              <span className="font-display font-black text-2xl text-white/60">BS</span>
            </div>
          )}
        </div>
        
        {/* Gradient fondu en bas */}
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-white to-transparent z-0" />

        {/* Badges */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 items-start">
          {variant?.compareAtPrice && parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount) && (
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500 text-white shadow-sm">
              -{Math.round(((parseFloat(variant.compareAtPrice.amount) - parseFloat(variant.price.amount)) / parseFloat(variant.compareAtPrice.amount)) * 100)}%
            </span>
          )}
          {finalBadge && (
            <span className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm",
              finalBadge === 'Nouveau' ? "bg-[#1a2e23] text-white" : "bg-[#eea22b] text-[#1a2e23]"
            )}>
              {finalBadge}
            </span>
          )}
        </div>
      </Link>

      {/* Contenu */}
      <div className="p-5 flex flex-col flex-1">
        {/* Type de produit */}
        <span className="text-[10px] font-bold text-[#89a890] uppercase tracking-widest mb-2 truncate">
          {productLabel}
        </span>

        <Link href={`/products/${product.handle}`}>
          <h3 className="font-display font-bold text-[#1a2e23] text-sm leading-snug mb-2 line-clamp-2 min-h-[2.5rem] hover:text-[#4a5f4c] transition-colors uppercase tracking-wide">
            {product.title}
          </h3>
        </Link>

        {/* Étoiles */}
        <div className="flex items-center gap-1.5 mb-4">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  'w-3 h-3',
                  star <= Math.floor(rating) ? 'text-[#1a2e23] fill-[#1a2e23]' : 'text-[#1a2e23]/15 fill-[#1a2e23]/15'
                )}
              />
            ))}
          </div>
          <span className="text-[10px] font-medium text-[#89a890]">
            {rating} ({reviewCount})
          </span>
        </div>

        {/* Prix + quantité */}
        <div className="flex items-center justify-between mb-4 mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="font-black text-[#1a2e23] text-xl">
              {formatPrice(product.priceRange.minVariantPrice)}
            </span>
            {variant?.compareAtPrice && (
              <span className="text-xs text-[#89a890] line-through">
                {formatPrice(variant.compareAtPrice)}
              </span>
            )}
          </div>

          {/* Sélecteur quantité */}
          {variant?.availableForSale && (
            <div className="flex items-center border border-[#1a2e23]/10 rounded-full overflow-hidden">
              <button
                onClick={(e) => { e.preventDefault(); setQty((q) => Math.max(1, q - 1)) }}
                className="w-7 h-7 flex items-center justify-center text-[#4a5f4c] hover:bg-[#1a2e23]/5 transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-xs font-bold text-[#1a2e23]">{qty}</span>
              <button
                onClick={(e) => { e.preventDefault(); setQty((q) => Math.min(10, q + 1)) }}
                className="w-7 h-7 flex items-center justify-center text-[#4a5f4c] hover:bg-[#1a2e23]/5 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={!variant?.availableForSale || adding}
          className={cn(
            'w-full py-3.5 text-[11px] uppercase font-bold tracking-widest rounded-full transition-all flex items-center justify-center gap-2',
            variant?.availableForSale && !adding
              ? 'bg-[#1a2e23] text-white hover:bg-[#2e4f3c] shadow-md hover:shadow-lg'
              : 'bg-[#1a2e23]/10 text-[#89a890] cursor-not-allowed'
          )}
        >
          {adding ? (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
          {adding ? 'Ajout...' : variant?.availableForSale ? 'Ajouter au panier' : 'Indisponible'}
        </button>
      </div>
    </div>
  )
}
