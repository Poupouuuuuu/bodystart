'use client'

import { useEffect, useState } from 'react'

/**
 * Bandeau anniversaire BodyStart — promo −15 % (code SURPRISE15), valable
 * UNIQUEMENT le 9 juillet 2026 (heure de Paris).
 *
 * La date est évaluée CÔTÉ CLIENT dans le fuseau Europe/Paris, pas côté
 * serveur : le layout est en ISR (revalidate 3600) et les pages sont
 * pré-générées, donc une condition serveur serait figée sur une date de
 * cache. Côté client, `Intl` avec timeZone donne la vraie date parisienne
 * quel que soit le fuseau du visiteur → le bandeau apparaît puis disparaît
 * tout seul à minuit (Paris), sans intervention manuelle.
 */
const BIRTHDAY_PARIS_DATE = '2026-07-09'

function parisDateString(): string {
  // en-CA → format « YYYY-MM-DD » directement comparable.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export default function BirthdayBanner() {
  // false au 1er rendu (SSR + hydratation) → aucun décalage d'hydratation ;
  // la vraie date parisienne est vérifiée juste après le montage.
  const [show, setShow] = useState(false)

  useEffect(() => {
    const check = () => setShow(parisDateString() === BIRTHDAY_PARIS_DATE)
    check()
    // Re-vérifie chaque minute : si l'onglet reste ouvert au passage de
    // minuit (Paris), le bandeau disparaît de lui-même sans rechargement.
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [])

  if (!show) return null

  const chip = (
    <span className="inline-flex items-center rounded-md bg-[#C9A227] text-[#1B2E1B] font-extrabold tracking-wider px-1.5 py-0.5 mx-0.5">
      SURPRISE15
    </span>
  )

  return (
    <div className="bg-[#2D5A2D] text-white" role="region" aria-label="Offre anniversaire">
      <div className="container">
        <p className="text-center text-[12px] sm:text-[13px] font-medium leading-snug py-2.5">
          {/* Message complet (desktop/tablette) — texte exact demandé */}
          <span className="hidden sm:inline">
            <span aria-hidden="true">🎉</span> Aujourd&apos;hui, c&apos;est l&apos;anniversaire de
            BodyStart ! −15 % sur tout le site avec le code {chip} — jusqu&apos;à ce soir minuit.
          </span>
          {/* Version condensée (mobile) — tient sur 2 lignes, même voix */}
          <span className="sm:hidden">
            <span aria-hidden="true">🎉</span> Anniversaire BodyStart : −15 % sur tout avec le code{' '}
            {chip}, aujourd&apos;hui seulement !
          </span>
        </p>
      </div>
    </div>
  )
}
