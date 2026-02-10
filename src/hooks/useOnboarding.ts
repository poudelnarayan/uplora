"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export function useOnboarding() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState<boolean | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [onboardingSkipped, setOnboardingSkipped] = useState(false);
  const [onboardingSeenAt, setOnboardingSeenAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/user/onboarding-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const shouldShow = Boolean(data.shouldShowOnboarding);
        setShouldShowOnboarding(shouldShow);
        setOnboardingCompleted(Boolean(data.onboardingCompleted));
        setOnboardingSkipped(Boolean(data.onboardingSkipped));
        setOnboardingSeenAt(data.onboardingSeenAt ?? null);
      } else {
        // On error, assume they need onboarding (safer default)
        setShouldShowOnboarding(true);
      }
    } catch (error) {
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
      setOnboardingCompleted(false);
      setOnboardingSkipped(false);
      setOnboardingSeenAt(null);
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
      setOnboardingSeenAt(new Date().toISOString());
    } catch {
      // best-effort
    }
  };

  const redirectToOnboarding = () => {
    router.push('/onboarding');
  };

  const completeOnboarding = async () => {
    const response = await fetch('/api/user/onboarding-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete' }),
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        (responseData as any)?.error || 'Failed to mark onboarding completed'
      );
    }

    setShouldShowOnboarding(false);
    setOnboardingCompleted(true);
    setOnboardingSkipped(false);
    return responseData;
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
        (responseData as any)?.error || 'Failed to skip onboarding'
      );
    }

    setShouldShowOnboarding(false);
    setOnboardingSkipped(true);
    setOnboardingCompleted(false);
    return responseData;
  };

  return {
    shouldShowOnboarding,
    redirectToOnboarding,
    completeOnboarding,
    skipOnboarding,
    markOnboardingSeen,
    isLoading,
    onboardingCompleted,
    onboardingSkipped,
    onboardingSeenAt,
    refresh: checkOnboardingStatus
  };
}
