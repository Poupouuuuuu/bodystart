// Pastille « Offerte dès 100 € » des cartes de l'accueil (28/11/2026) : la
// carte d'un produit dont une variante en stock est le cadeau d'un palier de
// la période de paliers en cours (metafield bodystart.paliers_cadeaux,
// lib/paliers). Calculée, jamais en dur : elle s'arrête avec la période
// (fin rendue au navigateur, components/home/accueil/CarteVente).
//
// Pur, sans réseau. Testé dans pastilles-accueil.test.ts.

import { cadeauDeFiche, periodeActive, type PaliersConfig } from '@/lib/paliers'

interface ProduitCarte {
  id: string
  variants: { nodes: { id: string; availableForSale?: boolean | null }[] }
}

export interface PastillesAccueil {
  /** Texte de la pastille par identifiant de produit. */
  pastilles: Record<string, string>
  /** Fin de la période de paliers (ISO), null sans fin ou sans période. */
  fin: string | null
}

const euros = (montant: number) =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(montant)} €`

export function pastillesCadeaux(config: PaliersConfig | null, now: Date, produits: ProduitCarte[]): PastillesAccueil {
  const periode = periodeActive(config, now)
  if (!periode) return { pastilles: {}, fin: null }
  const pastilles: Record<string, string> = {}
  for (const p of produits) {
    const enStock = p.variants.nodes.filter((v) => v.availableForSale !== false).map((v) => v.id)
    const cadeau = cadeauDeFiche(config, now, enStock)
    if (cadeau) pastilles[p.id] = `Offerte dès ${euros(cadeau.palier.montant)}`
  }
  return { pastilles, fin: periode.au }
}
