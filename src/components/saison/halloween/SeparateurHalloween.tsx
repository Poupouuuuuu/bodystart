import type { CSSProperties } from 'react'

// Séparateur entre les grandes sections de l'accueil pendant Halloween : un
// fil orange très fin et quelques lucioles. Décoratif.

type Var = CSSProperties & Record<`--${string}`, string>

const LUCIOLES: Var[] = [
  { left: '12%', top: '7px', '--d': '4.6s', '--r': '-1s' },
  { left: '31%', top: '15px', '--d': '5.8s', '--r': '-3.2s' },
  { left: '52%', top: '6px', '--d': '5.1s', '--r': '-.6s' },
  { left: '71%', top: '14px', '--d': '6.3s', '--r': '-2.2s' },
  { left: '90%', top: '9px', '--d': '4.9s', '--r': '-4s' },
]

export default function SeparateurHalloween() {
  return (
    <div aria-hidden="true" data-anim-saison="" className="container py-3">
      <div className="relative mx-auto h-6 max-w-[520px]">
        <div className="absolute inset-x-0 top-1/2 h-px bg-[linear-gradient(90deg,rgba(232,113,26,0),rgba(232,113,26,.5),rgba(232,113,26,0))]" />
        {LUCIOLES.map((style, i) => (
          <span key={i} className="hw-luciole" style={style} />
        ))}
      </div>
    </div>
  )
}
