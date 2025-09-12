"use client";

import { motion } from "framer-motion";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import MakePostInterface from "@/components/upload/MakePostInterface";
import { useTeam } from "@/context/TeamContext";
import AppShell from "@/components/layout/AppLayout";

const MotionDiv = motion.div as any;

export const dynamic = "force-dynamic";

export default function MakePostPage() {
  const { user, isLoaded } = useUser();
  const { selectedTeamId, selectedTeam } = useTeam();
  
  if (!isLoaded) return null;
  if (!user) return <RedirectToSignIn redirectUrl="/upload" />;

  return (
    <>
      <AppShell>
      <NextSeoNoSSR title="Create Content" noindex nofollow />
      
      <div className="min-h-[calc(100vh-8rem)] flex flex-col justify-center items-center px-4 py-0">
        <MakePostInterface 
          selectedTeam={selectedTeam}
          selectedTeamId={selectedTeamId}
        />
      </div>
      </AppShell>
    </>
  );
}