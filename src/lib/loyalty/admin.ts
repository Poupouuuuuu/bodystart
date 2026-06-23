/**
 * Contrôle d'accès ADMIN (gestion des ambassadeurs) + helpers code.
 *
 * Sécurité (cf. plan) : l'identité vient de resolveLoyaltyForSession() →
 * cookie httpOnly vérifié côté Shopify → email AUTHENTIFIÉ côté serveur.
 * L'autorisation = allowlist d'emails UNIQUEMENT serveur (env ADMIN_EMAILS +
 * défaut codé en dur). requireAdmin() est appelé en TÊTE de chaque route admin :
 * un client ne peut ni falsifier son email (cookie httpOnly non forgeable) ni
 * contourner le gate (re-vérifié serveur à chaque appel, l'UI n'a aucune autorité).
 */
import { resolveLoyaltyForSession } from './session'

/** Admin par défaut (marche sans config). Étendable via env ADMIN_EMAILS (CSV). */
const DEFAULT_ADMIN_EMAILS = ['bodystartnutrition@gmail.com']

/** Allowlist effective (défaut ∪ env), en lowercase. */
function adminAllowlist(): Set<string> {
  const fromEnv = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return new Set([...DEFAULT_ADMIN_EMAILS.map((s) => s.toLowerCase()), ...fromEnv])
}

/** Pur : l'email est-il admin ? (insensible à la casse/espaces). */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return adminAllowlist().has(email.trim().toLowerCase())
}

export type AdminGate = { ok: true; email: string } | { ok: false; status: 401 | 403 }

/**
 * À appeler en PREMIÈRE LIGNE de chaque route admin.
 *   - pas de session valide → 401 (logged_out)
 *   - session valide mais email non-admin → 403
 *   - sinon → { ok, email }
 */
export async function requireAdmin(): Promise<AdminGate> {
  const session = await resolveLoyaltyForSession()
  if (session.state === 'logged_out') return { ok: false, status: 401 }
  const email = session.shopify.email
  if (!isAdminEmail(email)) return { ok: false, status: 403 }
  return { ok: true, email }
}

// ── Helpers code ambassadeur (purs, testables) ──

/** Normalise un code : sans accents, MAJUSCULES, A-Z0-9 uniquement (sans espaces). */
export function normalizeAmbassadorCode(raw: string): string {
  return (raw ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

/**
 * Code auto depuis le nom : prénom (1er mot) en MAJUSCULES, sans espaces/accents.
 * Replis : nom complet normalisé, sinon 'AMBASSADEUR'. (L'unicité est gérée par
 * l'appelant via un suffixe numérique.)
 */
export function ambassadorCodeFromName(name: string): string {
  const firstToken = (name ?? '').trim().split(/\s+/)[0] ?? ''
  const base = normalizeAmbassadorCode(firstToken)
  if (base.length >= 2) return base
  const full = normalizeAmbassadorCode(name)
  return full.length >= 2 ? full : 'AMBASSADEUR'
}

/**
 * Renvoie `base` si libre, sinon `base2`, `base3`… (1er libre vs un set de codes
 * déjà pris, comparés en normalisé). Pur.
 */
export function withUniquenessSuffix(base: string, takenNormalized: Set<string>): string {
  if (!takenNormalized.has(base)) return base
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}${i}`
    if (!takenNormalized.has(candidate)) return candidate
  }
  // Garde-fou (improbable : 1000 codes de même base) : suffixe aléatoire.
  return `${base}${Math.floor(Math.random() * 9000 + 1000)}`
}
