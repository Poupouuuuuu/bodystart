'use client'

import { useEffect, useState } from 'react'
import { statutOuverture, type PlageHoraire } from '@/lib/store-hours'
import { cn } from '@/lib/utils'

/**
 * « Ouvert maintenant » / « Fermé, ouvre … », en heure de Paris, calculé
 * dans le navigateur (la page est en cache ISR : un statut rendu côté serveur
 * serait périmé). Rien n'est affiché avant le calcul, pour ne jamais montrer
 * un « Ouvert » faux un dimanche ; la place est réservée (pas de saut).
 */
export default function StatutBoutique({ hours }: { hours: PlageHoraire[] }) {
  const [statut, setStatut] = useState<{ ouvert: boolean; libelle: string } | null>(null)

  useEffect(() => {
    const maj = () => setStatut(statutOuverture(hours, new Date()))
    maj()
    const id = setInterval(maj, 60_000)
    return () => clearInterval(id)
  }, [hours])

  return (
    <span className="inline-flex min-h-[28px] items-center" aria-live="polite">
      {statut && (
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold',
            statut.ouvert ? 'bg-sage text-spruce' : 'bg-terracotta/10 text-terracotta'
          )}
        >
          <span
            aria-hidden="true"
            className={cn('h-1.5 w-1.5 rounded-full', statut.ouvert ? 'bg-fresh' : 'bg-terracotta')}
          />
          {statut.libelle}
        </span>
      )}
    </span>
  )
}
