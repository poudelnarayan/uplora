"use client";

import { motion } from "framer-motion";

const MotionDiv = motion.div as any;
const MotionSection = motion.section as any;
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Key, 
  Mail,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  Languages,
  CreditCard,
  Youtube,
  Crown,
  CheckCircle,
  ExternalLink,
  Upload,
  Users,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useUser, UserProfile, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import Link from "next/link";
import { useEffect, useState } from "react";
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
    <AppShell>
      <NextSeoNoSSR title="Settings" noindex nofollow />
      <div className="min-h-full space-y-8">
        {/* Header */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Account Settings</h1>
            <p className="text-muted-foreground">Manage your account, integrations, and preferences</p>
          </div>
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-primary" />
          </div>
        </MotionDiv>

        {/* Integrations moved to /social */}

        {/* Profile - Clerk UserProfile */}
        <MotionSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Profile</h2>
          </div>
          <div className="card p-4">
            <UserProfile routing="path" path="/settings" appearance={{
              elements: {
                card: "bg-card border border-border shadow-lg",
              }
            }} />
          </div>
        </MotionSection>

        {/* Notifications - Important for Team Workflow */}
        <MotionSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-secondary" />
            <h2 className="text-xl font-semibold text-foreground">Notification Preferences</h2>
          </div>
          
          <div className="card p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <span className="font-medium text-foreground">Email notifications</span>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                </div>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-secondary" />
                  <div>
                    <span className="font-medium text-foreground">Team invitations</span>
                    <p className="text-sm text-muted-foreground">Get notified of team invites</p>
                  </div>
                </div>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-accent" />
                  <div>
                    <span className="font-medium text-foreground">Upload status updates</span>
                    <p className="text-sm text-muted-foreground">Track upload progress</p>
                  </div>
                </div>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <div>
                    <span className="font-medium text-foreground">Approval notifications</span>
                    <p className="text-sm text-muted-foreground">Video approval updates</p>
                  </div>
                </div>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
            </div>
          </div>
        </MotionSection>

        
      </div>
    </AppShell>
  );
}