"use client";

import { motion } from "framer-motion";
const MotionDiv = motion.div as any;
import AppShell from "@/components/layout/AppShell";
import { Youtube, Instagram, Twitter, Facebook, Linkedin, Clock, Video } from "lucide-react";
import YouTubeConnection from "@/components/settings/YouTubeConnection";
import { useEffect, useState, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useNotifications } from "@/components/ui/Notification";

function SocialContent() {
  const { isSignedIn } = useUser();
  const searchParams = useSearchParams();
  const notifications = useNotifications();
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

  // Handle YouTube OAuth completion
  useEffect(() => {
    const youtubeCode = searchParams.get('youtube_code');
    
    if (youtubeCode && isSignedIn) {
      const completeYouTubeConnection = async () => {
        try {
          const response = await fetch('/api/youtube/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: youtubeCode }),
          });

          const result = await response.json();

          if (result.success) {
            notifications.addNotification({
              type: "success",
              title: "YouTube Connected!",
              message: `Successfully connected to ${result.channelTitle || 'your YouTube channel'}`
            });
            
            // Refresh YouTube status
            const statusResponse = await fetch("/api/youtube/status");
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              setYouTubeData(statusData);
            }
            
            // Clean up URL
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('youtube_code');
            window.history.replaceState({}, '', newUrl.toString());
          } else {
            notifications.addNotification({
              type: "error",
              title: "Connection Failed",
              message: result.error || "Failed to complete YouTube connection"
            });
          }
        } catch (error) {
          console.error("YouTube completion error:", error);
          notifications.addNotification({
            type: "error",
            title: "Connection Failed",
            message: "Failed to complete YouTube connection"
          });
        }
      };

      completeYouTubeConnection();
    }
  }, [searchParams, isSignedIn, notifications]);

  return (
    <div className="min-h-full space-y-8">
      {/* Clean Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#222831' }}>Social</h1>
        <p className="text-sm" style={{ color: '#393E46' }}>Connect your social media accounts</p>
      </div>

      {/* YouTube Connection */}
      <div className="rounded-lg p-6 mb-6" style={{ backgroundColor: '#EEEEEE', border: `1px solid #393E46` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
              <Youtube className="w-6 h-6 text-white" />
            </div> 
            <div>
              <h3 className="text-lg font-semibold" style={{ color: '#222831' }}>YouTube</h3>
              <p className="text-sm" style={{ color: '#393E46' }}>
                {youtubeData.isConnected 
                  ? `Connected: ${youtubeData.channelTitle || 'Your Channel'}`
                  : 'Connect your YouTube channel for direct uploads'
                }
              </p>
            </div>
          </div>
          <YouTubeConnection 
            isConnected={youtubeData.isConnected} 
            channelTitle={youtubeData.channelTitle} 
            onConnect={() => {
              // Refresh YouTube status after connection
              const fetchYouTubeStatus = async () => {
                try {
                  const response = await fetch("/api/youtube/status");
                  if (response.ok) {
                    const data = await response.json();
                    setYouTubeData(data);
                  }
                } catch (error) {
                  console.error("Failed to fetch YouTube status:", error);
                }
              };
              fetchYouTubeStatus();
            }} 
          />
        </div>
      </div>

      {/* Other Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {icon: Instagram, name: 'Instagram', desc: 'Photo & story publishing'},
          {icon: Twitter, name: 'X / Twitter', desc: 'Tweet scheduling'},
          {icon: Facebook, name: 'Facebook', desc: 'Page management'},
          {icon: Linkedin, name: 'LinkedIn', desc: 'Professional content'},
          {icon: Video, name: 'TikTok', desc: 'Short-form video content'}
        ].map(({icon: Icon, name, desc}) => (
          <div 
            key={name} 
            className="rounded-lg p-4 transition-all hover:scale-105"
            style={{ backgroundColor: '#EEEEEE', border: `1px solid #393E46` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#393E46' }}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold" style={{ color: '#222831' }}>{name}</div>
                  <div className="text-sm" style={{ color: '#393E46' }}>{desc}</div>
                </div>
              </div>
              <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: '#393E46', color: 'white' }}>
                Soon
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SocialPage() {
  return (
    <AppShell>
      <Suspense fallback={<div>Loading...</div>}>
        <SocialContent />
      </Suspense>
    </AppShell>
  );
}


