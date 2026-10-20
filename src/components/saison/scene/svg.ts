// Motifs SVG dans le CSS des décors de saison (aucun fichier image). Encodage
// minimal (seuls < > # % " sont échappés) : le CSS part dans chaque page
// pendant la période. Images de fond, jamais de masque CSS (Safari mobile
// dessinait certains masques en carré plein, 19/10/2026).
export const svg = (contenu: string, viewBox: string, ratio?: string) =>
  `url("data:image/svg+xml,${`<svg xmlns='http://www.w3.org/2000/svg' viewBox='${viewBox}'${ratio ? ` preserveAspectRatio='${ratio}'` : ''}>${contenu}</svg>`.replace(/[<>#%"]/g, encodeURIComponent)}")`
