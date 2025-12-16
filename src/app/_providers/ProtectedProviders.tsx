"use client";

import React from "react";
import { NotificationProvider } from "@/components/ui/Notification";
import { TeamProvider } from "@/context/TeamContext";
import { UploadProvider } from "@/context/UploadContext";
import { ContentCacheProvider } from "@/context/ContentCacheContext";
import UploadTray from "@/components/layout/UploadTray";
import { ThemeProvider } from "@/context/ThemeContext";
import { ModalProvider } from "@/components/ui/Modal";
import { SeoProviders } from "./SeoProviders";

export function ProtectedProviders({ children, siteUrl }: { children: React.ReactNode; siteUrl: string }) {
  return (
    <NotificationProvider>
      <TeamProvider>
        <ContentCacheProvider>
          <UploadProvider>
            <ModalProvider>
              <ThemeProvider>
                <SeoProviders siteUrl={siteUrl}>
                  {children}
                  <UploadTray />
                </SeoProviders>
              </ThemeProvider>
            </ModalProvider>
          </UploadProvider>
        </ContentCacheProvider>
      </TeamProvider>
    </NotificationProvider>
  );
}


