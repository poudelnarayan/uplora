"use client";

import { motion } from "framer-motion";
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
  Upload
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useSession } from "next-auth/react";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import YouTubeConnection from "@/components/settings/YouTubeConnection";
import { useEffect, useState } from "react";
export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const { data: session } = useSession();
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

    if (session?.user?.id) {
      fetchYouTubeStatus();
    }
  }, [session?.user?.id]);

  return (
    <AppShell>
      <NextSeoNoSSR title="Settings" noindex nofollow />
      <div className="min-h-full space-y-8">
        {/* Header */}
        <motion.div
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
        </motion.div>

        {/* YouTube Integration - Most Important */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <Youtube className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-foreground">YouTube Integration</h2>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              youtubeData.isConnected 
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800"
            }`}>
              {youtubeData.isConnected ? "Connected" : "Not Connected"}
            </div>
          </div>
          
          <YouTubeConnection
            isConnected={youtubeData.isConnected}
            channelTitle={youtubeData.channelTitle}
            onConnect={() => {}}
          />
        </motion.section>

        {/* Profile Settings - Core Functionality */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Profile Information</h2>
          </div>
          
          <div className="card p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Display Name</label>
                <div className="field">
                  <span className="field-addon"><User className="w-4 h-4" /></span>
                  <input 
                    type="text" 
                    className="field-control" 
                    placeholder="Your display name" 
                    defaultValue={session?.user?.name || ""} 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Email Address</label>
                <div className="field">
                  <span className="field-addon"><Mail className="w-4 h-4" /></span>
                  <input 
                    type="email" 
                    className="field-control" 
                    placeholder="your@email.com" 
                    defaultValue={session?.user?.email || ""} 
                    disabled 
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed for security reasons</p>
              </div>
            </div>
            
            <button className="btn btn-primary">
              <User className="w-4 h-4 mr-2" />
              Update Profile
            </button>
          </div>
        </motion.section>

        {/* Notifications - Important for Team Workflow */}
        <motion.section
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
        </motion.section>

        {/* Security Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-warning" />
            <h2 className="text-xl font-semibold text-foreground">Security & Privacy</h2>
          </div>
          
          <div className="card p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Change Password</div>
                  <div className="text-sm text-muted-foreground">Update your password</div>
                </div>
              </button>
              
              <button className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left">
                <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Two-Factor Auth</div>
                  <div className="text-sm text-muted-foreground">Add extra security</div>
                </div>
              </button>
            </div>
          </div>
        </motion.section>

        {/* Theme Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <Palette className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
          </div>
          
          <div className="card p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3 text-foreground">Theme Preference</label>
                <div className="grid grid-cols-3 gap-3">
                  <button className="p-4 rounded-lg border border-border hover:border-primary/50 transition-all group text-center">
                    <Sun className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                    <span className="text-sm font-medium text-foreground">Light</span>
                  </button>
                  <button className="p-4 rounded-lg border border-primary bg-primary/10 transition-all group text-center">
                    <Moon className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <span className="text-sm font-medium text-primary">Dark</span>
                  </button>
                  <button className="p-4 rounded-lg border border-border hover:border-primary/50 transition-all group text-center">
                    <Monitor className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">System</span>
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Language</label>
                <div className="field">
                  <span className="field-addon"><Languages className="w-4 h-4" /></span>
                  <select className="field-control">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Subscription Info */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-warning" />
            <h2 className="text-xl font-semibold text-foreground">Current Plan</h2>
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
              Free Trial
            </div>
          </div>
          
          <div className="card p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="text-2xl font-bold text-primary mb-1">∞</div>
                <div className="text-sm text-muted-foreground">Uploads</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                <div className="text-2xl font-bold text-secondary mb-1">5</div>
                <div className="text-sm text-muted-foreground">Team Members</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-accent/10 border border-accent/20">
                <div className="text-2xl font-bold text-accent mb-1">24/7</div>
                <div className="text-sm text-muted-foreground">Support</div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button className="btn btn-primary flex-1">
                <CreditCard className="w-4 h-4 mr-2" />
                Upgrade Plan
              </button>
              <button className="btn btn-secondary">
                View Billing
              </button>
            </div>
          </div>
        </motion.section>
      </div>
    </AppShell>
  );
}