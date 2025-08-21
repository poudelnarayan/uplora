import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define which routes should be protected (only API routes)
const isProtectedRoute = createRouteMatcher([
  '/api/teams(.*)',
  '/api/videos(.*)',
  '/api/s3(.*)',
  '/api/events(.*)',
  '/api/youtube(.*)',
  '/api/uploads(.*)',
]);

export default clerkMiddleware((auth, req) => {
  // Protect routes that match our patterns
  if (isProtectedRoute(req)) {
    const { userId } = auth();
    if (!userId) {
      const pathname = req.nextUrl.pathname || '/';
      const isApi = pathname.startsWith('/api/');

      if (isApi) {
        return NextResponse.json(
          { ok: false, code: 'UNAUTHORIZED', message: 'Authentication required' },
          { status: 401 }
        );
      }

      // Redirect only for pages
      const signInUrl = new URL('/sign-in', req.url);
      // Preserve where the user was trying to go
      const redirectTarget = req.nextUrl.pathname + (req.nextUrl.search || '');
      signInUrl.searchParams.set('redirect_url', redirectTarget);
      return NextResponse.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
