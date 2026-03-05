import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // API routes: return 401 JSON instead of redirecting to login
    if (pathname.startsWith('/api/')) {
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.next()
    }

    // Page routes: redirect to login if unauthenticated
    if (!token && pathname !== '/login' && pathname !== '/unauthorized') {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Redirect authenticated users away from login
    if (token && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Security headers on all page responses
    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co"
    )
    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        // Always let the middleware function handle auth logic for these paths
        if (pathname === '/login' || pathname === '/unauthorized') return true
        // Allow through to middleware function for API routes (handled above)
        if (pathname.startsWith('/api/auth/')) return true
        return !!token
      },
    },
  }
)

export const config = {
  // Protect both pages and API routes; exclude Next.js internals and static files
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.jpg).*)',
  ],
}
