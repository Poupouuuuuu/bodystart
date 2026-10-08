'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useId } from 'react'
import { Package } from 'lucide-react'
import { formatCents } from '@/lib/conseil/libelles'
import type { Ligne, VarianteProposee } from '@/lib/conseil/types'
import { frenchSpacing } from '@/lib/typo'
import { cn } from '@/lib/utils'

interface Props {
  ligne: Ligne
  /** Variantes encore proposées (celles vues épuisées à la revérification sont retirées). */
  variantes: VarianteProposee[]
  choisie: VarianteProposee | null
  /** Absent : pas de sélecteur de parfum (suggestions sans ajout au panier). */
  onChoisir?: (varianteId: string) => void
  badge?: string | null
}

/** Carte produit du résultat : photo, nom, parfum, prix, stock boutique, phrase « pourquoi ». */
export default function CarteProduitConseil({ ligne, variantes, choisie, onChoisir, badge }: Props) {
  const id = useId()
  const indisponible = !choisie
  const image = choisie?.image ?? ligne.variantes[0]?.image ?? null
  const href = `/products/${ligne.handle}`

  return (
    <li className={cn('rounded-[20px] bg-white p-4 shadow-card sm:p-5', indisponible && 'opacity-70')}>
      <div className="flex gap-4">
        <Link
          href={href}
          className="relative block h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-sage/60"
          tabIndex={-1}
          aria-hidden="true"
        >
          {image ? (
            <Image
              src={image.url}
              alt=""
              fill
              sizes="96px"
              className="object-contain p-1.5"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-spruce/60">
              <Package className="h-8 w-8" strokeWidth={1.5} />
            </span>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          {badge && (
            <span className="mb-1.5 inline-flex rounded-lg bg-sage px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-spruce">
              {badge}
            </span>
          )}
          <h3 className="text-[16px] font-semibold leading-snug text-ink">
            <Link href={href} className="py-1 hover:text-spruce hover:underline hover:underline-offset-4">
              {ligne.titre}
            </Link>
          </h3>
          {ligne.format && <p className="mt-0.5 text-[13px] text-ink-mute">{ligne.format}</p>}
          {choisie && (
            <p className="mt-1.5 font-display text-[18px] font-extrabold tabular-nums text-spruce">
              {formatCents(choisie.prixCents)}
            </p>
          )}
        </div>
      </div>

      {onChoisir && variantes.length > 1 && choisie ? (
        <div className="mt-4">
          <label htmlFor={`${id}-parfum`} className="mb-1.5 block text-[13px] font-semibold text-ink">
            Parfum
          </label>
          <select
            id={`${id}-parfum`}
            value={choisie.id}
            onChange={(e) => onChoisir(e.target.value)}
            className="h-11 w-full rounded-xl border border-spruce/15 bg-white px-3 text-[16px] text-ink focus:border-fresh focus:outline-none focus:ring-1 focus:ring-fresh/30 md:text-[14px]"
          >
            {variantes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.libelle || 'Standard'}
                {v.prixCents !== choisie.prixCents ? ` (${formatCents(v.prixCents)})` : ''}
              </option>
            ))}
          </select>
        </div>
      ) : (
        choisie?.libelle && <p className="mt-3 text-[14px] text-ink">{choisie.libelle}</p>
      )}

      <p
        className={cn(
          'mt-3 inline-flex items-center gap-2 text-[13px] font-semibold',
          indisponible ? 'text-terracotta' : 'text-spruce'
        )}
      >
        <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', indisponible ? 'bg-terracotta' : 'bg-fresh')} />
        {indisponible ? 'Plus en stock à Coignières' : 'En stock à Coignières'}
      </p>
      <p className="mt-2 text-[14px] leading-[1.6] text-ink-mute">{frenchSpacing(ligne.pourquoi)}</p>
    </li>
  )
}
