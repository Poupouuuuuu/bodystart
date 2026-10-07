'use client'

// Roue des cadeaux : SVG 6 segments, rotation pilotée en requestAnimationFrame.
// Phase 1 (spinning, lot encore inconnu) : vitesse constante.
// Phase 2 (targetIndex connu, tiré côté serveur) : décélération jusqu'au
// segment tiré, sans à-coup de vitesse. Mouvement réduit : arrêt quasi direct.

import { useEffect, useRef } from 'react'

export interface WheelSegment {
  label: string
  fill: string
  text: string
}

interface Props {
  segments: WheelSegment[]
  spinning: boolean
  targetIndex: number | null
  onDone?: () => void
}

const SPEED = 540 // degrés par seconde pendant l'attente du tirage
const DECEL_MS = 4500
const R = 150

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

function arcPath(i: number, n: number): string {
  const a0 = ((i * 360) / n - 90) * (Math.PI / 180)
  const a1 = (((i + 1) * 360) / n - 90) * (Math.PI / 180)
  const p = (a: number) => `${(R * Math.cos(a)).toFixed(2)} ${(R * Math.sin(a)).toFixed(2)}`
  return `M 0 0 L ${p(a0)} A ${R} ${R} 0 0 1 ${p(a1)} Z`
}

export default function Wheel({ segments, spinning, targetIndex, onDone }: Props) {
  const wheelRef = useRef<SVGGElement>(null)
  const angle = useRef(0)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const n = segments.length
  const seg = 360 / n

  useEffect(() => {
    if (!spinning && targetIndex === null) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const apply = () => {
      if (wheelRef.current) wheelRef.current.style.transform = `rotate(${angle.current}deg)`
    }
    let raf = 0
    let last = performance.now()

    if (targetIndex === null) {
      if (reduce) return
      const loop = (now: number) => {
        angle.current += (SPEED * (now - last)) / 1000
        last = now
        apply()
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
      return () => cancelAnimationFrame(raf)
    }

    // Le segment i va du degré i*seg au degré (i+1)*seg, sens horaire depuis
    // le haut. Le pointeur est en haut : on vise le centre du segment, avec un
    // léger décalage aléatoire pour ne pas toujours tomber pile au milieu.
    const jitter = (Math.random() - 0.5) * seg * 0.6
    const wanted = (((-(targetIndex * seg + seg / 2 + jitter)) % 360) + 360) % 360
    const start = angle.current
    const minTravel = reduce ? 0 : (SPEED * DECEL_MS) / 1000 / 3 // vitesse initiale ≈ SPEED
    const base = start + minTravel
    const end = base + ((wanted - (base % 360) + 360) % 360)
    const duration = reduce ? 500 : DECEL_MS
    const t0 = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration)
      angle.current = start + (end - start) * easeOutCubic(t)
      apply()
      if (t < 1) raf = requestAnimationFrame(step)
      else window.setTimeout(() => onDoneRef.current?.(), 500)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [spinning, targetIndex, seg])

  return (
    <div className="relative mx-auto w-[min(86vw,340px)] aspect-square">
      {/* Pointeur */}
      <svg
        viewBox="0 0 40 44"
        className="absolute left-1/2 -top-2 z-10 w-9 -translate-x-1/2 drop-shadow-md"
        aria-hidden="true"
      >
        <path d="M20 42 L4 6 Q20 -2 36 6 Z" fill="#2D5A2D" stroke="#FFFFFF" strokeWidth="3" strokeLinejoin="round" />
      </svg>

      <svg viewBox="-160 -160 320 320" className="h-full w-full drop-shadow-[0_18px_30px_rgba(45,90,45,0.18)]" role="img" aria-label={`Roue des cadeaux : ${segments.map((s) => s.label).join(', ')}`}>
        <circle r="158" fill="#FFFFFF" />
        <g ref={wheelRef} style={{ transformOrigin: '0 0', willChange: 'transform' }}>
          {segments.map((s, i) => (
            <g key={i}>
              <path d={arcPath(i, n)} fill={s.fill} stroke="#FFFFFF" strokeWidth="2" />
              <g transform={`rotate(${i * seg + seg / 2 - 90})`}>
                <text
                  x={R * 0.6}
                  y={0}
                  fill={s.text}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="font-sans"
                  style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.01em' }}
                >
                  {s.label}
                </text>
              </g>
            </g>
          ))}
        </g>
        <circle r="150" fill="none" stroke="#2D5A2D" strokeOpacity="0.12" strokeWidth="1" />
        {/* Moyeu */}
        <circle r="26" fill="#FAF8F3" stroke="#FFFFFF" strokeWidth="5" />
        <circle r="9" fill="#3B7A3F" />
      </svg>
    </div>
  )
}
