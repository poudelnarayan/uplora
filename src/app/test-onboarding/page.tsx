"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InlineSpinner } from '@/components/ui/loading-spinner';

export default function TestOnboardingPage() {
  const { user, isLoaded } = useUser();
  const [onboardingStatus, setOnboardingStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkOnboardingStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user/onboarding-status');
      const data = await response.json();
      setOnboardingStatus(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markOnboardingComplete = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user/onboarding-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingCompleted: true }),
      });
      const data = await response.json();
      setOnboardingStatus(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markOnboardingIncomplete = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user/onboarding-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingCompleted: false }),
      });
      const data = await response.json();
      setOnboardingStatus(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      checkOnboardingStatus();
    }
  }, [isLoaded, user]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <InlineSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p>Please sign in to test onboarding</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Onboarding Status Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">User Info:</h3>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}</p>
            <p><strong>Name:</strong> {user.fullName}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Onboarding Status:</h3>
            {loading ? (
              <InlineSpinner size="sm" />
            ) : onboardingStatus ? (
              <div className="space-y-2">
                <p><strong>Completed:</strong> {onboardingStatus.onboardingCompleted ? 'Yes' : 'No'}</p>
                {onboardingStatus.error && (
                  <p className="text-red-600"><strong>Error:</strong> {onboardingStatus.error}</p>
                )}
              </div>
            ) : (
              <p>No data</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-600"><strong>Error:</strong> {error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={checkOnboardingStatus} disabled={loading}>
              {loading ? <InlineSpinner size="sm" /> : null}
              Check Status
            </Button>
            <Button onClick={markOnboardingComplete} disabled={loading} variant="outline">
              Mark Complete
            </Button>
            <Button onClick={markOnboardingIncomplete} disabled={loading} variant="outline">
              Mark Incomplete
            </Button>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Raw API Response:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(onboardingStatus, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
