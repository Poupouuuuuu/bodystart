'use client'

import { useState } from 'react'
import { Store, ChevronDown, CheckCircle2, XCircle, Clock, MapPin } from 'lucide-react'
import { BODY_START_STORES, COMING_SOON_STORES } from '@/lib/shopify/types'
import { cn } from '@/lib/utils'

interface ClickAndCollectProps {
  availableInStores?: Record<string, number>
}

export default function ClickAndCollect({ availableInStores = {} }: ClickAndCollectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const store = BODY_START_STORES[0]

  const getStockStatus = (storeId: string) => {
    const qty = availableInStores[storeId]
    if (qty === undefined) return { label: 'Disponibilité à vérifier en boutique', color: 'gray', icon: Clock }
    if (qty === 0) return { label: 'Indisponible en boutique', color: 'red', icon: XCircle }
    if (qty <= 3) return { label: `Plus que ${qty} en boutique`, color: 'yellow', icon: CheckCircle2 }
    return { label: 'Disponible en boutique', color: 'green', icon: CheckCircle2 }
  }

  const { label, color, icon: StatusIcon } = getStockStatus(store.id)

  return (
    <div className="border border-cream-300 rounded-2xl overflow-hidden mt-6 mb-4">
      {/* Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-cream-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center">
            <Store className="w-5 h-5 text-brand-500" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-900 text-sm">Click & Collect disponible</p>
            <p className="text-xs text-gray-500">Retrait en boutique sous 2h</p>
          </div>
        </div>
        <ChevronDown className={cn('w-5 h-5 text-gray-400 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="border-t border-cream-200">
          {/* Boutique active */}
          <div className="p-4 hover:bg-cream-50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-500" />
                  <p className="font-semibold text-gray-900 text-sm">{store.name}</p>
                </div>
                <p className="text-xs text-gray-500 mb-2">{store.address}, {store.city}</p>
                <div className="space-y-0.5">
                  {store.hours.map((h, i) => (
                    <p key={i} className="text-xs text-gray-400">
                      <span className="font-medium text-gray-600">{h.day}</span>
                      {' '}
                      {h.open === 'Fermé' ? <span className="text-red-400">Fermé</span> : <span>{h.open} – {h.close}</span>}
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className={cn(
                  'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full',
                  color === 'green' && 'bg-brand-50 text-brand-500',
                  color === 'yellow' && 'bg-yellow-50 text-yellow-600',
                  color === 'red' && 'bg-red-50 text-red-600',
                  color === 'gray' && 'bg-cream-100 text-gray-500',
                )}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {label}
                </div>
              </div>
            </div>
          </div>

          {/* Boutique B - coming soon */}
          {COMING_SOON_STORES.map((cs) => (
            <div key={cs.id} className="p-4 bg-cream-50 border-t border-cream-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-sm text-gray-500">{cs.name}</p>
                </div>
                <span className="text-xs bg-cream-200 text-gray-500 px-3 py-1 rounded-full font-medium">
                  {cs.openingDate}
                </span>
              </div>
            </div>
          ))}

          {/* Info */}
          <div className="p-4 bg-brand-50 border-t border-brand-50">
            <p className="text-xs text-brand-600 leading-relaxed">
              <strong>Comment ça marche ?</strong> Choisissez Click & Collect au checkout. Votre commande sera prête en boutique sous 2h. Vous recevrez un email de confirmation avec les détails.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
