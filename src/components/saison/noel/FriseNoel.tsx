import { Cadeau, Sapin } from './formes'
import Guirlande from './Guirlande'
import { FLOCONS } from './neige'

// Frise du pied de page pendant Noël : ciel de nuit, guirlande lumineuse en
// haut, sapins enneigés et paquets cadeaux sur une colline de neige, flocons
// qui tombent. Décorative.

const SAPINS: { left: string; hauteur: number; cache?: boolean }[] = [
  { left: '4%', hauteur: 46 },
  { left: '10%', hauteur: 32 },
  { left: '33%', hauteur: 38, cache: true },
  { left: '61%', hauteur: 30, cache: true },
  { left: '80%', hauteur: 52 },
  { left: '88%', hauteur: 36 },
]

export default function FriseNoel() {
  return (
    <div aria-hidden="true" data-anim-saison="" className="nl-frise relative h-[104px] overflow-hidden md:h-[136px]">
      {FLOCONS.map((style, i) => (
        <span key={i} className="nl-flocon" style={style} />
      ))}
      <Guirlande className="absolute inset-x-0 top-1" />
      <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[32%] w-full" focusable="false">
        <path d="M0 8 Q 20 2 40 7 T 75 5 T 100 7 V20 H0z" fill="#F4F7FA" />
      </svg>
      {SAPINS.map((s, i) => (
        <span key={i} className={`absolute bottom-[20%] ${s.cache ? 'hidden sm:block' : ''}`} style={{ left: s.left }}>
          <Sapin hauteur={s.hauteur} />
        </span>
      ))}
      <span className="absolute bottom-[18%] left-[18%]">
        <Cadeau largeur={24} teinte="rouge" />
      </span>
      <span className="absolute bottom-[18%] left-[45%] hidden sm:block">
        <Cadeau largeur={20} teinte="or" />
      </span>
      <span className="absolute bottom-[18%] right-[20%]">
        <Cadeau largeur={22} teinte="vert" />
      </span>
    </div>
  )
}
