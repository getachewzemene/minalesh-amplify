import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const ADMIN_PREFIX = '/admin'
const VENDOR_PREFIX = '/vendor'
const VENDOR_STORE_PREFIX = '/vendor/store' // Public vendor store pages
const AUTH_COOKIE = 'auth_token'
const LANGUAGE_COOKIE = 'preferred_language'

// Supported locales
const locales = ['en', 'am', 'om', 'ti'] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = 'en';

function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

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
      const parsedQ = qValue ? parseFloat(qValue) : 1
      return {
        code: code.split('-')[0].toLowerCase(), // Get primary language code
        q: !isNaN(parsedQ) ? parsedQ : 1 // Fallback to 1 if parsing fails
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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  const isAdminRoute = pathname.startsWith(ADMIN_PREFIX)
  const isVendorStoreRoute = pathname.startsWith(VENDOR_STORE_PREFIX)
  const isVendorRoute = pathname.startsWith(VENDOR_PREFIX) && !isVendorStoreRoute
  const isAdminLogin = pathname === '/admin/login'
  
  // Set language cookie based on browser preference if not set
  const response = NextResponse.next()
  const existingLanguage = req.cookies.get(LANGUAGE_COOKIE)?.value
  
  if (!existingLanguage) {
    const detectedLocale = detectBrowserLanguage(req)
    if (detectedLocale) {
      response.cookies.set(LANGUAGE_COOKIE, detectedLocale, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      })
    }
  }

  // Allow vendor store pages to be accessed publicly (customer-facing)
  if (isVendorStoreRoute) {
    return response
  }

  // Allow non-authentication-required routes to pass through
  if (!isAdminRoute && !isVendorRoute) {
    return response
  }

  // Allow access to admin login page without authentication
  if (isAdminLogin) return response

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

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
