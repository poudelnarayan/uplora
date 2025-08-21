"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import AppShell from "@/components/layout/AppShell";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { useNotifications } from "@/components/ui/Notification";
import { useTeam } from "@/context/TeamContext";
import DashboardHeader from "@/components/pages/Dashboard/DashboardHeader";
import StatsOverview from "@/components/pages/Dashboard/StatsOverview";
import VideosList from "@/components/pages/Dashboard/VideosList";
import EmailVerificationBanner from "@/components/pages/Dashboard/EmailVerificationBanner";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import styles from "./Dashboard.module.css";

export const dynamic = "force-dynamic";

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
  const { user, isLoaded } = useUser();
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

  // Function to resend verification email (simplified for Clerk)
  const handleResendVerification = async () => {
    if (!user?.emailAddresses?.[0]) return;
    
    setResendingEmail(true);
    try {
      // Use Clerk's built-in email verification
      await user.emailAddresses[0].prepareVerification({ strategy: "email_code" });
      
      notifications.addNotification({
        type: "success",
        title: "Verification email sent!",
        message: "Please check your inbox for the verification link."
      });
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

  // Check if email is verified with Clerk
  useEffect(() => {
    if (user?.emailAddresses?.[0]?.verification?.status === "verified") {
      setShowEmailBanner(false);
    }
  }, [user]);

  // Realtime: auto-refresh list on video events
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      const url = selectedTeamId ? `/api/events?teamId=${encodeURIComponent(selectedTeamId)}` : `/api/events`;
      es = new EventSource(url);
      const handler = (ev: MessageEvent) => {
        try {
          const evt = JSON.parse(ev.data || '{}');
          if (evt?.type === 'user.email.verified' && evt?.userId === user?.id) {
            setShowEmailBanner(false);
            notifications.addNotification({
              type: "success",
              title: "Email verified!",
              message: "Your email has been successfully verified."
            });
          } else if (evt?.type?.startsWith('video.')) {
            if (evt.type === 'video.created') {
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
                  id: user?.id || '',
                  name: user?.fullName || user?.firstName || '', 
                  email: user?.emailAddresses?.[0]?.emailAddress || '' 
                }
              };
              setVideos(prev => [newVideo, ...prev]);
              
              notifications.addNotification({
                type: "success",
                title: "Video uploaded!",
                message: `"${evt.payload.title}" has been uploaded successfully`
              });
            } else if (evt.type === 'video.deleted') {
              setVideos(prev => prev.filter(video => video.id !== evt.payload.id));
            } else if (evt.type === 'video.status') {
              setVideos(prev => prev.map(video => 
                video.id === evt.payload.id 
                  ? { ...video, status: evt.payload.status, updatedAt: new Date().toISOString() }
                  : video
              ));
            } else if (evt.type === 'video.updated') {
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
  }, [selectedTeamId, user?.fullName, user?.emailAddresses?.[0]?.emailAddress, notifications]);

  const changeVideoStatus = async (videoId: string, newStatus: string) => {
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
    setVideoToDelete({ id: videoId, title: videoTitle });
    setDeleteModalOpen(true);
  };

  const confirmDeleteVideo = async () => {
    if (!videoToDelete) return;
    
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
    <>
      <SignedIn>
        <AppShell>
          <NextSeoNoSSR title="Dashboard" noindex nofollow />
          
          <div className={styles.container}>
            {/* Email Verification Banner */}
            <EmailVerificationBanner
              show={showEmailBanner && user && user?.emailAddresses?.[0]?.verification?.status !== "verified"}
              onResend={handleResendVerification}
              onDismiss={() => setShowEmailBanner(false)}
              isResending={resendingEmail}
            />

            <div className={styles.content}>
              <DashboardHeader teamName={selectedTeam?.name} />
              <StatsOverview videos={videos} />
              
              <div className={styles.videosSection}>
                <div className={styles.videosSectionHeader}>
                  <h2 className={styles.videosSectionTitle}>Recent Videos</h2>
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
          </div>
        </AppShell>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/dashboard" />
      </SignedOut>
    </>
  );
}