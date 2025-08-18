"use client";

import { motion } from "framer-motion";
import { Upload, Users, User, Sparkles, Zap, Shield, Target, Video, Clock, CheckCircle } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import UploadZone from "@/components/upload/UploadZone";
import { useTeam } from "@/context/TeamContext";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
export const dynamic = "force-dynamic";

export default function UploadPage() {
  const { selectedTeam } = useTeam();
  
  return (
    <AppShell>
      <NextSeoNoSSR title="Upload" noindex nofollow />
      <div className="min-h-full">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-3xl blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-card to-muted/30 rounded-2xl p-8 border border-border/50">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                <Upload className="w-10 h-10 text-white" />
              </div>
              <h1 className="heading-2 mb-3">Upload Center</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Share your creative content with the world. Upload videos directly to your team workspace with smart approval workflows.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Workspace Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="max-w-md mx-auto">
            <div className={`relative overflow-hidden rounded-xl border-2 border-dashed p-4 transition-all duration-300 ${
              selectedTeam 
                ? "border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5" 
                : "border-muted-foreground/30 bg-muted/20"
            }`}>
              <div className="flex items-center justify-center gap-3">
                {selectedTeam ? (
                  <>
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-foreground">Team Workspace</p>
                      <p className="text-sm text-primary font-medium">{selectedTeam.name}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-foreground">Personal Workspace</p>
                      <p className="text-sm text-muted-foreground">Your private uploads</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="card p-4 text-center hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Lightning Fast</h3>
            <p className="text-xs text-muted-foreground">Optimized upload speeds</p>
          </div>
          
          <div className="card p-4 text-center hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Secure Storage</h3>
            <p className="text-xs text-muted-foreground">Enterprise-grade security</p>
          </div>
          
          <div className="card p-4 text-center hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Direct Publishing</h3>
            <p className="text-xs text-muted-foreground">Straight to YouTube</p>
          </div>
          
          <div className="card p-4 text-center hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Smart Workflow</h3>
            <p className="text-xs text-muted-foreground">Automated approvals</p>
          </div>
        </motion.div>

        {/* Upload Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-3xl blur-2xl"></div>
            <div className="relative card p-8 border-2 border-dashed border-primary/20 hover:border-primary/40 transition-all duration-300">
              <UploadZone />
            </div>
          </div>
        </motion.div>

        {/* Upload Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 max-w-3xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
              <Video className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h4 className="font-semibold text-foreground mb-1">High Quality</h4>
              <p className="text-xs text-muted-foreground">Upload in 4K for best results</p>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <Clock className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-semibold text-foreground mb-1">Quick Process</h4>
              <p className="text-xs text-muted-foreground">Automatic optimization</p>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <CheckCircle className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <h4 className="font-semibold text-foreground mb-1">Team Review</h4>
              <p className="text-xs text-muted-foreground">Collaborative approval</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}