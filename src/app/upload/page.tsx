"use client";

import { motion } from "framer-motion";
import { Upload, Users, User } from "lucide-react";
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
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="heading-2 mb-2">Upload Center</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Share your latest content with the world. Upload videos directly to YouTube with your team.
          </p>
        </motion.div>

        {/* Team Context Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <div className="flex items-center justify-center gap-3 p-4 rounded-lg border-2 border-dashed border-primary/20 bg-primary/5">
            {selectedTeam ? (
              <>
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Uploading to: <span className="text-primary">{selectedTeam.name}</span>
                </span>
              </>
            ) : (
              <>
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Uploading to: Personal workspace
                </span>
              </>
            )}
          </div>
        </motion.div>

        {/* Upload Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-4 flex items-center justify-center">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h3 className="heading-3 mb-2">Upload Your Video</h3>
            <p className="text-muted-foreground">
              Drag and drop your video file to get started
            </p>
          </div>
          
          <UploadZone />
        </motion.div>

        {/* Removed extra tips per request */}
      </div>
    </AppShell>
  );
}
