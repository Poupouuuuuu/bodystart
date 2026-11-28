'use client'

/**
 * Rangée de pastilles de filtre qui défile au doigt (mobile first, nuit du
 * 28/11/2026) : catégories et sous-catégories de /products, sous-catégories
 * des pages catégorie. Zones tactiles de 44 px, pastille active ramenée dans
 * la vue au chargement (lien direct ?cat=…&tag=…), sans faire défiler la page.
 *
 * Chaque pastille est un bouton (filtre sur la page) ou un lien (`href`).
 */
import { useEffect, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface Pastille {
  cle: string
  libelle: string
  compte?: number
  actif: boolean
  href?: string
  onClick?: () => void
}

export default function PastillesFiltres({
  pastilles,
  libelle,
  className,
  discret = false,
  avant,
}: {
  pastilles: Pastille[]
  /** Commandes placées en tête de la même rangée (filtres, tri, recherche sur mobile). */
  avant?: ReactNode
  /** Nom de la rangée pour les lecteurs d'écran (« Catégories »). */
  libelle: string
  className?: string
  /** Rangée secondaire (sous-catégories) : pastilles plus légères. */
  discret?: boolean
}) {
  const rangee = useRef<HTMLDivElement>(null)
  const active = pastilles.find((p) => p.actif)?.cle

  useEffect(() => {
    const el = rangee.current
    const cible = el?.querySelector<HTMLElement>('[data-actif="true"]')
    if (!el || !cible) return
    const gauche = cible.offsetLeft - el.offsetLeft - 16
    if (gauche > 0 && cible.offsetLeft + cible.offsetWidth > el.scrollLeft + el.clientWidth) {
      el.scrollTo({ left: gauche, behavior: 'instant' as ScrollBehavior })
    }
  }, [active])

  if (pastilles.length === 0 && !avant) return null

  return (
    <div
      ref={rangee}
      role="group"
      aria-label={libelle}
      className={cn(
        'scrollbar-hide -mx-4 flex gap-2 overflow-x-auto overscroll-x-contain px-4 sm:-mx-6 sm:px-6',
        className
      )}
    >
      {avant}
      {pastilles.map((p) => {
        const classes = cn(
          'inline-flex h-11 flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-[14px] font-semibold transition-colors',
          p.actif
            ? discret
              ? 'saison-actif-doux border-spruce/30 bg-sage text-spruce'
              : 'saison-actif border-spruce bg-spruce text-white'
            : 'border-spruce/15 bg-white text-ink hover:border-spruce/40'
        )
        const contenu = (
          <>
            {p.libelle}
            {p.compte !== undefined && (
              <span className={cn('text-[12px] font-medium', p.actif && !discret ? 'text-white/70' : 'text-ink-mute')}>
                {p.compte}
              </span>
            )}
          </>
        )
        return p.href ? (
          <Link
            key={p.cle}
            href={p.href}
            data-actif={p.actif}
            aria-current={p.actif ? 'page' : undefined}
            className={classes}
          >
            {contenu}
          </Link>
        ) : (
          <button
            key={p.cle}
            type="button"
            data-actif={p.actif}
            aria-pressed={p.actif}
            onClick={p.onClick}
            className={classes}
          >
            {contenu}
          </button>
        )
      })}
    </div>
  )
}
