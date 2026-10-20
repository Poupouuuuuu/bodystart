import { svg } from './svg'

// Guirlande lumineuse des décors de saison (Noël : ampoules ; Halloween :
// petites lanternes citrouilles). Motif de 120 × 24 répété en largeur : fil
// qui ondule (raccord sans couture, tangente horizontale aux deux bords) et 4
// lumières. Deux calques de halos (lumières 1 et 3, puis 2 et 4) s'allument
// en alternance : scintillement doux. Mêmes emplacements pour chaque thème :
// sous l'en-tête, sous le haut de l'accueil (Guirlande), dans les bandeaux de
// page et dans la frise du pied de page.

export interface Lumiere {
  /** Point d'attache sur le fil (motif de 120 × 24). */
  x: number
  y: number
  couleur: string
  /** Couleur de la lueur (par défaut celle de la lumière). */
  halo?: string
}

interface OptionsGuirlande {
  /** Couleur du fil. */
  fil: string
  lumieres: Lumiere[]
  /** Ampoule ovale (Noël) ou petite lanterne citrouille (Halloween). */
  forme: 'ampoule' | 'lanterne'
}

const corps = (forme: OptionsGuirlande['forme'], { x, y, couleur }: Lumiere) =>
  forme === 'lanterne'
    ? `<ellipse cx='${x}' cy='${y + 6}' rx='4.4' ry='3.6' fill='${couleur}'/>` +
      `<path d='M${x - 1.7} ${y + 2.9}q-1.2 3.1 0 6.2M${x + 1.7} ${y + 2.9}q1.2 3.1 0 6.2' fill='none' stroke='#000' stroke-opacity='.2' stroke-width='.7'/>`
    : `<ellipse cx='${x}' cy='${y + 6}' rx='3' ry='4.2' fill='${couleur}'/>`

const attache = (forme: OptionsGuirlande['forme'], { x, y }: Lumiere) =>
  forme === 'lanterne'
    ? `<rect x='${x - 0.9}' y='${y - 1}' width='1.8' height='2.8' rx='.5' fill='#2A2233'/>`
    : `<rect x='${x - 1.5}' y='${y - 1}' width='3' height='3' rx='.6' fill='#3A3A3A'/>`

/**
 * CSS de la guirlande d'un thème : composant Guirlande (sz-guirlande), barre
 * sous l'en-tête (saison-entete, effacée dès que la page défile :
 * header[data-defile]) et `motif` pour les bandeaux de page (variable CSS :
 * l'image n'est écrite qu'une fois dans la page). Sans animation
 * (prefers-reduced-motion) : toutes les lumières restent allumées.
 */
export function cssGuirlande({ fil, lumieres, forme }: OptionsGuirlande): { motif: string; css: string } {
  const image = svg(
    `<path d='M0 4C20 4 40 13.5 60 13.5S100 4 120 4' fill='none' stroke='${fil}' stroke-width='1.2'/>` +
      lumieres.map((l) => attache(forme, l) + corps(forme, l)).join(''),
    '0 0 120 24'
  )
  const halos = (indices: number[]) =>
    svg(
      indices
        .map((i) => {
          const l = lumieres[i]
          return (
            `<circle cx='${l.x}' cy='${l.y + 6}' r='8' fill='${l.halo ?? l.couleur}' opacity='.28'/>` +
            corps(forme, l) +
            (forme === 'lanterne'
              ? `<ellipse cx='${l.x - 1.6}' cy='${l.y + 4.8}' rx='1.1' ry='.8' fill='#fff' opacity='.6'/>`
              : `<ellipse cx='${l.x - 1}' cy='${l.y + 4.6}' rx='1' ry='1.6' fill='#fff' opacity='.8'/>`)
          )
        })
        .join(''),
      '0 0 120 24'
    )
  const pose = 'left top/120px 24px repeat-x'
  const motif = 'var(--sz-guirlande)'
  const css = `
:root{--sz-guirlande:${image}}
.sz-guirlande{height:24px;background:${motif} ${pose}}
.sz-guirlande:not(.absolute){position:relative}
.sz-guirlande::before,.sz-guirlande::after,.saison-entete::before{content:"";position:absolute;inset:0;pointer-events:none;background:${halos([0, 2])} ${pose}}
.sz-guirlande::after{background-image:${halos([1, 3])}}
.saison-entete::before,.saison-entete::after{transition:opacity .3s}
header[data-defile] .saison-entete::before,header[data-defile] .saison-entete::after{opacity:0!important;animation:none}
.saison-entete::before{inset:auto 0 auto 0;top:100%;height:24px}
.saison-entete::after{content:"";position:absolute;left:0;right:0;top:100%;height:24px;pointer-events:none;background:${motif} ${pose}}
@media (prefers-reduced-motion:no-preference){
.sz-guirlande::before,.saison-entete::before{animation:sz-scintille 2.8s ease-in-out infinite alternate}
.sz-guirlande::after{animation:sz-scintille 2.8s ease-in-out -1.4s infinite alternate}
}
@keyframes sz-scintille{from{opacity:.15}to{opacity:1}}
`
  return { motif, css }
}
