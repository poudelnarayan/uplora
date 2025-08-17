import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Separate function to handle admin subdomain routing
function handleAdminSubdomain(req: any) {
  const { pathname, host } = req.nextUrl;
  
  // Check if this is an admin subdomain
  const isAdminSubdomain = host.startsWith('admin.');
  
  if (isAdminSubdomain) {
    // For admin subdomain, only redirect root to admin-login
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/admin-login', req.url));
    }
    
    // Allow all other admin routes to pass through
    return NextResponse.next();
  }
  
  return null; // Continue with normal middleware
}

export default withAuth(
  function middleware(req) {
    const { pathname, host } = req.nextUrl;
    const isAdminSubdomain = host.startsWith('admin.');
    
    // Handle admin subdomain first
    const adminResponse = handleAdminSubdomain(req);
    if (adminResponse) return adminResponse;
    
    // Main domain - block admin routes
    if (pathname.startsWith('/admin-login')) {
      return NextResponse.redirect(new URL('/signin', req.url));
    }
    
    // If the user is not authenticated and trying to access a protected route
    if (!req.nextauth.token) {
      // Redirect to our custom signin page instead of NextAuth default
      return NextResponse.redirect(new URL("/signin", req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname, host } = req.nextUrl;
        const isAdminSubdomain = host.startsWith('admin.');
        
        // For admin subdomain, let all routes pass through
        if (isAdminSubdomain) {
          return true;
        }
        
        // Main domain protected routes require token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    // Only protect specific routes, NOT the home page (/)
    "/dashboard/:path*",
    "/upload/:path*",
    "/teams/:path*",
    "/settings/:path*",
    "/videos/:path*",
    "/subscription/:path*",
  ],
};
