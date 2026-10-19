// Styles de la déco Noël (29/11 au 24/12), émis seulement pendant la période
// (layout Nutrition) : rien ne pèse sur le site le reste de l'année.
//
// Refonte du 20/10/2026 (retour de l'utilisateur : « du rouge partout, ça ne
// fait pas Noël ») : un décor plutôt qu'une palette. Grandes surfaces en crème
// ou blanc neige, haut de l'accueil et bandeaux de page en ciel de nuit, rouge
// #B3261E (6,2:1 sur crème) et or #F2D28A (sur fond sombre) en accents
// seulement. Guirlandes lumineuses, boules suspendues, neige, congères,
// sapins et cadeaux, houx. Le vert ne sert qu'au houx, aux sapins et aux
// ampoules, jamais en grande surface (sauf la variante b du haut de l'accueil,
// à valider par Claude Gestion).
//
// Animations (neige, scintillement, balancement) en transform et opacity
// uniquement, coupées par prefers-reduced-motion et mises en pause hors écran
// ([data-pause], posé par components/saison/AnimationsSaison). Sans
// animation : flocons posés, guirlandes allumées, boules immobiles.
//
// Mêmes classes repères que Halloween (saison-titre, saison-nuit,
// saison-bandeau…) : un seul thème émis à la fois.

// Icônes et motifs en SVG dans le CSS (aucun fichier image). Encodage minimal
// (seuls < > # % " sont échappés). Images de fond, jamais de masque CSS
// (Safari mobile, 19/10/2026).
const svg = (contenu: string, viewBox: string, ratio?: string) =>
  `url("data:image/svg+xml,${`<svg xmlns='http://www.w3.org/2000/svg' viewBox='${viewBox}'${ratio ? ` preserveAspectRatio='${ratio}'` : ''}>${contenu}</svg>`.replace(/[<>#%"]/g, encodeURIComponent)}")`

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
/** Trois flocons (bandeaux de page). */
const FLOCONS = svg(
  `<defs><g id='f' fill='none' stroke='#fff' stroke-width='1.4' stroke-linecap='round'><path d='M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7'/></g></defs>` +
    "<use href='#f' transform='translate(70 2) scale(1.5)'/><use href='#f' transform='translate(18 20)' opacity='.8'/><use href='#f' transform='translate(104 30) scale(.7)' opacity='.6'/>",
  '0 0 124 52'
)

// ─── Guirlande lumineuse (motif de 120 × 24 répété en largeur) ─────────
// Fil qui ondule (raccord sans couture : tangente horizontale aux deux bords),
// 4 ampoules par motif : rouge, or, vert, blanc chaud. Deux calques de halos
// (ampoules 1 et 3, puis 2 et 4) s'allument en alternance : scintillement doux.
const AMPOULES: [number, number, string][] = [
  [15, 5.6, '#E53935'],
  [45, 11.6, '#F2C14E'],
  [75, 11.6, '#43A047'],
  [105, 5.6, '#FFF3C4'],
]
const GUIRLANDE = svg(
  "<path d='M0 4C20 4 40 13.5 60 13.5S100 4 120 4' fill='none' stroke='#2B3A2F' stroke-width='1.2'/>" +
    AMPOULES.map(
      ([x, y, c]) =>
        `<rect x='${x - 1.5}' y='${y - 1}' width='3' height='3' rx='.6' fill='#3A3A3A'/><ellipse cx='${x}' cy='${y + 6}' rx='3' ry='4.2' fill='${c}'/>`
    ).join(''),
  '0 0 120 24'
)
const halos = (indices: number[]) =>
  svg(
    indices
      .map((i) => {
        const [x, y, c] = AMPOULES[i]
        return `<circle cx='${x}' cy='${y + 6}' r='8' fill='${c}' opacity='.28'/><ellipse cx='${x}' cy='${y + 6}' rx='3' ry='4.2' fill='${c}'/><ellipse cx='${x - 1}' cy='${y + 4.6}' rx='1' ry='1.6' fill='#fff' opacity='.8'/>`
      })
      .join(''),
    '0 0 120 24'
  )
const HALOS_A = halos([0, 2])
const HALOS_B = halos([1, 3])

// ─── Neige posée ─────────────────────────────────────────────────────
/** Congère (bord de neige) en haut d'une section : motif de 160 × 16. */
const CONGERE = svg(
  "<path fill='#D5E0EA' d='M0 0H160V9Q150 15 140 11Q130 14 120 10Q110 16 100 12Q90 14 80 10Q70 15 60 11Q50 14 40 10Q30 16 20 12Q10 14 0 9Z'/>" +
    "<path fill='#fff' d='M0 0H160V7Q150 13 140 9Q130 12 120 8Q110 14 100 10Q90 12 80 8Q70 13 60 9Q50 12 40 8Q30 14 20 10Q10 12 0 7Z'/>",
  '0 0 160 16'
)
/** Neige posée sur le badge « Best-seller ». */
const NEIGE_BADGE = svg(
  "<path fill='#D5E0EA' d='M0 7Q4 1 10 3Q16 0 22 3Q28 1 34 3Q40 4 40 8Q36 11 30 8Q26 10 20 8Q14 11 9 8Q4 11 0 7Z'/>" +
    "<path fill='#fff' d='M0 6Q4 0 10 2Q16 -1 22 2Q28 0 34 2Q40 3 40 6.5Q36 9.5 30 6.5Q26 8.5 20 6.5Q14 9.5 9 6.5Q4 9.5 0 6Z'/>",
  '0 -1 40 12',
  'none'
)

/** Ciel étoilé des bandeaux de page (petits points fixes). */
const ETOILES = [
  [6, 18],
  [14, 62],
  [23, 30],
  [37, 74],
  [48, 22],
  [59, 58],
  [71, 34],
  [83, 70],
  [92, 26],
]
  .map(([x, y], i) => `radial-gradient(${i % 3 ? 1 : 1.5}px ${i % 3 ? 1 : 1.5}px at ${x}% ${y}%,rgba(255,244,214,.9),transparent 70%)`)
  .join(',')

export const CSS_NOEL = `
.nl-selection{background:radial-gradient(60% 50% at 90% 0%,rgba(242,210,138,.18) 0%,rgba(242,210,138,0) 70%),linear-gradient(180deg,#FFFFFF 0%,#FAF8F3 100%)}
.nl-frise{background:radial-gradient(60% 120% at 50% 118%,rgba(242,210,138,.2) 0%,rgba(242,210,138,0) 60%),linear-gradient(to bottom,#0E1830 0%,#13203A 65%,#1C2D50 100%)}
/* Neige qui tombe : hauteur de chute (--chute) et lenteur (--lent) réglées
   par zone pour une chute lente partout (~15 à 20 px/s). */
.nl-neige-hero{--chute:110vh;--lent:4}
.nl-frise{--chute:150px;--lent:.5}
.nl-flocon{position:absolute;top:var(--y,20%);left:var(--x,50%);width:var(--t,4px);height:var(--t,4px);border-radius:9999px;background:#fff;opacity:var(--o,.85)}
/* Guirlande : fil et ampoules, deux calques de halos en alternance. */
.nl-guirlande{height:24px;background:${GUIRLANDE} left top/120px 24px repeat-x}
.nl-guirlande:not(.absolute){position:relative}
.nl-guirlande::before,.nl-guirlande::after,.saison-entete::before{content:"";position:absolute;inset:0;pointer-events:none;background:${HALOS_A} left top/120px 24px repeat-x}
.nl-guirlande::after{background-image:${HALOS_B}}
/* Boules suspendues : balancement autour de l'attache. */
.nl-boule{transform-origin:50% 0}
@media (min-width:1024px){.nl-boules-photo .nl-boule{scale:1.5}.nl-boules-section .nl-boule{scale:1.35}}
@media (prefers-reduced-motion:no-preference){
.nl-flocon{top:-8px;animation:nl-neige calc(var(--d,14s) * var(--lent,1)) linear infinite;animation-delay:calc(var(--r,0s) * var(--lent,1));will-change:transform}
.nl-guirlande::before,.saison-entete::before{animation:nl-scintille 2.8s ease-in-out infinite alternate}
.nl-guirlande::after{animation:nl-scintille 2.8s ease-in-out -1.4s infinite alternate}
.nl-boule{animation:nl-balance var(--d,5.5s) ease-in-out infinite alternate;animation-delay:var(--r,0s)}
}
[data-pause],[data-pause] *,[data-pause]::before,[data-pause]::after{animation-play-state:paused!important}
@keyframes nl-neige{from{transform:translate3d(0,0,0)}to{transform:translate3d(var(--dx,14px),var(--chute,110vh),0)}}
@keyframes nl-scintille{from{opacity:.15}to{opacity:1}}
@keyframes nl-balance{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}
:root{--nl-boule:${BOULE};--nl-houx:${HOUX}}
/* En-tête : guirlande pleine largeur juste sous la barre (calque des halos
   sur la barre elle-même, la guirlande dessous). */
.saison-entete::before{inset:auto 0 auto 0;top:100%;height:24px}
.saison-entete::after{content:"";position:absolute;left:0;right:0;top:100%;height:24px;pointer-events:none;background:${GUIRLANDE} left top/120px 24px repeat-x}
/* Badge « Best-seller » : neige posée dessus. */
.badge-saison:not(.absolute){position:relative}
.badge-saison::before{content:"";position:absolute;left:-3px;right:-3px;top:-6px;height:10px;pointer-events:none;background:${NEIGE_BADGE} center top/100% 100% no-repeat}
/* Titres de section : un mot en rouge, une boule de Noël au bout (houx pour
   les titres marqués data-saison-icone), collée au dernier mot (espace
   insécable). */
.saison-mot{color:#B3261E}
.saison-titre::after{content:"\\00a0";padding-right:.56em;background:var(--nl-boule) right center/.5em .55em no-repeat}
.saison-titre[data-saison-icone]::after{padding-right:1em;background:var(--nl-houx) right center/.95em .48em no-repeat}
/* Congère en haut de trois sections (meilleures ventes, guides, boutique). */
section.saison-nuit,.saison-coin{position:relative}
section.saison-nuit::after,.saison-coin::after{content:"";position:absolute;top:0;left:0;right:0;height:16px;pointer-events:none;background:${CONGERE} left top/160px 16px repeat-x}
/* Branche de houx dans un coin de section (saison-coin), sous la congère. */
.saison-coin::before{content:"";position:absolute;top:20px;right:14px;width:clamp(48px,6vw,76px);aspect-ratio:2;pointer-events:none;background:var(--nl-houx) top right/contain no-repeat}
.saison-coin-gauche::before{right:auto;left:14px;transform:scaleX(-1)}
/* Bandeau de titre des pages (saison-bandeau) : ciel de nuit étoilé pleine
   largeur, flocons dans un coin, guirlande allumée en bas. */
.saison-bandeau{position:relative;background-color:#13203A;background-image:${ETOILES};box-shadow:0 0 0 100vmax #13203A;clip-path:inset(0 -100vmax);padding-bottom:2.75rem;margin-bottom:1.75rem}
.saison-bandeau-haut{clip-path:inset(-100vmax -100vmax 0)}
.saison-bandeau.saison-bandeau-haut::before{top:-14px}
.saison-bandeau h1,.saison-bandeau .text-spruce{color:#FAF8F3}
.saison-bandeau p,.saison-bandeau nav{color:rgba(255,255,255,.82)}
.saison-bandeau a{color:#F2D28A}
.saison-bandeau a:hover{color:#FFE7B5}
.saison-bandeau::before{content:"";position:absolute;top:16px;right:0;width:clamp(80px,12vw,150px);aspect-ratio:124/52;pointer-events:none;background:${FLOCONS} center/contain no-repeat;opacity:.6}
.saison-bandeau::after{content:"";position:absolute;left:0;right:0;bottom:6px;height:24px;pointer-events:none;background:${GUIRLANDE} left top/120px 24px repeat-x}
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
