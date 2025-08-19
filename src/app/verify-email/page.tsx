"use client";

import { motion } from "framer-motion";

const MotionDiv = motion.div as any;
import { Mail, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import { useNotifications } from "@/components/ui/Notification";

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const notifications = useNotifications();
  const [resending, setResending] = useState(false);
  
  const email = params.get("email");
  const status = params.get("status");

  // Auto-redirect to dashboard after successful verification
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  const handleResendEmail = async () => {
    if (!email) return;
    
    setResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const result = await response.json();
        notifications.addNotification({
          type: "success",
          title: "Verification email sent!",
          message: result.method === "development" 
            ? "Check your terminal/console for the verification link (development mode)"
            : "Please check your inbox for the verification link."
        });
      } else {
        const error = await response.json();
        notifications.addNotification({
          type: "error",
          title: "Failed to resend email",
          message: error.message || "Please try again later."
        });
      }
    } catch {
      notifications.addNotification({
        type: "error",
        title: "Something went wrong",
        message: "Please try again later."
      });
    } finally {
      setResending(false);
    }
  };

  const getStatusContent = () => {
    switch (status) {
      case "success":
        return {
          icon: <CheckCircle className="w-12 h-12 text-green-500" />,
          title: "Email Verified Successfully!",
          message: "Your email has been verified. You can now access all features of Uplora.",
          action: "Continue to Dashboard",
          actionLink: "/dashboard",
          color: "green"
        };
      case "expired":
        return {
          icon: <AlertCircle className="w-12 h-12 text-yellow-500" />,
          title: "Verification Link Expired",
          message: "The verification link has expired. Please request a new one.",
          action: "Resend Verification Email",
          actionLink: null,
          color: "yellow"
        };
      case "error":
        return {
          icon: <AlertCircle className="w-12 h-12 text-red-500" />,
          title: "Verification Failed",
          message: "There was an error verifying your email. Please try again.",
          action: "Resend Verification Email",
          actionLink: null,
          color: "red"
        };
      default:
        return {
          icon: <Mail className="w-12 h-12 text-blue-500" />,
          title: "Check Your Email",
          message: `We've sent a verification link to ${email || "your email address"}. Please check your inbox and click the link to verify your account.`,
          action: "Resend Verification Email",
          actionLink: null,
          color: "blue"
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <NextSeoNoSSR title="Verify Email" noindex nofollow />
      <div className="container mx-auto px-4 py-16">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <div className="card p-8 text-center">
            <MotionDiv
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              {content.icon}
            </MotionDiv>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-foreground mb-4"
            >
              {content.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mb-8 leading-relaxed"
            >
              {content.message}
            </motion.p>

            <MotionDiv
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              {content.actionLink ? (
                <button
                  onClick={() => router.push(content.actionLink!)}
                  className="btn btn-primary w-full"
                >
                  {content.action}
                </button>
              ) : (
                <button
                  onClick={handleResendEmail}
                  disabled={resending}
                  className="btn btn-primary w-full"
                >
                  {resending ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    content.action
                  )}
                </button>
              )}

              <button
                onClick={() => router.push("/signin")}
                className="btn btn-ghost w-full"
              >
                Back to Sign In
              </button>
            </MotionDiv>

            {!status && email && (
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
              >
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Didn't receive the email?</p>
                  <ul className="text-xs space-y-1">
                    <li>• Check your spam/junk folder</li>
                    <li>• Make sure the email address is correct</li>
                    <li>• Wait a few minutes for delivery</li>
                  </ul>
                </div>
              </MotionDiv>
            )}
          </div>
        </MotionDiv>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center">
        <div className="spinner" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
