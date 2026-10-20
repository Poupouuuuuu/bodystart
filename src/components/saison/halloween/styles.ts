// Styles de la déco Halloween (19/10/2026, mise en scène refaite le 20/10/2026
// sur le modèle de Noël), émis seulement pendant la période (layout
// Nutrition) : rien ne pèse sur le site le reste de l'année.
//
// Haut de l'accueil en nuit #14101F, grandes sections en crème, orange et
// violet en accents. Guirlande de petites lanternes citrouilles,
// chauves-souris et araignées au bout d'un fil, feuilles d'automne qui
// tombent, sol de nuit avec citrouilles, pierres tombales, bonbons et marmite,
// toiles d'araignée dans les coins. Ton élégant, rien d'effrayant.
//
// Chute, objets suspendus et guirlande : composants et règles communs de
// scene/, paramétrés ici. Animations en transform et opacity, coupées par
// prefers-reduced-motion et mises en pause hors écran. Sans animation :
// feuilles posées, lanternes et citrouilles allumées, objets immobiles.

import { CSS_SCENE } from '../scene/css'
import { cssGuirlande } from '../scene/guirlande'
import { svg } from '../scene/svg'

const AILES =
  'M16 4c.7 0 1.2.6 1.4 1.3l.5-1.6.5 1.7c1.6-1.7 4.6-3.1 8.6-2.6-1.4.7-2.3 2-2.3 3.4 1.6-.4 3.4.1 4.8 1.3-1.7-.1-3.2.7-3.9 2.1-1.2-.9-2.9-1-4.2-.2.3 1.3-.1 2.8-1.2 3.9-.8-1.3-2.4-2.1-4.2-2.1s-3.4.8-4.2 2.1c-1.1-1.1-1.5-2.6-1.2-3.9-1.3-.8-3-.7-4.2.2-.7-1.4-2.2-2.2-3.9-2.1 1.4-1.2 3.2-1.7 4.8-1.3 0-1.4-.9-2.7-2.3-3.4 4-.5 7 .9 8.6 2.6l.5-1.7.5 1.6C14.8 4.6 15.3 4 16 4z'
const SOIE = '#8C849C'

const CITROUILLE = svg(
  "<path fill='#3B7A3F' d='M24.6 9.4c-.5-3 .5-5.6 3-7.2l1 1.3c-1.9 1.3-2.5 3.2-2.1 5.7z'/>" +
    "<path fill='#E8711A' d='M24 10c-3.4-2-9.4-1.8-12.6 1.4C7.6 15.2 6.6 23 9.6 29c2.6 5.2 8.2 7.2 14.4 6 6.2 1.2 11.8-.8 14.4-6 3-6 2-13.8-1.8-17.6C33.4 8.2 27.4 8 24 10z'/>" +
    "<path fill='none' stroke='#A9480C' stroke-width='1.5' d='M24 11v23.6M17.2 12c-2.6 6-2.6 16.6 0 22.6M30.8 12c2.6 6 2.6 16.6 0 22.6'/>",
  '6 1 36 35'
)
const chauveSouris = (couleur: string) => svg(`<path fill='${couleur}' d='${AILES}'/>`, '2 2 28 13')

/** Chauve-souris au bout de son fil (le fil rejoint la tête). */
const CHAUVE_SOURIS_PENDUE = svg(
  `<path d='M16 0V4.4' stroke='${SOIE}' stroke-width='.6'/><path fill='#1A1226' d='${AILES}'/>`,
  '2 0 28 15'
)

// Araignée ronde, petits yeux clairs : plus mignonne qu'effrayante.
const PATTES =
  'M10.2 11.2C6.6 9.6 4.8 6.8 3.6 3.4M9.6 12.6C5.6 12 3.4 11 1.4 9.2M9.6 14.2C5.4 15.2 3.6 17 2.4 20.2M10.6 15.8C8.4 18.2 7.4 20.4 7 23.2M13.8 11.2C17.4 9.6 19.2 6.8 20.4 3.4M14.4 12.6C18.4 12 20.6 11 22.6 9.2M14.4 14.2C18.6 15.2 20.4 17 21.6 20.2M13.4 15.8C15.6 18.2 16.6 20.4 17 23.2'
const CORPS_ARAIGNEE =
  `<path d='${PATTES}' fill='none' stroke='#1A1226' stroke-width='1.3' stroke-linecap='round'/>` +
  "<circle cx='12' cy='14.6' r='4.6' fill='#1A1226'/><circle cx='12' cy='9' r='2.9' fill='#1A1226'/>" +
  "<circle cx='10.9' cy='8.7' r='.85' fill='#fff'/><circle cx='13.1' cy='8.7' r='.85' fill='#fff'/>"
const ARAIGNEE_PENDUE = svg(`<path d='M12 2V6.4' stroke='${SOIE}' stroke-width='.8'/>${CORPS_ARAIGNEE}`, '0 2 24 22')
/** Araignée qui descend au bout d'un long fil (coin des sections). */
const ARAIGNEE_FIL = svg(
  `<path d='M12 0V50.4' stroke='${SOIE}' stroke-width='.8'/><g transform='translate(0 44)'>${CORPS_ARAIGNEE}</g>`,
  '0 0 24 68'
)

// Toile d'araignée de coin (coin haut droit, retournée pour le coin gauche) :
// 6 rayons et 4 anneaux qui pendent légèrement vers le centre.
const ANGLES = [0, 18, 36, 54, 72, 90].map((a) => (a * Math.PI) / 180)
const point = (r: number, a: number) => `${(40 - r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`
const TOILE_TRACE =
  ANGLES.map((a) => `M40 0L${point(40, a)}`).join('') +
  [9, 17, 25, 33]
    .map((r) => `M${point(r, ANGLES[0])}` + ANGLES.slice(1).map((a, i) => `Q${point(r * 0.86, (a + ANGLES[i]) / 2)} ${point(r, a)}`).join(''))
    .join('')
const TOILE = svg(`<path d='${TOILE_TRACE}' fill='none' stroke='#14101F' stroke-width='.7' stroke-linecap='round'/>`, '0 0 40 40')

// Feuilles d'automne (orange, brun, rouille), nervure plus sombre.
const feuille = (couleur: string, nervure: string) =>
  svg(
    `<path fill='${couleur}' d='M12 2C7 6 5 11 6.6 16.4 8 20.6 11 22 12 22s4-1.4 5.4-5.6C19 11 17 6 12 2z'/>` +
      `<path fill='none' stroke='${nervure}' stroke-linecap='round' stroke-width='1' d='M12 4.5V23.5'/>` +
      `<path fill='none' stroke='${nervure}' stroke-linecap='round' stroke-width='.8' d='M12 10.5 9.2 8.6M12 14l-3.4-2.2M12 10.5l2.8-1.9M12 14l3.4-2.2'/>`,
    '0 0 24 24'
  )

/** Bandeaux de page : lune orangée, une chauve-souris devant, deux plus loin. */
const LUNE_CHAUVES_SOURIS = svg(
  "<defs><radialGradient id='l' cx='.38' cy='.34' r='.7'><stop offset='0' stop-color='#FFE4BE'/><stop offset='.45' stop-color='#F4A055'/><stop offset='1' stop-color='#C85A12'/></radialGradient>" +
    `<path id='a' d='${AILES}'/></defs>` +
    "<circle cx='118' cy='30' r='27' fill='#E8711A' opacity='.14'/><circle cx='118' cy='30' r='17' fill='url(#l)'/>" +
    "<use href='#a' transform='translate(92 14) scale(1.1)' fill='#14101F'/>" +
    "<use href='#a' transform='translate(40 6) scale(.9)' fill='#F6A456' opacity='.85'/>" +
    "<use href='#a' transform='translate(4 30) scale(.6)' fill='#F6A456' opacity='.6'/>",
  '0 0 150 60'
)

// Guirlande de petites lanternes citrouilles : orange, violet, orange, blanc
// chaud (lueur violette plus claire, sinon invisible sur la nuit).
const GUIRLANDE = cssGuirlande({
  fil: '#2A2233',
  forme: 'lanterne',
  lumieres: [
    { x: 15, y: 5.6, couleur: '#E8711A' },
    { x: 45, y: 11.6, couleur: '#4B2A6B', halo: '#A77BDB' },
    { x: 75, y: 11.6, couleur: '#E8711A' },
    { x: 105, y: 5.6, couleur: '#FFF3C4' },
  ],
})

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

export const CSS_HALLOWEEN = `${CSS_SCENE}${GUIRLANDE.css}
.hw-etoiles{background-image:${ETOILES};opacity:.75}
.hw-lune{background:radial-gradient(circle at 36% 32%,#FFE4BE 0%,#F9B46F 20%,#EF8737 50%,#DA681B 76%,#B5510F 100%)}
.hw-lune::before,.hw-lune::after{content:"";position:absolute;border-radius:9999px;background:radial-gradient(circle,rgba(150,55,5,.2) 0%,rgba(150,55,5,.1) 45%,rgba(150,55,5,0) 72%)}
.hw-lune::before{width:30%;height:30%;left:52%;top:20%}
.hw-lune::after{width:20%;height:20%;left:24%;top:56%}
.hw-halo{background:radial-gradient(circle,rgba(232,113,26,.4) 0%,rgba(232,113,26,.15) 34%,rgba(232,113,26,0) 66%)}
.hw-vol{position:absolute;left:0;color:#0A0710;transform:translate3d(var(--x,30vw),0,0)}
.hw-luciole{position:absolute;width:4px;height:4px;border-radius:9999px;background:#FFB46B;box-shadow:0 0 6px 2px rgba(232,113,26,.65),0 0 16px 5px rgba(232,113,26,.22);opacity:.75}
.hw-lisere{filter:drop-shadow(0 -1px 0 rgba(240,140,70,.55))}
.hw-frise{background:radial-gradient(60% 120% at 50% 118%,rgba(232,113,26,.26) 0%,rgba(232,113,26,0) 60%),linear-gradient(to bottom,#14101F 0%,#241A33 62%,#33223F 100%)}
.hw-selection{background:radial-gradient(60% 50% at 90% 0%,rgba(232,113,26,.12) 0%,rgba(232,113,26,0) 70%),radial-gradient(50% 40% at 0% 100%,rgba(75,42,107,.07) 0%,rgba(75,42,107,0) 70%),linear-gradient(180deg,#FFFFFF 0%,#FAF8F3 100%)}
/* Feuilles (scene/Chute) : trois teintes en alternance. */
.sz-chute{background:var(--hw-feuille-1) center/contain no-repeat}
.sz-chute:nth-child(3n+2){background-image:var(--hw-feuille-2)}
.sz-chute:nth-child(3n){background-image:var(--hw-feuille-3)}
/* Objets suspendus (scene/Suspendus) : fil de soie, chauves-souris et
   araignées en image de fond, lueur orange sur la photo. */
.sz-fil{background:${SOIE}}
.hw-pendu{background:center top/100% 100% no-repeat}
.hw-pendu-chauve-souris{background-image:var(--hw-pendu-chauve-souris);transform-origin:50% 25%}
.hw-pendu-araignee{background-image:var(--hw-pendu-araignee)}
.sz-pendus-photo .hw-pendu{filter:drop-shadow(0 0 3px rgba(232,113,26,.75))}
/* Visages des citrouilles et bulles de la marmite qui s'allument doucement. */
.hw-lueur{filter:drop-shadow(0 0 2px rgba(255,190,90,.9))}
@media (prefers-reduced-motion:no-preference){
.hw-vol{animation:hw-vol var(--d,50s) linear infinite;animation-delay:var(--r,0s);will-change:transform}
.hw-vol>svg{animation:hw-aile var(--f,.8s) ease-in-out infinite alternate;transform-origin:50% 45%}
.hw-pendu-chauve-souris{animation:hw-aile-douce 1.4s ease-in-out infinite alternate}
.hw-halo{animation:hw-halo 7s ease-in-out infinite alternate}
.hw-lueur{animation:hw-lueur 3.2s ease-in-out infinite alternate}
.hw-luciole{animation:hw-luciole var(--d,5s) ease-in-out infinite;animation-delay:var(--r,0s)}
}
@keyframes hw-vol{from{transform:translate3d(-18vw,2vh,0)}to{transform:translate3d(118vw,-3vh,0)}}
@keyframes hw-aile{from{transform:scaleY(1)}to{transform:scaleY(.6)}}
@keyframes hw-aile-douce{from{transform:scaleY(1)}to{transform:scaleY(.8)}}
@keyframes hw-halo{from{opacity:.72;transform:scale(.97)}to{opacity:1;transform:scale(1.03)}}
@keyframes hw-lueur{from{opacity:.35}to{opacity:1}}
@keyframes hw-luciole{0%,100%{opacity:.08;transform:translate3d(0,4px,0)}50%{opacity:1;transform:translate3d(0,-7px,0)}}
/* Icônes partagées, déclarées une fois. */
:root{--hw-citrouille:${CITROUILLE};--hw-chauve-souris:${chauveSouris('#14101F')};--hw-toile:${TOILE};--hw-pendu-chauve-souris:${CHAUVE_SOURIS_PENDUE};--hw-pendu-araignee:${ARAIGNEE_PENDUE};--hw-araignee-fil:${ARAIGNEE_FIL};--hw-feuille-1:${feuille('#E8711A', '#B4500E')};--hw-feuille-2:${feuille('#8A4B22', '#5E3215')};--hw-feuille-3:${feuille('#B5531C', '#7E3610')}}
/* Titres de section (saison-titre, saison-mot) : un mot en orange foncé
   #B4500E (4,6:1 sur crème), une citrouille ou une chauve-souris au bout,
   collée au dernier mot (espace insécable) : jamais seule sur une ligne. */
.saison-mot{color:#B4500E}
.saison-titre::after{content:"\\00a0";padding-right:.62em;background:var(--hw-citrouille) right center/.58em .58em no-repeat}
.saison-titre[data-saison-icone=chauve-souris]::after{padding-right:.98em;background:var(--hw-chauve-souris) right center/.95em .45em no-repeat}
/* Toiles d'araignée dans les coins de trois sections (meilleures ventes :
   deux coins ; guides et boutique : un coin et une araignée qui descend). */
section.saison-nuit,.saison-coin{position:relative}
section.saison-nuit::before,section.saison-nuit::after,.saison-coin::before{content:"";position:absolute;top:0;right:0;width:clamp(80px,11vw,150px);aspect-ratio:1;pointer-events:none;background:var(--hw-toile) top right/contain no-repeat;opacity:.3}
section.saison-nuit::before,.saison-coin-gauche::before{right:auto;left:0;transform:scaleX(-1)}
.saison-coin::after{content:"";position:absolute;top:0;right:clamp(54px,7.5vw,104px);width:16px;height:45px;pointer-events:none;background:var(--hw-araignee-fil) center top/contain no-repeat;opacity:.85}
.saison-coin-gauche::after{right:auto;left:clamp(54px,7.5vw,104px)}
/* Bandeau de titre des pages (saison-bandeau) : nuit violette étoilée pleine
   largeur, lune et chauves-souris dans un coin, guirlande allumée en bas. */
.saison-bandeau{position:relative;background-color:#1E1633;background-image:${ETOILES};box-shadow:0 0 0 100vmax #1E1633;clip-path:inset(0 -100vmax);padding-bottom:2.75rem;margin-bottom:1.75rem}
.saison-bandeau-haut{clip-path:inset(-100vmax -100vmax 0)}
.saison-bandeau.saison-bandeau-haut::before{top:-14px}
.saison-bandeau h1,.saison-bandeau .text-spruce{color:#FAF8F3}
.saison-bandeau p,.saison-bandeau nav{color:rgba(255,255,255,.82)}
.saison-bandeau a{color:#FFB46B}
.saison-bandeau a:hover{color:#FFD2A6}
.saison-bandeau::before{content:"";position:absolute;top:12px;right:0;width:clamp(110px,15vw,190px);aspect-ratio:150/60;pointer-events:none;background:${LUNE_CHAUVES_SOURIS} center/contain no-repeat}
.saison-bandeau::after{content:"";position:absolute;left:0;right:0;bottom:6px;height:24px;pointer-events:none;background:${GUIRLANDE.motif} left top/120px 24px repeat-x}
/* Filtres, onglets et page courante actifs (saison-actif, saison-actif-doux). */
.saison-actif{background-color:#B4500E!important;color:#fff!important}
.saison-actif *{color:#fff!important}
.saison-actif-doux{background-color:#FCE3CF!important;color:#8A3A06!important;border-color:rgba(180,80,14,.28)!important}
/* Fiche produit : toile dans un coin de la galerie, liseré sur la
   réassurance, citrouille à côté du badge de remise. */
.saison-toile::after{content:"";position:absolute;top:0;left:0;z-index:20;width:clamp(56px,16%,104px);aspect-ratio:1;pointer-events:none;background:var(--hw-toile) top right/contain no-repeat;opacity:.28;transform:scaleX(-1)}
.saison-toile-droite::after{left:auto;right:0;transform:none}
.saison-reassurance{border-left:3px solid #E8711A;padding-left:14px}
.saison-badge-citrouille:not(.absolute){position:relative}
.saison-badge-citrouille::before{content:"";position:absolute;top:50%;right:calc(100% + 6px);width:22px;height:21px;transform:translateY(-50%);pointer-events:none;background:var(--hw-citrouille) center/contain no-repeat}
.saison-badge-citrouille-droite::before{right:auto;left:calc(100% + 6px)}
`
