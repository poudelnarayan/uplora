"use client";

import { ClerkProvider } from '@clerk/nextjs';
import { usePathname } from "next/navigation";
import { NotificationProvider } from "@/components/ui/Notification";
import { TeamProvider } from "@/context/TeamContext";
import { UploadProvider } from "@/context/UploadContext";
import UploadTray from "@/components/layout/UploadTray";
import { DefaultSeoNoSSR, OrganizationJsonLdNoSSR } from "@/components/seo/NoSSRSeo";
import defaultSeo from "@/seo.config";
import { ThemeProvider } from "@/context/ThemeContext";
import { ModalProvider } from "@/components/ui/Modal";

// Main Providers Component
export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  const isAuthPage = pathname === "/sign-in" || pathname === "/sign-up" || pathname === "/admin-login";
  
  // Check if Clerk keys are properly configured
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasValidClerkKey = clerkPublishableKey && 
    clerkPublishableKey !== 'pk_test_your-publishable-key-here' && 
    clerkPublishableKey.startsWith('pk_');

  return (
    <>
      {hasValidClerkKey ? (
        <ClerkProvider publishableKey={clerkPublishableKey}>
          <NotificationProvider>
            {isAuthPage ? (
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
              <TeamProvider>
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
              </TeamProvider>
            )}
          </NotificationProvider>
        </ClerkProvider>
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