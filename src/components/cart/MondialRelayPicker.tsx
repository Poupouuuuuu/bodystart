'use client'

// Modal de sélection d'un point relais Mondial Relay.
// Le widget officiel (jQuery + Leaflet + plugin ParcelShopPicker) est chargé
// EN LAZY, uniquement quand ce composant est monté (= modal ouverte). Rien
// n'entre dans le bundle global ni dans le <head> au chargement initial : on
// protège les Core Web Vitals. Si une ressource est bloquée (adblock, réseau),
// on remonte l'échec au parent qui masque proprement le bloc, sans erreur.

import { useEffect, useRef, useState } from 'react'
import { X, MapPin, Loader2 } from 'lucide-react'
import { MR_BRAND, type ParcelShop } from '@/lib/mondialRelay'

// ─── Ressources externes (officielles Mondial Relay) ───────────
const JQUERY_SRC = 'https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js'
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
const MR_PLUGIN_SRC =
  'https://widget.mondialrelay.com/parcelshop-picker/jquery.plugin.mondialrelay.parcelshoppicker.min.js'

// ─── Typage minimal du widget (pas de @types/jquery dans le projet) ───
interface MRParcelShopData {
  ID?: string
  Nom?: string
  Adresse1?: string
  Adresse2?: string
  CP?: string
  Ville?: string
  Pays?: string
}
interface MRPickerOptions {
  Target: string
  Brand: string
  Country: string
  PostCode?: string
  ColLivMod?: string
  NbResults?: number
  ShowResultsOnMap?: boolean
  Responsive?: boolean
  OnParcelShopSelected?: (data: MRParcelShopData) => void
}
type MRjQueryInstance = { MR_ParcelShopPicker?: (opts: MRPickerOptions) => void }
type MRjQuery = ((selector: Element | string) => MRjQueryInstance) & {
  fn?: { MR_ParcelShopPicker?: unknown }
}
declare global {
  interface Window {
    jQuery?: MRjQuery
    L?: unknown
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-mr-src="${src}"]`)
    if (existing) {
      if (existing.dataset.loaded === 'true') return resolve()
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error(`load error: ${src}`)))
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.dataset.mrSrc = src
    s.addEventListener('load', () => {
      s.dataset.loaded = 'true'
      resolve()
    })
    s.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)))
    document.body.appendChild(s)
  })
}

function loadCss(href: string): void {
  if (document.querySelector(`link[data-mr-css="${href}"]`)) return
  const l = document.createElement('link')
  l.rel = 'stylesheet'
  l.href = href
  l.dataset.mrCss = href
  document.head.appendChild(l)
}

// Chaîne de chargement mémoïsée (une seule fois par page). En cas d'échec on
// réinitialise la promesse pour permettre une nouvelle tentative ultérieure.
let widgetChain: Promise<void> | null = null
function loadMondialRelayWidget(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.jQuery?.fn?.MR_ParcelShopPicker) return Promise.resolve()
  if (widgetChain) return widgetChain
  widgetChain = (async () => {
    loadCss(LEAFLET_CSS)
    if (!window.jQuery) await loadScript(JQUERY_SRC)
    if (!window.L) await loadScript(LEAFLET_JS)
    await loadScript(MR_PLUGIN_SRC)
    if (!window.jQuery?.fn?.MR_ParcelShopPicker) {
      throw new Error('MR_ParcelShopPicker plugin missing after load')
    }
  })()
  widgetChain.catch(() => {
    widgetChain = null
  })
  return widgetChain
}

interface Props {
  postCode?: string
  onClose: () => void
  onSelected: (shop: ParcelShop) => void
  /** Chargement impossible (script bloqué) → le parent masque le bloc. */
  onUnavailable: () => void
}

export default function MondialRelayPicker({ postCode, onClose, onSelected, onUnavailable }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  // refs pour ne pas relancer l'init si les callbacks changent d'identité
  const onSelectedRef = useRef(onSelected)
  onSelectedRef.current = onSelected
  const onUnavailableRef = useRef(onUnavailable)
  onUnavailableRef.current = onUnavailable

  useEffect(() => {
    let cancelled = false
    loadMondialRelayWidget()
      .then(() => {
        if (cancelled) return
        const $ = window.jQuery
        const el = containerRef.current
        if (!$ || !el) throw new Error('jQuery/container indisponible')
        $(el).MR_ParcelShopPicker?.({
          Target: '#mr-selected-id',
          Brand: MR_BRAND,
          Country: 'FR',
          PostCode: postCode || '',
          ColLivMod: '24R',
          NbResults: 7,
          ShowResultsOnMap: true,
          Responsive: true,
          OnParcelShopSelected: (data: MRParcelShopData) => {
            if (!data || !data.ID) return
            const shop: ParcelShop = {
              id: String(data.ID).trim(),
              name: (data.Nom || '').trim(),
              address: [data.Adresse1, data.Adresse2].filter(Boolean).join(' ').trim(),
              postalCode: (data.CP || '').trim(),
              city: (data.Ville || '').trim(),
              countryCode: (data.Pays || 'FR').trim(),
            }
            onSelectedRef.current(shop)
          },
        })
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        onUnavailableRef.current()
      })
    return () => {
      cancelled = true
    }
    // init une seule fois au montage (postCode capturé à l'ouverture)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className="fixed inset-0 z-[60] flex sm:items-center sm:justify-center bg-ink/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Choisir un point relais"
      onClick={onClose}
    >
      <div
        className="bg-canvas w-full h-full sm:h-auto sm:max-h-[88vh] sm:max-w-2xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-spruce/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-fresh" />
            <h2 className="font-display text-[18px] font-extrabold tracking-tight text-spruce">
              Choisis ton point relais
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full text-ink-mute hover:text-spruce hover:bg-spruce/5 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps : le widget injecte recherche + liste + carte ici */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 min-h-[55vh]">
          {status === 'loading' && (
            <div className="h-full min-h-[40vh] flex flex-col items-center justify-center text-ink-mute gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-fresh" />
              <p className="text-[13px] font-medium">On charge la carte des relais…</p>
            </div>
          )}
          <div ref={containerRef} className="mr-widget" />
          {/* Cible technique requise par le widget (reçoit l'ID sélectionné) */}
          <input type="hidden" id="mr-selected-id" />
        </div>
      </div>
    </div>
  )
}
