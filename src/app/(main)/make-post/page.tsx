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

  // Allowlist awareness lives inline on each post-type card now (locked
  // platform icons + a single summary line), so the standalone banner is
  // gone — one signal in one place beats a banner above + inline below.
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