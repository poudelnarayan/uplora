"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface OnboardingData {
  role?: string;
  goal?: string;
  teamSize?: string;
}

export function useOnboarding() {
  const { user, isLoaded } = useUser();
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState<boolean | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [onboardingSkipped, setOnboardingSkipped] = useState(false);
  const [onboardingSeenAt, setOnboardingSeenAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/user/onboarding-status');
      if (response.ok) {
        const data = await response.json();
        setShouldShowOnboarding(Boolean(data.shouldShowOnboarding));
        setOnboardingCompleted(Boolean(data.onboardingCompleted));
        setOnboardingSkipped(Boolean(data.onboardingSkipped));
        setOnboardingSeenAt(data.onboardingSeenAt ?? null);
      } else {
        setShouldShowOnboarding(true);
      }
    } catch {
      setShouldShowOnboarding(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) {
      setIsLoading(true);
      return;
    }
    if (!user) {
      setIsLoading(false);
      setShouldShowOnboarding(false);
      return;
    }
    checkOnboardingStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isLoaded]);

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

  const completeOnboarding = async (data?: OnboardingData) => {
    const response = await fetch('/api/user/onboarding-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', ...data }),
    });

    const responseData = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error((responseData as any)?.error || 'Failed to complete onboarding');
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
      throw new Error((responseData as any)?.error || 'Failed to skip onboarding');
    }

    setShouldShowOnboarding(false);
    setOnboardingSkipped(true);
    setOnboardingCompleted(false);
    return responseData;
  };

  return {
    shouldShowOnboarding,
    completeOnboarding,
    skipOnboarding,
    markOnboardingSeen,
    isLoading,
    onboardingCompleted,
    onboardingSkipped,
    onboardingSeenAt,
    refresh: checkOnboardingStatus,
  };
}
