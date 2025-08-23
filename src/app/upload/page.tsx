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
          <NextSeoNoSSR title="Create Content" noindex nofollow />
          
          <div className="min-h-[calc(100vh-8rem)] relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <MotionDiv
                initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                animate={{ opacity: 0.06, scale: 1.2, rotate: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute -top-40 -right-40 w-80 h-80 rounded-full"
                style={{ backgroundColor: 'rgb(0, 173, 181)' }}
              />
              <MotionDiv
                initial={{ opacity: 0, scale: 0.3, x: -100 }}
                animate={{ opacity: 0.04, scale: 1, x: 0 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full"
                style={{ backgroundColor: 'rgb(57, 62, 70)' }}
              />
              <MotionDiv
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ opacity: 0.03, scale: 1 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
                style={{ backgroundColor: 'rgb(34, 40, 49)' }}
              />
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col justify-center items-center px-4 py-8 min-h-[calc(100vh-8rem)]">
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