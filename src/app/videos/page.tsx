"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const MotionDiv = motion.div as any;
import AppShell from "@/components/layout/AppShell";
import { Play, Image as ImageIcon, X, User, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { StatusChip } from "@/components/ui/StatusChip";
import { useNotifications } from "@/components/ui/Notification";
import { useTeam } from "@/context/TeamContext";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
export const dynamic = "force-dynamic";

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  status: "PROCESSING" | "PENDING" | "PUBLISHED";
  uploadedAt: string;
  updatedAt: string; // added to match API shape
  thumbnailKey?: string | null; // added to match API shape
  userRole?: "OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | null;
  uploader?: { name?: string | null; email?: string | null };
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingVideoId, setProcessingVideoId] = useState<string | null>(null);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<{ id: string; title: string } | null>(null);
  const router = useRouter();
  const notifications = useNotifications();
  const { selectedTeamId, selectedTeam } = useTeam();

  useEffect(() => {
    const load = async () => {
      try {
        const apiUrl = selectedTeamId ? `/api/videos?teamId=${selectedTeamId}` : "/api/videos";
        const res = await fetch(apiUrl);
        const data = await res.json();
        const baseList: any[] = Array.isArray(data) ? data : [];
        // Enrich with per-video role so we can conditionally show admin actions
        const enriched: VideoItem[] = await Promise.all(
          baseList.map(async (v: any) => {
            let role: VideoItem["userRole"] = null;
            try {
              const r = await fetch(`/api/videos/${v.id}/role`);
              if (r.ok) {
                const rr = await r.json();
                role = rr?.role ?? null;
              }
            } catch {}
            return {
              id: v.id,
              title: v.title,
              thumbnail: v.thumbnail ?? "",
              status: v.status,
              uploadedAt: v.uploadedAt,
              updatedAt: v.updatedAt,
              thumbnailKey: v.thumbnailKey,
              userRole: role,
              uploader: v.uploader ? { name: v.uploader.name, email: v.uploader.email } : undefined,
            } as VideoItem;
          })
        );
        setVideos(enriched);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedTeamId]);

  // Realtime: auto-refresh list on video events
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      const url = selectedTeamId ? `/api/events?teamId=${encodeURIComponent(selectedTeamId)}` : `/api/events`;
      es = new EventSource(url);
      const handler = (ev: MessageEvent) => {
        try {
          const evt = JSON.parse(ev.data || '{}');
          if (evt?.type?.startsWith('video.')) {
            if (evt.type === 'video.created') {
              // Add new video to list immediately
              const newVideo = {
                id: evt.payload.id,
                title: evt.payload.title,
                status: 'PROCESSING',
                uploadedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                thumbnail: '',
                thumbnailKey: null,
                userRole: 'OWNER', // New videos are owned by the uploader
                uploader: { name: session?.user?.name || '', email: session?.user?.email || '' }
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
    } finally {
      setProcessingVideoId(null);
    }
  };

  return (
    <AppShell>
      <NextSeoNoSSR
        title="All Videos"
        description="Browse all your uploaded videos."
        canonical={typeof window !== "undefined" ? window.location.origin + "/videos" : undefined}
        noindex
        nofollow
      />
      <div className="h-full flex flex-col">
        <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="text-center lg:text-left lg:flex lg:items-center lg:justify-between">
            <div>
              <h1 className="heading-2">
                {selectedTeam ? `${selectedTeam.name} - All Videos` : "Personal Videos"}
              </h1>
              <p className="text-muted-foreground">
                {selectedTeam 
                  ? `All videos uploaded to ${selectedTeam.name}` 
                  : "Your personal uploaded videos"
                }
              </p>
            </div>
            <button className="mt-4 lg:mt-0"
              onClick={() => router.push("/dashboard")}
              title="Close and go back"
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </MotionDiv>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="spinner-lg mx-auto mb-4" />
            <p className="text-muted-foreground">Loading videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="card p-8 lg:p-10 text-center max-w-md mx-auto">
            <p className="text-muted-foreground">No videos found. Upload your first video.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-3 lg:space-y-4">
            {videos.map((video) => {
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
              return (
                <div
                  key={video.id}
                  className="card p-3 lg:p-4 cursor-pointer hover:shadow-lg transition-all duration-200"
                  onClick={() => router.push(`/videos/${video.id}`)}
                >
                  <div className="grid grid-cols-[100px_1fr] lg:grid-cols-[120px_1fr] xl:grid-cols-[160px_1fr] gap-3 items-start">
                    <div className="w-[100px] h-[56px] lg:w-[120px] lg:h-[68px] xl:w-40 xl:h-24 rounded-lg bg-muted overflow-hidden relative">
                      {video.thumbnailKey ? (
                        <Image
                          src={`/api/images/thumb?key=${encodeURIComponent(video.thumbnailKey)}&v=${encodeURIComponent(video.updatedAt || video.uploadedAt)}`}
                          alt={`Thumbnail for ${fullTitle}`}
                          fill
                          sizes="(max-width: 768px) 100px, (max-width: 1024px) 120px, 160px"
                          className="object-cover"
                          onError={(e) => {
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class=\"w-full h-full flex items-center justify-center text-muted-foreground text-xs\"><span>No thumbnail</span></div>';
                            }
                          }}
                        />
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
                          <StatusChip status={video.status} />
                        </div>
                      </div>
                      <div className="mt-1 lg:hidden ml-auto w-fit">
                        <StatusChip status={video.status} />
                      </div>
                      <div className="mt-2 hidden lg:flex items-center gap-2">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={(e) => { e.stopPropagation(); router.push(`/videos/${video.id}`); }}
                        >
                          <Play className="w-4 h-4 mr-1" /> Preview
                        </button>
                        {video.status === 'PROCESSING' && video.userRole && ["EDITOR","MANAGER","ADMIN"].includes(video.userRole) && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={(e) => { e.stopPropagation(); changeVideoStatus(video.id, 'PENDING'); }}
                            disabled={processingVideoId === video.id}
                          >
                            {processingVideoId === video.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              "Request Publish"
                            )}
                          </button>
                        )}
                        {/* Delete button for owners/admins/managers */}
                        {video.userRole && ["OWNER","ADMIN","MANAGER"].includes(video.userRole) && (
                          <button
                            className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              deleteVideo(video.id, video.title || "Untitled"); 
                            }}
                            disabled={deletingVideoId === video.id}
                            title="Delete video"
                          >
                            {deletingVideoId === video.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 hidden lg:block">
                        Uploaded: {uploaded}
                        {video.uploader && (
                          <span className="ml-2">By: {video.uploader.name || video.uploader.email || 'Unknown'}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 lg:hidden">
                        <div>Uploaded on: {uploadedMobile}</div>
                        {video.uploader && (
                          <div>By: {video.uploader.name || video.uploader.email || 'Unknown'}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
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
    </AppShell>
  );
}