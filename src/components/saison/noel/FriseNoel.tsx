import type { CSSProperties } from 'react'
import { FLOCONS, type Var } from './neige'

// Frise du pied de page pendant Noël : nuit bordeaux, guirlande lumineuse en
// haut, sapins enneigés sur une colline de neige, flocons qui tombent.
// Décorative. Le vert ne sert qu'aux petits sapins.

const LUMIERES: Var[] = [
  { left: '6%', top: '20px', '--c': '#F2D28A', '--d': '2.6s', '--r': '-1s' },
  { left: '17%', top: '26px', '--c': '#FFFFFF', '--d': '3.2s', '--r': '-.4s' },
  { left: '28%', top: '29px', '--c': '#E57373', '--d': '2.9s', '--r': '-2s' },
  { left: '39%', top: '28px', '--c': '#F2D28A', '--d': '3.4s', '--r': '-1.4s' },
  { left: '50%', top: '25px', '--c': '#FFFFFF', '--d': '2.7s', '--r': '-.8s' },
  { left: '61%', top: '28px', '--c': '#E57373', '--d': '3.1s', '--r': '-2.4s' },
  { left: '72%', top: '29px', '--c': '#F2D28A', '--d': '2.8s', '--r': '-.2s' },
  { left: '83%', top: '26px', '--c': '#FFFFFF', '--d': '3.3s', '--r': '-1.7s' },
  { left: '94%', top: '20px', '--c': '#E57373', '--d': '2.5s', '--r': '-1.1s' },
]

const SAPINS: { left: string; hauteur: number; cache?: boolean }[] = [
  { left: '5%', hauteur: 46 },
  { left: '11%', hauteur: 32 },
  { left: '30%', hauteur: 38, cache: true },
  { left: '58%', hauteur: 30, cache: true },
  { left: '78%', hauteur: 52 },
  { left: '86%', hauteur: 36 },
]

function Sapin({ hauteur }: { hauteur: number }) {
  return (
    <svg viewBox="0 0 30 40" width={(hauteur * 3) / 4} height={hauteur} focusable="false">
      <rect x="13" y="33" width="4" height="7" fill="#3A1A10" />
      <path fill="#12301F" d="M15 1 4 15h5L2 25h6L0 35h30l-8-10h6l-7-10h5z" />
      <path fill="#F4F1EA" d="M15 1l-3.6 4.6c1.2.8 2.4.8 3.6.2 1.2.6 2.4.6 3.6-.2zM9 15h12l-1.6-2.2c-2.6 1.4-6.2 1.4-8.8 0zM8 25h14l-1.5-2.1c-3.2 1.5-7.8 1.5-11 0z" opacity=".9" />
    </svg>
  )
}

export default function FriseNoel() {
  return (
    <div aria-hidden="true" data-anim-saison="" className="nl-frise relative h-[96px] overflow-hidden md:h-[128px]">
      {FLOCONS.map((style, i) => (
        <span key={i} className="nl-flocon" style={style} />
      ))}
      {/* Guirlande : fil courbe, lumières qui scintillent. */}
      <svg viewBox="0 0 100 12" preserveAspectRatio="none" className="absolute inset-x-0 top-[14px] h-[18px] w-full" focusable="false">
        <path d="M0 2 Q 25 14 50 9 T 100 2" fill="none" stroke="rgba(242,210,138,.55)" strokeWidth=".35" vectorEffect="non-scaling-stroke" />
      </svg>
      {LUMIERES.map((style, i) => (
        <span key={i} className="nl-lumiere" style={style as CSSProperties} />
      ))}
      {/* Colline de neige et sapins. */}
      <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[34%] w-full" focusable="false">
        <path d="M0 8 Q 20 2 40 7 T 75 5 T 100 7 V20 H0z" fill="#F4F1EA" />
      </svg>
      {SAPINS.map((s, i) => (
        <span key={i} className={`absolute bottom-[22%] ${s.cache ? 'hidden sm:block' : ''}`} style={{ left: s.left }}>
          <Sapin hauteur={s.hauteur} />
        </span>
      ))}
    </div>
  )
}
