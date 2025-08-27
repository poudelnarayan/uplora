"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import AppShell from "@/components/layout/AppLayout";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import { useTeam } from "@/context/TeamContext";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/components/ui/Notification";
import { useUploads } from "@/context/UploadContext";
import { 
  Image as ImageIcon, 
  Upload, 
  ArrowLeft, 
  User, 
  Users,
  Sparkles,
  Target,
  Eye
} from "lucide-react";

const MotionDiv = motion.div as any;

export const dynamic = "force-dynamic";

export default function MakeImagePostPage() {
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
    const validFile = droppedFiles.find(file => file.type.startsWith('image/'));
    
    if (validFile) {
      setFile(validFile);
      notifications.addNotification({ 
        type: "success", 
        title: "Image selected!", 
        message: `${validFile.name} is ready to upload` 
      });
    } else {
      notifications.addNotification({ 
        type: "error", 
        title: "Invalid file type", 
        message: "Please drop an image file" 
      });
    }
  }, [hasActive, isCreating, notifications]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      notifications.addNotification({ 
        type: "success", 
        title: "Image selected!", 
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
        title: "Creating image post...", 
        message: "Your image is being processed",
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
          <NextSeoNoSSR title="Make Image Post" noindex nofollow />
          
          <div className="min-h-[calc(100vh-8rem)] flex flex-col">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <MotionDiv
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.1, scale: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute -top-32 -right-32 w-96 h-96 rounded-full"
                style={{ backgroundColor: 'rgb(57, 62, 70)' }}
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
                    borderColor: 'rgb(57, 62, 70)',
                    color: 'rgb(57, 62, 70)'
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="font-medium">Back to Post Types</span>
                </button>
              </MotionDiv>

              <div className="w-full max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <MotionDiv
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="text-center space-y-4"
                >
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border-2"
                    style={{ 
                      backgroundColor: 'rgba(57, 62, 70, 0.1)',
                      borderColor: 'rgb(57, 62, 70)',
                      color: 'rgb(57, 62, 70)'
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
                    Create Image Post
                  </h1>
                  <p className="text-lg" style={{ color: 'rgb(57, 62, 70)' }}>
                    Share photos and visual content
                  </p>
                </MotionDiv>

                {/* Image Upload Interface */}
                <MotionDiv
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="rounded-3xl p-8 border-2 shadow-2xl"
                  style={{
                    backgroundColor: 'rgb(238, 238, 238)',
                    borderColor: 'rgba(57, 62, 70, 0.3)'
                  }}
                >
                  {!file ? (
                    <div className="space-y-6">
                      <div className="text-center space-y-4">
                        <MotionDiv
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.25, type: "spring", stiffness: 400, damping: 25 }}
                          className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center"
                          style={{ backgroundColor: 'rgb(57, 62, 70)' }}
                        >
                          <ImageIcon className="w-10 h-10 text-white" />
                        </MotionDiv>
                        <div>
                          <h2 className="text-2xl font-bold" style={{ color: 'rgb(34, 40, 49)' }}>
                            Upload Image
                          </h2>
                          <p style={{ color: 'rgb(57, 62, 70)' }}>
                            Share photos and graphics
                          </p>
                        </div>
                      </div>

                      <MotionDiv
                        animate={{
                          scale: isDragOver ? 1.02 : 1,
                          borderColor: isDragOver ? 'rgb(57, 62, 70)' : 'rgba(57, 62, 70, 0.3)'
                        }}
                        transition={{ duration: 0.2 }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => {
                          if (hasActive || isCreating) return;
                          document.getElementById('image-file-input')?.click();
                        }}
                        className={`
                          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
                          transition-all duration-300 hover:scale-[1.01]
                          ${hasActive || isCreating ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        style={{
                          backgroundColor: isDragOver ? 'rgba(57, 62, 70, 0.05)' : 'white',
                          borderColor: isDragOver ? 'rgb(57, 62, 70)' : 'rgba(57, 62, 70, 0.3)'
                        }}
                      >
                        <input
                          id="image-file-input"
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          disabled={hasActive || isCreating}
                        />
                        
                        <div className="space-y-4">
                          <MotionDiv
                            animate={{ y: isDragOver ? -5 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(57, 62, 70, 0.1)' }}
                          >
                            <Upload className="w-8 h-8" style={{ color: 'rgb(57, 62, 70)' }} />
                          </MotionDiv>
                          
                          <div>
                            <h3 className="text-xl font-bold mb-2" style={{ color: 'rgb(34, 40, 49)' }}>
                              {isDragOver ? 'Drop your image here!' : 'Drag & drop or click to browse'}
                            </h3>
                            <p style={{ color: 'rgb(57, 62, 70)' }}>
                              {hasActive 
                                ? "Please wait for current upload to finish" 
                                : "Select your image file"
                              }
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 justify-center">
                            {['JPG', 'PNG', 'GIF', 'WebP'].map(format => (
                              <span
                                key={format}
                                className="px-3 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: 'rgba(57, 62, 70, 0.1)',
                                  color: 'rgb(57, 62, 70)'
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
                          borderColor: 'rgb(57, 62, 70)'
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <MotionDiv
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="w-16 h-16 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(57, 62, 70, 0.1)' }}
                          >
                            <ImageIcon className="w-8 h-8" style={{ color: 'rgb(57, 62, 70)' }} />
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
                        whileTap={{ scale: 0.96 }}
                      >
                        <button
                          onClick={handleCreate}
                          disabled={isCreating || hasActive}
                          className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                          style={{
                            backgroundColor: 'rgb(57, 62, 70)',
                            color: 'white'
                          }}
                        >
                          {isCreating || hasActive ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Creating Post...
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-5 h-5" />
                              Create Image Post
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
                  transition={{ duration: 0.25, delay: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  {[
                    { icon: Eye, title: "Visual Impact", desc: "Engaging photo content" },
                    { icon: Target, title: "Social Ready", desc: "Perfect for all platforms" },
                    { icon: Sparkles, title: "High Quality", desc: "Optimized uploads" }
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
                          style={{ backgroundColor: 'rgba(57, 62, 70, 0.1)' }}
                        >
                          <IconComponent className="w-6 h-6" style={{ color: 'rgb(57, 62, 70)' }} />
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
        <RedirectToSignIn redirectUrl="/make-post/image" />
      </SignedOut>
    </>
  );
}