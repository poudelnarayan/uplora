"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useOnboarding } from '@/hooks/useOnboarding';
import { InlineSpinner } from '@/components/ui/loading-spinner';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, isLoaded } = useUser();
  const { shouldShowOnboarding, isLoading } = useOnboarding();
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // Skip onboarding check for certain pages
  const skipOnboardingPages = [
    '/onboarding',
    '/sign-in',
    '/sign-up',
    '/',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/copyright'
  ];

  const shouldSkipOnboarding = skipOnboardingPages.some(page => 
    pathname.startsWith(page)
  );

  useEffect(() => {
    if (!isLoaded || !user || shouldSkipOnboarding) {
      setIsChecking(false);
      return;
    }

    // If we're checking onboarding and it's not loading, we're done
    if (!isLoading) {
      setIsChecking(false);
    }
  }, [isLoaded, user, shouldSkipOnboarding, isLoading]);

  // Show loading spinner while checking
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

  // If user needs onboarding and not on onboarding page, redirect
  if (isLoaded && user && shouldShowOnboarding && !shouldSkipOnboarding) {
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
