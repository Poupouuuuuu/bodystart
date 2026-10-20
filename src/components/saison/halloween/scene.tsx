import Frise from '../scene/Frise'
import SceneHero from '../scene/SceneHero'
import Sol from '../scene/Sol'
import Suspendus, { type Suspendu } from '../scene/Suspendus'
import { particules } from '../scene/particules'
import type { Var } from '../scene/types'
import { Bonbon, ChauveSouris, Citrouille, CitrouilleAllumee, Marmite, Pendu, Tombe } from './formes'

// Scène d'Halloween, même mise en scène que Noël (composants communs de
// scene/, paramétrés ici) : chauves-souris et araignées au bout d'un fil,
// feuilles d'automne qui tombent sur le haut de l'accueil, sol de nuit avec
// citrouilles, petites pierres tombales, bonbons et marmite, frise du pied de
// page. Décorative.

const TERRE = '#0A0710'
const LISERE = 'rgba(240,140,70,.6)'

// Feuilles d'automne (orange, brun, rouille : styles.ts), fines et lentes.
const FEUILLES_HERO = particules(18, {
  taille: 10,
  pas: 2,
  opacites: ['0.75', '0.85', '0.95'],
  duree: 13,
  derive: 14,
  tour: 260,
  graine: 3,
})
const FEUILLES_FRISE = particules(10, {
  taille: 9,
  pas: 1.5,
  opacites: ['0.7', '0.8', '0.9'],
  duree: 12,
  derive: 10,
  tour: 220,
  graine: 5,
})

// Photo du haut de l'accueil : 5 objets, fils de longueurs différentes.
const PHOTO: Suspendu[] = [
  { left: '7%', fil: 30, taille: 34, objet: 'chauve-souris', d: '5.2s', r: '-1.1s' },
  { left: '26%', fil: 58, taille: 22, objet: 'araignee', d: '6.4s', r: '-3s' },
  { left: '50%', fil: 18, taille: 28, objet: 'chauve-souris', d: '5.6s', r: '-2.2s' },
  { left: '72%', fil: 44, taille: 20, objet: 'araignee', d: '6s', r: '-.6s' },
  { left: '88%', fil: 26, taille: 26, objet: 'chauve-souris', d: '5s', r: '-4s' },
]

// « La sélection Halloween » : coin haut droit, fils courts sur téléphone.
const SECTION: Suspendu[] = [
  { left: '6%', fil: 12, taille: 18, objet: 'araignee', d: '5.4s', r: '-2s' },
  { left: '34%', fil: 26, taille: 26, objet: 'chauve-souris', d: '6.2s', r: '-.8s' },
  { left: '64%', fil: 4, taille: 16, objet: 'araignee', d: '5.8s', r: '-3.4s' },
  { left: '86%', fil: 18, taille: 22, objet: 'chauve-souris', d: '6.6s', r: '-1.6s' },
]

/** Sur la photo du haut de l'accueil (au-dessus de la photo seulement). */
export function PendusPhoto() {
  return <Suspendus items={PHOTO} Objet={Pendu} className="sz-pendus-photo inset-x-0 top-0 h-full" />
}

/** En haut à droite de la section « La sélection Halloween ». */
export function PendusSection() {
  return (
    <Suspendus
      items={SECTION}
      Objet={Pendu}
      className="sz-pendus-section right-3 top-0 h-[70px] w-[150px] sm:right-8 sm:w-[200px] lg:right-[6%] lg:h-[120px] lg:w-[260px]"
    />
  )
}

/** Haut de l'accueil : feuilles qui tombent, sol de nuit et ses objets. */
export function AutomneHero() {
  return (
    <SceneHero particules={FEUILLES_HERO}>
      <Sol
        chemin="M0 9 Q 14 3 30 8 T 62 6 T 100 8 V20 H0z"
        couleur={TERRE}
        lisere={LISERE}
        className="h-[72px] lg:h-[92px]"
        classeSol="h-[46%]"
      >
        <span className="absolute bottom-[26%] left-[3%]">
          <Tombe hauteur={34} />
        </span>
        <span className="absolute bottom-[22%] left-[10%]">
          <CitrouilleAllumee largeur={40} />
        </span>
        <span className="absolute bottom-[24%] left-[21%]">
          <Bonbon largeur={26} teinte="orange" />
        </span>
        <span className="absolute bottom-[26%] left-[28%] hidden sm:block">
          <Tombe hauteur={26} />
        </span>
        <span className="absolute bottom-[24%] right-[24%]">
          <Bonbon largeur={22} teinte="violet" />
        </span>
        <span className="absolute bottom-[22%] right-[13%]">
          <Marmite largeur={42} />
        </span>
        <span className="absolute bottom-[24%] right-[3%]">
          <Citrouille largeur={30} />
        </span>
        <span className="absolute bottom-[24%] left-[58%] hidden lg:block">
          <CitrouilleAllumee largeur={34} />
        </span>
        {/* Ordinateur : sol plus large, trois éléments de plus. */}
        <span className="absolute bottom-[20%] left-[36%] hidden lg:block">
          <Citrouille largeur={54} />
        </span>
        <span className="absolute bottom-[26%] left-[45%] hidden lg:block">
          <Tombe hauteur={24} />
        </span>
        <span className="absolute bottom-[24%] right-[33%] hidden lg:block">
          <Bonbon largeur={22} teinte="blanc" />
        </span>
      </Sol>
    </SceneHero>
  )
}

// Chauves-souris en vol dans le ciel de la frise. d : durée de la traversée ;
// r : départ décalé ; f : battement d'ailes ; x : place sans animation.
const VOLS: { largeur: number; style: Var }[] = [
  { largeur: 24, style: { top: '30%', '--d': '38s', '--r': '-9s', '--f': '.75s', '--x': '22vw' } },
  { largeur: 16, style: { top: '44%', '--d': '52s', '--r': '-31s', '--f': '.6s', '--x': '68vw' } },
]

/** Frise du pied de page : nuit, lune, chauves-souris, guirlande, sol et ses objets. */
export function FriseHalloween() {
  return (
    <Frise
      fond="hw-frise"
      particules={FEUILLES_FRISE}
      ciel={
        <>
          <div className="hw-etoiles absolute inset-0" />
          <div className="absolute right-[9%] top-[28%] h-7 w-7 md:h-10 md:w-10">
            <div className="hw-halo absolute inset-[-90%] rounded-full" />
            <div className="hw-lune absolute inset-0 rounded-full" />
          </div>
          {VOLS.map((v, i) => (
            <span key={i} className="hw-vol" style={v.style}>
              <ChauveSouris largeur={v.largeur} />
            </span>
          ))}
        </>
      }
    >
      <Sol chemin="M0 8 Q 20 2 40 7 T 75 5 T 100 7 V20 H0z" couleur={TERRE} lisere={LISERE} className="h-full" classeSol="h-[32%]">
        <span className="absolute bottom-[18%] left-[4%]">
          <CitrouilleAllumee largeur={34} />
        </span>
        <span className="absolute bottom-[20%] left-[13%]">
          <Tombe hauteur={26} />
        </span>
        <span className="absolute bottom-[18%] left-[30%] hidden sm:block">
          <Bonbon largeur={20} teinte="blanc" />
        </span>
        <span className="absolute bottom-[18%] left-[52%] hidden sm:block">
          <Citrouille largeur={24} />
        </span>
        <span className="absolute bottom-[18%] right-[22%]">
          <Bonbon largeur={22} teinte="orange" />
        </span>
        <span className="absolute bottom-[18%] right-[6%]">
          <Marmite largeur={36} />
        </span>
      </Sol>
    </Frise>
  )
}
