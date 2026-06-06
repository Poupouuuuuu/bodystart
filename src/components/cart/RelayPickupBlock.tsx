'use client'

// Bloc point relais Mondial Relay dans le panier (sous le récap).
// Non bloquant : on peut toujours passer commande sans choisir de relais
// (livraison domicile / Click & Collect). Masqué si la feature est éteinte
// (NEXT_PUBLIC_MR_ENSEIGNE absente) ou si le widget ne charge pas.

import { useState, useCallback } from 'react'
import { MapPin } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { isMondialRelayEnabled, type ParcelShop } from '@/lib/mondialRelay'
import MondialRelayPicker from './MondialRelayPicker'

export default function RelayPickupBlock() {
  const { relayPickup, selectRelayPickup, clearRelayPickup } = useCart()
  const [open, setOpen] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  const handleSelected = useCallback(
    (shop: ParcelShop) => {
      setOpen(false)
      void selectRelayPickup(shop)
    },
    [selectRelayPickup]
  )

  const handleUnavailable = useCallback(() => {
    setOpen(false)
    setUnavailable(true)
  }, [])

  // Feature flag éteinte ou widget bloqué → on ne montre rien.
  if (!isMondialRelayEnabled || unavailable) return null

  // Pré-remplissage du code postal si on connaît déjà un relais (5 chiffres).
  const prefillPostCode = relayPickup?.cpVille?.match(/\d{4,5}/)?.[0]

  return (
    <div className="mb-5">
      {relayPickup ? (
        /* Carte de confirmation */
        <div className="bg-sage/60 border border-spruce/15 rounded-xl p-4 flex items-start gap-3">
          <span className="flex-shrink-0 w-9 h-9 rounded-full bg-fresh/15 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-fresh-deep" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-fresh-deep">
              Relais choisi
            </p>
            <p className="text-[14px] font-bold text-spruce leading-tight truncate">
              {relayPickup.name}
            </p>
            {relayPickup.cpVille && (
              <p className="text-[12px] font-medium text-ink-mute mt-0.5">{relayPickup.cpVille}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => setOpen(true)}
                className="text-[12px] font-semibold text-fresh underline underline-offset-2 hover:text-fresh-deep transition-colors"
              >
                Modifier
              </button>
              <button
                onClick={() => void clearRelayPickup()}
                className="text-[12px] font-medium text-ink-mute underline underline-offset-2 hover:text-terracotta transition-colors"
              >
                Retirer
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Bloc incitatif discret — texte empilé + bouton pleine largeur
           (jamais comprimé, même à 360 px ; tap target 44 px) */
        <div className="w-full bg-white border border-spruce/10 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0 leading-none mt-0.5" aria-hidden="true">
              📦
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-spruce leading-snug">
                Tu veux être livré en point relais ?
              </p>
              <p className="text-[12px] font-medium text-ink-mute mt-0.5">
                Choisis ton relais maintenant
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="mt-3 w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-fresh/10 text-fresh text-[13px] font-semibold hover:bg-fresh/15 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Choisir mon relais
          </button>
        </div>
      )}

      {open && (
        <MondialRelayPicker
          postCode={prefillPostCode}
          onClose={() => setOpen(false)}
          onSelected={handleSelected}
          onUnavailable={handleUnavailable}
        />
      )}
    </div>
  )
}
