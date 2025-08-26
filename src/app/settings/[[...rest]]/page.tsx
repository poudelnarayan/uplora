"use client";

import { motion } from "framer-motion";
import { Settings, User, Bell, Shield, Palette, Key, Mail, Smartphone, Monitor, Sun, Moon, Languages, CreditCard, Youtube, Crown, CheckCircle, ExternalLink, Upload, Users } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useUser, UserProfile, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import SettingsHeader from "@/components/pages/Settings/SettingsHeader";
import ProfileSection from "@/components/pages/Settings/ProfileSection";
import NotificationSection from "@/components/pages/Settings/NotificationSection";
import YouTubeConnection from "@/components/settings/YouTubeConnection";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useNotifications } from "@/components/ui/Notification";
import styles from "../Settings.module.css";

const MotionDiv = motion.div as any;
const MotionSection = motion.section as any;

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const notifications = useNotifications();
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

  // Handle YouTube OAuth completion
  useEffect(() => {
    const youtubeCode = searchParams.get('youtube_code');
    
    if (youtubeCode && user?.id) {
      const completeYouTubeConnection = async () => {
        try {
          const response = await fetch('/api/youtube/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: youtubeCode }),
          });

          const result = await response.json();

          if (result.success) {
            notifications.addNotification({
              type: "success",
              title: "YouTube Connected!",
              message: `Successfully connected to ${result.channelTitle || 'your YouTube channel'}`
            });
            
            // Refresh YouTube status
            const statusResponse = await fetch("/api/youtube/status");
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              setYouTubeData(statusData);
            }
            
            // Clean up URL
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('youtube_code');
            window.history.replaceState({}, '', newUrl.toString());
          } else {
            notifications.addNotification({
              type: "error",
              title: "Connection Failed",
              message: result.error || "Failed to complete YouTube connection"
            });
          }
        } catch (error) {
          console.error("YouTube completion error:", error);
          notifications.addNotification({
            type: "error",
            title: "Connection Failed",
            message: "Failed to complete YouTube connection"
          });
        }
      };

      completeYouTubeConnection();
    }
  }, [searchParams, user?.id, notifications]);

  return (
    <>
      <SignedIn>
        <AppShell>
          <NextSeoNoSSR title="Settings" noindex nofollow />
          
          <div className="h-[calc(100vh-8rem)] overflow-hidden">
            <div className="h-full overflow-y-auto px-4 lg:px-0 space-y-6">
              {/* Clean Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold" style={{ color: '#222831' }}>Settings</h1>
                <p className="text-sm" style={{ color: '#393E46' }}>Manage your account and preferences</p>
              </div>

              {/* Settings Grid */}
              <div className="grid gap-4">
                {/* Profile Card */}
                <div className="rounded-lg p-6" style={{ backgroundColor: '#EEEEEE', border: `1px solid #393E46` }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: '#222831' }}>Profile</h3>
                      <p className="text-sm" style={{ color: '#393E46' }}>Manage your account information</p>
                    </div>
                  </div>
                  <UserProfile 
                    routing="path" 
                    path="/settings" 
                    appearance={{
                      elements: {
                        card: "bg-white border-0 shadow-none",
                        headerTitle: "text-[#222831]",
                        headerSubtitle: "text-[#393E46]",
                        formButtonPrimary: "bg-[#00ADB5] hover:bg-[#00ADB5]/90",
                        formFieldInput: "border-[#393E46] focus:border-[#00ADB5]",
                        formFieldLabel: "text-[#222831]"
                      }
                    }} 
                  />
                </div>

                {/* YouTube Connection */}
                <div className="rounded-lg p-6" style={{ backgroundColor: '#EEEEEE', border: `1px solid #393E46` }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
                      <Youtube className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: '#222831' }}>YouTube Integration</h3>
                      <p className="text-sm" style={{ color: '#393E46' }}>Connect your YouTube channel for direct uploads</p>
                    </div>
                  </div>
                  <YouTubeConnection 
                    isConnected={youtubeData.isConnected} 
                    channelTitle={youtubeData.channelTitle} 
                    onConnect={() => {
                      // Refresh YouTube status after connection
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
                      fetchYouTubeStatus();
                    }} 
                  />
                </div>
                
               

                {/* Notifications */}
                <div className="rounded-lg p-6" style={{ backgroundColor: '#EEEEEE', border: `1px solid #393E46` }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: '#222831' }}>Notifications</h3>
                      <p className="text-sm" style={{ color: '#393E46' }}>Email and push notification preferences</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Email notifications", checked: true },
                      { label: "Team invitations", checked: true },
                      { label: "Upload updates", checked: true }
                    ].map((setting, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: '#222831' }}>{setting.label}</span>
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            defaultChecked={setting.checked}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 rounded-full transition-all peer-checked:bg-[#00ADB5] bg-[#393E46]">
                            <div className="w-4 h-4 bg-white rounded-full shadow transform transition-transform translate-x-1 translate-y-1 peer-checked:translate-x-6"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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