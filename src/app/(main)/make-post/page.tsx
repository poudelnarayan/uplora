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
            className="min-h-full"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border">
              <h1 className="text-2xl font-semibold text-foreground">Create Content</h1>
              <p className="text-muted-foreground text-sm mt-1">Choose a content type to get started</p>
            </div>

            {/* Content */}
            <div className="p-6 flex justify-center items-start min-h-[calc(100vh-5rem)]">
              <MakePostInterface
                selectedTeam={selectedTeam}
                selectedTeamId={selectedTeamId}
              />
            </div>
          </MotionDiv>
        </div>
      </AppShell>
    </>
  );
}