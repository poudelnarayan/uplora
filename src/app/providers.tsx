"use client";

import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "@/components/ui/Notification";
import { useState, useEffect } from "react";
import { TeamProvider } from "@/context/TeamContext";
import { UploadProvider } from "@/context/UploadContext";
import UploadTray from "@/components/layout/UploadTray";
import { DefaultSeoNoSSR, OrganizationJsonLdNoSSR } from "@/components/seo/NoSSRSeo";
import defaultSeo from "@/seo.config";

// Theme Provider
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light";
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return <div data-theme={theme}>{children}</div>;
}

// Main Providers Component
export default function Providers({ children }: { children: React.ReactNode }) {
  const siteUrl =
    (typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL) ||
    "http://localhost:3000";
  return (
    <SessionProvider>
      <NotificationProvider>
        <TeamProvider>
          <UploadProvider>
            <ThemeProvider>
              <DefaultSeoNoSSR {...defaultSeo} />
              <OrganizationJsonLdNoSSR
                type="Organization"
                id={`${siteUrl}/#organization`}
                name="YTUploader"
                url={siteUrl}
                sameAs={[]}
              />
              {children}
              <UploadTray />
            </ThemeProvider>
          </UploadProvider>
        </TeamProvider>
      </NotificationProvider>
    </SessionProvider>
  );
}