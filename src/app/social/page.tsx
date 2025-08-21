"use client";

import { motion } from "framer-motion";
const MotionDiv = motion.div as any;
import AppShell from "@/components/layout/AppShell";
import { Youtube, Instagram, Twitter, Facebook, Linkedin, Clock } from "lucide-react";
import YouTubeConnection from "@/components/settings/YouTubeConnection";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function SocialPage() {
  const { isSignedIn } = useUser();
  const [youtubeData, setYouTubeData] = useState<{ isConnected: boolean; channelTitle?: string | null }>({ isConnected: false });

  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      try {
        const r = await fetch("/api/youtube/status");
        if (r.ok) setYouTubeData(await r.json());
      } catch {}
    })();
  }, [isSignedIn]);

  return (
    <AppShell>
      <div className="min-h-full space-y-8">
        <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Social Integrations</h1>
            <p className="text-muted-foreground">Connect your social accounts for scheduling and publishing</p>
          </div>
        </MotionDiv>

        <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
          {/* YouTube */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Youtube className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-semibold text-foreground">YouTube</h2>
            </div>
            <YouTubeConnection isConnected={youtubeData.isConnected} channelTitle={youtubeData.channelTitle} onConnect={() => {}} />
          </div>

          {/* Coming soon cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[{icon: Instagram, name: 'Instagram'}, {icon: Twitter, name: 'X / Twitter'}, {icon: Facebook, name: 'Facebook'}, {icon: Linkedin, name: 'LinkedIn'}].map(({icon: Icon, name}) => (
              <div key={name} className="card p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="w-6 h-6" />
                  <div>
                    <div className="font-semibold text-foreground">{name}</div>
                    <div className="text-sm text-muted-foreground">Scheduling & publishing</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-muted">
                  <Clock className="w-3 h-3" /> Coming soon
                </span>
              </div>
            ))}
          </div>
        </MotionDiv>
      </div>
    </AppShell>
  );
}


