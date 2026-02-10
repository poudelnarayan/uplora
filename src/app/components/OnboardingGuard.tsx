"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useOnboarding } from '@/hooks/useOnboarding';
import { InlineSpinner } from '@/app/components/ui/loading-spinner';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, isLoaded } = useUser();
  const { shouldShowOnboarding, isLoading } = useOnboarding();
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // Pages that should NEVER trigger onboarding redirect
  const skipOnboardingPages = [
    '/onboarding',
    '/sign-in',
    '/sign-up',
    '/', // Landing page should never redirect
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/copyright',
    '/invite', // Invitation pages
    '/social', // Allow connecting accounts during onboarding
    '/test-supabase' // Test pages
  ];

  const shouldSkipOnboarding = skipOnboardingPages.some(page =>
    pathname === page || pathname.startsWith(page + '/')
  );

  useEffect(() => {
    // Don't check onboarding for unauthenticated users or excluded pages
    if (!isLoaded || !user || shouldSkipOnboarding) {
      setIsChecking(false);
      return;
    }

    // If we're checking onboarding and it's not loading, we're done
    if (!isLoading) {
      setIsChecking(false);
    }
  }, [isLoaded, user, shouldSkipOnboarding, isLoading]);

  // Redirect in an effect to avoid push() during render (prevents loops/jank)
  useEffect(() => {
    if (!isLoaded || !user) return;
    if (shouldSkipOnboarding) return;
    if (isLoading) return;
    // Only redirect if shouldShowOnboarding is explicitly true (not null or false)
    if (shouldShowOnboarding !== true) return;
    if (pathname.startsWith('/onboarding')) return;

    router.push('/onboarding');
  }, [isLoaded, user, shouldSkipOnboarding, isLoading, shouldShowOnboarding, pathname, router]);

  // Show loading spinner while checking (only for authenticated users on protected pages)
  if (isChecking || (isLoaded && user && !shouldSkipOnboarding && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <InlineSpinner size="md" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Only redirect to onboarding if:
  // 1. User is authenticated
  // 2. Not on an excluded page
  // 3. Onboarding is not completed
  // 4. Not already on onboarding page
  if (isLoaded && user && !shouldSkipOnboarding && !isLoading && shouldShowOnboarding && !pathname.startsWith('/onboarding')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <InlineSpinner size="md" />
          <p className="mt-4 text-muted-foreground">Redirecting to onboarding...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
