'use client'

/**
 * Grille d'une page catégorie avec ses sous-catégories en pastilles (nuit du
 * 28/11/2026) : mêmes pastilles et même règle que /products?cat=…&tag=…
 * (lib/sous-categories). Le filtre reste sur la page, sans paramètre d'URL :
 * le HTML (rendu serveur) montre toute la grille, comme avant.
 */
import { useMemo, useState } from 'react'
import { ProductCardShop } from '@/components/product/ProductCardShop'
import PastillesFiltres from '@/components/product/PastillesFiltres'
import { dansSousCategorie, PRIORITES, SOUS_CATEGORIES, type SousCategorie } from '@/lib/sous-categories'
import type { ShopifyProduct } from '@/lib/shopify/types'

export default function GrilleCategorie({
  products,
  rayon,
  libelle,
}: {
  products: ShopifyProduct[]
  /** Slug du rayon (= clé de lib/sous-categories). */
  rayon: string
  libelle: string
}) {
  const sous = useMemo<SousCategorie[]>(() => (SOUS_CATEGORIES as Record<string, SousCategorie[]>)[rayon] ?? [], [rayon])
  const priorite = PRIORITES[rayon]
  const [actif, setActif] = useState<string | null>(null)

  const comptes = useMemo(() => {
    const c: Record<string, number> = {}
    for (const s of sous) c[s.key] = products.filter((p) => dansSousCategorie(p.tags, s.key, sous, priorite)).length
    return c
  }, [products, sous, priorite])
  const visibles = sous.filter((s) => (comptes[s.key] ?? 0) > 0)
  const affiches = actif ? products.filter((p) => dansSousCategorie(p.tags, actif, sous, priorite)) : products

  return (
    <>
      {visibles.length > 1 && (
        <PastillesFiltres
          className="mb-5 lg:flex-wrap"
          libelle={`Sous-catégories : ${libelle}`}
          pastilles={[
            { cle: 'tout', libelle: 'Tout voir', compte: products.length, actif: !actif, onClick: () => setActif(null) },
            ...visibles.map((s) => ({
              cle: s.key,
              libelle: s.label,
              compte: comptes[s.key],
              actif: actif === s.key,
              onClick: () => setActif((a) => (a === s.key ? null : s.key)),
            })),
          ]}
        />
      )}
      {/* 2 colonnes dès le mobile, cohérent avec /products (même carte). */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-14">
        {affiches.map((p) => (
          <ProductCardShop key={p.id} product={p} />
        ))}
      </div>
    </>
  )
}
