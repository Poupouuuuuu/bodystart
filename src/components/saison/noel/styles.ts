// Styles de la déco Noël (29/11 au 24/12, PR du 19/10/2026), émis seulement
// pendant la période (layout Nutrition) : rien ne pèse sur le site le reste
// de l'année. Bordeaux #6E1423, rouge #C62828 (texte sur clair #B3261E,
// 6,2:1), or #F2D28A sur fond sombre (8:1). Jamais de vert en grande surface :
// le vert ne sert qu'aux feuilles de houx et aux sapins de la frise.
//
// Animations (neige, guirlande) en transform et opacity uniquement, coupées
// par prefers-reduced-motion et mises en pause hors écran ([data-pause], posé
// par components/saison/AnimationsSaison). Sans animation, les flocons restent
// posés et la guirlande allumée.
//
// Mêmes classes repères que Halloween (saison-titre, saison-nuit,
// saison-bandeau…) : un seul thème émis à la fois.

// Icônes en SVG dans le CSS (aucun fichier image). Encodage minimal (seuls
// < > # % " sont échappés). Images de fond, jamais de masque CSS (Safari
// mobile, 19/10/2026).
const svg = (contenu: string, viewBox: string) =>
  `url("data:image/svg+xml,${`<svg xmlns='http://www.w3.org/2000/svg' viewBox='${viewBox}'>${contenu}</svg>`.replace(/[<>#%"]/g, encodeURIComponent)}")`

/** Boule de Noël rouge, attache dorée. */
const BOULE = svg(
  "<rect x='10.2' y='4.4' width='3.6' height='2.8' rx='.6' fill='#C9A24A'/>" +
    "<circle cx='12' cy='14' r='7.4' fill='#C62828'/>" +
    "<path d='M7.4 12.6c2.8 1.5 6.4 1.5 9.2 0' fill='none' stroke='#F2D28A' stroke-width='1.1'/>" +
    "<circle cx='9.6' cy='11.4' r='1.3' fill='#fff' opacity='.55'/>",
  '3.6 3.6 16.8 18.4'
)
/** Branche de houx : deux feuilles, trois baies. */
const HOUX = svg(
  "<path fill='#2E6B34' d='M13 11C10 6 5 5 1 7c2 1 2 3 1 4 2 0 3 2 2 4 3-2 7-2 9-4z'/>" +
    "<path fill='#3B7A3F' d='M15 11c3-5 8-6 12-4-2 1-2 3-1 4-2 0-3 2-2 4-3-2-7-2-9-4z'/>" +
    "<circle cx='12' cy='13' r='2.2' fill='#C62828'/><circle cx='16' cy='13' r='2.2' fill='#C62828'/><circle cx='14' cy='9.8' r='2.2' fill='#B3261E'/>",
  '0 3 28 14'
)
const flocon = (couleur: string) =>
  svg(
    `<g fill='none' stroke='${couleur}' stroke-width='1.6' stroke-linecap='round'><path d='M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7'/>` +
      "<path d='M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5M3.8 10.4l3.4-.9-.9-3.4M20.2 13.6l-3.4.9.9 3.4M3.8 13.6l3.4.9-.9 3.4M20.2 10.4l-3.4-.9.9-3.4'/></g>",
    '0 0 24 24'
  )
/** Trois flocons (bandeaux de page). */
const FLOCONS = svg(
  `<defs><g id='f' fill='none' stroke='#fff' stroke-width='1.4' stroke-linecap='round'><path d='M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7'/></g></defs>` +
    "<use href='#f' transform='translate(70 2) scale(1.5)'/><use href='#f' transform='translate(18 20)' opacity='.8'/><use href='#f' transform='translate(104 30) scale(.7)' opacity='.6'/>",
  '0 0 124 52'
)

export const CSS_NOEL = `
.nl-selection{background:radial-gradient(70% 60% at 85% 0%,rgba(242,210,138,.16) 0%,rgba(242,210,138,0) 60%),radial-gradient(60% 50% at 0% 100%,rgba(198,40,40,.22) 0%,rgba(198,40,40,0) 70%),#6E1423}
.nl-frise{background:radial-gradient(60% 120% at 50% 118%,rgba(242,210,138,.22) 0%,rgba(242,210,138,0) 60%),linear-gradient(to bottom,#4A0D17 0%,#6E1423 70%,#7E1A2A 100%)}
/* Neige : hauteur de chute (--chute) et lenteur (--lent) réglées par zone,
   pour une vitesse proche partout (~20 px/s). */
.nl-neige-photo{--chute:260px;--lent:1}
@media (min-width:1024px){.nl-neige-photo{--chute:110vh;--lent:2.5}}
.nl-frise{--chute:150px;--lent:.5}
.nl-flocon{position:absolute;top:var(--y,20%);left:var(--x,50%);width:var(--t,4px);height:var(--t,4px);border-radius:9999px;background:#fff;opacity:var(--o,.85)}
.nl-lumiere{position:absolute;width:6px;height:6px;border-radius:9999px;background:var(--c,#F2D28A);box-shadow:0 0 6px 2px color-mix(in srgb,var(--c,#F2D28A) 60%,transparent)}
@media (prefers-reduced-motion:no-preference){
.nl-flocon{top:-8px;animation:nl-neige calc(var(--d,14s) * var(--lent,1)) linear infinite;animation-delay:calc(var(--r,0s) * var(--lent,1));will-change:transform}
.nl-lumiere{animation:nl-scintille var(--d,3s) ease-in-out infinite alternate;animation-delay:var(--r,0s)}
}
[data-pause],[data-pause] *{animation-play-state:paused!important}
@keyframes nl-neige{from{transform:translate3d(0,0,0)}to{transform:translate3d(var(--dx,14px),var(--chute,110vh),0)}}
@keyframes nl-scintille{from{opacity:.45}to{opacity:1}}
:root{--nl-boule:${BOULE};--nl-houx:${HOUX};--nl-flocon:${flocon('#B3261E')};--nl-flocon-blanc:${flocon('#FFFFFF')}}
/* Titres de section : un mot en rouge, une boule de Noël au bout (houx pour
   les titres marqués data-saison-icone), collée au dernier mot (espace
   insécable). */
.saison-mot{color:#B3261E}
.saison-titre::after{content:"\\00a0";padding-right:.56em;background:var(--nl-boule) right center/.5em .55em no-repeat}
.saison-titre[data-saison-icone]::after{padding-right:1em;background:var(--nl-houx) right center/.95em .48em no-repeat}
/* Sections en fond bordeaux (saison-nuit) : texte clair, mot doré, flocon. */
section.saison-nuit{background-color:#6E1423}
.saison-nuit .saison-mot{color:#F2D28A}
.saison-nuit .saison-titre::after{background-image:var(--nl-flocon-blanc);background-size:.5em .5em}
.saison-nuit .saison-nuit-titre{color:#FAF8F3}
.saison-nuit .saison-nuit-libelle{color:rgba(255,255,255,.8);border-color:rgba(255,255,255,.24)}
.saison-nuit .saison-nuit-lien{color:#FAF8F3;border-color:rgba(255,255,255,.34)}
.saison-nuit .saison-nuit-lien:hover{background-color:rgba(255,255,255,.08);border-color:#F2D28A}
/* Branche de houx dans un coin de section (saison-coin). */
.saison-coin{position:relative}
.saison-coin::before{content:"";position:absolute;top:14px;right:14px;width:clamp(48px,6vw,76px);aspect-ratio:2;pointer-events:none;background:var(--nl-houx) top right/contain no-repeat}
.saison-coin-gauche::before{right:auto;left:14px;transform:scaleX(-1)}
/* Bandeau de titre des pages (saison-bandeau) : fond bordeaux pleine
   largeur, flocons dans un coin, filet doré en bas (border-image : peint,
   sans défilement horizontal). */
.saison-bandeau{position:relative;background-color:#6E1423;box-shadow:0 0 0 100vmax #6E1423;clip-path:inset(0 -100vmax);padding-bottom:2.25rem;margin-bottom:1.75rem}
.saison-bandeau-haut{clip-path:inset(-100vmax -100vmax 0)}
.saison-bandeau.saison-bandeau-haut::before{top:-14px}
.saison-bandeau h1,.saison-bandeau .text-spruce{color:#FAF8F3}
.saison-bandeau p,.saison-bandeau nav{color:rgba(255,255,255,.82)}
.saison-bandeau a{color:#F2D28A}
.saison-bandeau a:hover{color:#FFE7B5}
.saison-bandeau::before{content:"";position:absolute;top:16px;right:0;width:clamp(80px,12vw,150px);aspect-ratio:124/52;pointer-events:none;background:${FLOCONS} center/contain no-repeat;opacity:.55}
.saison-bandeau::after{content:"";position:absolute;bottom:0;left:0;right:0;height:3px;pointer-events:none;background:#F2D28A;border-image:linear-gradient(#F2D28A 0 0) fill 0//0 100vmax}
/* Filtres, onglets et page courante actifs (saison-actif, saison-actif-doux). */
.saison-actif{background-color:#B3261E!important;color:#fff!important}
.saison-actif *{color:#fff!important}
.saison-actif-doux{background-color:#FBE4E2!important;color:#8A1C16!important;border-color:rgba(179,38,30,.28)!important}
/* Fiche produit : houx dans un coin de la galerie, liseré rouge sur la
   réassurance, boule à côté du badge de remise. */
.saison-toile::after{content:"";position:absolute;top:12px;left:12px;z-index:20;width:clamp(48px,12%,76px);aspect-ratio:2;pointer-events:none;background:var(--nl-houx) top left/contain no-repeat;transform:scaleX(-1)}
.saison-toile-droite::after{left:auto;right:12px;transform:none}
.saison-reassurance{border-left:3px solid #C62828;padding-left:14px}
.saison-badge-citrouille:not(.absolute){position:relative}
.saison-badge-citrouille::before{content:"";position:absolute;top:50%;right:calc(100% + 6px);width:18px;height:20px;transform:translateY(-50%);pointer-events:none;background:var(--nl-boule) center/contain no-repeat}
.saison-badge-citrouille-droite::before{right:auto;left:calc(100% + 6px)}
`
