"use client";

import { motion } from "framer-motion";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import AppShell from "@/components/layout/AppShell";
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
          <NextSeoNoSSR title="Make Post" noindex nofollow />
          
          <div className="min-h-[calc(100vh-8rem)] flex flex-col">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <MotionDiv
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.1, scale: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute -top-32 -right-32 w-96 h-96 rounded-full"
                style={{ backgroundColor: 'rgb(0, 173, 181)' }}
              />
              <MotionDiv
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.05, scale: 1 }}
                transition={{ duration: 2.5, ease: "easeOut", delay: 0.5 }}
                className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full"
                style={{ backgroundColor: 'rgb(57, 62, 70)' }}
              />
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 py-8">
              <MakePostInterface 
                selectedTeam={selectedTeam}
                selectedTeamId={selectedTeamId}
              />
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