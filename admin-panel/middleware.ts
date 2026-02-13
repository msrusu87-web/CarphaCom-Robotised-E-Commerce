import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
// Skip API routes, static files, and manifest
    if (pathname.startsWith('/app/api') || 
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname === '/manifest.json' ||
        pathname === '/app/manifest.json' ||
        pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|json|woff|woff2|ttf|html)$/)) {
    return NextResponse.next()
  }
  
  console.log(`[MIDDLEWARE] Path: ${pathname}`)

  // Login page is always public
  if (pathname === "/app/login" || pathname === "/login") {
    console.log(`[MIDDLEWARE] Public: login`)
    return NextResponse.next()
  }

  // Check session cookie
  const sessionCookie = request.cookies.get("admin_session")
  
  // Parse session if exists
  let sessionData = null
  if (sessionCookie) {
    try {
      sessionData = JSON.parse(sessionCookie.value)
      if (!sessionData.userId || !sessionData.email) {
        sessionData = null
      }
    } catch {
      sessionData = null
    }
  }

  // /app root - handle both authenticated and unauthenticated
  if (pathname === "/app" || pathname === "/app/") {
    if (!sessionData) {
      console.log(`[MIDDLEWARE] /app root - no auth - redirect to login`)
      const response = NextResponse.redirect(new URL("/app/login", request.url))
      // FORCE NO CACHE - prevent browser from caching redirect
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      return response
    }
    console.log(`[MIDDLEWARE] /app root - authenticated - redirect to dashboard`)
    const response = NextResponse.redirect(new URL("/app/dashboard", request.url))
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  }

  // ALL OTHER ROUTES require authentication
  if (!sessionData) {
    console.log(`[MIDDLEWARE] No session - redirect to login`)
    const loginUrl = new URL("/app/login", request.url)
    loginUrl.searchParams.set("redirect", pathname.replace('/app', ''))
    const response = NextResponse.redirect(loginUrl)
    // FORCE NO CACHE - critical security
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  }

  // RBAC - Role-based access control
  const userRole = sessionData.role || 'customer'
  const isCustomerRoute = pathname.includes('/customer')
  
  console.log(`[MIDDLEWARE] User: ${sessionData.email} (${userRole})`)
  
  if (!isCustomerRoute && userRole !== 'admin') {
    console.log(`[MIDDLEWARE] ❌ Customer blocked from admin routes`)
    const response = NextResponse.redirect(new URL("/app/customer", request.url))
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    return response
  }

  console.log(`[MIDDLEWARE] ✅ Access granted`)
  
  // Add cache headers to protected pages too
  const response = NextResponse.next()
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
