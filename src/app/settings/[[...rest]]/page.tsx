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
import styles from "./Settings.module.css";

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
          
          <div className={styles.container}>
            <div className={styles.content}>
              <SettingsHeader />

              {/* Profile Section */}
              <MotionSection
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={styles.section}
              >
                <ProfileSection />
              </MotionSection>

              {/* Notifications Section */}
              <MotionSection
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={styles.section}
              >
                <NotificationSection />
              </MotionSection>

              {/* Social Integrations Section */}
              <MotionSection
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={styles.section}
              >
                <div className={styles.sectionHeader}>
                  <Youtube className={styles.sectionIcon} />
                  <h2 className={styles.sectionTitle}>Social Integrations</h2>
                </div>
                
                <div className={styles.card}>
                  <div className={styles.integrationInfo}>
                    <p className={styles.integrationDescription}>
                      Manage your social media connections and publishing settings. 
                      <Link href="/social" className={styles.link}>
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