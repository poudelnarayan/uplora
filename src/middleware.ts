import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname, host } = req.nextUrl;
    
    // Check if this is an admin subdomain
    const isAdminSubdomain = host.startsWith('admin.');
    
    // Admin subdomain routing
    if (isAdminSubdomain) {
      // Allow admin routes
      if (pathname.startsWith('/admin') || pathname.startsWith('/admin-login')) {
        return NextResponse.next();
      }
      
      // Redirect root to admin login
      if (pathname === '/') {
        return NextResponse.redirect(new URL('/admin-login', req.url));
      }
      
      // Redirect all other routes to admin login
      return NextResponse.redirect(new URL('/admin-login', req.url));
    }
    
    // Main domain - block admin routes
    if (pathname.startsWith('/admin-login')) {
      return NextResponse.redirect(new URL('/signin', req.url));
    }
    
    // If the user is not authenticated and trying to access a protected route
    if (!req.nextauth.token) {
      return NextResponse.redirect(new URL("/signin", req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname, host } = req.nextUrl;
        const isAdminSubdomain = host.startsWith('admin.');
        
        // Admin routes require authentication
        if (isAdminSubdomain && (pathname.startsWith('/admin') || pathname.startsWith('/admin-login'))) {
          return true; // Let the route handle auth
        }
        
        // Main domain protected routes require token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
