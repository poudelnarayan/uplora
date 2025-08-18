"use client";

import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { NotificationProvider } from "@/components/ui/Notification";
import { useState, useEffect } from "react";
import { TeamProvider } from "@/context/TeamContext";
import { UploadProvider } from "@/context/UploadContext";
import UploadTray from "@/components/layout/UploadTray";
import { DefaultSeoNoSSR, OrganizationJsonLdNoSSR } from "@/components/seo/NoSSRSeo";
import defaultSeo from "@/seo.config";
import { ThemeContext } from "@/components/ui/ThemeToggle/ThemeToggle";

// Theme Provider
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("uplora-theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Default to dark theme
      setTheme("dark");
      localStorage.setItem("uplora-theme", "dark");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("uplora-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  // Provide theme context to children
  const themeContextValue = {
    theme,
    toggleTheme,
    mounted
  };
  return (
    <ThemeContext.Provider value={themeContextValue}>
      <div data-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

// Main Providers Component
export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = typeof window !== "undefined" ? window.location.pathname : undefined;
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
            </UploadProvider>
          </TeamProvider>
        )}
      </NotificationProvider>
    </SessionProvider>
  );
}