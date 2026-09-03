'use client'

import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReadMoreProps {
  children: React.ReactNode
  /** Libellé du bouton quand le bloc est replié. */
  label?: string
  className?: string
}

/**
 * Bloc replié SUR MOBILE uniquement (au-dessus de `md`, tout est visible).
 *
 * Usage : les intros SEO des pages catégorie (2-3 paragraphes) repoussaient
 * les produits à plus d'un écran sur téléphone. Le texte reste dans le DOM
 * (Google le lit, le lecteur d'écran aussi), seul l'affichage est tronqué à
 * ~7 lignes avec un fondu et un bouton « Lire la suite » de 44 px.
 */
export default function ReadMore({ children, label = 'Lire la suite', className }: ReadMoreProps) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <div className={className}>
      <div
        id={id}
        className={cn(
          'relative transition-[max-height] duration-500 ease-out-expo',
          !open && 'max-h-[11.5rem] overflow-hidden md:max-h-none md:overflow-visible'
        )}
      >
        {children}
        {!open && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-canvas to-transparent md:hidden"
          />
        )}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="mt-1 inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-semibold text-spruce md:hidden"
      >
        {open ? 'Réduire' : label}
        <ChevronDown
          className={cn('h-4 w-4 transition-transform duration-500 ease-out-expo', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
    </div>
  )
}
