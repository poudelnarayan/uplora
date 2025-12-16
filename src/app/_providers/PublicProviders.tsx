"use client";

import React from "react";
import { NotificationProvider } from "@/app/components/ui/Notification";
import { ThemeProvider } from "@/context/ThemeContext";
import { SeoProviders } from "./SeoProviders";

export function PublicProviders({ children, siteUrl }: { children: React.ReactNode; siteUrl: string }) {
  return (
    <NotificationProvider>
      <ThemeProvider>
        <SeoProviders siteUrl={siteUrl}>{children}</SeoProviders>
      </ThemeProvider>
    </NotificationProvider>
  );
}


