import type { CSSProperties } from 'react'
import { ChauveSouris, Citrouille, Colline, Touffe } from './formes'

// Frise du pied de page pendant Halloween : colline, touffes d'herbes,
// citrouilles (une au visage éclairé) et chauves-souris en silhouette sur une
// nuit qui s'éclaire en orange à l'horizon, liseré orange sur les contours.
// Décorative.

type Var = CSSProperties & Record<`--${string}`, string>

const VOLS: { top: string; largeur: number; style: Var }[] = [
  {
    top: '14%',
    largeur: 26,
    style: { '--d': '38s', '--r': '-9s', '--f': '.75s', '--x': '22vw' },
  },
  {
    top: '30%',
    largeur: 18,
    style: { '--d': '52s', '--r': '-31s', '--f': '.6s', '--x': '68vw' },
  },
]

const LUCIOLES: Var[] = [
  { left: '24%', bottom: '46%', '--d': '5.2s', '--r': '-2s' },
  { left: '57%', bottom: '58%', '--d': '6.1s', '--r': '-.8s' },
  { left: '79%', bottom: '40%', '--d': '4.7s', '--r': '-3.4s' },
]

export default function FriseHalloween() {
  return (
    <div aria-hidden="true" data-anim-saison="" className="hw-frise relative h-[92px] overflow-hidden md:h-[124px]">
      <div className="hw-etoiles absolute inset-0" />
      <div className="absolute right-[9%] top-[16%] h-7 w-7 md:h-10 md:w-10">
        <div className="hw-halo absolute inset-[-90%] rounded-full" />
        <div className="hw-lune absolute inset-0 rounded-full" />
      </div>
      {VOLS.map((v, i) => (
        <span key={i} className="hw-vol" style={{ ...v.style, top: v.top }}>
          <ChauveSouris largeur={v.largeur} />
        </span>
      ))}
      <Colline className="hw-lisere absolute inset-x-0 bottom-0 h-[46%] w-full" />
      <span className="absolute bottom-[30%] left-[4%]">
        <Touffe largeur={30} />
      </span>
      <span className="absolute bottom-[26%] left-[30%]">
        <Touffe largeur={22} />
      </span>
      <span className="absolute bottom-[30%] left-[62%] hidden sm:block">
        <Touffe largeur={26} />
      </span>
      <span className="absolute bottom-[34%] right-[4%]">
        <Touffe largeur={24} />
      </span>
      <span className="hw-lisere absolute bottom-[22%] left-[12%]">
        <Citrouille largeur={38} />
      </span>
      <span className="hw-lisere absolute bottom-[24%] left-[45%] hidden sm:block">
        <Citrouille largeur={26} />
      </span>
      <span className="hw-lisere absolute bottom-[26%] right-[15%]">
        <Citrouille largeur={50} visage />
      </span>
      {LUCIOLES.map((style, i) => (
        <span key={i} className="hw-luciole" style={style} />
      ))}
    </div>
  )
}
