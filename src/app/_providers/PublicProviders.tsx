"use client";

import React from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { SeoProviders } from "./SeoProviders";

export function PublicProviders({ children, siteUrl }: { children: React.ReactNode; siteUrl: string }) {
  return (
    <ThemeProvider>
      <SeoProviders siteUrl={siteUrl}>{children}</SeoProviders>
    </ThemeProvider>
  );
}


