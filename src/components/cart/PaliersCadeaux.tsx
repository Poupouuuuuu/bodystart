'use client'

import { Gift, Truck, Check, Info } from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils'
import { prochainPalier, type EtatPalier } from '@/lib/paliers'
import { avecLeCode, type EtatCadeaux } from '@/lib/paliers/panier'

const euros = (n: number) => formatPrice({ amount: n.toFixed(2), currencyCode: 'EUR' })

/** « Plus que 12,40 € pour ta Crunch Bar offerte » (accroche du métachamp), sinon « Plus que 12,40 € : Crunch Bar offerte ». */
function phraseReste(e: EtatPalier) {
  return e.palier.accroche ? (
    <>
      Plus que <span className="font-bold text-spruce">{euros(e.reste)}</span> pour {e.palier.accroche}
    </>
  ) : (
    <>
      Plus que <span className="font-bold text-spruce">{euros(e.reste)}</span> : {e.palier.libelle}
    </>
  )
}

/**
 * Barre des paliers cadeaux du tiroir panier. Montants, libellés et périodes
 * viennent du métachamp (via useCadeaux) ; ce composant ne fait qu'afficher.
 */
export default function PaliersCadeaux({ etat, onAjouter }: { etat: EtatCadeaux; onAjouter: (montant: number) => void }) {
  const { etats, codeBloquant, horsBase, baseCadeaux } = etat
  const max = Math.max(...etats.map((e) => e.palier.montant))
  const aCadeaux = etats.some((e) => e.palier.type === 'cadeau')
  const remplissage = aCadeaux ? baseCadeaux : (etats[0]?.base ?? 0)
  const pct = Math.min(100, (remplissage / max) * 100)
  const prochain = prochainPalier(etats)

  return (
    <div className="px-8 pb-5">
      <div className="rounded-xl border border-spruce/10 bg-white p-4">
        <p className="mb-3 text-[12px] font-medium leading-snug text-ink-mute" aria-live="polite">
          {codeBloquant ? (
            <span className="inline-flex items-start gap-1.5">
              <Info className="mt-px h-3.5 w-3.5 flex-shrink-0 text-spruce" aria-hidden="true" />
              Les cadeaux ne se cumulent pas {avecLeCode(codeBloquant)}.
            </span>
          ) : prochain ? (
            phraseReste(prochain)
          ) : (
            <span className="inline-flex items-center gap-1.5 font-semibold text-spruce">
              <Check className="h-3.5 w-3.5 text-fresh" aria-hidden="true" />
              Tous les paliers sont atteints.
            </span>
          )}
        </p>

        {/* Piste : remplissage = base des cadeaux, un repère par palier (coché quand il est atteint). */}
        <div className="relative mx-1.5 mb-6 mt-1">
          <div
            className="relative h-1.5 overflow-hidden rounded-full bg-spruce/10"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={Math.round(remplissage)}
            aria-label="Progression vers les paliers cadeaux"
          >
            <div className="absolute inset-y-0 left-0 rounded-full bg-fresh transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
          </div>
          {etats.map((e) => {
            const gauche = (e.palier.montant / max) * 100
            return (
              <div key={`${e.palier.type}-${e.palier.montant}`} className="absolute top-[3px] -translate-x-1/2 -translate-y-1/2" style={{ left: `${gauche}%` }}>
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full border-2',
                    e.atteint ? 'border-fresh bg-fresh text-white' : 'border-spruce/20 bg-white text-transparent'
                  )}
                  aria-hidden="true"
                >
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
                <span
                  className={cn(
                    'absolute top-5 whitespace-nowrap text-[11px] font-semibold tabular-nums',
                    gauche > 92 ? 'right-0' : 'left-1/2 -translate-x-1/2',
                    e.atteint ? 'text-spruce' : 'text-ink-mute'
                  )}
                >
                  {euros(e.palier.montant).replace(',00', '')}
                </span>
              </div>
            )
          })}
        </div>

        <ul className="space-y-1">
          {etats.map((e) => {
            const Icone = e.palier.type === 'livraison' ? Truck : Gift
            const dansPanier = e.lignes.length > 0
            return (
              <li key={`${e.palier.type}-${e.palier.montant}`} className="flex min-h-[32px] items-center justify-between gap-3 text-[12px]">
                <span className={cn('flex items-center gap-2', e.atteint ? 'text-ink' : 'text-ink-mute')}>
                  <Icone className={cn('h-3.5 w-3.5 flex-shrink-0', e.atteint ? 'text-fresh' : 'text-spruce/40')} aria-hidden="true" />
                  {e.palier.libelle}
                </span>
                {e.palier.type === 'livraison' ? (
                  e.atteint && <span className="font-semibold text-fresh-deep">Atteint</span>
                ) : e.atteint && !codeBloquant ? (
                  dansPanier ? (
                    <span className="font-semibold text-fresh-deep">Dans ton panier</span>
                  ) : e.nonAccorde ? null : e.refuse ? (
                    <button
                      type="button"
                      onClick={() => onAjouter(e.palier.montant)}
                      className="press -my-1.5 inline-flex min-h-[44px] items-center rounded-full px-1 font-semibold text-spruce underline underline-offset-2 hover:text-fresh-deep"
                    >
                      Ajouter mon cadeau
                    </button>
                  ) : null
                ) : null}
              </li>
            )
          })}
        </ul>

        {horsBase && aCadeaux && !codeBloquant && prochain?.palier.type === 'cadeau' && (
          <p className="mt-2 text-[11px] leading-snug text-ink-mute">
            Les cadeaux se calculent sur les compléments et les barres, hors accessoires.
          </p>
        )}
      </div>
    </div>
  )
}
