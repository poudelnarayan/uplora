"use client";

import { motion } from "framer-motion";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { NextSeoNoSSR } from "@/app/components/seo/NoSSRSeo";
import MakePostInterface from "@/app/components/upload/MakePostInterface";
import { useTeam } from "@/context/TeamContext";
import AppShell from "@/app/components/layout/AppLayout";
import { TeamPlatformsBanner } from "@/app/components/teams/TeamPlatformsBanner";

const MotionDiv = motion.div as any;

export const dynamic = "force-dynamic";


export default function MakePostPage() {
  const { user, isLoaded } = useUser();
  const { selectedTeamId, selectedTeam } = useTeam();
  
  if (!isLoaded) return null;
  if (!user) return <RedirectToSignIn redirectUrl="/upload" />;
 
  return (
    <>
      <NextSeoNoSSR title="Create Content" noindex nofollow />
      <AppShell>
        <div className="relative lg:fixed lg:inset-0 lg:left-64 bg-background lg:overflow-auto">
          <MotionDiv
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {/* Editors get the platform-allowlist banner before they pick a
                content type — so they know whether YouTube / Instagram / etc.
                are currently enabled for this workspace. */}
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 max-w-3xl mx-auto w-full">
              <TeamPlatformsBanner teamId={selectedTeamId} />
            </div>
            <MakePostInterface
              selectedTeam={selectedTeam}
              selectedTeamId={selectedTeamId}
            />
          </MotionDiv>
        </div>
      </AppShell>
    </>
  );
}