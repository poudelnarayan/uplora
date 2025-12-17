"use client";

import { motion } from "framer-motion";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { NextSeoNoSSR } from "@/app/components/seo/NoSSRSeo";
import MakePostInterface from "@/app/components/upload/MakePostInterface";
import { useTeam } from "@/context/TeamContext";
import AppShell from "@/app/components/layout/AppLayout";

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
        <div className="fixed inset-0 lg:left-64 bg-background overflow-auto">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-full flex items-center justify-center"
          >
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