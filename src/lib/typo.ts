// Typographie française à l'affichage : espace insécable avant : ; ! ? € % »,
// après « et entre un nombre et « h » (heures). Évite qu'une ligne commence par
// « : » ou qu'un « € » se retrouve seul, sans toucher au texte source (utile
// pour les textes copiés tels quels depuis Shopify, comme les CGV).
export function frenchSpacing(text: string): string {
  return text
    .replace(/ (?=[:;!?€%»])/g, '\u00a0')
    .replace(/« /g, '«\u00a0')
    .replace(/(\d) (?=h\b)/g, '$1\u00a0')
}

// Poids et volumes à la française, à l'affichage seulement (les titres de
// variantes Shopify restent tels quels) : « 2.27kg » → « 2,27 kg »,
// « 500g » → « 500 g », espace insécable entre le nombre et l'unité.
// « L » (litre) garde sa casse ; « 1 Litre » n'est pas touché.
export function formatPoids(text: string): string {
  // (?![\p{L}\d]) plutôt que \b : \b voit « é » comme une non-lettre (« 60 gélules »).
  return text.replace(/(\d+(?:[.,]\d+)?)\s*(kg|mg|ml|cl|g|l)(?![\p{L}\d])/giu, (_, n: string, u: string) => {
    const unite = /^l$/i.test(u) ? u : u.toLowerCase()
    return `${n.replace('.', ',')} ${unite}`
  })
}
