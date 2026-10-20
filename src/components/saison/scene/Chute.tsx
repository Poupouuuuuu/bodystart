import type { Var } from './types'

// Particules qui tombent (neige à Noël, feuilles à Halloween) : aspect donné
// par le CSS du thème (.sz-chute), place, taille et vitesse par les variables
// de chaque particule (valeurs fixes, scene/types.ts).
export default function Chute({ particules }: { particules: Var[] }) {
  return (
    <>
      {particules.map((style, i) => (
        <span key={i} className="sz-chute" style={style} />
      ))}
    </>
  )
}
