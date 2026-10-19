import { Cadeau, Sapin } from './formes'
import { FLOCONS_HERO } from './neige'

// Haut de l'accueil pendant Noël, posé sur toute la section (texte compris) :
// neige fine et lente, et en bas un sol enneigé avec des sapins et des
// paquets cadeaux (sous le texte sur téléphone, sous le texte et la photo sur
// ordinateur ; espace réservé par decors.hero.espaceBas). Décoratif, sans
// clic (pointer-events-none). Animations coupées par prefers-reduced-motion et
// en pause hors écran.
export default function HiverHero() {
  return (
    <div aria-hidden="true" data-anim-saison="" className="nl-neige-hero pointer-events-none absolute inset-0 overflow-hidden">
      {FLOCONS_HERO.map((style, i) => (
        <span key={i} className="nl-flocon" style={style} />
      ))}
      <div className="absolute inset-x-0 bottom-0 h-[72px] lg:h-[92px]">
        <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[46%] w-full" focusable="false">
          <path d="M0 9 Q 14 3 30 8 T 62 6 T 100 8 V20 H0z" fill="#F4F7FA" />
        </svg>
        <span className="absolute bottom-[30%] left-[3%]">
          <Sapin hauteur={46} />
        </span>
        <span className="absolute bottom-[28%] left-[11%]">
          <Sapin hauteur={30} />
        </span>
        <span className="absolute bottom-[24%] left-[20%]">
          <Cadeau largeur={26} teinte="rouge" />
        </span>
        <span className="absolute bottom-[24%] left-[27%] hidden sm:block">
          <Cadeau largeur={20} teinte="or" />
        </span>
        <span className="absolute bottom-[26%] right-[22%]">
          <Cadeau largeur={22} teinte="vert" />
        </span>
        <span className="absolute bottom-[25%] right-[14%]">
          <Cadeau largeur={28} teinte="or" />
        </span>
        <span className="absolute bottom-[30%] right-[4%]">
          <Sapin hauteur={52} />
        </span>
        <span className="absolute bottom-[30%] left-[58%] hidden lg:block">
          <Sapin hauteur={40} />
        </span>
      </div>
    </div>
  )
}
