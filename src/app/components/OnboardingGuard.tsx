"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useOnboarding } from '@/hooks/useOnboarding';
import { InlineSpinner, AppShellSkeleton } from '@/app/components/ui/loading-spinner';

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

  // Pre-shell loader: AppShellSkeleton fakes a sidebar + content area so the
  // page doesn't jump when the real shell mounts.
  if (isChecking || (isLoaded && user && !shouldSkipOnboarding && isLoading)) {
    return <AppShellSkeleton />;
  }

  if (isLoaded && user && !shouldSkipOnboarding && !isLoading && shouldShowOnboarding && !pathname.startsWith('/onboarding')) {
    return <AppShellSkeleton text="Redirecting to onboarding…" />;
  }

  return <>{children}</>;
}
