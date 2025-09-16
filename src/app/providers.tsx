"use client";
import { usePathname } from "next/navigation";
import { NotificationProvider } from "@/components/ui/Notification";
import { TeamProvider } from "@/context/TeamContext";
import { UploadProvider } from "@/context/UploadContext";
import { ContentCacheProvider } from "@/context/ContentCacheContext";
import UploadTray from "@/components/layout/UploadTray";
import { DefaultSeoNoSSR, OrganizationJsonLdNoSSR } from "@/components/seo/NoSSRSeo";
import defaultSeo from "@/seo.config";
import { ThemeProvider } from "@/context/ThemeContext";
import { ModalProvider } from "@/components/ui/Modal";
import OnboardingGuard from "@/components/OnboardingGuard";

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
        <NotificationProvider>
          {isPublicPage ? (
            // Public pages - no onboarding guard
            <ThemeProvider>
              <DefaultSeoNoSSR {...defaultSeo} />
              <OrganizationJsonLdNoSSR
                type="Organization"
                id={`${siteUrl}/#organization`}
                name="Uplora"
                url={siteUrl}
                sameAs={[]}
              />
              {children}
            </ThemeProvider>
          ) : (
            // Protected pages - with onboarding guard
            <OnboardingGuard>
              <TeamProvider>
                <ContentCacheProvider>
                  <UploadProvider>
                    <ModalProvider>
                      <ThemeProvider>
                        <DefaultSeoNoSSR {...defaultSeo} />
                        <OrganizationJsonLdNoSSR
                          type="Organization"
                          id={`${siteUrl}/#organization`}
                          name="Uplora"
                          url={siteUrl}
                          sameAs={[]}
                        />
                        {children}
                        <UploadTray />
                      </ThemeProvider>
                    </ModalProvider>
                  </UploadProvider>
                </ContentCacheProvider>
              </TeamProvider>
            </OnboardingGuard>
          )}
        </NotificationProvider>
      ) : (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div>
            <h1 style={{ marginBottom: '1rem', color: '#ef4444' }}>Clerk Configuration Required</h1>
            <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
              Please add your Clerk publishable key to continue.
            </p>
            <ol style={{ textAlign: 'left', color: '#374151', lineHeight: '1.6' }}>
              <li>Go to <a href="https://dashboard.clerk.com/last-active?path=api-keys" target="_blank" style={{ color: '#3b82f6' }}>Clerk Dashboard</a></li>
              <li>Copy your Publishable Key</li>
              <li>Add it to your .env.local file as NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</li>
              <li>Restart your development server</li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}