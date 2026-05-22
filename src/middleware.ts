// STANDBY 2026-05-23 : coaching + vetements masques, redirect 301 vers /products
// (cf. tech-specs/site-rewrite-copy-v1.md §7.4 + §3.8 + brief recentrage)
import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_PATHS = ['/account']
const LOGIN_PATH = '/login'
const TOKEN_COOKIE = 'body-start-customer-token'

// Routes mises en standby : redirect permanent vers /products
const STANDBY_PATHS = ['/coaching', '/vetements']

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

  // ─── Protection /account/* via cookie Shopify ───
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
  matcher: ['/account/:path*', '/coaching/:path*', '/coaching', '/vetements/:path*', '/vetements'],
}
