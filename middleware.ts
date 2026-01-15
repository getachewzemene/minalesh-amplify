import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/navigation'
import { locales, defaultLocale, isValidLocale, type Locale } from '@/i18n/config'

const ADMIN_PREFIX = '/admin'
const VENDOR_PREFIX = '/vendor'
const VENDOR_STORE_PREFIX = '/vendor/store' // Public vendor store pages
const AUTH_COOKIE = 'auth_token'
const LANGUAGE_COOKIE = 'preferred_language'

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing)

async function verifyJWT(token: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-key-change-in-production')
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as { userId?: string; email?: string; role?: string }
  } catch {
    return null
  }
}

/**
 * Detect preferred language from browser's Accept-Language header
 */
function detectBrowserLanguage(request: NextRequest): Locale | null {
  const acceptLanguage = request.headers.get('accept-language')
  if (!acceptLanguage) return null
  
  // Parse Accept-Language header and find best match
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, qValue] = lang.trim().split(';q=')
      return {
        code: code.split('-')[0].toLowerCase(), // Get primary language code
        q: qValue ? parseFloat(qValue) : 1
      }
    })
    .sort((a, b) => b.q - a.q)
  
  // Find first matching locale
  for (const lang of languages) {
    if (isValidLocale(lang.code)) {
      return lang.code
    }
  }
  
  return null
}

/**
 * Get the pathname without locale prefix
 */
function getPathnameWithoutLocale(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return pathname.replace(`/${locale}`, '') || '/'
    }
  }
  return pathname
}

/**
 * Check if path is for admin routes (with or without locale prefix)
 */
function isAdminPath(pathname: string): boolean {
  const cleanPath = getPathnameWithoutLocale(pathname)
  return cleanPath.startsWith(ADMIN_PREFIX)
}

/**
 * Check if path is for vendor store routes (public)
 */
function isVendorStorePath(pathname: string): boolean {
  const cleanPath = getPathnameWithoutLocale(pathname)
  return cleanPath.startsWith(VENDOR_STORE_PREFIX)
}

/**
 * Check if path is for vendor routes (protected)
 */
function isVendorPath(pathname: string): boolean {
  const cleanPath = getPathnameWithoutLocale(pathname)
  return cleanPath.startsWith(VENDOR_PREFIX) && !cleanPath.startsWith(VENDOR_STORE_PREFIX)
}

/**
 * Check if path is admin login
 */
function isAdminLoginPath(pathname: string): boolean {
  const cleanPath = getPathnameWithoutLocale(pathname)
  return cleanPath === '/admin/login'
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Skip for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Static files
  ) {
    return NextResponse.next()
  }
  
  // Handle locale detection for first-time visitors
  const storedLanguage = req.cookies.get(LANGUAGE_COOKIE)?.value
  const currentLocaleFromPath = locales.find(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  
  // If no locale in URL and no stored preference, detect from browser
  if (!currentLocaleFromPath && !storedLanguage) {
    const detectedLocale = detectBrowserLanguage(req)
    if (detectedLocale && detectedLocale !== defaultLocale) {
      // Redirect to detected locale
      const newUrl = new URL(`/${detectedLocale}${pathname}`, req.url)
      const response = NextResponse.redirect(newUrl)
      // Store the preference
      response.cookies.set(LANGUAGE_COOKIE, detectedLocale, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      })
      return response
    }
  }
  
  const isAdminRoute = isAdminPath(pathname)
  const isVendorStoreRoute = isVendorStorePath(pathname)
  const isVendorRoute = isVendorPath(pathname)
  const isAdminLogin = isAdminLoginPath(pathname)

  // Allow vendor store pages to be accessed publicly (customer-facing)
  if (isVendorStoreRoute) {
    return intlMiddleware(req)
  }

  // Allow non-authentication-required routes to pass through to intl middleware
  if (!isAdminRoute && !isVendorRoute) {
    return intlMiddleware(req)
  }

  // Allow access to admin login page without authentication
  if (isAdminLogin) return intlMiddleware(req)

  const token = req.cookies.get(AUTH_COOKIE)?.value
  if (!token) {
    const cleanPath = getPathnameWithoutLocale(pathname)
    const loginUrl = isAdminRoute 
      ? new URL('/admin/login', req.url)
      : new URL('/auth/login', req.url)
    loginUrl.searchParams.set('next', cleanPath)
    return NextResponse.redirect(loginUrl)
  }

  const payload = await verifyJWT(token)
  if (!payload?.role) {
    const cleanPath = getPathnameWithoutLocale(pathname)
    const loginUrl = isAdminRoute 
      ? new URL('/admin/login', req.url)
      : new URL('/auth/login', req.url)
    loginUrl.searchParams.set('next', cleanPath)
    return NextResponse.redirect(loginUrl)
  }

  const role = String(payload.role)
  if (isAdminRoute && role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url))
  }
  if (isVendorRoute && !(role === 'vendor' || role === 'admin')) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return intlMiddleware(req)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
