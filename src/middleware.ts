import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Temporarily disable Clerk middleware until valid keys are configured
export default function middleware(request: NextRequest) {
  // Check if Clerk is properly configured
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasValidClerkKey = clerkPublishableKey && 
    clerkPublishableKey !== 'pk_test_your-publishable-key-here' && 
    clerkPublishableKey.startsWith('pk_');

  if (!hasValidClerkKey) {
    // Allow all requests when Clerk is not configured
    return NextResponse.next();
  }

  // When Clerk is configured, you can re-enable the middleware
  // For now, allow all requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
