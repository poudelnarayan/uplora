"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import AppShell from "@/components/layout/AppShell";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import { useTeam } from "@/context/TeamContext";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/components/ui/Notification";
import { useUploads } from "@/context/UploadContext";
import { 
  Sparkles, 
  Upload, 
  ArrowLeft, 
  User, 
  Users,
  Zap,
  Target,
  TrendingUp
} from "lucide-react";

const MotionDiv = motion.div as any;

export const dynamic = "force-dynamic";

export default function MakeReelPage() {
  const { selectedTeamId, selectedTeam } = useTeam();
  const router = useRouter();
  const notifications = useNotifications();
  const { enqueueUpload, hasActive } = useUploads();
  
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (hasActive || isCreating) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFile = droppedFiles.find(file => file.type.startsWith('video/'));
    
    if (validFile) {
      setFile(validFile);
      notifications.addNotification({ 
        type: "success", 
        title: "Video selected!", 
        message: `${validFile.name} is ready to upload` 
      });
    } else {
      notifications.addNotification({ 
        type: "error", 
        title: "Invalid file type", 
        message: "Please drop a video file" 
      });
    }
  }, [hasActive, isCreating, notifications]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      notifications.addNotification({ 
        type: "success", 
        title: "Video selected!", 
        message: `${selectedFile.name} is ready to upload` 
      });
    }
  };

  const handleCreate = async () => {
    if (!file) return;
    
    setIsCreating(true);
    try {
      const uploadId = enqueueUpload(file, selectedTeamId);
      notifications.addNotification({ 
        type: "info", 
        title: "Creating reel...", 
        message: "Your short video is being processed",
        sticky: true,
        stickyConditions: {
          dismissOnRouteChange: true,
          dismissAfterSeconds: 25
        }
      });
      
      // Reset form
      setFile(null);
      router.push("/dashboard");
    } catch (error) {
      notifications.addNotification({
        type: "error",
        title: "Creation failed",
        message: "Please try again"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <SignedIn>
        <AppShell>
          <NextSeoNoSSR title="Make Reel" noindex nofollow />
          
          <div className="min-h-[calc(100vh-8rem)] flex flex-col">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <MotionDiv
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.1, scale: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute -top-32 -right-32 w-96 h-96 rounded-full"
                style={{ backgroundColor: 'rgb(34, 40, 49)' }}
              />
              <MotionDiv
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.05, scale: 1 }}
                transition={{ duration: 2.5, ease: "easeOut", delay: 0.5 }}
                className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full"
                style={{ backgroundColor: 'rgb(0, 173, 181)' }}
              />
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 py-8">
              <div className="w-full max-w-2xl mx-auto space-y-8">
                {/* Header Section */}
                <MotionDiv
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="text-center space-y-4"
                >
                  <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all hover:scale-105"
                    style={{ 
                      backgroundColor: 'transparent',
                      borderColor: 'rgb(34, 40, 49)',
                      color: 'rgb(34, 40, 49)'
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-medium">Back to Post Types</span>
                  </button>

                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border-2"
                    style={{ 
                      backgroundColor: 'rgba(34, 40, 49, 0.1)',
                      borderColor: 'rgb(34, 40, 49)',
                      color: 'rgb(34, 40, 49)'
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
                    Create Short Reel
                  </h1>
                  <p className="text-lg" style={{ color: 'rgb(57, 62, 70)' }}>
                    Create engaging short-form content
                  </p>
                </MotionDiv>

                {/* Reel Upload Interface */}
                <MotionDiv
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="rounded-3xl p-8 border-2 shadow-2xl"
                  style={{
                    backgroundColor: 'rgb(238, 238, 238)',
                    borderColor: 'rgba(34, 40, 49, 0.3)'
                  }}
                >
                  {!file ? (
                    <div className="space-y-6">
                      <div className="text-center space-y-4">
                        <MotionDiv
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
                          className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center"
                          style={{ backgroundColor: 'rgb(34, 40, 49)' }}
                        >
                          <Sparkles className="w-10 h-10 text-white" />
                        </MotionDiv>
                        <div>
                          <h2 className="text-2xl font-bold" style={{ color: 'rgb(34, 40, 49)' }}>
                            Upload Short Video
                          </h2>
                          <p style={{ color: 'rgb(57, 62, 70)' }}>
                            Create engaging reels for TikTok & Instagram
                          </p>
                        </div>
                      </div>

                      <MotionDiv
                        animate={{
                          scale: isDragOver ? 1.02 : 1,
                          borderColor: isDragOver ? 'rgb(34, 40, 49)' : 'rgba(34, 40, 49, 0.3)'
                        }}
                        transition={{ duration: 0.2 }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => {
                          if (hasActive || isCreating) return;
                          document.getElementById('reel-file-input')?.click();
                        }}
                        className={`
                          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
                          transition-all duration-300 hover:scale-[1.01]
                          ${hasActive || isCreating ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        style={{
                          backgroundColor: isDragOver ? 'rgba(34, 40, 49, 0.05)' : 'white',
                          borderColor: isDragOver ? 'rgb(34, 40, 49)' : 'rgba(34, 40, 49, 0.3)'
                        }}
                      >
                        <input
                          id="reel-file-input"
                          type="file"
                          accept="video/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          disabled={hasActive || isCreating}
                        />
                        
                        <div className="space-y-4">
                          <MotionDiv
                            animate={{ y: isDragOver ? -5 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(34, 40, 49, 0.1)' }}
                          >
                            <Upload className="w-8 h-8" style={{ color: 'rgb(34, 40, 49)' }} />
                          </MotionDiv>
                          
                          <div>
                            <h3 className="text-xl font-bold mb-2" style={{ color: 'rgb(34, 40, 49)' }}>
                              {isDragOver ? 'Drop your video here!' : 'Drag & drop or click to browse'}
                            </h3>
                            <p style={{ color: 'rgb(57, 62, 70)' }}>
                              {hasActive 
                                ? "Please wait for current upload to finish" 
                                : "Select your short video file"
                              }
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 justify-center">
                            {['MP4', 'MOV', 'WebM'].map(format => (
                              <span
                                key={format}
                                className="px-3 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: 'rgba(34, 40, 49, 0.1)',
                                  color: 'rgb(34, 40, 49)'
                                }}
                              >
                                {format}
                              </span>
                            ))}
                          </div>
                        </div>
                      </MotionDiv>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* File Preview */}
                      <MotionDiv
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="p-6 rounded-2xl border-2"
                        style={{
                          backgroundColor: 'white',
                          borderColor: 'rgb(34, 40, 49)'
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <MotionDiv
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="w-16 h-16 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(34, 40, 49, 0.1)' }}
                          >
                            <Sparkles className="w-8 h-8" style={{ color: 'rgb(34, 40, 49)' }} />
                          </MotionDiv>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg truncate" style={{ color: 'rgb(34, 40, 49)' }}>
                              {file.name}
                            </h3>
                            <p style={{ color: 'rgb(57, 62, 70)' }}>
                              {formatFileSize(file.size)} • {file.type.split('/')[1]?.toUpperCase()}
                            </p>
                          </div>
                          
                          {!isCreating && (
                            <MotionDiv
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <button
                                onClick={() => setFile(null)}
                                className="p-2 rounded-full transition-all duration-200"
                                style={{
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                  color: 'rgb(239, 68, 68)'
                                }}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </MotionDiv>
                          )}
                        </div>
                      </MotionDiv>

                      {/* Create Button */}
                      <MotionDiv
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <button
                          onClick={handleCreate}
                          disabled={isCreating || hasActive}
                          className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                          style={{
                            backgroundColor: 'rgb(34, 40, 49)',
                            color: 'white'
                          }}
                        >
                          {isCreating || hasActive ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Creating Reel...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5" />
                              Create Reel
                            </>
                          )}
                        </button>
                      </MotionDiv>
                    </div>
                  )}
                </MotionDiv>

                {/* Features Section */}
                <MotionDiv
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  {[
                    { icon: Zap, title: "Quick & Viral", desc: "Perfect for TikTok & Instagram" },
                    { icon: Target, title: "Engaging", desc: "Short-form content that hooks" },
                    { icon: TrendingUp, title: "Trending", desc: "Optimized for discovery" }
                  ].map((feature, index) => {
                    const IconComponent = feature.icon;
                    return (
                      <MotionDiv
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                        whileHover={{ y: -5 }}
                        className="text-center p-6 rounded-2xl border"
                        style={{
                          backgroundColor: 'rgba(238, 238, 238, 0.8)',
                          borderColor: 'rgba(34, 40, 49, 0.2)'
                        }}
                      >
                        <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(34, 40, 49, 0.1)' }}
                        >
                          <IconComponent className="w-6 h-6" style={{ color: 'rgb(34, 40, 49)' }} />
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
        <RedirectToSignIn redirectUrl="/make-post/reel" />
      </SignedOut>
    </>
  );
}