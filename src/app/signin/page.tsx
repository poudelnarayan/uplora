"use client";

import { motion } from "framer-motion";
import SignInForm from "@/components/auth/SignInForm";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const params = useSearchParams();
  const verified = params.get("verified");
  const showSuccess = verified === "1";
  const showExpired = verified === "expired";
  const showError = verified === "0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <h1 className="heading-2">Sign in</h1>
            <p className="text-muted-foreground">Welcome back. Continue to your dashboard.</p>
          </div>

          {showSuccess && (
            <div className="mb-4 p-3 rounded-md border bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm">
              Email verified successfully. Please sign in below.
            </div>
          )}
          {showExpired && (
            <div className="mb-4 p-3 rounded-md border bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 text-sm">
              Verification link expired. Please register again to receive a new link.
            </div>
          )}
          {showError && (
            <div className="mb-4 p-3 rounded-md border bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
              Verification failed. Please try again.
            </div>
          )}

          <SignInForm />
        </motion.div>
      </div>
    </div>
  );
}


