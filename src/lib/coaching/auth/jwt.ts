/**
 * Signature de JWTs compatibles avec Supabase Auth.
 *
 * Supabase RLS attend ces claims standards :
 *   - sub : profile.id (UUID)
 *   - role : 'authenticated' (lit auth.uid() depuis sub)
 *   - aud : 'authenticated'
 *   - email : email du user
 *   - exp, iat
 *
 * On signe avec HS256 + SUPABASE_JWT_SECRET (la même clé secrète que
 * Supabase utilise pour signer ses propres tokens, accessible via
 * Settings > API > JWT Settings).
 *
 * ⚠️ Ce module utilise SUPABASE_JWT_SECRET qui est privé : ne JAMAIS
 * importer ce fichier depuis un Client Component.
 */
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60       // 1h
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 // 24h

function getSecretKey(): Uint8Array {
  if (!JWT_SECRET) {
    throw new Error(
      '[Coaching JWT] SUPABASE_JWT_SECRET manquant. Vérifie .env.local. ' +
        'Récupère la valeur dans Supabase Dashboard > Settings > API > JWT Settings > JWT Secret.'
    )
  }
  // Le JWT secret Supabase est en base64 standard. jose attend des bytes raw.
  return new TextEncoder().encode(JWT_SECRET)
}

export interface CoachingJwtClaims {
  sub: string                  // profile.id
  email: string
  role: 'authenticated'        // rôle Postgres
  aud: 'authenticated'
  app_role?: 'client' | 'admin' // notre propre rôle métier (différent du rôle PG)
}

/**
 * Signe un access_token (1h) — utilisé par les requêtes Supabase pour
 * authentifier le user via RLS.
 */
export async function signAccessToken(claims: CoachingJwtClaims): Promise<string> {
  return await new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .setSubject(claims.sub)
    .setAudience(claims.aud)
    .sign(getSecretKey())
}

/**
 * Signe un refresh_token (24h) — utilisé pour ré-émettre un access_token
 * sans repasser par Shopify. Notre bridge l'accepte aussi en input.
 */
export async function signRefreshToken(claims: Pick<CoachingJwtClaims, 'sub' | 'email'>): Promise<string> {
  return await new SignJWT({
    sub: claims.sub,
    email: claims.email,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_TTL_SECONDS}s`)
    .setSubject(claims.sub)
    .sign(getSecretKey())
}

/**
 * Vérifie un JWT et retourne ses claims. Throw si invalide/expiré.
 */
export async function verifyToken(token: string): Promise<CoachingJwtClaims & { iat: number; exp: number }> {
  const { payload } = await jwtVerify(token, getSecretKey())
  return payload as unknown as CoachingJwtClaims & { iat: number; exp: number }
}

export { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS }
