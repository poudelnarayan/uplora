"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import AppShell from "@/components/layout/AppShell";
import { Play, Image as ImageIcon, X, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { StatusChip } from "@/components/ui/StatusChip";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { useNotifications } from "@/components/ui/Notification";
import { useTeam } from "@/context/TeamContext";
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

export default function AllVideosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; video: VideoItem | null; isDeleting: boolean }>({
    isOpen: false,
    video: null,
    isDeleting: false
  });
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
            // Reload list; cheap due to API caching/ETag on server if added later
            (async () => {
              const apiUrl = selectedTeamId ? `/api/videos?teamId=${selectedTeamId}` : "/api/videos";
              const res = await fetch(apiUrl, { cache: 'no-store' });
              const data = await res.json();
              setVideos(Array.isArray(data) ? data : []);
            })();
          }
        } catch {}
      };
      es.onmessage = handler;
      es.onerror = () => { try { es?.close(); } catch {}; es = null; };
    } catch {}
    return () => { try { es?.close(); } catch {} };
  }, [selectedTeamId]);

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

  return (
    <AppShell>
      <NextSeoNoSSR
        title="All Videos"
        description="Browse all your uploaded videos."
        canonical={typeof window !== "undefined" ? window.location.origin + "/videos" : undefined}
        noindex
        nofollow
      />
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
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
            <button
              onClick={() => router.push("/dashboard")}
              title="Close and go back"
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <div className="spinner-lg mx-auto mb-4" />
            <p className="text-muted-foreground">Loading videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-muted-foreground">No videos found. Upload your first video.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => {
              const fullTitle = video.title || "Untitled";
              const title = fullTitle.length > 50 ? fullTitle.slice(0, 50) + "..." : fullTitle;
              const uploaded = new Date(video.uploadedAt).toLocaleString();
              return (
                <div key={video.id} className="card p-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-40 h-24 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative">
                      {video.thumbnailKey ? (
                        <Image
                          src={`/api/images/thumb?key=${encodeURIComponent(video.thumbnailKey)}&v=${encodeURIComponent(video.updatedAt || video.uploadedAt)}`}
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
                        <StatusChip status={video.status} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 space-y-1">
                        <div>Uploaded: {uploaded}</div>
                        {video.uploader && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>By: {video.uploader.name || video.uploader.email || "Unknown"}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => location.assign(`/videos/${video.id}`)}>
                          <Play className="w-4 h-4 mr-1" /> Preview
                        </button>
                        {video.userRole && ["MANAGER", "ADMIN", "OWNER"].includes(video.userRole) && (
                          <button 
                            className="btn btn-ghost btn-sm text-gray-500 hover:text-red-500 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950/30"
                            onClick={() => handleDeleteVideo(video)}
                          >
                            {/* Reuse Delete from admin role only */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 mr-1"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                            Delete
                          </button>
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
