// Choix du parfum et du format dans la feuille d'ajout rapide.
//
// - Ouverture sur la première variante disponible (comme la fiche,
//   lib/product-variant).
// - Une valeur sans aucune variante disponible (« Fraise » épuisé dans tous
//   les formats) est grisée et ne se choisit pas.
// - Une valeur disponible dans une autre combinaison (« 2 kg » existe en
//   chocolat seulement) reste choisissable : les autres options passent sur
//   la variante disponible la plus proche du choix en cours.
//
// Pur. Testé dans selection.test.ts.

export interface VarianteChoix {
  id: string
  availableForSale: boolean
  selectedOptions: { name: string; value: string }[]
}

export type Choix = Record<string, string>

export type EtatValeur = 'choisie' | 'dispo' | 'rupture'

const valeurDe = (v: VarianteChoix, option: string) => v.selectedOptions.find((o) => o.name === option)?.value

const choixDe = (v: VarianteChoix): Choix => Object.fromEntries(v.selectedOptions.map((o) => [o.name, o.value]))

/** Options à montrer : sans l'option unique « Title » des produits sans variante. */
export function optionsAChoisir<O extends { name: string; optionValues: { name: string }[] }>(
  options: O[],
  variantes: VarianteChoix[]
): O[] {
  if (variantes.length <= 1) return []
  return options.filter((o) => o.optionValues.length > 1 || o.name.toLowerCase() !== 'title')
}

export function choixInitial(variantes: VarianteChoix[]): Choix {
  const v = variantes.find((x) => x.availableForSale) ?? variantes[0]
  return v ? choixDe(v) : {}
}

export function varianteDuChoix<V extends VarianteChoix>(variantes: V[], choix: Choix): V | undefined {
  return variantes.find((v) => v.selectedOptions.every((o) => choix[o.name] === o.value))
}

export function etatValeur(variantes: VarianteChoix[], choix: Choix, option: string, valeur: string): EtatValeur {
  if (choix[option] === valeur) return 'choisie'
  return variantes.some((v) => v.availableForSale && valeurDe(v, option) === valeur) ? 'dispo' : 'rupture'
}

/** Nouveau choix après un appui sur `valeur` de `option` (inchangé si la valeur est en rupture). */
export function choisir(variantes: VarianteChoix[], choix: Choix, option: string, valeur: string): Choix {
  const voulu = { ...choix, [option]: valeur }
  const exacte = varianteDuChoix(variantes, voulu)
  if (exacte?.availableForSale) return voulu
  const candidates = variantes.filter((v) => v.availableForSale && valeurDe(v, option) === valeur)
  if (candidates.length === 0) return choix
  const proximite = (v: VarianteChoix) => v.selectedOptions.filter((o) => voulu[o.name] === o.value).length
  const meilleure = candidates.reduce((a, b) => (proximite(b) > proximite(a) ? b : a))
  return choixDe(meilleure)
}
