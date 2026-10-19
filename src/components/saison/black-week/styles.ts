// Styles de la déco Black Week (23 au 28/11, validée par Claude Gestion le
// 19/10/2026), émis seulement pendant la période (layout Nutrition) : rien ne
// pèse sur le site le reste de l'année. Noir #111111 et jaune #F2C200, décor
// sobre : étiquettes de prix, coins en équerre, mot surligné. Aucune animation.
//
// Mêmes classes repères que Halloween (saison-titre, saison-nuit,
// saison-bandeau…) : un seul thème émis à la fois.

// Icônes en SVG dans le CSS (aucun fichier image). Encodage minimal (seuls
// < > # % " sont échappés). Images de fond, jamais de masque CSS (Safari
// mobile, 19/10/2026).
const svg = (contenu: string, viewBox: string) =>
  `url("data:image/svg+xml,${`<svg xmlns='http://www.w3.org/2000/svg' viewBox='${viewBox}'>${contenu}</svg>`.replace(/[<>#%"]/g, encodeURIComponent)}")`

/** Étiquette de prix (corps, trou). */
const etiquette = (corps: string, trou: string) =>
  svg(
    `<path fill='${corps}' d='M3 12.6V4.5C3 3.7 3.7 3 4.5 3h8.1c.4 0 .8.2 1.1.4l7.4 7.4c.6.6.6 1.5 0 2.1l-8.1 8.1c-.6.6-1.5.6-2.1 0l-7.4-7.4c-.3-.3-.5-.7-.5-1z'/>` +
      `<circle cx='7.6' cy='7.6' r='1.7' fill='${trou}'/>`,
    '2 2 20 20'
  )

export const CSS_BLACK_WEEK = `
.bw-selection{background:radial-gradient(70% 60% at 85% 0%,rgba(242,194,0,.12) 0%,rgba(242,194,0,0) 60%),#111111}
.bw-frise{background:#111111}
:root{--bw-etiquette:${etiquette('#111111', '#F2C200')};--bw-etiquette-jaune:${etiquette('#F2C200', '#111111')}}
/* Titres de section : mot surligné jaune (texte noir sur jaune, 12:1),
   étiquette au bout, collée au dernier mot (espace insécable). */
.saison-mot{color:#111111;background:linear-gradient(transparent 60%,#F2C200 60%,#F2C200 94%,transparent 94%);padding:0 .06em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.saison-titre::after{content:"\\00a0";padding-right:.6em;background:var(--bw-etiquette) right center/.5em .5em no-repeat}
/* Sections en fond noir (saison-nuit) : texte clair, mot et étiquette jaunes. */
section.saison-nuit{background-color:#111111}
.saison-nuit .saison-mot{color:#F2C200;background:none}
.saison-nuit .saison-titre::after{background-image:var(--bw-etiquette-jaune)}
.saison-nuit .saison-nuit-titre{color:#FAF8F3}
.saison-nuit .saison-nuit-libelle{color:rgba(255,255,255,.78);border-color:rgba(255,255,255,.22)}
.saison-nuit .saison-nuit-lien{color:#FAF8F3;border-color:rgba(255,255,255,.32)}
.saison-nuit .saison-nuit-lien:hover{background-color:rgba(255,255,255,.08);border-color:#F2C200}
/* Coin en équerre jaune dans une section (saison-coin). */
.saison-coin{position:relative}
.saison-coin::before{content:"";position:absolute;top:20px;right:20px;width:clamp(26px,3.5vw,40px);aspect-ratio:1;pointer-events:none;border-top:3px solid #F2C200;border-right:3px solid #F2C200}
.saison-coin-gauche::before{right:auto;left:20px;border-right:0;border-left:3px solid #F2C200}
/* Bandeau de titre des pages (saison-bandeau) : fond noir pleine largeur,
   filet jaune en bas. Le filet déborde par border-image (débordement peint,
   pas de défilement horizontal ; avec left/right négatifs, la page faisait
   2 880 px de large en 1440). */
.saison-bandeau{position:relative;background-color:#111111;box-shadow:0 0 0 100vmax #111111;clip-path:inset(0 -100vmax);padding-bottom:2.25rem;margin-bottom:1.75rem}
.saison-bandeau-haut{clip-path:inset(-100vmax -100vmax 0)}
.saison-bandeau h1,.saison-bandeau .text-spruce{color:#FAF8F3}
.saison-bandeau p,.saison-bandeau nav{color:rgba(255,255,255,.8)}
.saison-bandeau a{color:#F2C200}
.saison-bandeau a:hover{color:#FFE066}
.saison-bandeau::after{content:"";position:absolute;bottom:0;left:0;right:0;height:3px;pointer-events:none;background:#F2C200;border-image:linear-gradient(#F2C200 0 0) fill 0//0 100vmax}
/* Filtres, onglets et page courante actifs (saison-actif, saison-actif-doux). */
.saison-actif{background-color:#111111!important;color:#fff!important}
.saison-actif *{color:#fff!important}
.saison-actif-doux{background-color:#FFF3BF!important;color:#111111!important;border-color:rgba(17,17,17,.22)!important}
/* Fiche produit : équerre dans un coin de la galerie, filet jaune sur la
   réassurance, étiquette à côté du badge de remise. */
.saison-toile::after{content:"";position:absolute;top:14px;left:14px;z-index:20;width:clamp(26px,7%,40px);aspect-ratio:1;pointer-events:none;border-top:3px solid #F2C200;border-left:3px solid #F2C200}
.saison-toile-droite::after{left:auto;right:14px;border-left:0;border-right:3px solid #F2C200}
.saison-reassurance{border-left:3px solid #F2C200;padding-left:14px}
.saison-badge-citrouille:not(.absolute){position:relative}
.saison-badge-citrouille::before{content:"";position:absolute;top:50%;right:calc(100% + 6px);width:18px;height:18px;transform:translateY(-50%);pointer-events:none;background:var(--bw-etiquette) center/contain no-repeat}
.saison-badge-citrouille-droite::before{right:auto;left:calc(100% + 6px)}
`
