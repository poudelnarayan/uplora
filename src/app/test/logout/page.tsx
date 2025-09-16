"use client";

import { useEffect } from "react";
import { useClerk, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function TestLogoutPage() {
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Check if user is actually signed in before attempting logout
        if (!isSignedIn) {
          console.log("User not signed in, redirecting to home");
          router.push("/");
          return;
        }

        console.log("Performing automatic logout...");
        
        // Use signOut with immediate redirect to avoid cookies context issues
        await signOut({
          redirectUrl: "/",
        });
        
      } catch (error) {
        console.error("Logout error:", error);
        
        // Fallback: force redirect to home page
        window.location.href = "/";
      }
    };

    // Small delay to show the loading state briefly
    const timer = setTimeout(performLogout, 800);
    
    return () => clearTimeout(timer);
  }, [signOut, router, isSignedIn]);

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