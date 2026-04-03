'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SlidersHorizontal, X, ChevronDown, Search, Minus, Plus, ShoppingCart, Package } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import type { ShopifyProduct, ShopifyCollection } from '@/lib/shopify/types'

// ─── Objectifs / Goals (bandeau haut) ───
// Chaque objectif est lié à des catégories (collections Shopify).
// Quand un objectif est actif, seuls les produits de ces collections s'affichent.
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

// ─── Catégories : chaque entrée = 1 collection Shopify + sous-catégories par tags ───
// Le `collectionHandle` doit correspondre au handle de la collection dans Shopify.
// Les `tag` des sous-catégories doivent correspondre aux tags mis sur les produits dans Shopify.
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
  const [activeGoal, setActiveGoal] = useState('all')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState('best')
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200])
  const [visibleCount, setVisibleCount] = useState(12)
  const [searchQuery, setSearchQuery] = useState('')
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())

  const hasProducts = products.length > 0

  // Toggle ouvrir/fermer section
  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Catégorie active (objet)
  const currentCategory = useMemo(() =>
    CATEGORIES.find((c) => c.key === activeCategory) ?? null,
    [activeCategory]
  )

  // Reset pagination quand les filtres changent
  useEffect(() => { setVisibleCount(12) }, [activeGoal, activeCategory, activeTag, priceRange, sortKey, searchQuery])

  // Reset tag quand on change de catégorie
  useEffect(() => { setActiveTag(null) }, [activeCategory])

  // Reset catégorie + tag quand on change d'objectif (la catégorie peut ne plus être visible)
  useEffect(() => {
    setActiveCategory(null)
    setActiveTag(null)
  }, [activeGoal])

  // Clic sur une catégorie dans la sidebar
  // - Si pas active : active le filtre + ouvre la section
  // - Si active + section ouverte : ferme la section (garde le filtre)
  // - Si active + section fermée : ouvre la section
  // - Double usage : cliquer sur une autre catégorie la switch
  const handleCategoryClick = (key: string) => {
    if (activeCategory === key) {
      // Déjà active → toggle l'ouverture de la section uniquement
      toggleSection(key)
    } else {
      // Nouvelle catégorie → active le filtre + ouvre la section
      setActiveCategory(key)
      setActiveTag(null)
      setOpenSections((prev) => {
        const next = new Set(prev)
        next.add(key)
        return next
      })
    }
  }

  // Sélectionner un tag (sous-catégorie)
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

    // Recherche texte
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.productType?.toLowerCase().includes(q) ||
        p.vendor?.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    // Filtre par objectif (bandeau haut — filtre par collections liées)
    if (activeGoal !== 'all') {
      const goal = GOALS.find((g) => g.key === activeGoal)
      if (goal && goal.linkedCategories.length > 0) {
        // Récupérer les handles de collections des catégories liées
        const linkedHandles = goal.linkedCategories
          .map((catKey) => CATEGORIES.find((c) => c.key === catKey)?.collectionHandle)
          .filter(Boolean) as string[]
        result = result.filter((p) =>
          p.collections?.nodes?.some((c) => linkedHandles.includes(c.handle))
        )
      }
    }

    // Filtre par catégorie (= collection Shopify)
    if (currentCategory) {
      result = result.filter((p) =>
        p.collections?.nodes?.some((c) => c.handle === currentCategory.collectionHandle)
      )

      // Filtre par sous-catégorie (= tag Shopify)
      if (activeTag) {
        result = result.filter((p) =>
          p.tags.some((t) => t.toLowerCase() === activeTag)
        )
      }
    }

    // Filtre par prix
    result = result.filter((p) => {
      const price = parseFloat(p.priceRange.minVariantPrice.amount)
      return price >= priceRange[0] && price <= priceRange[1]
    })

    // Tri
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

  // Catégories visibles dans la sidebar (filtrées si un objectif est actif)
  const visibleCategories = useMemo(() => {
    if (activeGoal === 'all') return CATEGORIES
    const goal = GOALS.find((g) => g.key === activeGoal)
    if (!goal || goal.linkedCategories.length === 0) return CATEGORIES
    return CATEGORIES.filter((cat) => goal.linkedCategories.includes(cat.key))
  }, [activeGoal])

  // Compteur de produits par catégorie (pour afficher le nombre)
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
    <div className="bg-cream-100 min-h-screen">
      {/* ─── Header "Filter by Goal" ─── */}
      <div className="relative py-10 md:py-14 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/Backgroundproduct.webp')" }}>
        <div className="container">
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-black uppercase text-white tracking-tight mb-8 text-center">
            Nos Produits
          </h1>

          {/* Goal pills */}
          <div className="flex items-center justify-center gap-4 md:gap-6">
            {GOALS.map(({ key, label, image }) => (
              <button
                key={key}
                onClick={() => setActiveGoal(key)}
                className={cn(
                  'flex flex-col items-center gap-2 transition-all w-[72px] md:w-[90px]',
                  activeGoal === key ? 'opacity-100' : 'opacity-60 hover:opacity-80'
                )}
              >
                <div className={cn(
                  'w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all border-2 overflow-hidden',
                  activeGoal === key
                    ? 'bg-white border-white'
                    : 'bg-white/80 border-white/50'
                )}>
                  {image ? (
                    <img src={image} alt={label} className="w-9 h-9 md:w-10 md:h-10 object-contain" />
                  ) : (
                    <span className="text-sm md:text-base font-bold text-[#345f44]">ALL</span>
                  )}
                </div>
                <span className="text-white text-[11px] md:text-xs font-bold uppercase tracking-wider">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-8 md:py-12">
        {/* ─── Barre de contrôle ─── */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <p className="text-sm text-gray-500 font-medium">
            {Math.min(visibleCount, filtered.length)} sur {filtered.length} produit{filtered.length > 1 ? 's' : ''}
          </p>

          <div className="flex items-center gap-3">
            {/* Bouton filtres mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white rounded-full text-sm font-bold text-gray-700 border border-cream-300 shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtres
            </button>

            {/* Recherche */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white rounded-full text-sm font-medium text-gray-700 border border-cream-300 shadow-sm pl-9 pr-4 py-2.5 w-[200px] focus:outline-none focus:border-brand-500 focus:w-[260px] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Tri */}
            <div className="relative">
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="appearance-none bg-white rounded-full text-sm font-medium text-gray-700 border border-cream-300 shadow-sm pl-4 pr-10 py-2.5 cursor-pointer focus:outline-none focus:border-brand-500"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Recherche mobile */}
        <div className="md:hidden mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-full text-sm font-medium text-gray-700 border border-cream-300 shadow-sm pl-9 pr-10 py-2.5 focus:outline-none focus:border-brand-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
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
              'bg-white rounded-2xl border border-cream-300 p-6 shadow-sm',
              showFilters && 'fixed right-0 top-0 h-full w-[300px] rounded-none z-50 overflow-y-auto lg:relative lg:rounded-2xl lg:h-auto lg:w-auto'
            )}>
              {/* Close mobile */}
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <span className="font-display font-bold text-lg uppercase">Filtres</span>
                <button onClick={() => setShowFilters(false)}>
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* ── Prix ── */}
              <div className="mb-5">
                <button
                  onClick={() => toggleSection('prix')}
                  className="flex items-center justify-between w-full mb-3"
                >
                  <h4 className="font-display font-bold text-xs uppercase tracking-widest text-gray-900">
                    Prix
                  </h4>
                  <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', openSections.has('prix') && 'rotate-180')} />
                </button>
                <div className={cn('overflow-hidden transition-all duration-200', openSections.has('prix') ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0')}>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>{priceRange[0]}€</span>
                    <span>{priceRange[1]}€</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full accent-[#345f44]"
                  />
                </div>
              </div>

              <div className="border-t border-cream-200 my-3" />

              {/* ── Bouton "Tous les produits" ── */}
              <button
                onClick={() => { setActiveCategory(null); setActiveTag(null) }}
                className={cn(
                  'flex items-center justify-between w-full text-left text-sm py-2.5 px-3 rounded-lg transition-colors mb-3 font-medium',
                  !activeCategory
                    ? 'bg-[#345f44] text-white font-bold'
                    : 'text-gray-700 hover:bg-cream-200'
                )}
              >
                <span>Tous les produits</span>
                <span className={cn('text-xs', !activeCategory ? 'text-white/70' : 'text-gray-400')}>
                  {products.length}
                </span>
              </button>

              {/* ── Catégories ── */}
              {visibleCategories.map((cat, index) => {
                const isActive = activeCategory === cat.key
                const count = categoryCounts[cat.key] ?? 0

                return (
                  <div key={cat.key}>
                    {/* Header catégorie */}
                    <button
                      onClick={() => handleCategoryClick(cat.key)}
                      className={cn(
                        'flex items-center justify-between w-full text-left text-sm py-2.5 px-3 rounded-lg transition-colors font-medium',
                        isActive && !activeTag
                          ? 'bg-[#345f44] text-white font-bold'
                          : isActive
                            ? 'text-[#345f44] bg-[#345f44]/5 font-bold'
                            : 'text-gray-700 hover:bg-cream-200'
                      )}
                    >
                      <span>{cat.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs', isActive ? (activeTag ? 'text-[#345f44]/50' : 'text-white/70') : 'text-gray-400')}>
                          {count}
                        </span>
                        {cat.subcategories.length > 0 && (
                          <ChevronDown className={cn(
                            'w-3.5 h-3.5 transition-transform duration-200',
                            isActive ? (activeTag ? 'text-[#345f44]/50' : 'text-white/60') : 'text-gray-400',
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
                        <div className="space-y-0.5 pl-3 border-l-2 border-cream-200 ml-3">
                          {cat.subcategories.map((sub) => (
                            <button
                              key={sub.tag}
                              onClick={() => selectTag(cat.key, sub.tag)}
                              className={cn(
                                'flex items-center w-full text-left text-sm py-1.5 px-3 rounded-lg transition-colors',
                                isActive && activeTag === sub.tag
                                  ? 'bg-[#345f44] text-white font-bold'
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-cream-100'
                              )}
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Séparateur entre catégories */}
                    {index < visibleCategories.length - 1 && (
                      <div className="border-t border-cream-100 my-1.5" />
                    )}
                  </div>
                )
              })}

              <div className="border-t border-cream-200 my-4" />

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
                className="w-full py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 border border-cream-300 rounded-full transition-colors"
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
                <span className="text-xs text-gray-400 font-medium mr-1">Filtres :</span>
                {activeGoal !== 'all' && (
                  <button
                    onClick={() => setActiveGoal('all')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#345f44]/10 text-[#345f44] rounded-full text-xs font-bold hover:bg-[#345f44]/20 transition-colors"
                  >
                    {GOALS.find((g) => g.key === activeGoal)?.label}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {currentCategory && (
                  <button
                    onClick={() => { setActiveCategory(null); setActiveTag(null) }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#345f44]/10 text-[#345f44] rounded-full text-xs font-bold hover:bg-[#345f44]/20 transition-colors"
                  >
                    {currentCategory.label}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {activeTag && currentCategory && (
                  <button
                    onClick={() => setActiveTag(null)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#345f44]/10 text-[#345f44] rounded-full text-xs font-bold hover:bg-[#345f44]/20 transition-colors"
                  >
                    {currentCategory.subcategories.find((s) => s.tag === activeTag)?.label ?? activeTag}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#345f44]/10 text-[#345f44] rounded-full text-xs font-bold hover:bg-[#345f44]/20 transition-colors"
                  >
                    &quot;{searchQuery}&quot;
                    <X className="w-3 h-3" />
                  </button>
                )}
                {priceRange[1] < 200 && (
                  <button
                    onClick={() => setPriceRange([0, 200])}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#345f44]/10 text-[#345f44] rounded-full text-xs font-bold hover:bg-[#345f44]/20 transition-colors"
                  >
                    Max {priceRange[1]}€
                    <X className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => { setActiveGoal('all'); setActiveCategory(null); setActiveTag(null); setPriceRange([0, 200]); setSearchQuery('') }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline ml-1"
                >
                  Tout effacer
                </button>
              </div>
            )}

            {hasProducts && filtered.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5">
                  {filtered.slice(0, visibleCount).map((product) => (
                    <ProductCardShop key={product.id} product={product} />
                  ))}
                </div>

                {/* Bouton Charger plus */}
                {visibleCount < filtered.length && (
                  <div className="text-center mt-10">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 12)}
                      className="inline-flex items-center gap-2 px-8 py-3.5 bg-white border-2 border-gray-900 text-gray-900 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-gray-900 hover:text-white transition-all shadow-sm"
                    >
                      Charger plus
                    </button>
                    <p className="text-xs text-gray-400 mt-3">
                      {Math.min(visibleCount, filtered.length)} sur {filtered.length} produits affichés
                    </p>
                  </div>
                )}
              </>
            ) : hasProducts && filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-cream-200 flex items-center justify-center mx-auto mb-5">
                  <Package className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="font-display font-bold text-lg text-gray-800 mb-2">
                  {activeCategory ? 'Cette catégorie arrive bientôt' : 'Aucun produit trouvé'}
                </h3>
                <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                  {activeCategory
                    ? 'Nous préparons cette sélection. Inscris-toi à la newsletter pour être notifié dès leur arrivée !'
                    : 'Essaie de modifier tes filtres ou ta recherche pour trouver ce que tu cherches.'
                  }
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => { setActiveGoal('all'); setActiveCategory(null); setActiveTag(null); setPriceRange([0, 200]); setSearchQuery('') }}
                    className="px-6 py-3 bg-[#345f44] text-white rounded-full text-sm font-bold hover:bg-[#234832] transition-colors"
                  >
                    Voir tous les produits
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-500">Connectez Shopify pour afficher vos produits</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Card produit style boutique (avec Background.webp + sélecteur quantité) ───
function ProductCardShop({ product }: { product: ShopifyProduct }) {
  const variant = product.variants.nodes[0]
  const { addItem } = useCart()
  const [adding, setAdding] = useState(false)
  const [qty, setQty] = useState(1)

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
    <div className="rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg border border-cream-300 group bg-white">
      {/* Zone image avec Background.webp */}
      <Link
        href={`/products/${product.handle}`}
        className="relative w-full h-[220px] md:h-[250px] bg-cover bg-bottom bg-no-repeat overflow-hidden block"
        style={{ backgroundImage: "url('/Background.webp')" }}
      >
        <div className="absolute inset-0 flex items-end justify-center">
          {product.featuredImage ? (
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              width={200}
              height={200}
              className="relative z-10 w-auto min-h-[120px] max-h-[170px] object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-105"
              style={{ marginBottom: '6px' }}
            />
          ) : (
            <div className="relative z-10 w-20 h-20 bg-white/30 rounded-full flex items-center justify-center mb-8">
              <span className="font-display font-black text-2xl text-white/60">BS</span>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent z-0" />

        {/* Badge promo */}
        {variant?.compareAtPrice && parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount) && (
          <span className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500 text-white">
            -{Math.round(((parseFloat(variant.compareAtPrice.amount) - parseFloat(variant.price.amount)) / parseFloat(variant.compareAtPrice.amount)) * 100)}%
          </span>
        )}
      </Link>

      {/* Contenu */}
      <div className="p-4 flex flex-col flex-1">
        {product.productType && (
          <span className="text-[11px] font-semibold text-[#345f44] uppercase tracking-wide mb-1">
            {product.productType}
          </span>
        )}
        <Link href={`/products/${product.handle}`}>
          <h3 className="font-display font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2 min-h-[2.5rem] hover:text-[#345f44] transition-colors">
            {product.title}
          </h3>
        </Link>

        {/* Prix + sélecteur quantité */}
        <div className="flex items-center justify-between mb-4 mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-gray-900 text-lg">
              {formatPrice(product.priceRange.minVariantPrice)}
            </span>
            {variant?.compareAtPrice && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(variant.compareAtPrice)}
              </span>
            )}
          </div>

          {/* Sélecteur quantité */}
          {variant?.availableForSale && (
            <div className="flex items-center border border-cream-300 rounded-full overflow-hidden">
              <button
                onClick={(e) => { e.preventDefault(); setQty((q) => Math.max(1, q - 1)) }}
                className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-cream-100 transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-xs font-bold text-gray-900">{qty}</span>
              <button
                onClick={(e) => { e.preventDefault(); setQty((q) => Math.min(10, q + 1)) }}
                className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-cream-100 transition-colors"
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
            'w-full py-3 text-sm uppercase font-bold rounded-full transition-all flex items-center justify-center gap-2',
            variant?.availableForSale && !adding
              ? 'bg-[#345f44] text-white hover:bg-[#234832] shadow-md'
              : 'bg-cream-200 text-gray-400 cursor-not-allowed'
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
