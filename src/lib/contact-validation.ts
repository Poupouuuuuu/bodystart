// Validation des demandes de /api/contact (« Être rappelé » du guide /conseil).
// Depuis le 08/10/2026 l'e-mail est facultatif : prénom, objectif et un moyen
// de recontacter (téléphone, sinon e-mail) suffisent. Pur, testé.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface DemandeContact {
  name: string
  email: string | null
  phone: string | null
  objectif: string
  message: string
}

const texte = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

/** Demande nettoyée, ou null si elle est incomplète ou mal formée. */
export function validerContact(body: unknown): DemandeContact | null {
  const b = (body ?? {}) as Record<string, unknown>
  const name = texte(b.name)
  const objectif = texte(b.objectif)
  const email = texte(b.email)
  const phone = texte(b.phone)
  if (!name || !objectif) return null
  // Un e-mail saisi doit être valide ; un téléphone, compter au moins 9 chiffres.
  if (email && !EMAIL_RE.test(email)) return null
  if (phone && phone.replace(/\D/g, '').length < 9) return null
  if (!email && !phone) return null
  return { name, objectif, email: email || null, phone: phone || null, message: texte(b.message) }
}
