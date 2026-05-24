/**
 * Validation et normalisation du telephone client (cle d'identite loyalty).
 * Utilise libphonenumber-js (parsePhoneNumberFromString) pour gerer
 * les formats francais courants (06.. / +33 6.. / 0033 6..).
 */
import { parsePhoneNumberFromString } from 'libphonenumber-js'

/**
 * Tente de parser une chaine en E.164 (+33612345678).
 * Retourne null si invalide (pas de pays detectable, format casse, etc.).
 *
 * Par defaut on fixe le pays a 'FR' pour parser les numeros nationaux
 * (ex: '0612345678' → '+33612345678'). Si l'utilisateur passe deja un
 * format international ('+33612345678'), parsePhoneNumberFromString
 * l'utilise tel quel.
 */
export function normalizeToE164(input: string, defaultCountry: 'FR' = 'FR'): string | null {
  if (typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed) return null

  try {
    const parsed = parsePhoneNumberFromString(trimmed, defaultCountry)
    if (!parsed) return null
    if (!parsed.isValid()) return null
    return parsed.number // E.164 standard : +33612345678
  } catch {
    return null
  }
}

/**
 * Indique si une chaine est deja en E.164 valide (sans tentative de parsing
 * national). Utile pour les inputs serveur qui doivent etre stricts.
 */
export function isValidE164(input: string): boolean {
  if (typeof input !== 'string') return false
  if (!input.startsWith('+')) return false
  const parsed = parsePhoneNumberFromString(input)
  return parsed?.isValid() === true && parsed.number === input
}
