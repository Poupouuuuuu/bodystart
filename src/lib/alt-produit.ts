// Texte alternatif des images produit (SEO 2, point 15 de Claude Gestion) :
// « [Produit] [marque] [format], BodyStart Nutrition ». Avant : « Whey Native
// Protimuscle - image 3 » sur la galerie, le seul titre sur les cartes.
// - Un texte saisi dans Shopify (coffrets, packs) reste prioritaire.
// - Marque omise si le titre la contient déjà ; format omis si sa quantité est
//   déjà dans le titre, s'il y en a plusieurs (« 500 g / 1 kg / 2,25 kg ») ou s'il
//   décrit autre chose qu'un format (« 3 produits : … »).
//
// Pur. Testé dans alt-produit.test.ts.

const MAISON = 'BodyStart Nutrition'
const MAX_FORMAT = 24

const compact = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[\s.,]+/g, '')

/** « Pot de 400 g (25 doses de 16 g) » → « 400 g » ; plusieurs formats ou description → null. */
export function formatCourt(brut: string | null | undefined): string | null {
  if (!brut) return null
  if (/[/:]|\bou\b/i.test(brut)) return null
  const tete = brut.split(/[(,;]/)[0].replace(/^(pot|sachet|boîte|boite|flacon|bouteille|tube)\s+de\s+/i, '').trim()
  return tete && tete.length <= MAX_FORMAT ? tete : null
}

/** Texte alternatif généré pour une image du produit. */
export function altProduit(p: { title: string; vendor?: string | null; format?: string | null }): string {
  const titre = p.title.trim()
  const parties = [titre]
  const marque = p.vendor?.trim()
  if (marque && marque !== MAISON && !compact(titre).includes(compact(marque))) parties.push(marque)
  const format = formatCourt(p.format)
  // « 120 gélules végétales » sous « L-Carnitine 1500 - 120 gélules » : la
  // quantité est déjà dans le titre, le format n'apporte rien.
  const quantite = format?.match(/^\d+(?:[.,]\d+)?\s*\p{L}+/u)?.[0] ?? format
  if (format && quantite && !compact(titre).includes(compact(quantite))) parties.push(format)
  return `${parties.join(' ')}, ${MAISON}`
}

/** Texte saisi dans Shopify s'il existe, sinon le texte généré. */
export function altImage(image: { altText?: string | null } | null | undefined, genere: string): string {
  return image?.altText?.trim() || genere
}
