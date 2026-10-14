'use client'

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CarrouselBoutiqueProps {
  /** En-tête de la section, à gauche des flèches. */
  entete: ReactNode
  label: string
  /** Les cartes, rendues côté serveur. */
  children: ReactNode
}

/**
 * Carrousel des photos de la boutique (accueil, BoutiqueGalleryV2).
 *
 * La piste est un défilement CSS natif (scroll-snap) rendu côté serveur :
 * sans JavaScript, toutes les photos sont dans le HTML et défilent au doigt,
 * au pavé tactile, à Maj + molette ou au clavier (piste focusable). Ce
 * composant n'ajoute que les flèches (à partir de md), invisibles tant que le
 * JS n'a pas pris la main, grisées en début et en fin de piste.
 *
 * Pas de défilement automatique (WCAG 2.2.2 demanderait alors un bouton
 * pause) et la molette verticale n'est pas détournée : elle fait défiler la
 * page, comme partout ailleurs.
 */
export default function CarrouselBoutique({ entete, label, children }: CarrouselBoutiqueProps) {
  const id = useId()
  const piste = useRef<HTMLDivElement>(null)
  const [pret, setPret] = useState(false)
  const [bords, setBords] = useState({ debut: true, fin: false })

  const mesurer = useCallback(() => {
    const el = piste.current
    if (!el) return
    setBords({
      debut: el.scrollLeft <= 2,
      fin: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    })
  }, [])

  useEffect(() => {
    const el = piste.current
    if (!el) return
    setPret(true)
    mesurer()
    el.addEventListener('scroll', mesurer, { passive: true })
    window.addEventListener('resize', mesurer)
    return () => {
      el.removeEventListener('scroll', mesurer)
      window.removeEventListener('resize', mesurer)
    }
  }, [mesurer])

  // Une page = autant de cartes entières que la piste en montre (4 sur
  // ordinateur). Le scroll-snap aligne ensuite la carte au bord.
  const defiler = (sens: 1 | -1) => {
    const el = piste.current
    const carte = el?.firstElementChild as HTMLElement | null
    if (!el || !carte) return
    const ecart = parseFloat(getComputedStyle(el).columnGap) || 0
    const pas = carte.offsetWidth + ecart
    const parPage = Math.max(1, Math.floor((el.clientWidth + ecart) / pas))
    const doux = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: sens * pas * parPage, behavior: doux ? 'smooth' : 'auto' })
  }

  const FLECHE =
    'press inline-flex h-11 w-11 items-center justify-center rounded-full border border-spruce/20 bg-white text-spruce transition-colors hover:bg-sage disabled:cursor-default disabled:opacity-40 disabled:hover:bg-white'

  return (
    <>
      <div className="mb-9 flex items-end justify-between gap-6">
        {entete}
        <div className={cn('hidden flex-shrink-0 gap-2 md:flex', !pret && 'invisible')}>
          <button
            type="button"
            className={FLECHE}
            onClick={() => defiler(-1)}
            disabled={bords.debut}
            aria-controls={id}
            aria-label="Photos précédentes"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={FLECHE}
            onClick={() => defiler(1)}
            disabled={bords.fin}
            aria-controls={id}
            aria-label="Photos suivantes"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile : la piste déborde jusqu'aux bords de l'écran, scroll-padding
          pour que la carte s'aligne sur la marge du conteneur. */}
      <div
        ref={piste}
        id={id}
        role="region"
        aria-roledescription="carrousel"
        aria-label={label}
        tabIndex={0}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </>
  )
}
