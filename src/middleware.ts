/**
 * Middleware Next.js — protection des routes nécessitant un compte client.
 *
 * Niveau 1 (rapide, edge runtime) : vérifie la PRÉSENCE du cookie Shopify.
 * - Si absent sur /account/* ou /admin/* → redirect vers /login
 *
 * Niveau 2 (vrai check role admin) : effectué côté server component dans
 *   src/app/(admin)/layout.tsx qui interroge Supabase pour vérifier que
 *   le user authentifié a bien `profiles.role = 'admin'`.
 *
 * Pourquoi 2 niveaux : le middleware tourne sur l'edge avec un runtime
 * limité — on n'y vérifie pas le JWT Supabase complet (lourd, nécessite
 * jose + appel DB potentiel). On laisse le layout admin faire la vérif réelle.
 */
import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_PATHS = ['/account', '/admin']
const LOGIN_PATH = '/login'
const TOKEN_COOKIE = 'body-start-customer-token'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  )

  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get(TOKEN_COOKIE)?.value

  if (!token) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = LOGIN_PATH
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*'],
}
