"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  Upload, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  Play,
  Users,
  User,
  Plus,
  Calendar,
  FileVideo,
  Trash2,
  MoreVertical,
  Edit3,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import AppShell from "@/components/layout/AppShell";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/components/ui/Notification";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { useTeam } from "@/context/TeamContext";
import { StatusChip } from "@/components/ui/StatusChip";

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
  const { data: session } = useSession();
  const notifications = useNotifications();
  const router = useRouter();
  const { selectedTeamId, selectedTeam } = useTeam();
  
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbnailUrls, setThumbnailUrls] = useState<Map<string, string>>(new Map());
  const [loadingThumbnails, setLoadingThumbnails] = useState<Set<string>>(new Set());
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; video: VideoItem | null; isDeleting: boolean }>({
    isOpen: false,
    video: null,
    isDeleting: false
  });

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
        // Fetch role for each video
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
        // Load thumbnails for videos that have them
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

  // Realtime refresh for dashboard recent videos
  useEffect(() => {
    let es: EventSource | null = null;
    let retryTimer: any = null;
    const connect = () => {
      try {
        const url = selectedTeamId ? `/api/events?teamId=${encodeURIComponent(selectedTeamId)}` : `/api/events`;
        es = new EventSource(url);
        es.onmessage = async (ev) => {
          try {
            const evt = JSON.parse(ev.data || '{}');
            if (evt?.type?.startsWith('video.')) await fetchVideos();
          } catch {}
        };
        es.onerror = () => {
          try { es?.close(); } catch {}
          es = null;
          if (!retryTimer) retryTimer = setTimeout(() => { retryTimer = null; connect(); }, 3000);
        };
      } catch {
        if (!retryTimer) retryTimer = setTimeout(() => { retryTimer = null; connect(); }, 3000);
      }
    };
    connect();
    // Fallback refresh on focus/visibility
    const onFocus = () => fetchVideos();
    const onVis = () => { if (!document.hidden) fetchVideos(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      try { es?.close(); } catch {}
      if (retryTimer) clearTimeout(retryTimer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeamId, fetchVideos]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "PENDING":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "PROCESSING":
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-blue-500" />; // Default to processing
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "Published";
      case "PENDING":
        return "Awaiting Publish";
      case "PROCESSING":
        return "Processing";
      default:
        return "Processing"; // Default to processing
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "text-green-600 bg-green-100";
      case "PENDING":
        return "text-yellow-700 bg-yellow-100";
      case "PROCESSING":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-blue-600 bg-blue-100"; // Default to processing
    }
  };

  const handleDeleteVideo = (video: VideoItem) => {
    setDeleteModal({ isOpen: true, video, isDeleting: false });
  };

  const confirmDelete = async () => {
    if (!deleteModal.video) return;
    
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    
    try {
      const response = await fetch(`/api/videos/${deleteModal.video.id}/delete`, {
        method: "DELETE"
      });
      
      if (response.ok) {
        setVideos(prev => prev.filter(v => v.id !== deleteModal.video!.id));
        notifications.addNotification({
          type: "success",
          title: "Video deleted",
          message: "The video has been permanently removed"
        });
        setDeleteModal({ isOpen: false, video: null, isDeleting: false });
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
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const closeDeleteModal = () => {
    if (!deleteModal.isDeleting) {
      setDeleteModal({ isOpen: false, video: null, isDeleting: false });
    }
  };

  const changeVideoStatus = async (videoId: string, newStatus: string) => {
    try {
      let endpoint = '';
      let method = 'POST';
      
      if (newStatus === 'PENDING') {
        endpoint = `/api/videos/${videoId}/request-approval`;
      } else if (newStatus === 'PUBLISHED') {
        endpoint = `/api/videos/${videoId}/approve`;
      } else {
        return; // Unsupported status change
      }
      
      const response = await fetch(endpoint, { method });
      
      if (response.ok) {
        // Update local state
        setVideos(prev => prev.map(video => 
          video.id === videoId 
            ? { ...video, status: newStatus, updatedAt: new Date().toISOString() }
            : video
        ));
        
        const statusText = newStatus === 'PENDING' ? 'pending' : 
                          newStatus === 'PUBLISHED' ? 'published' : newStatus;
        
        notifications.addNotification({
          type: "success",
          title: "Status updated",
          message: `Video status changed to ${statusText}`
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
    }
  };

  return (
    <AppShell>
      <div className="h-full flex flex-col">
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="text-center lg:text-left">
            <div>
              <h1 className="heading-2 mb-2">
                {selectedTeam ? `${selectedTeam.name} - Videos` : "Personal Videos"}
              </h1>
              <p className="text-muted-foreground">
                {selectedTeam 
                  ? `Manage videos for ${selectedTeam.name} team` 
                  : "Manage your personal YouTube content and track upload status"
                }
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold text-foreground">{videos.filter(v => v.status === "PUBLISHED").length}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Awaiting Publish</p>
                <p className="text-2xl font-bold text-foreground">{videos.filter(v => v.status === "PENDING").length}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-foreground">{videos.filter(v => v.status === "PROCESSING").length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Videos */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex-1 space-y-4 lg:space-y-6">
          <div className="flex items-center justify-between text-center lg:text-left">
            <h2 className="text-xl font-semibold text-foreground">Recent Videos</h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="spinner-lg mx-auto mb-4" />
              <p className="text-muted-foreground">Loading videos...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-semibold mb-2 text-foreground">No videos yet</h4>
              <p className="text-muted-foreground mb-6">Upload your first video to see it here.</p>
              <button className="btn btn-primary" onClick={() => router.push('/upload')}>Upload a Video</button>
            </div>
          ) : (
            <>
            <div className="space-y-3 lg:space-y-4">
              {videos.slice(0, 3).map((video) => {
                const fullTitle = video.title || "Untitled";
                const title = fullTitle.length > 50 ? fullTitle.slice(0, 50) + "..." : fullTitle;
                const uploadedDate = new Date(video.uploadedAt);
                const uploaded = uploadedDate.toLocaleString();
                const uploadedMobile = uploadedDate.toLocaleString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                });
                const thumbnailUrl = thumbnailUrls.get(video.id);
                const isLoadingThumbnail = loadingThumbnails.has(video.id);
                
                return (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-3 lg:p-4 cursor-pointer hover:shadow-lg transition-all duration-200"
                    onClick={() => router.push(`/videos/${video.id}`)}
                  >
                    <div className="grid grid-cols-[100px_1fr] lg:grid-cols-[120px_1fr] gap-3 items-start lg:flex lg:gap-4">
                      {/* Thumbnail */}
                      <div className="w-[100px] h-[56px] lg:w-[120px] lg:h-[68px] xl:w-40 xl:h-24 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative">
                        {isLoadingThumbnail ? (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : thumbnailUrl ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={`/api/images/thumb?key=${encodeURIComponent(video.thumbnailKey!)}&v=${encodeURIComponent(video.updatedAt || video.uploadedAt || "")}`}
                              alt={`Thumbnail for ${fullTitle}`}
                              fill
                              sizes="160px"
                              className="object-cover"
                              onError={(e) => {
                                const parent = (e.target as HTMLImageElement).parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-muted-foreground text-xs"><span>No thumbnail</span></div>';
                                }
                              }}
                            />
                          </div>
                        ) : video.thumbnailKey ? (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Loading...</div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            <div className="flex flex-col items-center gap-1">
                              <ImageIcon className="w-6 h-6" />
                              <span>No thumbnail</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className="font-bold text-foreground text-sm lg:text-base pr-2"
                            title={fullTitle}
                            style={{ display: '-webkit-box', WebkitLineClamp: 2 as any, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                          >
                            {title}
                          </h3>
                          <div className="hidden sm:flex ml-auto">
                            <StatusChip status={video.status as any} />
                          </div>
                        </div>
                        <div className="mt-1 lg:hidden ml-auto w-fit">
                          <StatusChip status={video.status as any} />
                        </div>
                        <div className="mt-2 hidden lg:flex items-center gap-2">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={(e) => { e.stopPropagation(); router.push(`/videos/${video.id}`); }}
                          >
                            <Play className="w-4 h-4 mr-1" /> Preview
                          </button>
                          {video.status === 'PROCESSING' && video.userRole && ["EDITOR","MANAGER","ADMIN","OWNER"].includes(video.userRole) && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={(e) => { e.stopPropagation(); changeVideoStatus(video.id, 'PENDING'); }}
                            >
                              Request Publish
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 hidden lg:block">
                          Uploaded: {uploaded}
                          {video.uploader && (
                            <span className="ml-2">By: {video.uploader.name || video.uploader.email}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 lg:hidden">
                          <div>Uploaded on: {uploadedMobile}</div>
                          {video.uploader && (
                            <div>By: {video.uploader.name || video.uploader.email}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {videos.length > 3 && (
              <div className="mt-4 text-center">
                <button className="btn btn-ghost w-full" onClick={() => router.push('/videos')}>View all</button>
              </div>
            )}
            </>
          )}
        </motion.div>

      </div>
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Delete Video"
        itemName={deleteModal.video?.title}
        message="This action cannot be undone. The video will be permanently removed from your account and storage."
        confirmText="Delete Video"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteModal.isDeleting}
      />
    </AppShell>
  );
}
