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
