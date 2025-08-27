"use client";

import { motion } from "framer-motion";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import AppShell from "@/components/layout/AppLayout";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import MakePostInterface from "@/components/upload/MakePostInterface";
import { useTeam } from "@/context/TeamContext";

const MotionDiv = motion.div as any;

export const dynamic = "force-dynamic";

export default function MakePostPage() {
  const { selectedTeamId, selectedTeam } = useTeam();
  
  return (
    <>
      <SignedIn>
        <AppShell>
          <NextSeoNoSSR title="Create Content" noindex nofollow />
          
          <div className="min-h-[calc(100vh-8rem)] flex flex-col justify-center items-center px-4 py-0">
              <MakePostInterface 
                selectedTeam={selectedTeam}
                selectedTeamId={selectedTeamId}
              />
          </div>
        </AppShell>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/upload" />
      </SignedOut>
    </>
  );
}