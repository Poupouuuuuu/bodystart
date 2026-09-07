'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

/**
 * Bandeau opération Venomette (influenceuse muscu/moto, vidéo Instagram
 * publiée le 8 septembre 2026) : code VENO10 (−10 % sur tout le site) et
 * jeu-concours (pack d’une valeur de 150 €, tirage le lundi 14 septembre).
 *
 * Trois phases, évaluées CÔTÉ CLIENT dans le fuseau Europe/Paris (même
 * raison que BirthdayBanner : layout en ISR, pages pré-générées, donc une
 * condition serveur serait figée sur une date de cache) :
 *  - « teaser » la veille de la vidéo (7 septembre) ;
 *  - « contest » du 8 au 13 septembre : code + concours (lien règlement) ;
 *  - « code » du 14 au 20 septembre : code seul, le tirage est passé.
 * En dehors de ces dates, rien n’est rendu. Composant à retirer après le 20/09.
 */
const TEASER_DATE = '2026-09-07'
const LIVE_FROM = '2026-09-08'
const DRAW_DATE = '2026-09-14'
const LIVE_TO = '2026-09-20'

const INSTAGRAM_URL = 'https://www.instagram.com/bodystart_nutrition/'

type Phase = 'teaser' | 'contest' | 'code' | null

function parisDateString(): string {
  // en-CA → format « YYYY-MM-DD » directement comparable.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function phaseFor(date: string): Phase {
  if (date === TEASER_DATE) return 'teaser'
  if (date < LIVE_FROM || date > LIVE_TO) return null
  return date < DRAW_DATE ? 'contest' : 'code'
}

export default function VenometteBanner() {
  // null au 1er rendu (SSR + hydratation) → aucun décalage d’hydratation ;
  // la vraie date parisienne est vérifiée juste après le montage.
  const [phase, setPhase] = useState<Phase>(null)

  useEffect(() => {
    const check = () => setPhase(phaseFor(parisDateString()))
    check()
    // Re-vérifie chaque minute : changement de phase à minuit (Paris) sans rechargement.
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [])

  if (!phase) return null

  const chip = (
    <span className="inline-flex items-center rounded-md bg-[#C9A227] text-[#1B2E1B] font-extrabold tracking-wider px-1.5 py-0.5 mx-0.5">
      VENO10
    </span>
  )
  // Toute la ligne est cliquable (zone tactile ≥ 44 px, règle mobile first).
  const rowClass =
    'flex items-center justify-center min-h-[44px] py-1.5 text-center text-[12px] sm:text-[13px] font-medium leading-snug'
  const cue = 'underline underline-offset-2 decoration-white/50 font-semibold whitespace-nowrap'

  return (
    <div className="bg-[#2D5A2D] text-white" role="region" aria-label="Opération Venomette">
      <div className="container">
        {phase === 'teaser' && (
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={rowClass}>
            <span>
              <span aria-hidden="true">🎬</span> Demain, une surprise sur Instagram : un pack de 150 € à
              gagner, et un cadeau pour tout le monde.{' '}
              <span className={cue}>Suivre @bodystart_nutrition</span>
            </span>
          </a>
        )}
        {phase === 'contest' && (
          <Link href="/jeu-concours" className={rowClass}>
            <span className="hidden sm:inline">
              <span aria-hidden="true">🎬</span> Vu chez Venomette ? −10 % sur tout le site avec le code{' '}
              {chip} · Un pack de 150 € à gagner : <span className={cue}>voir le règlement</span>
            </span>
            <span className="sm:hidden">
              <span aria-hidden="true">🎬</span> −10 % sur tout avec le code {chip} · Pack de 150 € à
              gagner : <span className={cue}>règlement</span>
            </span>
          </Link>
        )}
        {phase === 'code' && (
          <p className={rowClass}>
            <span>
              <span aria-hidden="true">🎬</span> Vu chez Venomette ? −10 % sur tout le site avec le code{' '}
              {chip}
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
