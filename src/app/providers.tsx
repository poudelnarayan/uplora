"use client";

import { SessionProvider } from "next-auth/react";
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
  const siteUrl =
    (typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL) ||
    "http://localhost:3000";
  const isAuthPage = pathname === "/signin" || pathname === "/admin-login";
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
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
    </SessionProvider>
  );
}