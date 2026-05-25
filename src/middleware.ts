// STANDBY 2026-05-23 : coaching + vetements masques, redirect 301 vers /products
// L5 2026-05-XX : protection /staff/* (auth Supabase Auth obligatoire,
// vrai check en haut du Server Component via requireStaff())
// 2026-05-25 : redirect 301 /account/coaching/* vers /account (onglet
// coaching retire de la nav, on rend les sous-pages inatteignables visuellement
// sans toucher au code parke STANDBY)
import { NextRequest, NextResponse } from 'next/server'

const NUTRITION_PROTECTED_PATHS = ['/account']
const STAFF_PROTECTED_PATHS = ['/staff']
const NUTRITION_LOGIN_PATH = '/login'
const STAFF_LOGIN_PATH = '/staff/login'
const NUTRITION_TOKEN_COOKIE = 'body-start-customer-token'
const SUPABASE_AUTH_COOKIE_PREFIX = 'sb-' // les cookies @supabase/ssr commencent par sb-{projectRef}-

// Routes mises en standby : redirect permanent vers /products
const STANDBY_PATHS = ['/coaching', '/vetements']

// Sous-routes /account/coaching/* en standby : redirect 301 vers /account
const ACCOUNT_COACHING_PREFIX = '/account/coaching'

function hasSupabaseAuthCookie(req: NextRequest): boolean {
  // @supabase/ssr stocke la session dans 1 ou 2 cookies nommes
  // sb-{projectRef}-auth-token (+ optionnel -code-verifier).
  // On verifie juste la presence d'un cookie commencant par sb- avec "auth-token" dedans.
  // Le vrai check de validite + role staff est fait dans le Server Component
  // via requireStaff() (qui parse le JWT et lookup loyalty_staff).
  for (const cookie of req.cookies.getAll()) {
    if (cookie.name.startsWith(SUPABASE_AUTH_COOKIE_PREFIX) && cookie.name.includes('auth-token')) {
      return true
    }
  }
  return false
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ─── Redirection 301 standby (coaching + vetements) ───
  const isStandby = STANDBY_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  )
  if (isStandby) {
    const url = req.nextUrl.clone()
    url.pathname = '/products'
    url.search = ''
    return NextResponse.redirect(url, 301)
  }

  // ─── Redirection 301 /account/coaching/* vers /account (standby coaching) ───
  if (pathname === ACCOUNT_COACHING_PREFIX || pathname.startsWith(ACCOUNT_COACHING_PREFIX + '/')) {
    const url = req.nextUrl.clone()
    url.pathname = '/account'
    url.search = ''
    return NextResponse.redirect(url, 301)
  }

  // ─── Protection /staff/* via Supabase Auth ───
  const isStaffPath = STAFF_PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  )
  if (isStaffPath) {
    // /staff/login = whitelist (sinon boucle infinie)
    if (pathname === STAFF_LOGIN_PATH) {
      return NextResponse.next()
    }
    if (!hasSupabaseAuthCookie(req)) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = STAFF_LOGIN_PATH
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
    // Cookie present → on laisse passer. Le vrai check (validite JWT + loyalty_staff
    // actif) se fait dans le Server Component via requireStaff().
    return NextResponse.next()
  }

  // ─── Protection /account/* via cookie Shopify (existant) ───
  const isNutritionProtected = NUTRITION_PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  )
  if (!isNutritionProtected) return NextResponse.next()

  const token = req.cookies.get(NUTRITION_TOKEN_COOKIE)?.value
  if (!token) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = NUTRITION_LOGIN_PATH
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/account/:path*',
    '/coaching/:path*',
    '/coaching',
    '/vetements/:path*',
    '/vetements',
    '/staff/:path*',
    '/staff',
  ],
}
