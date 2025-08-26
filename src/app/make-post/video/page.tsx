"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import AppShell from "@/components/layout/AppShell";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import { useTeam } from "@/context/TeamContext";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/components/ui/Notification";
import VideoUploadZone from "@/components/upload/VideoUploadZone";
import { 
  Youtube, 
  ArrowLeft, 
  User, 
  Users,
  Video,
  Target,
  BarChart3,
  CheckCircle
} from "lucide-react";

const MotionDiv = motion.div as any;

export const dynamic = "force-dynamic";

export default function MakeLongVideoPage() {
  const { selectedTeamId, selectedTeam } = useTeam();
  const router = useRouter();
  const notifications = useNotifications();
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);

  const handleUploadComplete = (videoId: string) => {
    setUploadedVideoId(videoId);
    notifications.addNotification({
      type: "success",
      title: "Video uploaded successfully!",
      message: "Your video is now ready for YouTube upload"
    });
  };

  const handleContinueToYouTube = () => {
    if (uploadedVideoId) {
      router.push(`/videos/${uploadedVideoId}`);
    }
  };

  return (
    <>
      <SignedIn>
        <AppShell>
          <NextSeoNoSSR title="Make YouTube Video" noindex nofollow />
          
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
                style={{ backgroundColor: 'rgb(34, 40, 49)' }}
              />
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 py-8">
              {/* Back Button - Top Left */}
              <MotionDiv
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute top-4 left-4"
              >
                <button
                  onClick={() => router.back()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: 'transparent',
                    borderColor: 'rgb(0, 173, 181)',
                    color: 'rgb(0, 173, 181)'
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="font-medium">Back to Post Types</span>
                </button>
              </MotionDiv>

              <div className="w-full max-w-4xl mx-auto space-y-8">
                {/* Header Section */}
                <MotionDiv
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="text-center space-y-4"
                >
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border-2"
                    style={{ 
                      backgroundColor: 'rgba(0, 173, 181, 0.1)',
                      borderColor: 'rgb(0, 173, 181)',
                      color: 'rgb(0, 173, 181)'
                    }}
                  >
                    {selectedTeam ? (
                      <>
                        <Users className="w-5 h-5" />
                        <span className="font-semibold">Team: {selectedTeam.name}</span>
                      </>
                    ) : (
                      <>
                        <User className="w-5 h-5" />
                        <span className="font-semibold">Personal Workspace</span>
                      </>
                    )}
                  </div>
                  
                  <h1 className="text-4xl font-bold" style={{ color: 'rgb(34, 40, 49)' }}>
                    Create YouTube Video
                  </h1>
                  <p className="text-lg" style={{ color: 'rgb(57, 62, 70)' }}>
                    Upload your video and get it ready for YouTube
                  </p>
                </MotionDiv>

                {/* Upload Zone */}
                <MotionDiv
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <VideoUploadZone
                    onUploadComplete={handleUploadComplete}
                    teamId={selectedTeamId}
                  />
                </MotionDiv>

                {/* Success State */}
                {uploadedVideoId && (
                  <MotionDiv
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-center space-y-4"
                  >
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border-2"
                      style={{ 
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderColor: 'rgb(34, 197, 94)',
                        color: 'rgb(34, 197, 94)'
                      }}
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Video Uploaded Successfully!</span>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold" style={{ color: 'rgb(34, 40, 49)' }}>
                        What's Next?
                      </h3>
                      <p className="text-base" style={{ color: 'rgb(57, 62, 70)' }}>
                        Your video is now ready for YouTube upload. You can add details, set privacy settings, and publish to YouTube.
                      </p>
                      
                      <button
                        onClick={handleContinueToYouTube}
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-medium transition-all hover:scale-105"
                        style={{ 
                          backgroundColor: 'rgb(0, 173, 181)',
                          color: 'white'
                        }}
                      >
                        <Youtube className="w-5 h-5" />
                        Continue to YouTube Upload
                      </button>
                    </div>
                  </MotionDiv>
                )}

                {/* Features Section */}
                <MotionDiv
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
                >
                  {[
                    {
                      icon: Video,
                      title: "High Quality",
                      description: "Supports all major video formats up to 500MB"
                    },
                    {
                      icon: Target,
                      title: "Fast Upload",
                      description: "Multipart upload for reliable, fast transfers"
                    },
                    {
                      icon: BarChart3,
                      title: "Progress Tracking",
                      description: "Real-time progress with cancel option"
                    }
                  ].map((feature, index) => {
                    const IconComponent = feature.icon;
                    return (
                      <MotionDiv
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                        className="p-6 rounded-2xl border-2 text-center space-y-4"
                        style={{ 
                          backgroundColor: 'white',
                          borderColor: 'rgb(238, 238, 238)'
                        }}
                      >
                        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(0, 173, 181, 0.1)' }}
                        >
                          <IconComponent className="w-8 h-8" style={{ color: 'rgb(0, 173, 181)' }} />
                        </div>
                        <h3 className="text-lg font-semibold" style={{ color: 'rgb(34, 40, 49)' }}>
                          {feature.title}
                        </h3>
                        <p className="text-sm" style={{ color: 'rgb(57, 62, 70)' }}>
                          {feature.description}
                        </p>
                      </MotionDiv>
                    );
                  })}
                </MotionDiv>
              </div>
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