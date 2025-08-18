"use client";

import { motion } from "framer-motion";
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Key, 
  Trash2, 
  Mail,
  Lock,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  Languages,
  CreditCard,
  Youtube,
  Zap,
  Crown
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
      <div className="min-h-full">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-3xl blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-card to-muted/30 rounded-2xl p-8 border border-border/50">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                <Settings className="w-10 h-10 text-white" />
              </div>
              <h1 className="heading-2 mb-3">Account Settings</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Customize your experience, manage security, and configure integrations for your perfect workflow.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Settings Sections */}
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Profile & Account */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">Profile & Account</h2>
              <p className="text-muted-foreground">Manage your personal information and account details</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Settings */}
              <div className="card p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Profile Information</h3>
                    <p className="text-sm text-muted-foreground">Update your personal details</p>
                  </div>
                </div>
                
                <div className="space-y-4">
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
                  
                  <button className="btn btn-primary w-full">
                    <User className="w-4 h-4 mr-2" />
                    Update Profile
                  </button>
                </div>
              </div>

              {/* Security Settings */}
              <div className="card p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/10 to-pink-500/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Security & Privacy</h3>
                    <p className="text-sm text-muted-foreground">Protect your account</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <button className="btn btn-ghost w-full justify-start group hover:bg-blue-500/10">
                    <Key className="w-4 h-4 mr-3 text-blue-500" />
                    <span>Change Password</span>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  </button>
                  
                  <button className="btn btn-ghost w-full justify-start group hover:bg-green-500/10">
                    <Smartphone className="w-4 h-4 mr-3 text-green-500" />
                    <span>Two-Factor Authentication</span>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </button>
                  
                  <button className="btn btn-ghost w-full justify-start group hover:bg-purple-500/10">
                    <Globe className="w-4 h-4 mr-3 text-purple-500" />
                    <span>Connected Accounts</span>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Notifications & Preferences */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">Notifications & Preferences</h2>
              <p className="text-muted-foreground">Control how you receive updates and customize your experience</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Notification Settings */}
              <div className="card p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
                    <p className="text-sm text-muted-foreground">Choose what updates you receive</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-foreground">Email notifications</span>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-foreground">Team invitations</span>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Upload className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-foreground">Upload status updates</span>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium text-foreground">Approval notifications</span>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                </div>
              </div>

              {/* Appearance Settings */}
              <div className="card p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                    <Palette className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Appearance</h3>
                    <p className="text-sm text-muted-foreground">Customize your interface</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-3 text-foreground">Theme Preference</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button className="p-3 rounded-lg border border-border hover:border-primary/50 transition-all group">
                        <Sun className="w-5 h-5 mx-auto mb-2 text-amber-500" />
                        <span className="text-xs font-medium">Light</span>
                      </button>
                      <button className="p-3 rounded-lg border border-primary bg-primary/10 transition-all group">
                        <Moon className="w-5 h-5 mx-auto mb-2 text-primary" />
                        <span className="text-xs font-medium text-primary">Dark</span>
                      </button>
                      <button className="p-3 rounded-lg border border-border hover:border-primary/50 transition-all group">
                        <Monitor className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                        <span className="text-xs font-medium">System</span>
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
            </div>
          </motion.section>

          {/* Platform Integrations */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">Platform Integrations</h2>
              <p className="text-muted-foreground">Connect your social media accounts to enable seamless publishing</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* YouTube Connection */}
              <YouTubeConnection
                isConnected={youtubeData.isConnected}
                channelTitle={youtubeData.channelTitle}
                onConnect={() => {}}
              />
              
              {/* Coming Soon Integrations */}
              <div className="card p-6 opacity-60 hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500/10 to-slate-500/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">More Platforms</h3>
                    <p className="text-sm text-muted-foreground">Additional integrations coming soon</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-red-500">TT</span>
                      </div>
                      <span className="text-sm text-muted-foreground">TikTok (Coming Soon)</span>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-500">IG</span>
                      </div>
                      <span className="text-sm text-muted-foreground">Instagram (Coming Soon)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Billing & Subscription */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">Billing & Subscription</h2>
              <p className="text-muted-foreground">Manage your subscription and billing information</p>
            </div>
            
            <div className="card p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Current Plan</h3>
                  <p className="text-sm text-muted-foreground">Free Trial - 14 days remaining</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                  <div className="text-2xl font-bold text-green-600 mb-1">∞</div>
                  <div className="text-xs text-muted-foreground">Uploads</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-600 mb-1">5</div>
                  <div className="text-xs text-muted-foreground">Team Members</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                  <div className="text-2xl font-bold text-purple-600 mb-1">24/7</div>
                  <div className="text-xs text-muted-foreground">Support</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button className="btn btn-primary flex-1">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </button>
                <button className="btn btn-ghost">
                  View Billing
                </button>
              </div>
            </div>
          </motion.section>

          {/* Advanced Settings */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">Advanced Settings</h2>
              <p className="text-muted-foreground">Advanced configuration and account management</p>
            </div>
            
            <div className="space-y-6">
              {/* Export Data */}
              <div className="card p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Export Your Data</h4>
                      <p className="text-sm text-muted-foreground">Download a copy of your account data</p>
                    </div>
                  </div>
                  <button className="btn btn-ghost">
                    Export
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="card p-6 border-red-500/20 bg-gradient-to-br from-red-500/5 to-pink-500/5 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground">Irreversible account actions</p>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Warning:</strong> Once you delete your account, there is no going back. All your data, teams, and videos will be permanently removed.
                  </p>
                </div>
                
                <button className="btn btn-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </button>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </AppShell>
  );
}