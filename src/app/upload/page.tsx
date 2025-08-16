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
      <div className="max-w-4xl mx-auto mt-6 sm:mt-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4 sm:mb-8"
        >
          <h1 className="heading-2 mb-1 sm:mb-2">Upload Center</h1>
          <p className="hidden sm:block text-muted-foreground max-w-2xl mx-auto">
            Share your latest content with the world. Upload videos directly to YouTube with your team.
          </p>
        </motion.div>

        {/* Team Context Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-4 sm:mb-6"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border-2 border-dashed border-primary/20 bg-primary/5">
            {selectedTeam ? (
              <>
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Uploading to: <span className="text-primary">{selectedTeam.name}</span>
                </span>
              </>
            ) : (
              <>
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
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
          className="card p-4 sm:p-8"
        >
          <div className="text-center mb-4 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-3 sm:mb-4 flex items-center justify-center">
              <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="text-lg sm:heading-3 mb-1 sm:mb-2">Upload Your Video</h3>
            <p className="text-muted-foreground hidden sm:block">
              Drag and drop your video file to get started
            </p>
          </div>
          
          <div className="-mt-2 sm:mt-0">
            <UploadZone />
          </div>
        </motion.div>

        {/* Removed extra tips per request */}
      </div>
    </AppShell>
  );
}
