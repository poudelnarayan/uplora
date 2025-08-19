"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import AppShell from "@/components/layout/AppShell";
import { useNotifications } from "@/components/ui/Notification";
import { useTeam } from "@/context/TeamContext";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsOverview from "@/components/dashboard/StatsOverview";
import VideosList from "@/components/dashboard/VideosList";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { AlertCircle, Mail, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div as any;

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  status: "PROCESSING" | "PENDING" | "PUBLISHED";
  uploadedAt: string;
  updatedAt: string;
  duration?: string;
  views?: number;
  likes?: number;
  s3Key?: string;
  thumbnailKey?: string | null;
  description?: string;
  visibility?: "private" | "unlisted" | "public";
  madeForKids?: boolean;
  userRole?: "OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | null;
  uploader?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export default function Dashboard() {
  const { data: session, update: updateSession } = useSession();
  const notifications = useNotifications();
  const { selectedTeamId, selectedTeam } = useTeam();
  
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbnailUrls, setThumbnailUrls] = useState<Map<string, string>>(new Map());
  const [loadingThumbnails, setLoadingThumbnails] = useState<Set<string>>(new Set());
  const [processingVideoId, setProcessingVideoId] = useState<string | null>(null);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<{ id: string; title: string } | null>(null);
  const [showEmailBanner, setShowEmailBanner] = useState(true);
  const [resendingEmail, setResendingEmail] = useState(false);

  // Function to resend verification email
  const handleResendVerification = async () => {
    if (!session?.user?.email) return;
    
    setResendingEmail(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email }),
      });

      const result = await response.json();

      if (response.ok) {
        notifications.addNotification({
          type: "success",
          title: "Verification email sent!",
          message: "Please check your inbox for the verification link."
        });
      } else if (response.status === 400 && result.message === "Email is already verified") {
        // Email is already verified in database but session is stale
        notifications.addNotification({
          type: "info",
          title: "Email Already Verified",
          message: "Your email is already verified. Refreshing your session..."
        });
        
        // Force session refresh
        await updateSession();
        
        // Hide the banner after a brief delay
        setTimeout(() => {
          setShowEmailBanner(false);
        }, 2000);
      } else {
        notifications.addNotification({
          type: "error",
          title: "Failed to resend email",
          message: result.message || "Please try again later."
        });
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      notifications.addNotification({
        type: "error",
        title: "Something went wrong",
        message: "Please try again later."
      });
    } finally {
      setResendingEmail(false);
    }
  };

  // Function to load thumbnail URL
  const loadThumbnailUrl = async (videoId: string, thumbnailKey: string) => {
    if (loadingThumbnails.has(videoId) || thumbnailUrls.has(videoId)) return;
    
    setLoadingThumbnails(prev => new Set(prev).add(videoId));
    
    try {
      const res = await fetch(`/api/s3/get-url?key=${encodeURIComponent(thumbnailKey)}`);
      if (res.ok) {
        const { url } = await res.json();
        if (url) {
          setThumbnailUrls(prev => new Map(prev).set(videoId, url));
        }
      }
    } catch (error) {
      console.error('Failed to load thumbnail:', error);
    } finally {
      setLoadingThumbnails(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    }
  };

  const fetchVideos = useCallback(async () => {
    try {
      const apiUrl = selectedTeamId ? `/api/videos?teamId=${selectedTeamId}` : "/api/videos";
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        const list: VideoItem[] = Array.isArray(data) ? data : [];
        const videosWithRoles = await Promise.all(
          list.map(async (video) => {
            try {
              const roleRes = await fetch(`/api/videos/${video.id}/role`);
              if (roleRes.ok) {
                const { role } = await roleRes.json();
                return { ...video, userRole: role };
              }
            } catch (error) {
              console.error(`Failed to get role for video ${video.id}:`, error);
            }
            return { ...video, userRole: null };
          })
        );
        setVideos(videosWithRoles);
        videosWithRoles.forEach(video => {
          if (video.thumbnailKey) {
            loadThumbnailUrl(video.id, video.thumbnailKey);
          }
        });
      } else {
        setVideos([]);
      }
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTeamId]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Check for stale session on mount and refresh if needed
  useEffect(() => {
    const checkSessionFreshness = async () => {
      if (!session?.user?.email || session.user.emailVerified) {
        return; // No need to check if already verified or not logged in
      }

      try {
        // Check if email is actually verified in database
        const response = await fetch("/api/debug/refresh-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.needsRefresh) {
            console.log("🔄 Detected stale session, refreshing...");
            
            // Update the session to get fresh data
            await updateSession();
            
            notifications.addNotification({
              type: "success",
              title: "Session Updated",
              message: "Your email verification status has been refreshed."
            });
          }
        }
      } catch (error) {
        console.error("Session freshness check failed:", error);
      }
    };

    // Run the check after a short delay to ensure session is loaded
    const timer = setTimeout(checkSessionFreshness, 1000);
    return () => clearTimeout(timer);
  }, [session?.user?.email, updateSession, notifications]);

  // Realtime: auto-refresh list on video events
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      const url = selectedTeamId ? `/api/events?teamId=${encodeURIComponent(selectedTeamId)}` : `/api/events`;
      es = new EventSource(url);
      const handler = (ev: MessageEvent) => {
        try {
          const evt = JSON.parse(ev.data || '{}');
          if (evt?.type === 'user.email.verified' && evt?.userId === session?.user?.id) {
            // Update session to reflect email verification
            updateSession();
            notifications.addNotification({
              type: "success",
              title: "Email verified!",
              message: "Your email has been successfully verified."
            });
          } else if (evt?.type?.startsWith('video.')) {
            if (evt.type === 'video.created') {
              // Add new video to list immediately
              const newVideo: VideoItem = {
                id: evt.payload.id,
                title: evt.payload.title,
                status: 'PROCESSING' as const,
                uploadedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                thumbnail: '',
                thumbnailKey: null,
                userRole: 'OWNER' as const,
                uploader: { 
                  id: session?.user?.id || '',
                  name: session?.user?.name || '', 
                  email: session?.user?.email || '' 
                }
              };
              setVideos(prev => [newVideo, ...prev]);
              
              notifications.addNotification({
                type: "success",
                title: "Video uploaded!",
                message: `"${evt.payload.title}" has been uploaded successfully`
              });
            } else if (evt.type === 'video.deleted') {
              // Remove deleted video from list immediately
              setVideos(prev => prev.filter(video => video.id !== evt.payload.id));
            } else if (evt.type === 'video.status') {
              // Update video status immediately
              setVideos(prev => prev.map(video => 
                video.id === evt.payload.id 
                  ? { ...video, status: evt.payload.status, updatedAt: new Date().toISOString() }
                  : video
              ));
            } else if (evt.type === 'video.updated') {
              // Refresh the specific video data
              (async () => {
                try {
                  const res = await fetch(`/api/videos/${evt.payload.id}`, { cache: 'no-store' });
                  if (res.ok) {
                    const updatedVideo = await res.json();
                    setVideos(prev => prev.map(video => 
                      video.id === evt.payload.id 
                        ? { ...video, ...updatedVideo, updatedAt: new Date().toISOString() }
                        : video
                    ));
                  }
                } catch {}
              })();
            } else {
              // For other video events, reload the entire list
              (async () => {
                const apiUrl = selectedTeamId ? `/api/videos?teamId=${selectedTeamId}` : "/api/videos";
                const res = await fetch(apiUrl, { cache: 'no-store' });
                const data = await res.json();
                if (Array.isArray(data)) {
                  setVideos(data);
                }
              })();
            }
          }
        } catch {}
      };
      es.onmessage = handler;
      es.onerror = () => { try { es?.close(); } catch {}; es = null; };
    } catch {}
    return () => { try { es?.close(); } catch {} };
  }, [selectedTeamId, session?.user?.name, session?.user?.email, notifications]);

  const changeVideoStatus = async (videoId: string, newStatus: string) => {
    // Prevent multiple clicks
    if (processingVideoId) return;
    
    setProcessingVideoId(videoId);
    try {
      let endpoint = '';
      
      if (newStatus === 'PENDING') {
        endpoint = `/api/videos/${videoId}/request-approval`;
      } else if (newStatus === 'PUBLISHED') {
        endpoint = `/api/videos/${videoId}/approve`;
      } else {
        return;
      }
      
      const response = await fetch(endpoint, { method: 'POST' });
      
      if (response.ok) {
        setVideos(prev => prev.map(video => 
          video.id === videoId 
            ? { ...video, status: newStatus, updatedAt: new Date().toISOString() }
            : video
        ));
        
        const statusText = newStatus === 'PENDING' ? 'pending' : 
                          newStatus === 'PUBLISHED' ? 'published to YouTube' : newStatus;
        
        notifications.addNotification({
          type: "success",
          title: newStatus === 'PUBLISHED' ? "Video published!" : "Status updated",
          message: `Video ${newStatus === 'PUBLISHED' ? 'has been published to YouTube' : `status changed to ${statusText}`}`
        });
      } else {
        const error = await response.json();
        notifications.addNotification({
          type: "error",
          title: "Status change failed",
          message: error.error || "Failed to update video status"
        });
      }
    } catch (error) {
      notifications.addNotification({
        type: "error",
        title: "Status change failed",
        message: "An error occurred while updating the video status"
      });
    } finally {
      setProcessingVideoId(null);
    }
  };

  const deleteVideo = async (videoId: string, videoTitle: string) => {
    // Set the video to delete and open modal
    setVideoToDelete({ id: videoId, title: videoTitle });
    setDeleteModalOpen(true);
  };

  const confirmDeleteVideo = async () => {
    if (!videoToDelete) return;
    
    // Prevent multiple clicks
    if (deletingVideoId) return;
    
    setDeletingVideoId(videoToDelete.id);
    try {
      const response = await fetch(`/api/videos/${videoToDelete.id}/delete`, { method: 'DELETE' });
      
      if (response.ok) {
        setVideos(prev => prev.filter(video => video.id !== videoToDelete.id));
        
        notifications.addNotification({
          type: "success",
          title: "Video deleted",
          message: `"${videoToDelete.title}" has been permanently deleted`
        });
      } else {
        const error = await response.json();
        notifications.addNotification({
          type: "error",
          title: "Delete failed",
          message: error.error || "Failed to delete video"
        });
      }
    } catch (error) {
      notifications.addNotification({
        type: "error",
        title: "Delete failed",
        message: "An error occurred while deleting the video"
      });
    } finally {
      setDeletingVideoId(null);
      setDeleteModalOpen(false);
      setVideoToDelete(null);
    }
  };

  return (
    <AppShell>
      {/* Email Verification Banner */}
      <AnimatePresence mode="wait" initial={false}>
        {showEmailBanner && session?.user && !session.user.emailVerified && (
          <MotionDiv
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800"
          >
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                      Please verify your email address
                    </span>
                    <span className="text-yellow-700 dark:text-yellow-300">
                      to access all features
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResendVerification}
                    disabled={resendingEmail}
                    className="btn btn-sm btn-outline text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-800/50"
                  >
                    {resendingEmail ? (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Resend Email
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => setShowEmailBanner(false)}
                    className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      <div className="h-full flex flex-col">
        <DashboardHeader teamName={selectedTeam?.name} />
        <StatsOverview videos={videos} />
        
        <div className="flex-1 space-y-4 lg:space-y-6">
          <div className="flex items-center justify-between text-center lg:text-left">
            <h2 className="text-xl font-semibold text-foreground">Recent Videos</h2>
          </div>

          <VideosList
            videos={videos}
            loading={loading}
            thumbnailUrls={Object.fromEntries(thumbnailUrls)}
            loadingThumbnails={Object.fromEntries([...loadingThumbnails].map(id => [id, true]))}
            onChangeVideoStatus={changeVideoStatus}
            onDeleteVideo={deleteVideo}
            processingVideoId={processingVideoId}
            deletingVideoId={deletingVideoId}
          />

          {/* Delete Confirmation Modal */}
          <ConfirmationModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onConfirm={confirmDeleteVideo}
            title="Delete Video?"
            message="This action cannot be undone. The video will be permanently deleted from both the platform and YouTube (if published)."
            itemName={videoToDelete?.title}
            confirmText={deletingVideoId ? "Deleting..." : "Delete Permanently"}
            cancelText="Cancel"
            variant="danger"
            icon="trash"
            isLoading={!!deletingVideoId}
          />
        </div>
      </div>
    </AppShell>
  );
}