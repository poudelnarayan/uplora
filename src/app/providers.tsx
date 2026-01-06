"use client";
import { usePathname } from "next/navigation";
import { MissingClerkConfig } from "./_providers/MissingClerkConfig";
import { PublicProviders } from "./_providers/PublicProviders";
import { ProtectedProviders } from "./_providers/ProtectedProviders";
import OnboardingGuard from "@/app/components/OnboardingGuard";

// Main Providers Component
export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const siteUrl =
    (typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL) ||
    "http://localhost:3000";
  
  // Pages that should NOT have onboarding guard applied
  const isPublicPage = pathname === "/" || 
                      pathname === "/sign-in" || 
                      pathname === "/sign-up" || 
                      pathname === "/admin-login" ||
                      pathname.startsWith("/about") ||
                      pathname.startsWith("/contact") ||
                      pathname.startsWith("/privacy") ||
                      pathname.startsWith("/terms") ||
                      pathname.startsWith("/copyright") ||
                      pathname.startsWith("/invite/");
  
  // Check if Clerk keys are properly configured
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasValidClerkKey = clerkPublishableKey && 
    clerkPublishableKey !== 'pk_test_your-publishable-key-here' && 
    clerkPublishableKey.startsWith('pk_');

  return (
    <>
      {hasValidClerkKey ? (
        isPublicPage ? (
          // Public pages
          <PublicProviders siteUrl={siteUrl}>{children}</PublicProviders>
        ) : (
          // Protected pages (first-time users are redirected into onboarding)
          <OnboardingGuard>
            <ProtectedProviders siteUrl={siteUrl}>{children}</ProtectedProviders>
          </OnboardingGuard>
        )
      ) : (
        <MissingClerkConfig />
      )}
    </>
  );
}