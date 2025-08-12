"use client";

import { useState, useEffect } from "react";
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
import AppShell from "@/components/layout/AppShell";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/components/ui/Notification";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { useTeam } from "@/context/TeamContext";

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

  useEffect(() => {
    const fetchVideos = async () => {
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
    };
    fetchVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email, selectedTeamId]);

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
        return "Pending";
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
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                <p className="text-sm text-muted-foreground">Pending</p>
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Recent Videos</h2>
            {videos.length > 3 && (
              <button className="btn btn-ghost text-sm" onClick={() => router.push('/videos')}>View all</button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="spinner-lg mx-auto mb-4" />
              <p className="text-muted-foreground">Loading videos...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-semibold mb-2 text-foreground">No videos yet</h4>
              <p className="text-muted-foreground mb-6">Upload your first video to see it here.</p>
              <button className="btn btn-primary" onClick={() => router.push('/upload')}>Upload a Video</button>
            </div>
          ) : (
            <div className="space-y-4">
              {videos.slice(0, 3).map((video) => {
                const fullTitle = video.title || "Untitled";
                const title = fullTitle.length > 50 ? fullTitle.slice(0, 50) + "..." : fullTitle;
                const uploaded = new Date(video.uploadedAt).toLocaleString();
                const thumbnailUrl = thumbnailUrls.get(video.id);
                const isLoadingThumbnail = loadingThumbnails.has(video.id);
                
                return (
                  <motion.div key={video.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
                    <div className="flex gap-4 items-start">
                      {/* Thumbnail */}
                      <div className="w-40 h-24 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative">
                        {isLoadingThumbnail ? (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : thumbnailUrl ? (
                          <img 
                            src={thumbnailUrl} 
                            alt={`Thumbnail for ${fullTitle}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Hide broken image and show fallback
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-muted-foreground text-xs"><span>No thumbnail</span></div>';
                              }
                            }}
                          />
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
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-semibold text-foreground truncate" title={fullTitle}>{title}</h3>
                          <div className="flex items-center gap-2">
                            {/* Always show status chips for all statuses */}
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getStatusColor(video.status)}`}>
                              {getStatusIcon(video.status)} {getStatusText(video.status)}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 space-y-1">
                          <div>Uploaded: {uploaded}</div>
                          {video.uploader && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>By: {video.uploader.name || video.uploader.email}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {/* Preview Chip */}
                          <button 
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                            onClick={() => router.push(`/videos/${video.id}`)}
                          >
                            <Play className="w-3 h-3" /> Preview
                          </button>
                          
                          {/* Send for Publish Chip - Only for PROCESSING videos and EDITOR/MANAGER/ADMIN (not OWNER) */}
                          {video.status === "PROCESSING" && video.userRole && ["EDITOR", "MANAGER", "ADMIN"].includes(video.userRole) && (
                            <button 
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                              onClick={() => changeVideoStatus(video.id, 'PENDING')}
                            >
                              <Upload className="w-3 h-3" /> Request for Publish
                            </button>
                          )}
                          
                          {/* Approve Chip - Only for PENDING videos and MANAGERS+ */}
                          {video.status === "PENDING" && video.userRole && ["MANAGER", "ADMIN", "OWNER"].includes(video.userRole) && (
                            <button 
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                              onClick={() => changeVideoStatus(video.id, 'PUBLISHED')}
                            >
                              <CheckCircle className="w-3 h-3" /> Approve
                            </button>
                          )}
                          
                          {/* Delete Video Chip - Only for MANAGERS+ */}
                          {video.userRole && ["MANAGER", "ADMIN", "OWNER"].includes(video.userRole) && (
                            <button 
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                              onClick={() => handleDeleteVideo(video)}
                            >
                              <Trash2 className="w-3 h-3" /> Delete Video
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Team Activity & Upcoming Uploads removed per request */}

        {/* Quick Actions and Insights removed as requested */}
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
