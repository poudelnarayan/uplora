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
      <div className="h-full flex flex-col">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
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
        </motion.div>

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
                        {video.status === 'PROCESSING' && video.userRole && ["EDITOR","MANAGER","ADMIN","OWNER"].includes(video.userRole) && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={(e) => { e.stopPropagation(); router.push(`/videos/${video.id}`); }}
                          >
                            Request Publish
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
