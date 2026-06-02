'use client'

/**
 * Champ téléphone avec sélecteur de pays (drapeau + indicatif), défaut France.
 * - Affiche le numéro au format national ("07 61 84 75 80").
 * - Normalise en interne en E.164 (+33761847580) via libphonenumber-js.
 * - onChange(e164, isValid) : e164 = '' si vide, sinon E.164 quand valide.
 *   isValid = true si vide (champ optionnel géré par le parent) ou numéro valide.
 *
 * Réutilisé partout où on saisit un téléphone (profil, cagnotte/parrainage).
 */
import { useState } from 'react'
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'

type Country = { iso: CountryCode; dial: string; flag: string; name: string }

// France en premier (défaut). Liste resserrée sur la zone FR + voisins courants.
const COUNTRIES: Country[] = [
  { iso: 'FR', dial: '33', flag: '🇫🇷', name: 'France' },
  { iso: 'BE', dial: '32', flag: '🇧🇪', name: 'Belgique' },
  { iso: 'CH', dial: '41', flag: '🇨🇭', name: 'Suisse' },
  { iso: 'LU', dial: '352', flag: '🇱🇺', name: 'Luxembourg' },
  { iso: 'MC', dial: '377', flag: '🇲🇨', name: 'Monaco' },
  { iso: 'ES', dial: '34', flag: '🇪🇸', name: 'Espagne' },
  { iso: 'IT', dial: '39', flag: '🇮🇹', name: 'Italie' },
  { iso: 'DE', dial: '49', flag: '🇩🇪', name: 'Allemagne' },
  { iso: 'PT', dial: '351', flag: '🇵🇹', name: 'Portugal' },
  { iso: 'GB', dial: '44', flag: '🇬🇧', name: 'Royaume-Uni' },
]

function seed(value: string): { iso: CountryCode; national: string } {
  if (!value) return { iso: 'FR', national: '' }
  const parsed = parsePhoneNumberFromString(value)
  if (parsed) return { iso: (parsed.country as CountryCode) ?? 'FR', national: parsed.formatNational() }
  return { iso: 'FR', national: value }
}

interface PhoneFieldProps {
  value: string
  onChange: (e164: string, isValid: boolean) => void
  id?: string
  placeholder?: string
  /** Classe appliquée au champ numéro (pour coller à la DA du parent). */
  inputClassName?: string
}

const DEFAULT_INPUT =
  'w-full px-4 py-3.5 rounded-xl border border-spruce/20 text-sm font-medium text-ink bg-white focus:outline-none focus:border-fresh focus:ring-1 focus:ring-fresh/30 placeholder:text-ink-mute/60 transition-all'

export default function PhoneField({ value, onChange, id, placeholder = '06 12 34 56 78', inputClassName }: PhoneFieldProps) {
  const initial = seed(value)
  const [iso, setIso] = useState<CountryCode>(initial.iso)
  const [national, setNational] = useState(initial.national)

  function emit(nextIso: CountryCode, nextNational: string) {
    const trimmed = nextNational.trim()
    if (!trimmed) {
      onChange('', true)
      return
    }
    const parsed = parsePhoneNumberFromString(trimmed, nextIso)
    if (parsed && parsed.isValid()) onChange(parsed.number, true)
    else onChange('', false)
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-shrink-0">
        <select
          aria-label="Indicatif pays"
          value={iso}
          onChange={(e) => {
            const next = e.target.value as CountryCode
            setIso(next)
            emit(next, national)
          }}
          className="h-full appearance-none rounded-xl border border-spruce/20 bg-white pl-3 pr-8 text-sm font-medium text-ink focus:outline-none focus:border-fresh focus:ring-1 focus:ring-fresh/30 transition-all cursor-pointer"
        >
          {COUNTRIES.map((c) => (
            <option key={c.iso} value={c.iso}>
              {c.flag} +{c.dial}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-mute text-xs">▾</span>
      </div>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={national}
        onChange={(e) => {
          setNational(e.target.value)
          emit(iso, e.target.value)
        }}
        placeholder={placeholder}
        className={inputClassName ?? DEFAULT_INPUT}
      />
    </div>
  )
}
