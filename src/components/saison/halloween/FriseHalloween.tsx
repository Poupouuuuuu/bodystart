import type { CSSProperties } from 'react'
import { ChauveSouris, Citrouille, Herbes } from './formes'

// Frise du pied de page pendant Halloween : herbes, citrouilles (une au visage
// éclairé) et chauves-souris en silhouette sur une nuit qui s'éclaire en
// orange à l'horizon. Décorative.

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
      <Herbes className="absolute inset-x-0 bottom-0 h-[44%] w-full" />
      <span className="absolute bottom-[6%] left-[9%]">
        <Citrouille largeur={40} />
      </span>
      <span className="absolute bottom-[4%] left-[44%] hidden sm:block">
        <Citrouille largeur={28} />
      </span>
      <span className="absolute bottom-[5%] right-[16%]">
        <Citrouille largeur={52} visage />
      </span>
      {LUCIOLES.map((style, i) => (
        <span key={i} className="hw-luciole" style={style} />
      ))}
    </div>
  )
}
