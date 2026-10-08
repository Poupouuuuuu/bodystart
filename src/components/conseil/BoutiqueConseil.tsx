import { MapPin, Navigation, Phone } from 'lucide-react'
import { BODY_START_STORES } from '@/lib/shopify/types'
import { GOOGLE_DIRECTIONS_URL } from '@/lib/store-info'
import { resumeHoraires, telInternational } from '@/lib/store-hours'
import StatutBoutique from './StatutBoutique'

const boutique = BODY_START_STORES.find((s) => s.isActive)

/**
 * Carte boutique du guide /conseil : adresse, horaires, statut d'ouverture en
 * direct, itinéraire et appel. Tout vient de BODY_START_STORES et de
 * store-info.ts (NAP identique au reste du site).
 */
export default function BoutiqueConseil() {
  if (!boutique) return null
  const tel = telInternational(boutique.phone)

  return (
    <div className="rounded-[20px] bg-white p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mustard-ink">Notre boutique</p>
        <StatutBoutique hours={boutique.hours} />
      </div>
      <p className="mt-3 font-display text-[20px] font-extrabold leading-tight tracking-tight text-spruce">
        {boutique.name}
      </p>
      <address className="mt-3 flex items-start gap-2.5 text-[15px] not-italic leading-[1.5] text-ink">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-spruce" aria-hidden="true" />
        <span>
          {boutique.address}
          <br />
          {boutique.city}
        </span>
      </address>
      <ul className="mt-3 space-y-0.5 pl-[26px] text-[14px] leading-[1.5] text-ink-mute">
        {resumeHoraires(boutique.hours).map((ligne) => (
          <li key={ligne}>{ligne}</li>
        ))}
      </ul>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <a
          href={GOOGLE_DIRECTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="press inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-spruce px-4 text-[15px] font-semibold text-spruce transition-colors hover:bg-spruce/5"
        >
          <Navigation className="h-4 w-4" aria-hidden="true" />
          Itinéraire
        </a>
        <a
          href={`tel:${tel}`}
          className="press inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-spruce px-4 text-[15px] font-semibold text-spruce transition-colors hover:bg-spruce/5"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          Appeler
        </a>
      </div>
      <p className="mt-3 text-center text-[13px] text-ink-mute">{boutique.phone}</p>
    </div>
  )
}
