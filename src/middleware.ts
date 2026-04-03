import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_PATHS = ['/account']
const LOGIN_PATH = '/login'
const TOKEN_COOKIE = 'body-start-customer-token'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  )

  if (!isProtected) return NextResponse.next()

  // Vérifier le token dans les cookies
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
  matcher: ['/account/:path*'],
}
