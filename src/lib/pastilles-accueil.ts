// Pastille « Offerte dès 100 € » des cartes de l'accueil (28/11/2026) : la
// carte d'un produit dont une variante est le cadeau d'un palier de la
// période en cours. Mêmes règles que /products et les catégories
// (lib/offres-cartes : remise active, cadeau en stock, période à l'heure du
// rendu). Calculée, jamais en dur ; la carte la retire à la fin de la
// période même page en cache (components/home/accueil/CarteVente).
//
// Pur, sans réseau. Testé dans pastilles-accueil.test.ts.

import type { OffresVariantes } from '@/lib/carte-produit'

interface ProduitCarte {
  id: string
  variants: { nodes: { id: string }[] }
}

/** Pastille par identifiant de produit : texte et fin de la période (ISO, null sans fin). */
export type PastillesAccueil = Record<string, { texte: string; fin: string | null }>

export function pastillesDesProduits(offres: OffresVariantes | null, produits: ProduitCarte[]): PastillesAccueil {
  const out: PastillesAccueil = {}
  if (!offres) return out
  for (const p of produits) {
    const v = p.variants.nodes.find((x) => offres[x.id])
    if (v) out[p.id] = { texte: offres[v.id].libelle, fin: offres[v.id].fin }
  }
  return out
}
