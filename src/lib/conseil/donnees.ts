// Données du guide /conseil, lues côté serveur au rendu de la page (ISR 15 min).
//
// 1. Le guide : metafield boutique `bodystart.guide_conseil` (Storefront).
// 2. Les produits qu'il cite : une requête Storefront (variantes, prix, images).
// 3. Le stock par variante à l'emplacement de la boutique active (Admin API).
//
// Aucune erreur ne remonte : si une étape échoue (Shopify indisponible, JSON
// invalide, jeton Admin absent…), on renvoie { ok: false } et la page affiche
// sa version de repli (texte, infos boutique, rappel). Jamais d'erreur 500,
// et un build ne casse pas pour une panne Shopify passagère.

import { shopifyFetch } from '@/lib/shopify/client'
import { getInventoryForVariants } from '@/lib/shopify'
import { BODY_START_STORES } from '@/lib/shopify/types'
import { GET_GUIDE_CONSEIL, buildGuideProductsQuery } from '@/lib/shopify/queries/conseil'
import { parseGuide } from './guide'
import type { Catalogue, Guide, Image } from './types'

export type DonneesGuide =
  | { ok: true; guide: Guide; catalogue: Catalogue }
  | { ok: false }

interface ProduitStorefront {
  id: string
  handle: string
  title: string
  featuredImage: Image | null
  variants: {
    nodes: {
      id: string
      title: string
      availableForSale: boolean
      price: { amount: string; currencyCode: string }
      image: Image | null
    }[]
  }
}

export async function chargerGuideConseil(): Promise<DonneesGuide> {
  try {
    const boutique = BODY_START_STORES.find((s) => s.isActive)
    if (!boutique?.shopifyLocationId) throw new Error('aucune boutique active')

    const { shop } = await shopifyFetch<{ shop: { metafield: { value: string } | null } }>(GET_GUIDE_CONSEIL)
    if (!shop?.metafield?.value) throw new Error('metafield bodystart.guide_conseil absent')
    const guide = parseGuide(shop.metafield.value)

    const handles = Array.from(new Set(Object.values(guide.produits).map((p) => p.handle)))
    const parHandle = new Map<string, ProduitStorefront>()
    if (handles.length > 0) {
      const variables = Object.fromEntries(handles.map((h, i) => [`h${i}`, h]))
      const data = await shopifyFetch<Record<string, ProduitStorefront | null>>(
        buildGuideProductsQuery(handles.length),
        variables
      )
      handles.forEach((h, i) => {
        const p = data[`p${i}`]
        if (p) parHandle.set(h, p)
        // Handle introuvable ou dépublié : le produit est simplement ignoré
        // (le moteur passe au candidat suivant).
        else console.warn(`[conseil] produit introuvable sur le Storefront : ${h}`)
      })
    }

    const variantIds = Array.from(parHandle.values()).flatMap((p) => p.variants.nodes.map((v) => v.id))
    const stock = variantIds.length > 0 ? await getInventoryForVariants(variantIds, boutique.shopifyLocationId) : {}

    const catalogue: Catalogue = {}
    for (const [cle, gp] of Object.entries(guide.produits)) {
      const p = parHandle.get(gp.handle)
      if (!p) continue
      catalogue[cle] = {
        handle: p.handle,
        titre: p.title,
        image: p.featuredImage,
        // Seules les variantes vendables et en stock à la boutique servent au
        // moteur : les autres alourdiraient la page pour rien.
        variantes: p.variants.nodes
          .map((v) => ({
            id: v.id,
            titre: v.title,
            prixCents: Math.round(parseFloat(v.price.amount) * 100),
            disponible: v.availableForSale,
            stock: stock[v.id] ?? 0,
            image: v.image,
          }))
          .filter((v) => v.disponible && v.stock > 0 && Number.isFinite(v.prixCents)),
      }
    }

    return { ok: true, guide, catalogue }
  } catch (err) {
    console.error('[conseil] guide indisponible, page de repli :', err)
    return { ok: false }
  }
}
