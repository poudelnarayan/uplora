"use client";

import { motion } from "framer-motion";
import { Upload, Users, User, Video, Shield, Zap, CheckCircle } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import UploadZone from "@/components/pages/Upload/UploadZone";
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
          <NextSeoNoSSR title="Upload" noindex nofollow />
          
          <div className={styles.container}>
            <div className={styles.content}>
              {/* Main Upload Section */}
              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.uploadSection}
              >
                {/* Current Workspace Indicator */}
                <div className={styles.workspaceSection}>
                  <WorkspaceIndicator
                    selectedTeam={selectedTeam}
                    selectedTeamId={selectedTeamId}
                  />
                </div>

                {/* Upload Zone */}
                <div className={styles.uploadZoneSection}>
                  <UploadZone />
                </div>
              </MotionDiv>

              {/* Upload Benefits */}
              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={styles.benefitsSection}
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