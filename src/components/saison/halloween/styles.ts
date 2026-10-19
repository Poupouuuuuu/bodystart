// Styles de la déco Halloween (19/10/2026), émis seulement pendant la période
// (layout Nutrition) : rien ne pèse sur le site le reste de l'année.
//
// Animations en transform et opacity uniquement, coupées par
// prefers-reduced-motion et mises en pause hors écran ([data-pause], posé par
// components/saison/AnimationsSaison). Sans animation, tout reste en place et
// visible (chauves-souris arrêtées sur le ciel, lucioles allumées).

// Icônes en SVG dans le CSS (aucun fichier image) : citrouille et chauve-souris
// des titres, chauves-souris des bandeaux de page. Encodage minimal (seuls
// < > # % " sont échappés) : le CSS part dans chaque page pendant la période.
const svg = (contenu: string, viewBox: string) =>
  `url("data:image/svg+xml,${`<svg xmlns='http://www.w3.org/2000/svg' viewBox='${viewBox}'>${contenu}</svg>`.replace(/[<>#%"]/g, encodeURIComponent)}")`
const CITROUILLE = svg(
  "<path fill='#3B7A3F' d='M24.6 9.4c-.5-3 .5-5.6 3-7.2l1 1.3c-1.9 1.3-2.5 3.2-2.1 5.7z'/>" +
    "<path fill='#E8711A' d='M24 10c-3.4-2-9.4-1.8-12.6 1.4C7.6 15.2 6.6 23 9.6 29c2.6 5.2 8.2 7.2 14.4 6 6.2 1.2 11.8-.8 14.4-6 3-6 2-13.8-1.8-17.6C33.4 8.2 27.4 8 24 10z'/>" +
    "<path fill='none' stroke='#A9480C' stroke-width='1.5' d='M24 11v23.6M17.2 12c-2.6 6-2.6 16.6 0 22.6M30.8 12c2.6 6 2.6 16.6 0 22.6'/>",
  '6 1 36 35'
)
const AILES =
  'M16 4c.7 0 1.2.6 1.4 1.3l.5-1.6.5 1.7c1.6-1.7 4.6-3.1 8.6-2.6-1.4.7-2.3 2-2.3 3.4 1.6-.4 3.4.1 4.8 1.3-1.7-.1-3.2.7-3.9 2.1-1.2-.9-2.9-1-4.2-.2.3 1.3-.1 2.8-1.2 3.9-.8-1.3-2.4-2.1-4.2-2.1s-3.4.8-4.2 2.1c-1.1-1.1-1.5-2.6-1.2-3.9-1.3-.8-3-.7-4.2.2-.7-1.4-2.2-2.2-3.9-2.1 1.4-1.2 3.2-1.7 4.8-1.3 0-1.4-.9-2.7-2.3-3.4 4-.5 7 .9 8.6 2.6l.5-1.7.5 1.6C14.8 4.6 15.3 4 16 4z'
// Images de fond, jamais de masque CSS : Safari mobile dessinait la chauve-souris
// des titres (masque sur un élément en ligne) dans un carré plein (19/10/2026).
const chauveSouris = (couleur: string) => svg(`<path fill='${couleur}' d='${AILES}'/>`, '2 2 28 13')
const toile = (couleur: string) =>
  svg(
    `<path fill='none' stroke='${couleur}' stroke-width='.6' d='M16 0V16M16 0 3 13M16 0 0 7M16 0H0M16 5 12.5 3.5 11.4 2 11 0M16 10 8.9 7.1 6.8 4 6 0M16 14.5 5.7 10.3 2.7 5.8 1.5 0'/>`,
    '0 0 16 16'
  )
const CHAUVES_SOURIS = svg(
  `<defs><path id='a' d='${AILES}'/></defs><g fill='#F6A456'>` +
    "<use href='#a' transform='translate(58 0) scale(1.5)'/>" +
    "<use href='#a' transform='translate(4 20)' opacity='.8'/>" +
    "<use href='#a' transform='translate(96 26) scale(.7)' opacity='.65'/></g>",
  '0 0 120 48'
)

const ETOILES = [
  [6, 10],
  [17, 28],
  [27, 8],
  [39, 21],
  [52, 34],
  [61, 6],
  [72, 24],
  [86, 12],
  [93, 31],
  [12, 46],
]
  .map(
    ([x, y], i) =>
      `radial-gradient(${i % 3 ? 1 : 1.5}px ${i % 3 ? 1 : 1.5}px at ${x}% ${y}%,rgba(255,236,214,.85),transparent 70%)`
  )
  .join(',')

export const CSS_HALLOWEEN = `
.hw-etoiles{background-image:${ETOILES};opacity:.75}
.hw-lune{background:radial-gradient(circle at 36% 32%,#FFE4BE 0%,#F9B46F 20%,#EF8737 50%,#DA681B 76%,#B5510F 100%)}
.hw-lune::before,.hw-lune::after{content:"";position:absolute;border-radius:9999px;background:radial-gradient(circle,rgba(150,55,5,.2) 0%,rgba(150,55,5,.1) 45%,rgba(150,55,5,0) 72%)}
.hw-lune::before{width:30%;height:30%;left:52%;top:20%}
.hw-lune::after{width:20%;height:20%;left:24%;top:56%}
.hw-halo{background:radial-gradient(circle,rgba(232,113,26,.4) 0%,rgba(232,113,26,.15) 34%,rgba(232,113,26,0) 66%)}
.hw-luciole{position:absolute;width:4px;height:4px;border-radius:9999px;background:#FFB46B;box-shadow:0 0 6px 2px rgba(232,113,26,.65),0 0 16px 5px rgba(232,113,26,.22);opacity:.75}
.hw-vol{position:absolute;left:0;color:#0A0710;transform:translate3d(var(--x,30vw),0,0)}
.hw-vol-zone{position:absolute;left:0;width:100%;color:#0A0710;transform:translate3d(var(--x,40%),0,0)}
.hw-silhouette{filter:drop-shadow(0 0 3px rgba(232,113,26,.6))}
.hw-visage{filter:drop-shadow(0 0 3px rgba(247,160,80,.9))}
.hw-lisere{filter:drop-shadow(0 -1px 0 rgba(240,140,70,.55))}
.hw-frise{background:radial-gradient(60% 120% at 50% 118%,rgba(232,113,26,.26) 0%,rgba(232,113,26,0) 60%),linear-gradient(to bottom,#14101F 0%,#241A33 62%,#33223F 100%)}
.hw-selection{background:radial-gradient(70% 60% at 85% 0%,rgba(232,113,26,.16) 0%,rgba(232,113,26,0) 60%),radial-gradient(60% 50% at 0% 100%,rgba(120,80,170,.18) 0%,rgba(120,80,170,0) 70%),#14101F}
@media (prefers-reduced-motion:no-preference){
.hw-vol{animation:hw-vol var(--d,50s) linear infinite;animation-delay:var(--r,0s);will-change:transform}
.hw-vol-zone{animation:hw-vol-zone var(--d,40s) linear infinite;animation-delay:var(--r,0s);will-change:transform}
.hw-vol>svg,.hw-vol-zone>svg{animation:hw-aile var(--f,.8s) ease-in-out infinite alternate;transform-origin:50% 45%}
.hw-halo{animation:hw-halo 7s ease-in-out infinite alternate}
.hw-luciole{animation:hw-luciole var(--d,5s) ease-in-out infinite;animation-delay:var(--r,0s)}
}
[data-pause],[data-pause] *{animation-play-state:paused!important}
@keyframes hw-vol{from{transform:translate3d(-18vw,2vh,0)}to{transform:translate3d(118vw,-3vh,0)}}
@keyframes hw-vol-zone{from{transform:translate3d(-12%,1.5vh,0)}to{transform:translate3d(100%,-2vh,0)}}
@keyframes hw-aile{from{transform:scaleY(1)}to{transform:scaleY(.6)}}
@keyframes hw-halo{from{opacity:.72;transform:scale(.97)}to{opacity:1;transform:scale(1.03)}}
@keyframes hw-luciole{0%,100%{opacity:.08;transform:translate3d(0,4px,0)}50%{opacity:1;transform:translate3d(0,-7px,0)}}
/* Icônes partagées, déclarées une fois. */
:root{--hw-citrouille:${CITROUILLE};--hw-chauve-souris:${chauveSouris('#14101F')};--hw-chauve-souris-orange:${chauveSouris('#E8711A')};--hw-toile:${toile('#14101F')};--hw-toile-claire:${toile('#FFFFFF')}}
/* Titres de section (saison-titre, saison-mot) : un mot en orange, une
   citrouille ou une chauve-souris au bout, collée au dernier mot (espace
   insécable) : jamais seule sur une ligne. Orange foncé #B4500E sur fond
   clair (4,6:1), orange #E8711A sur fond nuit. */
.saison-mot{color:#B4500E}
.saison-titre::after{content:"\\00a0";padding-right:.62em;background:var(--hw-citrouille) right center/.58em .58em no-repeat}
.saison-titre[data-saison-icone=chauve-souris]::after{padding-right:.98em;background:var(--hw-chauve-souris) right center/.95em .45em no-repeat}
/* Sections en fond nuit (saison-nuit) : texte clair, cartes inchangées. */
section.saison-nuit{background-color:#14101F}
.saison-nuit .saison-mot{color:#E8711A}
.saison-nuit .saison-titre[data-saison-icone=chauve-souris]::after{background-image:var(--hw-chauve-souris-orange)}
.saison-nuit .saison-nuit-titre{color:#FAF8F3}
.saison-nuit .saison-nuit-libelle{color:rgba(255,255,255,.78);border-color:rgba(255,255,255,.22)}
.saison-nuit .saison-nuit-lien{color:#FAF8F3;border-color:rgba(255,255,255,.32)}
.saison-nuit .saison-nuit-lien:hover{background-color:rgba(255,255,255,.08);border-color:#E8711A}
/* Toiles discrètes dans un coin de section (saison-coin). */
.saison-coin{position:relative}
.saison-coin::before{content:"";position:absolute;top:0;right:0;width:clamp(64px,9vw,120px);aspect-ratio:1;pointer-events:none;background:var(--hw-toile) top right/contain no-repeat;opacity:.13}
.saison-coin-gauche::before{right:auto;left:0;transform:scaleX(-1)}
/* Bandeau de titre des pages (saison-bandeau) : fond nuit pleine largeur,
   toile dans un coin, 3 chauves-souris immobiles. */
.saison-bandeau{position:relative;background-color:#14101F;box-shadow:0 0 0 100vmax #14101F;clip-path:inset(0 -100vmax);padding-bottom:2.25rem;margin-bottom:1.75rem}
.saison-bandeau-haut{clip-path:inset(-100vmax -100vmax 0)}
.saison-bandeau.saison-bandeau-haut::before{top:-28px}
.saison-bandeau.saison-bandeau-haut::after{top:-30px;width:clamp(72px,10vw,150px)}
.saison-bandeau h1,.saison-bandeau .text-spruce{color:#FAF8F3}
.saison-bandeau p,.saison-bandeau nav{color:rgba(255,255,255,.8)}
.saison-bandeau a{color:#FFB46B}
.saison-bandeau a:hover{color:#FFD2A6}
.saison-bandeau::before{content:"";position:absolute;top:0;right:0;width:clamp(56px,8vw,104px);aspect-ratio:1;pointer-events:none;background:var(--hw-toile-claire) top right/contain no-repeat;opacity:.16}
.saison-bandeau::after{content:"";position:absolute;top:18px;right:calc(clamp(56px,8vw,104px) + 2%);width:clamp(88px,13vw,170px);aspect-ratio:120/48;pointer-events:none;background:${CHAUVES_SOURIS} center/contain no-repeat;opacity:.9}
/* Filtres, onglets et page courante actifs (saison-actif, saison-actif-doux). */
.saison-actif{background-color:#B4500E!important;color:#fff!important}
.saison-actif *{color:#fff!important}
.saison-actif-doux{background-color:#FCE3CF!important;color:#8A3A06!important;border-color:rgba(180,80,14,.28)!important}
/* Fiche produit : toile dans un coin de la galerie, liseré sur la
   réassurance, citrouille à côté du badge de remise. */
.saison-toile::after{content:"";position:absolute;top:0;left:0;z-index:20;width:clamp(56px,16%,104px);aspect-ratio:1;pointer-events:none;background:var(--hw-toile) top right/contain no-repeat;opacity:.2;transform:scaleX(-1)}
.saison-toile-droite::after{left:auto;right:0;transform:none}
.saison-reassurance{border-left:3px solid #E8711A;padding-left:14px}
.saison-badge-citrouille:not(.absolute){position:relative}
.saison-badge-citrouille::before{content:"";position:absolute;top:50%;right:calc(100% + 6px);width:22px;height:21px;transform:translateY(-50%);pointer-events:none;background:var(--hw-citrouille) center/contain no-repeat}
.saison-badge-citrouille-droite::before{right:auto;left:calc(100% + 6px)}
`
