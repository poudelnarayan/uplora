"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import AppShell from "@/components/layout/AppShell";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import { useTeam } from "@/context/TeamContext";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/components/ui/Notification";
import { 
  FileText, 
  Send, 
  ArrowLeft, 
  User, 
  Users,
  Sparkles,
  Target,
  MessageCircle
} from "lucide-react";

const MotionDiv = motion.div as any;

export const dynamic = "force-dynamic";

export default function MakeTextPostPage() {
  const { selectedTeamId, selectedTeam } = useTeam();
  const router = useRouter();
  const notifications = useNotifications();
  
  const [textContent, setTextContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!textContent.trim()) return;
    
    setIsCreating(true);
    // Simulate text post creation
    setTimeout(() => {
      notifications.addNotification({
        type: "success",
        title: "Text post created!",
        message: "Your post has been shared successfully"
      });
      setTextContent("");
      setIsCreating(false);
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <>
      <SignedIn>
        <AppShell>
          <NextSeoNoSSR title="Make Text Post" noindex nofollow />
          
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
              <div className="w-full max-w-2xl mx-auto space-y-8">
                {/* Header Section */}
                <MotionDiv
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="text-center space-y-4"
                >
                  <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all hover:scale-105"
                    style={{ 
                      backgroundColor: 'transparent',
                      borderColor: 'rgb(57, 62, 70)',
                      color: 'rgb(57, 62, 70)'
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-medium">Back to Post Types</span>
                  </button>

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
                    Create Text Post
                  </h1>
                  <p className="text-lg" style={{ color: 'rgb(57, 62, 70)' }}>
                    Share your thoughts with your audience
                  </p>
                </MotionDiv>

                {/* Text Post Creator */}
                <MotionDiv
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="rounded-3xl p-8 border-2 shadow-2xl"
                  style={{
                    backgroundColor: 'rgb(238, 238, 238)',
                    borderColor: 'rgba(0, 173, 181, 0.3)'
                  }}
                >
                  <div className="space-y-6">
                    <div className="text-center space-y-4">
                      <MotionDiv
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.25, type: "spring", stiffness: 400, damping: 25 }}
                        className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center"
                        style={{ backgroundColor: 'rgb(0, 173, 181)' }}
                      >
                        <FileText className="w-10 h-10 text-white" />
                      </MotionDiv>
                      <div>
                        <h2 className="text-2xl font-bold" style={{ color: 'rgb(34, 40, 49)' }}>
                          Share Your Thoughts
                        </h2>
                        <p style={{ color: 'rgb(57, 62, 70)' }}>
                          What's on your mind today?
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <textarea
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="What's happening? Share your thoughts with your audience..."
                        className="w-full h-32 p-4 rounded-xl border-2 resize-none transition-all duration-300 focus:scale-[1.02]"
                        style={{
                          backgroundColor: 'white',
                          borderColor: textContent.length > 0 ? 'rgb(0, 173, 181)' : 'rgba(57, 62, 70, 0.3)',
                          color: 'rgb(34, 40, 49)'
                        }}
                        maxLength={280}
                      />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ color: 'rgb(57, 62, 70)' }}>
                          {textContent.length}/280 characters
                        </span>
                        <div className="w-16 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(57, 62, 70, 0.2)' }}>
                          <div 
                            className="h-full transition-all duration-300 rounded-full"
                            style={{ 
                              width: `${(textContent.length / 280) * 100}%`,
                              backgroundColor: textContent.length > 250 ? 'rgb(239, 68, 68)' : 'rgb(0, 173, 181)'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <MotionDiv
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <button
                        onClick={handleCreate}
                        disabled={!textContent.trim() || textContent.length > 280 || isCreating}
                        className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        style={{
                          backgroundColor: textContent.trim() && textContent.length <= 280 ? 'rgb(0, 173, 181)' : 'rgba(57, 62, 70, 0.3)',
                          color: 'white'
                        }}
                      >
                        {isCreating ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Creating Post...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Share Post
                          </>
                        )}
                      </button>
                    </MotionDiv>
                  </div>
                </MotionDiv>

                {/* Features Section */}
                <MotionDiv
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  {[
                    { icon: MessageCircle, title: "Quick Sharing", desc: "Instant text updates" },
                    { icon: Target, title: "Audience Reach", desc: "Connect with followers" },
                    { icon: Sparkles, title: "Engagement", desc: "Drive conversations" }
                  ].map((feature, index) => {
                    const IconComponent = feature.icon;
                    return (
                      <MotionDiv
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.25 + index * 0.05 }}
                        whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.15 } }}
                        className="text-center p-6 rounded-2xl border"
                        style={{
                          backgroundColor: 'rgba(238, 238, 238, 0.8)',
                          borderColor: 'rgba(57, 62, 70, 0.2)'
                        }}
                      >
                        <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(0, 173, 181, 0.1)' }}
                        >
                          <IconComponent className="w-6 h-6" style={{ color: 'rgb(0, 173, 181)' }} />
                        </div>
                        <h3 className="font-bold mb-2" style={{ color: 'rgb(34, 40, 49)' }}>
                          {feature.title}
                        </h3>
                        <p className="text-sm" style={{ color: 'rgb(57, 62, 70)' }}>
                          {feature.desc}
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
        <RedirectToSignIn redirectUrl="/make-post/text" />
      </SignedOut>
    </>
  );
}