"use client";

import { motion } from "framer-motion";
import { Settings, User, Bell, Shield, Palette, Key, Mail, Smartphone, Monitor, Sun, Moon, Languages, CreditCard, Youtube, Crown, CheckCircle, ExternalLink, Upload, Users } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useUser, UserProfile, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import SettingsHeader from "@/components/pages/Settings/SettingsHeader";
import ProfileSection from "@/components/pages/Settings/ProfileSection";
import NotificationSection from "@/components/pages/Settings/NotificationSection";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../Settings.module.css";

const MotionDiv = motion.div as any;
const MotionSection = motion.section as any;

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const { user } = useUser();
  const [youtubeData, setYouTubeData] = useState<{
    isConnected: boolean;
    channelTitle?: string | null;
  }>({ isConnected: false });

  useEffect(() => {
    const fetchYouTubeStatus = async () => {
      try {
        const response = await fetch("/api/youtube/status");
        if (response.ok) {
          const data = await response.json();
          setYouTubeData(data);
        }
      } catch (error) {
        console.error("Failed to fetch YouTube status:", error);
      }
    };

    if (user?.id) {
      fetchYouTubeStatus();
    }
  }, [user?.id]);

  return (
    <>
      <SignedIn>
        <AppShell>
          <NextSeoNoSSR title="Settings" noindex nofollow />
          
          <div className="h-[calc(100vh-8rem)] overflow-hidden">
            <div className="h-full overflow-y-auto px-4 lg:px-0 space-y-6">
              <SettingsHeader />

              {/* Profile Section */}
              <MotionSection
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <ProfileSection />
              </MotionSection>

              {/* Notifications Section */}
              <MotionSection
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <NotificationSection />
              </MotionSection>

              {/* Social Integrations Section */}
              <MotionSection
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <Youtube className={styles.sectionIcon} />
                  <h2 className={styles.sectionTitle}>Social Integrations</h2>
                </div>
                
                <div className="card p-6">
                  <div className="text-center">
                    <p className="text-muted-foreground">
                      Manage your social media connections and publishing settings. 
                      <Link href="/social" className="text-primary hover:underline ml-1">
                        Visit Social page
                      </Link> for full integration management.
                    </p>
                  </div>
                </div>
              </MotionSection>
            </div>
          </div>
        </AppShell>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/settings" />
      </SignedOut>
    </>
  );
}