"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function TestLogoutPage() {
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Automatically sign out without confirmation
        await signOut({
          redirectUrl: "/"
        });
      } catch (error) {
        console.error("Logout error:", error);
        // Fallback: redirect to home page
        router.push("/");
      }
    };

    // Small delay to show the loading state briefly
    const timer = setTimeout(performLogout, 500);
    
    return () => clearTimeout(timer);
  }, [signOut, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Signing you out...
          </h1>
          <p className="text-gray-600">
            Please wait while we log you out of your account.
          </p>
        </div>
      </div>
    </div>
  );
}