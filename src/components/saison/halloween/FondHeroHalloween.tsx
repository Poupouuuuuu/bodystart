import type { CSSProperties } from 'react'
import { Branche, ChauveSouris } from './formes'

// Fond du haut de l'accueil pendant Halloween (19/10/2026), à la place de la
// photo de la boutique : ciel de nuit, grande lune orange et son halo, une
// branche nue, des chauves-souris qui traversent lentement, de la brume et des
// lucioles. Aucune image téléchargée : CSS et SVG en ligne. Le titre (élément
// LCP texte) n'attend donc plus aucune image.

type Var = CSSProperties & Record<`--${string}`, string>

// top : hauteur de vol ; d : durée de la traversée ; r : départ décalé (déjà
// en vol au chargement) ; f : battement d'ailes ; x : position sans animation.
const VOLS: { top: string; largeur: number; style: Var }[] = [
  {
    top: '15%',
    largeur: 46,
    style: { '--d': '48s', '--r': '-14s', '--f': '.85s', '--x': '62vw' },
  },
  {
    top: '25%',
    largeur: 30,
    style: { '--d': '63s', '--r': '-41s', '--f': '.7s', '--x': '34vw' },
  },
  {
    top: '8%',
    largeur: 22,
    style: { '--d': '77s', '--r': '-23s', '--f': '.6s', '--x': '80vw' },
  },
]

const LUCIOLES: Var[] = [
  { left: '7%', bottom: '24%', '--d': '5.4s', '--r': '-1.2s' },
  { left: '19%', bottom: '11%', '--d': '6.2s', '--r': '-3.1s' },
  { left: '33%', bottom: '30%', '--d': '4.8s', '--r': '-.4s' },
  { left: '48%', bottom: '16%', '--d': '5.9s', '--r': '-2.4s' },
  { left: '61%', bottom: '34%', '--d': '6.6s', '--r': '-4.2s' },
  { left: '74%', bottom: '9%', '--d': '5.1s', '--r': '-1.8s' },
  { left: '88%', bottom: '22%', '--d': '6s', '--r': '-3.6s' },
]

export default function FondHeroHalloween() {
  return (
    <div aria-hidden="true" data-anim-saison="" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="hw-ciel absolute inset-0" />
      <div className="hw-etoiles absolute inset-x-0 top-0 h-[60%]" />

      {/* Lune : en haut à droite. Sur mobile, elle tient dans les 144 px de
          marge haute du bloc (pt-36) : jamais sous le texte (crème sur orange,
          contraste insuffisant), quelle que soit la hauteur d'écran. */}
      <div className="absolute right-[-30px] top-[-30px] aspect-square w-[150px] sm:right-[4%] sm:top-[8%] sm:w-[40vw] lg:w-[33vw] lg:max-w-[500px]">
        <div className="hw-halo absolute inset-[-48%] rounded-full" />
        <div className="hw-lune absolute inset-0 rounded-full" />
        <Branche className="absolute -bottom-[12%] right-[-6%] w-[118%] sm:right-[-30%]" />
      </div>

      {VOLS.map((v, i) => (
        <span key={i} className="hw-vol" style={{ ...v.style, top: v.top }}>
          <ChauveSouris largeur={v.largeur} />
        </span>
      ))}

      <div className="hw-brume" />

      {/* Voile de lisibilité du texte, sous les lucioles. */}
      <div className="hw-voile absolute inset-0" />

      {LUCIOLES.map((style, i) => (
        <span key={i} className="hw-luciole" style={style} />
      ))}
    </div>
  )
}
