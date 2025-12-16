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

  // Show loading spinner while checking (only for authenticated users on protected pages)
  if (isChecking || (isLoaded && user && !shouldSkipOnboarding && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <InlineSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Only redirect to onboarding if:
  // 1. User is authenticated
  // 2. Not on an excluded page
  // 3. Onboarding is not completed
  // 4. Not already on onboarding page
  if (isLoaded && user && !shouldSkipOnboarding && shouldShowOnboarding && !pathname.startsWith('/onboarding')) {
    router.push('/onboarding/welcome');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <InlineSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirecting to onboarding...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}