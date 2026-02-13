/**
 * Admin Panel Middleware
 * Protects all admin routes - requires valid admin_session cookie
 * Supports role-based access: admin (full), support (limited), client (no admin access)
 * Public routes: /login, /api/admin/auth, /api/google/callback, /api/google/sync/cron
 */

import { NextRequest, NextResponse } from 'next/server'

// Routes that don't require authentication (relative to basePath /app)
const PUBLIC_PATHS = [
  '/login',
  '/api/admin/auth',
  '/api/google/callback',
  '/api/google/sync/cron',
]

// Role-based path restrictions
// Support role can only access these paths
const SUPPORT_ALLOWED_PATHS = [
  '/dashboard',
  '/magazin',
  '/facturare',
  '/api/',
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'))
}

function isSupportAllowed(pathname: string): boolean {
  return SUPPORT_ALLOWED_PATHS.some(p => pathname === p || pathname.startsWith(p))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Check for admin session cookie
  const sessionCookie = request.cookies.get('admin_session')

  if (!sessionCookie?.value) {
    // API routes return 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Not authenticated', message: 'Invalid session' },
        { status: 401 }
      )
    }
    // Page routes redirect to login
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify session data is valid JSON with required fields
  try {
    const session = JSON.parse(sessionCookie.value)
    if (!session.userId || !session.email) {
      throw new Error('Invalid session data')
    }

    // Check expiry
    const expiresCookie = request.cookies.get('admin_session_expires')
    if (expiresCookie?.value) {
      const expiresAt = new Date(expiresCookie.value)
      if (expiresAt < new Date()) {
        throw new Error('Session expired')
      }
    }

    // Role-based access control
    const role = session.role || 'admin'
    
    if (role === 'support' && !pathname.startsWith('/api/') && !isSupportAllowed(pathname)) {
      // Support users can only access allowed paths
      const dashUrl = request.nextUrl.clone()
      dashUrl.pathname = '/dashboard'
      return NextResponse.redirect(dashUrl)
    }
    
    if (role === 'client') {
      // Client role has no admin access at all
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'You do not have permission for this action' },
          { status: 403 }
        )
      }
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      return NextResponse.redirect(loginUrl)
    }
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Session expired', message: 'Session expired' },
        { status: 401 }
      )
    }
    const expiredUrl = request.nextUrl.clone()
    expiredUrl.pathname = '/login'
    const response = NextResponse.redirect(expiredUrl)
    response.cookies.delete('admin_session')
    response.cookies.delete('admin_session_expires')
    response.cookies.delete('medusa_token')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     */
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
}
