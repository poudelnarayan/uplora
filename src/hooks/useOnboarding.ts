"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export function useOnboarding() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to check onboarding status from database
  const checkOnboardingStatus = async () => {
    try {
      console.log('🔍 Checking onboarding status...');
      const response = await fetch('/api/user/onboarding-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const shouldShow = Boolean(data.shouldShowOnboarding);
        
        console.log('📊 Onboarding status from database:', data);
        
        setShouldShowOnboarding(shouldShow);
        
        if (shouldShow) {
          console.log('➡️ User needs to complete onboarding');
        } else {
          console.log('✅ User has completed onboarding');
        }
      } else {
        console.error('❌ Failed to fetch onboarding status');
        // On error, assume they need onboarding (safer default)
        setShouldShowOnboarding(true);
      }
    } catch (error) {
      console.error('❌ Error checking onboarding status:', error);
      // On error, assume they need onboarding (safer default)
      setShouldShowOnboarding(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded || !user) {
      setIsLoading(false);
      setShouldShowOnboarding(false);
      return;
    }

    checkOnboardingStatus();
  }, [user, isLoaded]);

  const markOnboardingSeen = async () => {
    try {
      await fetch('/api/user/onboarding-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seen' }),
      });
    } catch {
      // best-effort
    }
  };

  const redirectToOnboarding = () => {
    router.push('/onboarding/welcome');
  };

  const completeOnboarding = async () => {
    console.log('🔄 Starting onboarding completion...');
    const response = await fetch('/api/user/onboarding-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete' }),
    });

    const responseData = await response.json().catch(() => ({}));
    console.log('📡 API Response:', responseData);

    if (!response.ok) {
      throw new Error(
        (responseData as any)?.details?.message ||
          (responseData as any)?.error ||
          'Failed to mark onboarding completed'
      );
    }

    // Verify persistence (debugging + safety)
    const persisted = (responseData as any)?.persisted;
    if (!persisted?.onboardingCompleted) {
      throw new Error('Onboarding completion did not persist (onboardingCompleted is still false).');
    }

    setShouldShowOnboarding(false);
    router.replace('/dashboard');
  };

  const skipOnboarding = async () => {
    const response = await fetch('/api/user/onboarding-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'skip' }),
    });
    const responseData = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        (responseData as any)?.details?.message ||
          (responseData as any)?.error ||
          'Failed to skip onboarding'
      );
    }

    setShouldShowOnboarding(false);
    router.replace('/dashboard');
  };

  return {
    shouldShowOnboarding,
    redirectToOnboarding,
    completeOnboarding,
    skipOnboarding,
    markOnboardingSeen,
    isLoading
  };
}