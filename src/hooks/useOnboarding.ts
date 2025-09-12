"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export function useOnboarding() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState<boolean | null>(null);

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
        const onboardingCompleted = data.onboardingCompleted;
        
        console.log('📊 Onboarding status from database:', onboardingCompleted);
        
        if (!onboardingCompleted) {
          console.log('➡️ User needs to complete onboarding, redirecting...');
          setShouldShowOnboarding(true);
          // Only redirect if not already on onboarding page
          if (!pathname.startsWith('/onboarding')) {
            router.push('/onboarding/welcome');
          }
        } else {
          console.log('✅ User has completed onboarding');
          setShouldShowOnboarding(false);
        }
      } else {
        console.error('❌ Failed to fetch onboarding status');
        // Fallback: assume they need onboarding
        setShouldShowOnboarding(true);
        if (!pathname.startsWith('/onboarding')) {
          router.push('/onboarding/welcome');
        }
      }
    } catch (error) {
      console.error('❌ Error checking onboarding status:', error);
      // Fallback: assume they need onboarding
      setShouldShowOnboarding(true);
      if (!pathname.startsWith('/onboarding')) {
        router.push('/onboarding/welcome');
      }
    }
  };

  useEffect(() => {
    if (!isLoaded || !user) return;

    checkOnboardingStatus();
  }, [user, isLoaded]); // Removed router from dependencies to prevent loop

  const redirectToOnboarding = () => {
    router.push('/onboarding/welcome');
  };

  const completeOnboarding = async () => {
    try {
      console.log('🔄 Starting onboarding completion...');
      const response = await fetch('/api/user/onboarding-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ onboardingCompleted: true }),
      });
      
      const responseData = await response.json();
      console.log('📡 API Response:', responseData);
      
      if (response.ok) {
        console.log('✅ Onboarding marked as completed in database');
        setShouldShowOnboarding(false);
        // Add a small delay to ensure state is updated
        setTimeout(() => {
          router.push('/dashboard');
        }, 100);
      } else {
        console.error('❌ Failed to update onboarding status:', responseData);
        // Still redirect to dashboard
        setShouldShowOnboarding(false);
        setTimeout(() => {
          router.push('/dashboard');
        }, 100);
      }
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      // Still redirect to dashboard
      setShouldShowOnboarding(false);
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);
    }
  };

  return {
    shouldShowOnboarding,
    redirectToOnboarding,
    completeOnboarding,
    isLoading: shouldShowOnboarding === null
  };
}
