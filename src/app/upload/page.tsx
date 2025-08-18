"use client";

import { motion } from "framer-motion";
import { Upload, Users, User, Video, Shield, Zap, CheckCircle } from "lucide-react";
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
      <div className="min-h-full space-y-6">
        {/* Main Upload Section - Prominent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Current Workspace - Clear and Visible */}
          <div className="flex items-center justify-center">
            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl border-2 ${
              selectedTeam 
                ? "border-primary/30 bg-primary/10 text-primary" 
                : "border-muted-foreground/30 bg-muted/20 text-muted-foreground"
            }`}>
              {selectedTeam ? (
                <>
                  <Users className="w-5 h-5" />
                  <span className="font-semibold">Team: {selectedTeam.name}</span>
                </>
              ) : (
                <>
                  <User className="w-5 h-5" />
                  <span className="font-semibold">Personal Workspace</span>
                </>
              )}
            </div>
          </div>

          {/* Upload Zone - Main Focus */}
          <div className="max-w-4xl mx-auto">
            <UploadZone />
          </div>
        </motion.div>

        {/* Quick Benefits - Minimal but Informative */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-card border">
              <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Fast Upload</p>
            </div>
            <div className="p-3 rounded-lg bg-card border">
              <Shield className="w-6 h-6 text-secondary mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Secure</p>
            </div>
            <div className="p-3 rounded-lg bg-card border">
              <Video className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Direct to YouTube</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}