"use client";

import { motion } from "framer-motion";
import { Upload, Users, User, Video, Shield, Zap, CheckCircle } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import UploadZone from "@/components/upload/UploadZone";
import WorkspaceIndicator from "@/components/pages/Upload/WorkspaceIndicator";
import UploadBenefits from "@/components/pages/Upload/UploadBenefits";
import { useTeam } from "@/context/TeamContext";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import styles from "./Upload.module.css";

const MotionDiv = motion.div as any;

export const dynamic = "force-dynamic";

export default function UploadPage() {
  const { selectedTeamId, selectedTeam } = useTeam();
  
  return (
    <>
      <SignedIn>
        <AppShell>
          <NextSeoNoSSR title="Make Post" noindex nofollow />
          
          <div className="h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col justify-center items-center max-w-4xl mx-auto w-full px-4">
              {/* Main Upload Section */}
              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4 w-full"
              >
                {/* Current Workspace Indicator */}
                <div className="flex items-center justify-center mb-2">
                  <WorkspaceIndicator
                    selectedTeam={selectedTeam}
                    selectedTeamId={selectedTeamId}
                  />
                </div>

                {/* Content Creation Zone */}
                <div className="w-full max-w-xl">
                  <UploadZone />
                </div>
              </MotionDiv>

              {/* Content Creation Benefits */}
              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-lg mx-auto mt-4"
              >
                <UploadBenefits />
              </MotionDiv>
            </div>
          </div>
        </AppShell>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/upload" />
      </SignedOut>
    </>
  );
}