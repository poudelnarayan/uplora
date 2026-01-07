"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { InlineSpinner } from "@/app/components/ui/loading-spinner";

/**
 * Legacy route kept for backward compatibility.
 * Onboarding now uses a single plan step at `/onboarding/billing`.
 */
export default function SubscriptionOnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/onboarding/billing");
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-background">
      <div className="text-center">
        <InlineSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Redirecting…</p>
      </div>
    </div>
  );
}


