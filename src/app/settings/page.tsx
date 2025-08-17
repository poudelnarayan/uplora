"use client";

import { motion } from "framer-motion";
import { Settings, User, Bell, Shield, Palette, Globe, Key, Trash2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useSession } from "next-auth/react";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import YouTubeConnection from "@/components/settings/YouTubeConnection";
import { useEffect, useState } from "react";
export const dynamic = "force-dynamic";
// Avoid exporting revalidate from a client page; build was interpreting it on server.

export default function SettingsPage() {
  const { data: session } = useSession();
  const [youtubeData, setYouTubeData] = useState<{
    isConnected: boolean;
    channelTitle?: string | null;
  }>({ isConnected: false });

  useEffect(() => {
    // Fetch YouTube connection status
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

    if (session?.user?.id) {
      fetchYouTubeStatus();
    }
  }, [session?.user?.id]);

  return (
    <AppShell>
      <NextSeoNoSSR title="Settings" noindex nofollow />
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-6"
        >
          <h1 className="heading-2 mb-2">Settings</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Manage your account preferences, notifications, and security settings.
          </p>
        </motion.div>

        {/* Settings Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Profile Settings */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Profile</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Display Name</label>
                <input type="text" className="input" placeholder="Your display name" defaultValue={session?.user?.name || ""} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Email</label>
                <input type="email" className="input" placeholder="your@email.com" defaultValue={session?.user?.email || ""} disabled />
              </div>
              <button className="btn btn-primary w-full">Update Profile</button>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Email notifications</span>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">WhatsApp notifications</span>
                <input type="checkbox" className="toggle" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Team invitations</span>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Upload status updates</span>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Security</h3>
            </div>
            <div className="space-y-4">
              <button className="btn btn-ghost w-full justify-start"><Key className="w-4 h-4 mr-2" />Change Password</button>
              <button className="btn btn-ghost w-full justify-start"><Shield className="w-4 h-4 mr-2" />Two-Factor Authentication</button>
              <button className="btn btn-ghost w-full justify-start"><Globe className="w-4 h-4 mr-2" />Connected Accounts</button>
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Palette className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Appearance</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Theme</label>
                <select className="input"><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Language</label>
                <select className="input"><option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option></select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Platform Connections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Platform Connections</h2>
            <p className="text-muted-foreground">Connect your social media accounts to enable video uploads</p>
          </div>
          
          <YouTubeConnection
            isConnected={youtubeData.isConnected}
            channelTitle={youtubeData.channelTitle}
            onConnect={() => {}}
          />
        </motion.div>

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6 border-red-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Danger Zone</h3>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Once you delete your account, there is no going back. Please be certain.</p>
            <button className="btn btn-destructive"><Trash2 className="w-4 h-4 mr-2" />Delete Account</button>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
