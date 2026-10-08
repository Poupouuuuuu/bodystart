// Moteur de recommandation du guide /conseil : fonction pure, testée
// (moteur.test.ts). Tourne dans le navigateur : les contraintes alimentaires
// (données de santé possibles) ne quittent jamais l'appareil du client.
//
// Ordre d'application (décrit par les règles du metafield) :
//   1. parcours = objectifs[objectif].parcours[standard|masse][budget]
//   2. transformations des candidats (séances, sans lactose, vegan)
//   3. résolution du stock à la boutique (premier candidat en stock au bon format)
//   4. plafond du budget (on retire le dernier complément, jamais l'essentiel)
//   5. shaker proposé en option si la sélection contient une protéine ou un gainer

import type {
  Budget,
  Catalogue,
  Emplacement,
  Guide,
  GuideProduit,
  Ligne,
  ObjectifBoutique,
  Reponses,
  Resultat,
  Role,
  VarianteProposee,
} from './types'

/** Plafond par budget (« le budget est un plafond »), en centimes. */
export const PLAFONDS_CENTS: Record<Budget, number | null> = {
  'moins-40': 4000,
  '40-90': 9000,
  'plus-90': null,
}

/** Protéines en poudre et gainers : leur présence déclenche la proposition du shaker. */
const PROTEINES_OU_GAINERS = new Set([
  'protimuscle1',
  'protimuscle225',
  'musclewhey',
  'clearwhey',
  'mutantmass227',
  'mutantmass68',
])

/**
 * Vegan, lecture prudente de la règle : elle ne cite que les protéines, les
 * oméga 3 et la vitamine D3 à retirer, et ne dit rien des autres produits
 * (ZMA, multivitamines, acides aminés, barre au lait, gainer). On ne garde
 * donc que ce qu'on sait compatible : liste blanche.
 */
const VEGAN_AUTORISES = new Set([
  'creatine',
  'magnesium',
  'creamofrice',
  'cremeriznm',
  'clusterdextrin',
  'shaker',
])

const SANS_LACTOSE_REMPLACES = new Set(['protimuscle1', 'protimuscle225'])
const SANS_LACTOSE_REMPLACANTS = ['musclewhey', 'clearwhey']

const CLE_SHAKER = 'shaker'
const MAX_SUGGESTIONS = 3

// ─── Formats ─────────────────────────────────────────────────

/** Minuscules, sans espaces, virgule décimale → point (« 2,25 kg » → « 2.25kg »). */
export function normaliserFormat(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '').replace(/,/g, '.')
}

/**
 * Le format est-il contenu dans le titre de variante ? Comparaison normalisée,
 * et le format ne doit pas être collé à un chiffre avant lui (« 1 kg » ne
 * correspond pas à « 11 kg », ni « 25 kg » à « 2,25 kg »). Format vide :
 * n'importe quelle variante.
 */
export function correspondAuFormat(titreVariante: string, format: string): boolean {
  const f = normaliserFormat(format)
  if (!f) return true
  const t = normaliserFormat(titreVariante)
  let i = t.indexOf(f)
  while (i !== -1) {
    if (i === 0 || !/[0-9.]/.test(t[i - 1])) return true
    i = t.indexOf(f, i + 1)
  }
  return false
}

function segments(titre: string): string[] {
  return titre
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Parfum (ou libellé utile) d'une variante, sans son format : « Chocolat / 1 kg » → « Chocolat ». */
export function libelleVariante(titre: string, format: string): string {
  if (titre === 'Default Title') return ''
  const avecFormat = normaliserFormat(format) !== ''
  return segments(titre)
    .filter((s) => !(avecFormat && correspondAuFormat(s, format)))
    .join(' / ')
}

/** Format tel que la boutique l'écrit dans le titre de variante (« 2,25 kg »). */
export function formatDansTitre(titre: string, format: string): string | null {
  if (!normaliserFormat(format)) return null
  return segments(titre).find((s) => correspondAuFormat(s, format)) ?? format.trim()
}

/** Message client d'une règle : le texte entre les derniers « ». */
export function extraireMessage(regle: string | undefined): string | null {
  if (!regle) return null
  const m = /«\s*([^«»]+?)\s*»[^«»]*$/.exec(regle)
  return m ? m[1] : null
}

// ─── Étape 2 : transformations des candidats ─────────────────

function sansDoublons(cles: string[]): string[] {
  return cles.filter((c, i) => cles.indexOf(c) === i)
}

export function appliquerRegles(emplacements: Emplacement[], r: Reponses): Emplacement[] {
  const sansLactose = r.contraintes.includes('sans-lactose')
  const vegan = r.contraintes.includes('vegan')
  // sans-cafeine : aucun produit du guide n'en contient, aucun effet.

  return emplacements.map((e) => {
    let c = [...e.candidats]

    // Séances 0 à 1 : la créatine porte sur des exercices intenses.
    if (r.seances === '0-1') c = c.filter((k) => k !== 'creatine')

    // Séances 4 et plus avec un budget sans plafond : le grand format d'abord,
    // le 1 kg reste en repli.
    if (
      r.seances === '4-plus' &&
      r.budget === 'plus-90' &&
      e.role === 'essentiel' &&
      c.includes('protimuscle1')
    ) {
      c = ['protimuscle225', ...c.filter((k) => k !== 'protimuscle225')]
    }

    // Sans lactose : la whey native est remplacée par les isolats, dans cet
    // ordre, à la place de la première occurrence.
    if (sansLactose) {
      const i = c.findIndex((k) => SANS_LACTOSE_REMPLACES.has(k))
      if (i !== -1) {
        const garder = (k: string) => !SANS_LACTOSE_REMPLACES.has(k)
        c = [...c.slice(0, i).filter(garder), ...SANS_LACTOSE_REMPLACANTS, ...c.slice(i + 1).filter(garder)]
      }
    }

    if (vegan) c = c.filter((k) => VEGAN_AUTORISES.has(k))

    return { role: e.role, candidats: sansDoublons(c) }
  })
}

function messagesApplicables(guide: Guide, r: Reponses): string[] {
  const out: string[] = []
  if (r.seances === '0-1' && guide.messages.frequence01) out.push(guide.messages.frequence01)
  if (r.contraintes.includes('sans-lactose') && guide.messages.sansLactose) out.push(guide.messages.sansLactose)
  if (r.contraintes.includes('vegan') && guide.messages.vegan) out.push(guide.messages.vegan)
  return out
}

// ─── Étape 3 : stock à la boutique ───────────────────────────

function cleProduitFormat(p: GuideProduit): string {
  return `${p.handle}|${normaliserFormat(p.format)}`
}

/**
 * Ligne pour une clé produit si au moins une variante au bon format est en
 * stock à la boutique (et vendable en ligne). Parfum par défaut : la variante
 * la plus stockée (approximation du plus vendu, faute de ventes par parfum).
 */
export function resoudreProduit(
  cle: string,
  role: Ligne['role'],
  guide: Guide,
  catalogue: Catalogue
): Ligne | null {
  const gp = guide.produits[cle]
  const produit = catalogue[cle]
  if (!gp || !produit) return null

  const enStock = produit.variantes
    .map((v, rang) => ({ v, rang }))
    .filter(({ v }) => v.disponible && v.stock > 0 && correspondAuFormat(v.titre, gp.format))
    .sort((a, b) => b.v.stock - a.v.stock || a.rang - b.rang)
    .map(({ v }) => v)
  if (enStock.length === 0) return null

  const variantes: VarianteProposee[] = enStock.map((v) => ({
    id: v.id,
    libelle: libelleVariante(v.titre, gp.format),
    prixCents: v.prixCents,
    stock: v.stock,
    image: v.image ?? produit.image,
  }))

  return {
    cle,
    role,
    handle: gp.handle,
    titre: produit.titre,
    pourquoi: gp.pourquoi,
    format: formatDansTitre(enStock[0].titre, gp.format),
    variantes,
    prixMaxCents: Math.max(...variantes.map((v) => v.prixCents)),
  }
}

function resoudreEmplacements(emplacements: Emplacement[], guide: Guide, catalogue: Catalogue): Ligne[] {
  const pris = new Set<string>()
  const lignes: Ligne[] = []
  for (const e of emplacements) {
    for (const cle of e.candidats) {
      const gp = guide.produits[cle]
      if (!gp || pris.has(cleProduitFormat(gp))) continue
      const ligne = resoudreProduit(cle, e.role as Role, guide, catalogue)
      if (ligne) {
        lignes.push(ligne)
        pris.add(cleProduitFormat(gp))
        break
      }
    }
    // Aucun candidat en stock : l'emplacement n'est pas affiché.
  }
  return lignes
}

// ─── Étape 4 : plafond ───────────────────────────────────────

function totalMax(lignes: Ligne[]): number {
  return lignes.reduce((s, l) => s + l.prixMaxCents, 0)
}

/** Retire le dernier complément tant que le total dépasse ; l'essentiel n'est jamais retiré. */
export function appliquerPlafond(lignes: Ligne[], plafondCents: number | null): Ligne[] {
  if (plafondCents === null) return lignes
  const out = [...lignes]
  while (totalMax(out) > plafondCents) {
    let i = out.length - 1
    while (i >= 0 && out[i].role !== 'complement') i--
    if (i < 0) break
    out.splice(i, 1)
  }
  return out
}

// ─── Total affiché (parfums choisis) ─────────────────────────

/** Prix de la ligne pour le parfum choisi (parfum par défaut si absent ou inconnu). */
export function prixLigneCents(ligne: Ligne, varianteId?: string): number {
  const v = ligne.variantes.find((x) => x.id === varianteId) ?? ligne.variantes[0]
  return v.prixCents
}

// ─── Point d'entrée ──────────────────────────────────────────

function resultatNeSaitPas(objectif: ObjectifBoutique, guide: Guide, catalogue: Catalogue): Resultat {
  const pris = new Set<string>()
  const suggestions: Ligne[] = []
  for (const cle of objectif.suggestions) {
    if (suggestions.length >= MAX_SUGGESTIONS) break
    const gp = guide.produits[cle]
    if (!gp || pris.has(cleProduitFormat(gp))) continue
    const ligne = resoudreProduit(cle, 'suggestion', guide, catalogue)
    if (ligne) {
      suggestions.push(ligne)
      pris.add(cleProduitFormat(gp))
    }
  }
  return { type: 'boutique', raison: 'ne-sait-pas', texte: objectif.texte, suggestions, messages: [] }
}

export function recommander(guide: Guide, reponses: Reponses, catalogue: Catalogue): Resultat {
  const objectif = guide.objectifs.find((o) => o.cle === reponses.objectif)
  if (!objectif) {
    return { type: 'boutique', raison: 'rupture', texte: null, suggestions: [], messages: [] }
  }
  if (objectif.type === 'boutique') return resultatNeSaitPas(objectif, guide, catalogue)

  const nomParcours = objectif.questionSup
    ? reponses.questionSup
      ? objectif.questionSup.oui
      : objectif.questionSup.non
    : 'standard'
  const parcours = objectif.parcours[nomParcours] ?? objectif.parcours.standard
  const emplacements = appliquerRegles(parcours?.[reponses.budget] ?? [], reponses)
  const messages = messagesApplicables(guide, reponses)

  const plafondCents = PLAFONDS_CENTS[reponses.budget]
  const lignes = appliquerPlafond(resoudreEmplacements(emplacements, guide, catalogue), plafondCents)
  if (lignes.length === 0) {
    return { type: 'boutique', raison: 'rupture', texte: null, suggestions: [], messages }
  }

  const shaker = lignes.some((l) => PROTEINES_OU_GAINERS.has(l.cle))
    ? resoudreProduit(CLE_SHAKER, 'option', guide, catalogue)
    : null

  return { type: 'selection', lignes, shaker, messages, plafondCents }
}
