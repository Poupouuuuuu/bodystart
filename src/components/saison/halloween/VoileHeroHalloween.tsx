import type { CSSProperties } from 'react'
import { ChauveSouris } from './formes'

// Haut de l'accueil pendant Halloween (retouche du 19/10/2026) : la photo de
// la boutique reste, chargée comme hors saison ; ce composant remplace
// seulement ses voiles par un vert sapin (#1E3A2C) et pose 3 chauves-souris
// qui traversent le côté droit de la photo. Rien d'autre sur la photo.
//
// Voiles : vertical sous lg (le texte occupe presque toute la hauteur),
// latéral à partir de lg (plus de 90 % sur le tiers gauche, effacé vers
// 70 % de la largeur), plus un fond bas pour les chiffres et la carte
// boutique. Le vert sapin est plus clair que le voile habituel : opacité
// réglée pour le contraste AA mesuré sur la photo (spots du plafond compris).

type Var = CSSProperties & Record<`--${string}`, string>

// top : hauteur de vol dans la zone ; d : durée de la traversée ; r : départ
// décalé (déjà en vol au chargement) ; f : battement d'ailes ; x : position
// sans animation (mouvement réduit).
const VOLS: { top: string; largeur: number; style: Var }[] = [
  { top: '22%', largeur: 40, style: { '--d': '34s', '--r': '-9s', '--f': '.85s', '--x': '58%' } },
  { top: '52%', largeur: 26, style: { '--d': '44s', '--r': '-27s', '--f': '.7s', '--x': '22%' } },
  { top: '8%', largeur: 20, style: { '--d': '53s', '--r': '-16s', '--f': '.6s', '--x': '80%' } },
]

export default function VoileHeroHalloween() {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_top,rgba(30,58,44,0.97)_0%,rgba(30,58,44,0.94)_50%,rgba(30,58,44,0.92)_72%,rgba(30,58,44,0.88)_82%,rgba(30,58,44,0.4)_93%,rgba(30,58,44,0.15)_100%)] lg:hidden"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(30,58,44,0.95)_0%,rgba(30,58,44,0.94)_42%,rgba(30,58,44,0.75)_54%,rgba(30,58,44,0.35)_63%,rgba(30,58,44,0)_72%)] lg:block"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden bg-[linear-gradient(to_top,rgba(30,58,44,0.97)_0%,rgba(30,58,44,0.88)_26%,rgba(30,58,44,0)_50%)] lg:block"
      />
      {/* Chauves-souris : bande du haut sous lg, côté droit de la photo
          au-dessus (texte à gauche, jamais survolé). */}
      <div
        aria-hidden="true"
        data-anim-saison=""
        className="pointer-events-none absolute inset-x-0 top-0 h-[22%] overflow-hidden lg:left-[58%] lg:h-[62%]"
      >
        {VOLS.map((v, i) => (
          <span key={i} className="hw-vol-zone" style={{ ...v.style, top: v.top }}>
            <ChauveSouris largeur={v.largeur} className="hw-silhouette" />
          </span>
        ))}
      </div>
    </>
  )
}
