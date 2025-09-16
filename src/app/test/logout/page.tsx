"use client";

import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function TestLogoutPage() {
  const { signOut, loaded } = useClerk();
  const [status, setStatus] = useState<'loading' | 'signing-out' | 'complete'>('loading');

  useEffect(() => {
    // Wait for Clerk to be fully loaded before attempting logout
    if (!loaded) return;

    const performLogout = async () => {
      try {
        setStatus('signing-out');
        console.log("Performing automatic logout...");
        
        // Use the simplest possible signOut call
        await signOut();
        
        setStatus('complete');
        
        // Force redirect after a brief delay
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
        
      } catch (error) {
        console.error("Logout error:", error);
        
        // Immediate fallback redirect
        window.location.href = "/";
      }
    };

    // Small delay to ensure everything is loaded
    const timer = setTimeout(performLogout, 300);
    
    return () => clearTimeout(timer);
  }, [loaded, signOut]);

  const getMessage = () => {
    switch (status) {
      case 'loading':
        return "Preparing to sign out...";
      case 'signing-out':
        return "Signing you out...";
      case 'complete':
        return "Redirecting...";
      default:
        return "Signing you out...";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {getMessage()}
          </h1>
          <p className="text-gray-600">
            Please wait while we log you out of your account.
          </p>
        </div>
      </div>
    </div>
  );
}