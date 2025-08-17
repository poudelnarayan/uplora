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
      <div className="h-full flex flex-col">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4 lg:mb-6"
        >
          <h1 className="heading-2 mb-1 sm:mb-2">Upload Center</h1>
          <p className="hidden lg:block text-muted-foreground max-w-2xl mx-auto">
            Share your latest content with the world. Upload videos directly to YouTube with your team.
          </p>
        </motion.div>

        {/* Team Context Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-4 lg:mb-6"
        >
          <div className="flex items-center justify-center gap-2 lg:gap-3 p-3 lg:p-4 rounded-lg border-2 border-dashed border-primary/20 bg-primary/5">
            {selectedTeam ? (
              <>
                <Users className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Uploading to: <span className="text-primary">{selectedTeam.name}</span>
                </span>
              </>
            ) : (
              <>
                <User className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
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
          className="flex-1 card p-4 lg:p-8"
        >
          <div className="text-center mb-4 lg:mb-8">
            <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-3 lg:mb-4 flex items-center justify-center">
              <Upload className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
            </div>
            <h3 className="text-lg lg:text-xl font-semibold mb-1 lg:mb-2">Upload Your Video</h3>
            <p className="text-muted-foreground hidden lg:block">
              Drag and drop your video file to get started
            </p>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <UploadZone />
          </div>
        </motion.div>

        {/* Removed extra tips per request */}
      </div>
    </AppShell>
  );
}
