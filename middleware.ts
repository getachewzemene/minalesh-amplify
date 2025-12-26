import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n'

const ADMIN_PREFIX = '/admin'
const VENDOR_PREFIX = '/vendor'
const AUTH_COOKIE = 'auth_token'

// Create i18n middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
})

async function verifyJWT(token: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-key-change-in-production')
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as { userId?: string; email?: string; role?: string }
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Handle i18n for non-auth routes
  const isAdminRoute = pathname.startsWith(ADMIN_PREFIX)
  const isVendorRoute = pathname.startsWith(VENDOR_PREFIX)
  const isAdminLogin = pathname === '/admin/login'

  // Apply i18n middleware first for non-protected routes
  if (!isAdminRoute && !isVendorRoute) {
    return intlMiddleware(req)
  }

  // Allow access to admin login page without authentication
  if (isAdminLogin) return NextResponse.next()

  const token = req.cookies.get(AUTH_COOKIE)?.value
  if (!token) {
    const loginUrl = isAdminRoute 
      ? new URL('/admin/login', req.url)
      : new URL('/auth/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const payload = await verifyJWT(token)
  if (!payload?.role) {
    const loginUrl = isAdminRoute 
      ? new URL('/admin/login', req.url)
      : new URL('/auth/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = String(payload.role)
  if (isAdminRoute && role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url))
  }
  if (isVendorRoute && !(role === 'vendor' || role === 'admin')) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
