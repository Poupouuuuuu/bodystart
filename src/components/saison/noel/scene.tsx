import Frise from '../scene/Frise'
import SceneHero from '../scene/SceneHero'
import Sol from '../scene/Sol'
import Suspendus, { type Suspendu } from '../scene/Suspendus'
import { Boule, Cadeau, Sapin } from './formes'
import { FLOCONS, FLOCONS_HERO } from './neige'

// Scène de Noël (composants communs de scene/, paramétrés ici) : boules
// suspendues, neige fine sur le haut de l'accueil avec sol enneigé, sapins et
// cadeaux, frise du pied de page. Décorative.

const NEIGE = '#F4F7FA'

// Photo du haut de l'accueil : 5 boules, tailles et couleurs différentes.
const PHOTO: Suspendu[] = [
  { left: '7%', fil: 24, taille: 26, objet: 'rouge', d: '5.2s', r: '-1.1s' },
  { left: '24%', fil: 52, taille: 20, objet: 'or', d: '6s', r: '-3s' },
  { left: '50%', fil: 16, taille: 30, objet: 'vert', d: '5.6s', r: '-2.2s' },
  { left: '72%', fil: 40, taille: 22, objet: 'rouge', d: '6.4s', r: '-.6s' },
  { left: '88%', fil: 28, taille: 18, objet: 'argent', d: '5s', r: '-4s' },
]

// « La sélection de Noël » : coin haut droit, fils courts sur téléphone (le
// titre occupe toute la largeur sous le haut de la section).
const SECTION: Suspendu[] = [
  { left: '8%', fil: 10, taille: 20, objet: 'rouge', d: '5.4s', r: '-2s' },
  { left: '38%', fil: 26, taille: 16, objet: 'or', d: '6.2s', r: '-.8s' },
  { left: '64%', fil: 4, taille: 24, objet: 'vert', d: '5.8s', r: '-3.4s' },
  { left: '88%', fil: 18, taille: 14, objet: 'rouge', d: '6.6s', r: '-1.6s' },
]

/** Sur la photo du haut de l'accueil (au-dessus de la photo seulement). */
export function BoulesPhoto() {
  return <Suspendus items={PHOTO} Objet={Boule} className="sz-pendus-photo inset-x-0 top-0 h-full" />
}

/** En haut à droite de la section « La sélection de Noël ». */
export function BoulesSection() {
  return (
    <Suspendus
      items={SECTION}
      Objet={Boule}
      className="sz-pendus-section right-3 top-0 h-[70px] w-[150px] sm:right-8 sm:w-[200px] lg:right-[6%] lg:h-[120px] lg:w-[260px]"
    />
  )
}

/** Haut de l'accueil : neige fine, sol enneigé avec sapins et paquets cadeaux. */
export function HiverHero() {
  return (
    <SceneHero particules={FLOCONS_HERO}>
      <Sol chemin="M0 9 Q 14 3 30 8 T 62 6 T 100 8 V20 H0z" couleur={NEIGE} className="h-[72px] lg:h-[92px]" classeSol="h-[46%]">
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
      </Sol>
    </SceneHero>
  )
}

const SAPINS: { left: string; hauteur: number; cache?: boolean }[] = [
  { left: '4%', hauteur: 46 },
  { left: '10%', hauteur: 32 },
  { left: '33%', hauteur: 38, cache: true },
  { left: '61%', hauteur: 30, cache: true },
  { left: '80%', hauteur: 52 },
  { left: '88%', hauteur: 36 },
]

/** Frise du pied de page : ciel de nuit, guirlande, sapins et cadeaux sur la neige. */
export function FriseNoel() {
  return (
    <Frise fond="nl-frise" particules={FLOCONS}>
      <Sol chemin="M0 8 Q 20 2 40 7 T 75 5 T 100 7 V20 H0z" couleur={NEIGE} className="h-full" classeSol="h-[32%]">
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
      </Sol>
    </Frise>
  )
}
