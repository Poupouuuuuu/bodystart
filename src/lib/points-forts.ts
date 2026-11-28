// Points forts de la fiche produit (28/11/2026) : jusqu'à 3 lignes sous le
// prix, au premier écran du téléphone.
//
// Le texte vient TOUJOURS du produit, jamais d'ici : aucune phrase n'est
// écrite, reformulée ou complétée par le site (allégations santé : seules
// celles de la fiche Shopify, relues avant publication, peuvent apparaître).
// Sources, dans l'ordre :
// 1. un metafield structuré : aucun n'existe au 28/11/2026 (requêtes produit
//    de lib/shopify/queries/products.ts et références de la fiche :
//    composition, valeurs nutritionnelles, allergènes, format, conseils
//    d'utilisation, rien de « points forts ») ;
// 2. les 3 premiers <li> de la description HTML, nettoyés et coupés proprement
//    sur une ligne : première phrase seulement ; trop longue, on garde le
//    libellé avant « : » (« Vitamine D3 (2 000 UI) »), sinon la fin d'une
//    proposition, sinon le dernier mot entier suivi de « … » ;
// 3. sinon rien : le bloc ne s'affiche pas.
// Les mentions de précaution (dose journalière, enfants, grossesse…) ne sont
// pas des points forts : écartées.
//
// Pur, sans réseau. Testé dans points-forts.test.ts.

import { frenchSpacing } from '@/lib/typo'

/** Longueur maximale d'une ligne : tient sur un écran de 375 px en 14 px. */
export const LONGUEUR_MAX = 46
const LONGUEUR_MIN = 3
const NOMBRE = 3

const ENTITES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  laquo: '«',
  raquo: '»',
  hellip: '…',
  eacute: 'é',
  egrave: 'è',
  agrave: 'à',
  ccedil: 'ç',
  oelig: 'œ',
}

function decoderEntites(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (tout, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : tout
    }
    return ENTITES[code.toLowerCase()] ?? tout
  })
}

const PRECAUTION =
  /dose journali|hors de (?:la )?port[ée]e|ne (?:se )?substitue|d[ée]conseill|enceinte|allaitant|avis m[ée]dical|m[ée]decin|ne pas d[ée]passer/i

/** Texte brut d'un <li> : balises retirées, entités décodées, espaces normalisés, puce de tête retirée. */
function texteBrut(html: string): string {
  const sansSousListe = html.split(/<(?:ul|ol)\b/i)[0]
  const texte = decoderEntites(sansSousListe.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, ''))
  return texte
    .replace(/[\s  ]+/g, ' ')
    .trim()
    .replace(/^[^\p{L}\p{N}(«"]+/u, '')
}

/** Première phrase, sans ponctuation finale. */
function premierePhrase(t: string): string {
  const fin = t.search(/[.!?…](?=\s|$)/)
  return (fin >= 0 ? t.slice(0, fin) : t).replace(/[\s.;:,!?…]+$/, '').trim()
}

const parenthesesEquilibrees = (t: string) => (t.match(/\(/g)?.length ?? 0) === (t.match(/\)/g)?.length ?? 0)

/** Coupe une ligne trop longue à un endroit propre (jamais au milieu d'un mot ni d'une parenthèse). */
function couper(t: string, max: number): string {
  if (t.length <= max) return t
  // 1. Libellé avant « : » (« Vitamine D3 (2 000 UI) : le soleil… »).
  const deuxPoints = t.search(/\s?:\s/)
  if (deuxPoints >= LONGUEUR_MIN && deuxPoints <= max) return t.slice(0, deuxPoints).trim()
  // 2. Fin de la dernière proposition qui tient : avant « , », « ; » ou « ( ».
  const bornes = [...t.matchAll(/\s?[,;]\s|\s\(/g)]
    .map((m) => m.index ?? -1)
    .filter((i) => i >= LONGUEUR_MIN && i <= max && parenthesesEquilibrees(t.slice(0, i)))
  if (bornes.length > 0) return t.slice(0, bornes[bornes.length - 1]).trim()
  // 3. Dernier mot entier, parenthèse ouverte retirée, puis « … ».
  let coupe = t.slice(0, max - 1)
  const espace = coupe.lastIndexOf(' ')
  if (espace >= LONGUEUR_MIN) coupe = coupe.slice(0, espace)
  if (!parenthesesEquilibrees(coupe)) coupe = coupe.slice(0, coupe.lastIndexOf('('))
  coupe = coupe.replace(/[\s.;:,!?(]+$/, '').trim()
  return coupe.length >= LONGUEUR_MIN ? `${coupe}…` : ''
}

/**
 * Jusqu'à 3 points forts tirés des <li> de la description Shopify, chacun sur
 * une ligne. Tableau vide quand la description n'a pas de liste : la fiche
 * n'affiche alors pas le bloc.
 */
export function pointsForts(descriptionHtml: string | null | undefined, max = LONGUEUR_MAX): string[] {
  if (!descriptionHtml) return []
  const out: string[] = []
  for (const m of descriptionHtml.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    const brut = texteBrut(m[1])
    if (!brut || PRECAUTION.test(brut)) continue
    const ligne = couper(premierePhrase(brut), max)
    if (ligne.length < LONGUEUR_MIN) continue
    const affiche = frenchSpacing(ligne)
    if (!out.includes(affiche)) out.push(affiche)
    if (out.length === NOMBRE) break
  }
  return out
}
