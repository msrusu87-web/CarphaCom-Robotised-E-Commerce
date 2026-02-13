import { NextRequest, NextResponse } from 'next/server'

// Admin authentication middleware for development mode
export function middleware(request: NextRequest) {
  // Skip auth for API routes, static files, and images
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/images') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check for admin auth cookie
  const authCookie = request.cookies.get('admin_dev_auth')
  
  // Check for HTTP Basic Auth header
  const authHeader = request.headers.get('authorization')
  
  if (authCookie?.value === 'authenticated' || authHeader) {
    // Parse basic auth if present
    if (authHeader) {
      const auth = Buffer.from(authHeader.split(' ')[1] || '', 'base64').toString()
      const [username, password] = auth.split(':')
      
      if (username === 'admin' && password === 'CarphaDev2026!') {
        const response = NextResponse.next()
        // Set persistent auth cookie
        response.cookies.set('admin_dev_auth', 'authenticated', {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        })
        return response
      }
    } else {
      return NextResponse.next()
    }
  }

  // Return 401 with WWW-Authenticate header for browser to show login prompt
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Development Mode - Admin Only", charset="UTF-8"'
    }
  })
}

// Apply middleware to all routes except excluded ones
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (already handled above)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
