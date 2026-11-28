// ============================================================
// « Pour composer le tien, en ligne » (page Pré-workout en boutique)
// ============================================================
// Demande de l'Agent Digital du 21/11/2026 : des liens calculés sur le stock
// plutôt qu'en dur, pour ne jamais mener à une fiche vide. Une ligne par
// ingrédient, vers la première fiche en stock (ordre reçu : meilleures
// ventes) ; la ligne disparaît quand plus rien n'est en stock.
// - L-citrulline : citrulline pure seulement (pas de malate de citrulline,
//   décision du 17/10/2026), jamais la L-Arginine (étiquetée citrulline pour
//   le rangement du catalogue) ;
// - bêta-alanine ;
// - shot pré-workout avec caféine : nom « shot », boisson, caféine attestée
//   (étiquette energy ou cafeine, ou « caféine » dans la description).
// Mêmes garde-fous que toute mise en avant automatique (lib/merchandising) :
// jamais une marque exclue, jamais la réserve (pré-workout, brûleurs, packs).
//
// Pur, sans réseau. Testé dans composer-pre-workout.test.ts.

import { familyOf, isAutoPromotable } from '@/lib/merchandising'

export interface ProduitComposable {
  handle: string
  title: string
  productType: string
  vendor: string
  tags: string[]
  availableForSale?: boolean
  description?: string | null
}

export interface LigneComposer {
  cle: 'citrulline' | 'beta-alanine' | 'shot'
  libelle: string
  handle: string
  titre: string
}

const norm = (s?: string | null) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const etiquettes = (p: ProduitComposable) => p.tags.map((t) => norm(t).trim())

const REGLES: { cle: LigneComposer['cle']; libelle: string; retenir: (p: ProduitComposable) => boolean }[] = [
  {
    cle: 'citrulline',
    libelle: 'L-citrulline',
    retenir: (p) =>
      familyOf(p) === 'acides-amines' &&
      etiquettes(p).includes('citrulline') &&
      norm(p.title).includes('citrulline') &&
      !norm(`${p.title} ${p.handle}`).includes('malate'),
  },
  {
    cle: 'beta-alanine',
    libelle: 'Bêta-alanine',
    retenir: (p) => familyOf(p) === 'acides-amines' && etiquettes(p).includes('beta-alanine') && norm(p.title).includes('alanine'),
  },
  {
    cle: 'shot',
    libelle: 'Shot pré-workout avec caféine',
    retenir: (p) =>
      familyOf(p) === 'boisson' &&
      /\bshot\b/.test(norm(p.title)) &&
      (etiquettes(p).some((t) => t === 'energy' || t === 'cafeine') || norm(p.description).includes('cafeine')),
  },
]

const RESERVE = new Set(['pre-workout', 'bruleur', 'pack'])

/** Lignes à afficher, dans l'ordre citrulline, bêta-alanine, shot ; [] si rien n'est en stock. */
export function liensComposerPreWorkout(produits: readonly ProduitComposable[]): LigneComposer[] {
  const candidats = produits.filter((p) => p.availableForSale === true && isAutoPromotable(p) && !RESERVE.has(familyOf(p)))
  const lignes: LigneComposer[] = []
  for (const regle of REGLES) {
    const p = candidats.find(regle.retenir)
    if (p) lignes.push({ cle: regle.cle, libelle: regle.libelle, handle: p.handle, titre: p.title.trim() })
  }
  return lignes
}
