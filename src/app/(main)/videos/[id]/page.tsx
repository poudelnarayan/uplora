"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Shield, CheckCircle, Clock, Upload, Image as ImageIcon, Link as LinkIcon, Hash, Check, AlertCircle, Bold, Italic, Type, Clock3, X, ArrowLeft, Users, User, Edit3, Trash2, Youtube } from "lucide-react";
import Image from "next/image";
import ConfirmationModal from "@/app/components/ui/ConfirmationModal";
import { StatusChip } from "@/app/components/ui/StatusChip";
import { useNotifications } from "@/app/components/ui/Notification";
import { NextSeoNoSSR, VideoJsonLdNoSSR } from "@/app/components/seo/NoSSRSeo";
import { videoCache } from "@/lib/videoCache";
import { ThumbnailShimmer } from "@/app/components/ui/Shimmer";
import { useTeam } from "@/context/TeamContext";
import AppShell from "@/app/components/layout/AppLayout";
export const dynamic = "force-dynamic";

interface Video {
  id: string;
  key: string;
  filename: string;
  contentType: string;
  status?: string;
  teamId?: string | null;
  uploadedAt?: string;
  updatedAt?: string;
  description?: string;
  visibility?: "private" | "unlisted" | "public";
  madeForKids?: boolean;
  thumbnailKey?: string | null;
  uploader?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export default function VideoPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const notifications = useNotifications();
  const { teams } = useTeam();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [teamName, setTeamName] = useState<string | null>(null);
  
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [webOptimizedUrl, setWebOptimizedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Editable metadata
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [madeForKids, setMadeForKids] = useState(false);
  const [visibility, setVisibility] = useState<"private" | "unlisted" | "public">("public");
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [thumbnailDeleting, setThumbnailDeleting] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Track original values for change detection
  const [originalMetadata, setOriginalMetadata] = useState({
    title: "",
    description: "",
    madeForKids: false,
    visibility: "public" as "private" | "unlisted" | "public"
  });

  const canonicalUrl = typeof window !== "undefined" ? `${window.location.origin}/videos/${id}` : undefined;
  const pageTitle = (title && title.trim()) || video?.filename || "Video Preview";
  const pageDescription = (description && description.trim()) || "Preview and manage this video";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try cache first
        const cachedVideo = videoCache.get(id);
        if (cachedVideo) {
          console.log('Loading video from cache:', id);
          setVideo(cachedVideo);
          
          // Load from cache
          const titleWithoutExt = (cachedVideo.filename || "").replace(/\s*\[WEB:[^\]]+\]/, '').replace(/\.[^/.]+$/, '');
          const videoDescription = cachedVideo.description || "";
          const videoMadeForKids = cachedVideo.madeForKids || false;
          const videoVisibility = cachedVideo.visibility || "public";
          
          // Set current values
          setTitle(titleWithoutExt);
          setDescription(videoDescription);
          setMadeForKids(videoMadeForKids);
          setVisibility(videoVisibility);
          
          // Set original values for change detection
          setOriginalMetadata({
            title: titleWithoutExt,
            description: videoDescription,
            madeForKids: videoMadeForKids,
            visibility: videoVisibility
          });
          // Load cached URLs if available
          if (cachedVideo.playUrl) {
            setPlayUrl(cachedVideo.playUrl);
          }
          if (cachedVideo.webOptimizedUrl) {
            setWebOptimizedUrl(cachedVideo.webOptimizedUrl);
          }
          
          // Load thumbnail if available
          if (cachedVideo.thumbnailKey) {
            // Check if we have a cached thumbnail URL
            if (cachedVideo.thumbnailUrl) {
              setCurrentThumbnailUrl(cachedVideo.thumbnailUrl);
            } else {
              loadThumbnailUrl(cachedVideo.thumbnailKey);
            }
          }
          
          // Still fetch fresh data in background to ensure accuracy
        }

        const v = await fetch(`/api/videos/${id}`, {
          // Disable browser cache to ensure fresh data
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }).then(r => r.json()).catch(() => null);
        
        if (v?.id) {
          setVideo(v);
          
          // Set team name if video belongs to a team
          if (v.teamId) {
            const team = teams.find(t => t.id === v.teamId);
            setTeamName(team?.name || null);
          } else {
            setTeamName(null);
          }
          
          // Extract clean title and check for web-optimized version
          let cleanTitle = v.filename || "";
          let webKey = null;
          
          // Check if web-optimized key is stored in filename
          const webMatch = cleanTitle.match(/\[WEB:([^\]]+)\]/);
          if (webMatch) {
            webKey = webMatch[1];
            cleanTitle = cleanTitle.replace(/\s*\[WEB:[^\]]+\]/, '');
          }
          
          const titleWithoutExt = cleanTitle.replace(/\.[^/.]+$/, '');
          const videoDescription = v.description || "";
          const videoMadeForKids = v.madeForKids || false;
          const videoVisibility = v.visibility || "public";
          
          // Set current values (only if not from cache to avoid overwriting user edits)
          if (!cachedVideo) {
            setTitle(titleWithoutExt);
            setDescription(videoDescription);
            setMadeForKids(videoMadeForKids);
            setVisibility(videoVisibility);
          }
          
          // Always update original values for change detection
          setOriginalMetadata({
            title: titleWithoutExt,
            description: videoDescription,
            madeForKids: videoMadeForKids,
            visibility: videoVisibility
          });
          
          // Cache the video data, preserving existing URLs
          const existingUrls = videoCache.getUrls(v.id);
          videoCache.set(v, existingUrls?.playUrl, existingUrls?.webOptimizedUrl, existingUrls?.thumbnailUrl);
          
          // Load web-optimized version if available and not cached
          if (webKey && !cachedVideo?.webOptimizedUrl) {
            loadWebOptimizedUrl(webKey);
          }
          
          // Load thumbnail if available
          if (v.thumbnailKey) {
            // Check cache first
            const cachedThumbnailUrl = videoCache.getThumbnailUrl(v.id);
            if (cachedThumbnailUrl) {
              setCurrentThumbnailUrl(cachedThumbnailUrl);
            } else {
              loadThumbnailUrl(v.thumbnailKey);
            }
          }
        }
        // Determine user role for this video
        if (v?.id) {
          try {
            const roleResponse = await fetch(`/api/videos/${v.id}/role`);
            if (roleResponse.ok) {
              const { role } = await roleResponse.json();
              setRole(role);
            }
          } catch (error) {
            console.error('Failed to get user role:', error);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, user?.id]);

  // Realtime: refresh on video.* events for this id, but avoid overwriting local edits
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      const url = `/api/events`;
      es = new EventSource(url);
      es.onmessage = async (ev) => {
        try {
          const evt = JSON.parse(ev.data || '{}');
          if (!evt?.type?.startsWith('video.')) return;
          if (evt?.payload?.id !== id) return;
          
          // If user has unsaved changes, don't clobber the form
          if (hasUnsavedChanges || isSaving) return;
          
          if (evt.type === 'video.deleted') {
            // Video was deleted, redirect to videos page
            notifications.addNotification({
              type: "info",
              title: "Video deleted",
              message: "This video has been deleted by another user"
            });
            router.push("/posts/all?type=video");
            return;
          }
          
          if (evt.type === 'video.status') {
            // Status change - update immediately
            setVideo(prev => prev ? { ...prev, status: evt.payload.status } : prev);
            
            // Show notification for status changes
            const statusMessages = {
              'PROCESSING': 'Video is back in editing mode',
              'PENDING': 'Video is awaiting approval',
              'APPROVED': 'Video is approved and ready to publish',
              'PUBLISHED': 'Video has been published'
            } as const;
            const key = evt?.payload?.status as keyof typeof statusMessages | undefined;
            if (key) {
              notifications.addNotification({
                type: "success",
                title: "Status updated",
                message: statusMessages[key]
              });
            }
            return;
          }
          
          // For other updates, soft refresh of server fields
          const res = await fetch(`/api/videos/${id}`, { cache: 'no-store' });
          if (!res.ok) return;
          const v = await res.json();
          setVideo(v);
          
          // Only update form fields if they haven't been touched since last load
          setTitle((prev) => prev || (v.filename || '').replace(/\.[^/.]+$/, ''));
          setDescription((prev) => prev);
          setVisibility((prev) => prev || v.visibility || 'public');
          setMadeForKids((prev) => typeof prev === 'boolean' ? prev : (v.madeForKids || false));
          
          // thumbnail refresh
          if (v.thumbnailKey) {
            const cached = videoCache.getThumbnailUrl(v.id);
            if (!cached) loadThumbnailUrl(v.thumbnailKey);
          } else {
            setCurrentThumbnailUrl(null);
          }
        } catch {}
      };
      es.onerror = () => { try { es?.close(); } catch {}; es = null; };
    } catch {}
    return () => { try { es?.close(); } catch {} };
  }, [id, hasUnsavedChanges, isSaving, router, notifications]);

  // Auto-save function
  const autoSave = async (showNotification = false) => {
    if (!video || !hasUnsavedChanges) return;
    // Lock editors when awaiting publish
    if (role === "EDITOR" && video.status === "PENDING") {
      if (showNotification) {
        notifications.addNotification({ type: "warning", title: "Awaiting publish", message: "This video is awaiting owner approval. Editors cannot edit until it's sent back to Processing." });
      }
      return;
    }
    
    setIsSaving(true);
    try {
      // Handle thumbnail upload if needed
      let thumbnailKey: string | undefined = undefined;
      if (thumbFile) {
        // If there's an existing thumbnail, delete it first
        if (video.thumbnailKey) {
          try {
            await fetch(`/api/videos/${video.id}/thumbnail/delete`, {
              method: "DELETE"
            });
          } catch (error) {
            console.error("Failed to delete old thumbnail:", error);
            // Continue with upload even if old deletion fails
          }
        }

        // Upload new thumbnail
        const presign = await fetch("/api/s3/presign-thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: thumbFile.name, contentType: thumbFile.type || "image/jpeg", sizeBytes: thumbFile.size, teamId: video.teamId, videoId: video.id }),
        }).then(r=>r.json());
        if (presign?.putUrl && presign?.key) {
          const put = await fetch(presign.putUrl, { method: "PUT", headers: { "Content-Type": thumbFile.type || "image/jpeg" }, body: thumbFile });
          if (put.ok) thumbnailKey = presign.key;
        }
      }

      const payload: any = {
        title,
        description,
        visibility,
        madeForKids,
      };
      if (typeof thumbnailKey === 'string') {
        payload.thumbnailKey = thumbnailKey; // new upload
      } else if (thumbFile === null && video.thumbnailKey === null) {
        // explicit delete case handled elsewhere; keep as is here (no field)
      }

      const res = await fetch(`/api/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (showNotification) {
          notifications.addNotification({ type: "error", title: "Save failed", message: json?.error || "Could not save changes" });
        }
      } else {
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
        // Update original metadata
        setOriginalMetadata({
          title,
          description,
          madeForKids,
          visibility
        });
        // Clear thumbnail file after successful save
        setThumbFile(null);
        if (thumbPreview) {
          URL.revokeObjectURL(thumbPreview);
          setThumbPreview(null);
        }
        
        // Update local video state
        const newThumbnailKey = thumbnailKey || video.thumbnailKey;
        setVideo(v => v ? ({ 
          ...v, 
          filename: title,
          description,
          visibility,
          madeForKids,
          thumbnailKey: newThumbnailKey
        }) : v);
        
        // Update cache with new data
        if (video) {
          videoCache.update(video.id, {
            filename: title,
            description,
            visibility,
            madeForKids,
            thumbnailKey: newThumbnailKey
          });
        }

        // Load the new thumbnail URL if a new thumbnail was uploaded
        if (thumbnailKey) {
          loadThumbnailUrl(thumbnailKey);
        }
        
        if (showNotification) {
          notifications.addNotification({ type: "success", title: "Saved", message: "Your changes have been saved" });
        }
      }
    } catch (error) {
      if (showNotification) {
        notifications.addNotification({ type: "error", title: "Save failed", message: "Could not save changes" });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Change detection effect
  useEffect(() => {
    const hasChanges = 
      title !== originalMetadata.title ||
      description !== originalMetadata.description ||
      madeForKids !== originalMetadata.madeForKids ||
      visibility !== originalMetadata.visibility ||
      thumbFile !== null;
    
    setHasUnsavedChanges(hasChanges);
    
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // Set new auto-save timeout (save after 3 seconds of no changes)
    if (hasChanges) {
      const timeout = setTimeout(() => {
        autoSave(false); // Silent auto-save
      }, 3000);
      setAutoSaveTimeout(timeout);
    }
    
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [title, description, madeForKids, visibility, thumbFile, originalMetadata, video, hasUnsavedChanges]);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        // Attempt to save
        autoSave(false);
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!thumbFile) return;
    const url = URL.createObjectURL(thumbFile);
    setThumbPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbFile]);

  // Generate a signed GET URL for private S3 object playback
  useEffect(() => {
    const loadSignedUrl = async () => {
      if (!video?.key) return;
      
      // Check cache first for play URL
      const cachedUrls = videoCache.getUrls(video.id);
      if (cachedUrls?.playUrl && !playUrl) {
        console.log("Loading play URL from cache");
        setPlayUrl(cachedUrls.playUrl);
        setUrlError(null);
        return;
      }
      
      setUrlError(null);
      try {
        console.log("Requesting signed URL for key:", video.key);
        const res = await fetch(`/api/video-url?key=${encodeURIComponent(video.key)}`);
        const json = await res.json();
        console.log("Signed URL response:", res.status, json);
        if (res.ok && json?.url) {
          setPlayUrl(json.url);
          setUrlError(null);
          
          // Cache the URL
          videoCache.set(video, json.url, webOptimizedUrl || undefined);
        } else {
          setPlayUrl(null);
          setUrlError(json?.error || "Failed to get signed URL");
        }
      } catch (e) {
        console.error("Error getting signed URL:", e);
        setPlayUrl(null);
        setUrlError("Network error getting signed URL");
      }
    };
    loadSignedUrl();
  }, [video?.key]);

  // Download entire video as blob for better playback
  const downloadAsBlob = async () => {
    if (!playUrl || isDownloading) return;
    setIsDownloading(true);
    try {
      console.log("Downloading video as blob...");
      const response = await fetch(playUrl);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      console.log("Video blob ready for playback");
    } catch (e) {
      console.error("Blob download failed:", e);
      setUrlError("Failed to download video");
    } finally {
      setIsDownloading(false);
    }
  };

  // Load web-optimized URL
  const loadWebOptimizedUrl = async (webKey: string) => {
    try {
      // Check cache first
      if (video) {
        const cachedUrls = videoCache.getUrls(video.id);
        if (cachedUrls?.webOptimizedUrl) {
          console.log("Loading web-optimized URL from cache");
          setWebOptimizedUrl(cachedUrls.webOptimizedUrl);
          return;
        }
      }
      
      const res = await fetch(`/api/video-url?key=${encodeURIComponent(webKey)}`);
      const json = await res.json();
      if (res.ok && json?.url) {
        setWebOptimizedUrl(json.url);
        
        // Cache the URL
        if (video) {
          videoCache.set(video, playUrl || undefined, json.url);
        }
      }
    } catch (e) {
      console.error("Failed to load web-optimized URL:", e);
    }
  };

  // Process video for web optimization
  const processForWeb = async () => {
    if (!video || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/videos/process-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video.id }),
      });
      if (res.ok) {
        // Reload video data to get web-optimized key
        const v = await fetch(`/api/videos/${id}`).then(r => r.json());
        if (v?.filename) {
          const webMatch = v.filename.match(/\[WEB:([^\]]+)\]/);
          if (webMatch) {
            loadWebOptimizedUrl(webMatch[1]);
          }
        }
      }
    } catch (e) {
      console.error("Processing failed:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Load thumbnail from S3
  const loadThumbnailUrl = async (thumbnailKey: string) => {
    if (!thumbnailKey) {
      setCurrentThumbnailUrl(null);
      setThumbnailLoading(false);
      return;
    }
    setThumbnailLoading(true);
    try {
      const res = await fetch(`/api/s3/get-url?key=${encodeURIComponent(thumbnailKey)}`);
      const json = await res.json();
      if (res.ok && json?.url) {
        setImageLoading(true);
        setCurrentThumbnailUrl(json.url);
        if (video?.id) videoCache.setThumbnailUrl(video.id, json.url);
      } else {
        setCurrentThumbnailUrl(null);
      }
    } catch {
      setCurrentThumbnailUrl(null);
    } finally {
      setThumbnailLoading(false);
    }
  };

  // Handle thumbnail file selection
  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbFile(file);
      setImageLoading(true); // Start loading for preview
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setThumbPreview(previewUrl);
    }
  };

  // Delete thumbnail from S3 and database
  const deleteThumbnail = async () => {
    if (!video || thumbnailDeleting) return;
    
    const confirmed = window.confirm("Are you sure you want to delete this thumbnail? This action cannot be undone.");
    if (!confirmed) return;

    setThumbnailDeleting(true);
    try {
      const res = await fetch(`/api/videos/${video.id}/thumbnail/delete`, {
        method: "DELETE"
      });
      
      if (res.ok) {
        // Clear local state
        setCurrentThumbnailUrl(null);
        setThumbFile(null);
        setThumbPreview(null);
        
        // Update video data to reflect the change
        if (video) {
          setVideo({ ...video, thumbnailKey: null });
          
          // Update cache and clear thumbnail URL
          videoCache.update(video.id, { thumbnailKey: null });
          videoCache.setThumbnailUrl(video.id, ""); // Clear cached URL
        }
        
        notifications.addNotification({
          type: "success",
          title: "Thumbnail deleted",
          message: "The thumbnail has been permanently removed"
        });
      } else {
        const error = await res.json();
        notifications.addNotification({
          type: "error",
          title: "Delete failed",
          message: error.error || "Failed to delete thumbnail"
        });
      }
    } catch (error) {
      console.error("Failed to delete thumbnail:", error);
      notifications.addNotification({
        type: "error",
        title: "Delete failed",
        message: "An error occurred while deleting the thumbnail"
      });
    } finally {
      setThumbnailDeleting(false);
    }
  };

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  useEffect(() => {
    return () => {
      if (thumbPreview) URL.revokeObjectURL(thumbPreview);
    };
  }, [thumbPreview]);

  const requestApproval = async () => {
    if (!video) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/videos/${video.id}/request-approval`, { method: "POST" });
      const js = await response.json().catch(() => ({}));
      if (response.ok) {
        setVideo({ ...video, status: "PENDING" });
        notifications.addNotification({
          type: "success",
          title: "✅ Approval request sent!",
          message: "Owner/admins have been notified."
        });
      } else {
        throw new Error(js?.error || "Failed to send request");
      }
    } catch (error) {
      notifications.addNotification({
        type: "error", 
        title: "❌ Request failed",
        message: error instanceof Error ? error.message : "Could not send publish request"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const markReady = async () => {
    if (!video) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/videos/${video.id}/mark-ready`, { method: "POST" });
      const js = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(js?.error || "Failed to mark ready");
      setVideo({ ...video, status: "READY" });
      notifications.addNotification({
        type: "success",
        title: "Ready to publish",
        message: "Marked as ready. You can now request approval.",
      });
    } catch (e) {
      notifications.addNotification({
        type: "error",
        title: "Failed",
        message: e instanceof Error ? e.message : "Could not mark ready",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const approveOrPublish = async () => {
    if (!video) return;
    setSubmitting(true);
    try {
      // UX guard: don't allow publishing team videos before editors mark ready
      if (video.teamId && (role === "OWNER" || role === "ADMIN")) {
        const st = String(video.status || "PROCESSING").toUpperCase();
        if (st !== "READY" && st !== "APPROVED" && st !== "PENDING") {
          notifications.addNotification({
            type: "error",
            title: "Not ready to post",
            message: "This video is not ready yet. Ask editors to mark it 'Ready to post' before publishing.",
          });
          setSubmitting(false);
          return;
        }
      }

      // Call approve endpoint with video metadata for YouTube upload
      const response = await fetch(`/api/videos/${video.id}/approve`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          privacyStatus: visibility,
          madeForKids,
        })
      });
      
      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        if (result?.status === "APPROVED") {
          setVideo({ ...video, status: "APPROVED" });
          notifications.addNotification({
            type: "success",
            title: "Approved",
            message: "This video is approved. A manager can now publish it to YouTube.",
          });
        } else {
          setVideo({ ...video, status: "PUBLISHED" });
          notifications.addNotification({
            type: "success",
            title: "✅ Video published to YouTube!",
            message: `The video has been successfully uploaded and published${result.youtubeVideoId ? ` (YouTube ID: ${result.youtubeVideoId})` : ''}`
          });
          router.push("/dashboard");
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to approve");
      }
    } catch (error) {
      notifications.addNotification({
        type: "error",
        title: "❌ Action failed", 
        message: error instanceof Error ? error.message : "Could not publish video to YouTube"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteVideo = async () => {
    if (!video) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/videos/${video.id}/delete`, {
        method: "DELETE"
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete video");
      }
      
      notifications.addNotification({
        type: "success",
        title: "Video deleted",
        message: "Video has been permanently deleted"
      });
      
      // Redirect to videos page
      router.push("/posts/all?type=video");
    } catch (error) {
      notifications.addNotification({
        type: "error",
        title: "Delete failed",
        message: error instanceof Error ? error.message : "Failed to delete video"
      });
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  

  // Enhanced hashtag parsing - fixes double # issue and supports copy-paste
  const tags = useMemo(() => {
    const hashtagRegex = /#([a-zA-Z0-9_\u00a1-\uffff]+)(?![a-zA-Z0-9_\u00a1-\uffff])/g;
    const matches = description.match(hashtagRegex) || [];
    return Array.from(new Set(matches.map(t => t.replace('#', ''))));
  }, [description]);

  // YouTube formatting and link highlighting
  const descriptionPreview = useMemo(() => {
    let formatted = description;
    
    // 1. YouTube-style formatting (do this first to avoid conflicts)
    // Bold: **text** (prioritize double asterisk)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
    // Bold: *text* (single asterisk, avoid already processed content)
    formatted = formatted.replace(/\*([^\*\n]+?)\*/g, (match, content) => {
      // Don't replace if it's inside HTML tags
      return `<strong class="font-bold">${content}</strong>`;
    });
    
    // Italic: _text_
    formatted = formatted.replace(/_([^_\n]+?)_/g, '<em class="italic">$1</em>');
    
    // 2. Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300">$1</a>');
    
    // 3. Highlight hashtags (improved regex to handle consecutive hashtags)
    formatted = formatted.replace(/#([a-zA-Z0-9_\u00a1-\uffff]+)(?![a-zA-Z0-9_\u00a1-\uffff])/g, (match, content) => {
      return `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-300 text-sm font-medium">#${content}</span>`;
    });
    
    // 4. Timestamps: 1:23 or 12:34:56
    const timestampRegex = /\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g;
    formatted = formatted.replace(timestampRegex, '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-300 text-sm font-medium cursor-pointer hover:bg-green-500/20"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path></svg>$1</span>');
    
    // 5. Convert line breaks to <br>
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  }, [description]);

  // Formatting helpers
  const insertFormatting = (before: string, after: string = before) => {
    const textarea = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.substring(start, end);
    const newText = description.substring(0, start) + before + selectedText + after + description.substring(end);
    
    setDescription(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  return (
    <AppShell>
      <div className="fixed inset-0 lg:left-64 bg-background overflow-auto">
      <NextSeoNoSSR
        title={pageTitle}
        description={pageDescription}
        canonical={canonicalUrl}
        noindex
        nofollow
        openGraph={{
          url: canonicalUrl,
          title: pageTitle,
          description: pageDescription,
          images: currentThumbnailUrl ? [{ url: currentThumbnailUrl }] : undefined,
        }}
      />
      {video && (
        <VideoJsonLdNoSSR
          name={pageTitle}
          description={pageDescription}
          thumbnailUrls={currentThumbnailUrl ? [currentThumbnailUrl] : []}
          uploadDate={video.uploadedAt || new Date().toISOString()}
          contentUrl={canonicalUrl}
          embedUrl={canonicalUrl}
        />
      )}
      <div className="space-y-6 max-w-[88rem] mx-auto">
        <div className="flex items-center justify-between mt-6">
          <h1 className="heading-2">Video Preview</h1>
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            title="Close and go back"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Team Context & Uploader Info */}
        <div className="space-y-3">
          {teamName && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Team: <span className="text-primary">{teamName}</span>
              </span>
            </div>
          )}
          
          {/* Video Uploader Info */}
          {video?.uploader && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-muted">
              {video.uploader.image ? (
                <img 
                  src={video.uploader.image} 
                  alt={video.uploader.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground">
                  Uploaded by: <span className="text-primary">{video.uploader.name || video.uploader.email}</span>
                </span>
                <p className="text-xs text-muted-foreground">
                  {video.uploadedAt && new Date(video.uploadedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
        {loading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : !video ? (
          <div className="text-muted-foreground">Video not found</div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* On mobile, video first; on desktop, editor left */}
              <div className="lg:hidden order-1">
                <div className="card p-2">
                  <div className="w-full rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16 / 9' }}>
                    {urlError ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-red-400 p-4">
                        <div className="text-sm mb-2">Error loading video:</div>
                        <div className="text-xs">{urlError}</div>
                      </div>
                    ) : webOptimizedUrl ? (
                      <video key={webOptimizedUrl} controls className="w-full h-full object-contain" preload="metadata" src={webOptimizedUrl} />
                    ) : blobUrl ? (
                      <video key={blobUrl} controls className="w-full h-full object-contain" src={blobUrl} />
                    ) : playUrl ? (
                      <video key={playUrl} controls className="w-full h-full object-contain" preload="metadata" playsInline src={playUrl} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">Generating preview...</div>
                    )}
                  </div>
                </div>
                {/* Mobile: workflow (below video) */}
                <div className="mt-3 px-2">
                  <div className="rounded-xl border bg-background/60 backdrop-blur p-3">
                    <div className="flex items-center gap-2 flex-wrap">

                      {(role === "EDITOR" || role === "MANAGER") && video.teamId && (video.status === "PROCESSING" || !video.status) && (
                        <button className="btn btn-ghost" disabled={submitting} onClick={markReady}>
                          {submitting ? "Working…" : "Mark ready to publish"}
                        </button>
                      )}

                      {(role === "EDITOR" || role === "MANAGER") && video.teamId && video.status === "READY" && (
                        <button className="btn btn-primary" disabled={submitting} onClick={requestApproval}>
                          {submitting ? "Working…" : "Request approval"}
                        </button>
                      )}

                      {(role === "OWNER" || role === "ADMIN") && video.teamId && video.status === "PENDING" && (
                        <button className="btn btn-success" disabled={submitting} onClick={() => approveOrPublish()}>
                          {submitting ? "Approving…" : "Approve"}
                        </button>
                      )}

                      {(role === "OWNER" || role === "ADMIN" || (role === "MANAGER" && video.status === "APPROVED")) && (
                        <button
                          className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 font-semibold text-white bg-[#FF0000] hover:bg-[#E60000] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          disabled={submitting}
                          onClick={approveOrPublish}
                        >
                          <Youtube className="h-5 w-5" />
                          {submitting ? 'Working…' : 'Publish to YouTube'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {/* Mobile: quick edit button just below the player */}
                <div className="mt-2 px-2">
                  <button
                    className="btn btn-primary w-full"
                    onClick={() => {
                      const el = document.getElementById('edit-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >
                    <Edit3 className="w-4 h-4 mr-1" /> Edit Video
                  </button>
                </div>
              </div>

              <div id="edit-section" className="order-2 lg:order-none lg:col-span-7 space-y-3 -mx-2 sm:mx-0">
                {/* Status chip (requested: above content div, left side) */}
                {(String(video.status || "PROCESSING").toUpperCase() === "PROCESSING" || String(video.status || "").toUpperCase() === "READY") && (
                  <div className="px-2 sm:px-0">
                    <StatusChip status={(String(video.status || "PROCESSING").toUpperCase() as any)} />
                  </div>
                )}
              
                <div className={`card p-4 sm:p-6 space-y-5 bg-muted/10 border border-border/60 ${role === "EDITOR" && video.status === "PENDING" ? "opacity-60 pointer-events-none select-none" : ""}`}>
                {/* Save status + action (moved away from under-video controls) */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    {isSaving || submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-blue-600 dark:text-blue-400">Working…</span>
                      </>
                    ) : hasUnsavedChanges ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-amber-600 dark:text-amber-400">Unsaved changes</span>
                      </>
                    ) : lastSavedAt ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-green-600 dark:text-green-400">
                          Saved {new Date(lastSavedAt).toLocaleTimeString()}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  <button
                    className={`btn ${hasUnsavedChanges ? 'btn-primary' : 'btn-outline'}`}
                    disabled={isSaving || !hasUnsavedChanges}
                    onClick={() => autoSave(true)}
                    title={hasUnsavedChanges ? 'Save changes' : 'No changes to save'}
                  >
                    {isSaving ? 'Working…' : hasUnsavedChanges ? 'Save changes' : 'Saved'}
                  </button>
                </div>
                {video.status === "PENDING" && (
                  <div className="mb-3 text-sm flex items-center gap-2 p-3 rounded-md border bg-amber-50 text-amber-800 border-amber-200">
                    <Clock className="w-4 h-4" />
                    {role === "EDITOR" ? (
                      <span>Awaiting owner review — editors can’t edit while awaiting publish.</span>
                    ) : (
                      <span>Awaiting publish — you can edit or send back to Processing to allow editors to make changes.</span>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input className="input bg-muted/20 border border-border/60 w-full" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="Add a descriptive title" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" /> 
                    Description
                  </label>
                  
                  {/* Formatting Toolbar */}
                  <div className="flex items-center gap-1 mb-2 p-2 bg-muted/30 rounded border">
                    <button
                      type="button"
                      onClick={() => insertFormatting('*', '*')}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                      title="Bold (*text*)"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('_', '_')}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                      title="Italic (_text_)"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-border mx-1" />
                    <button
                      type="button"
                      onClick={() => insertFormatting('#', '')}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                      title="Add hashtag (#tag)"
                    >
                      <Hash className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('0:00')}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                      title="Add timestamp (0:00)"
                    >
                      <Clock3 className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-border mx-1" />
                    <span className="text-xs text-muted-foreground px-2">
                      YouTube formatting supported
                    </span>
                  </div>

                  <textarea 
                    name="description"
                    className="textarea h-56 font-mono text-sm bg-muted/20 border border-border/60 w-full" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="📝 Add your video description here..."
                  />
                  
                  {/* Live Preview */}
                  {description.trim() && (
                    <div className="mt-3 p-3 bg-muted/20 border rounded">
                      <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                        <Type className="w-3 h-3" />
                        Live Preview
                      </div>
                      <div 
                        className="text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: descriptionPreview }}
                      />
                    </div>
                  )}
                  

                </div>
                {/* Thumbnail Section */}
                <div>
                  <label className="block text-sm font-medium mb-2">Thumbnail</label>
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {/* Thumbnail Preview Box */}
                    <div className="relative group mx-auto sm:mx-0">
                      {thumbnailLoading ? (
                        // Show shimmer loading state
                        <ThumbnailShimmer text="Loading thumbnail..." className="w-64 h-36" />
                      ) : (thumbPreview || currentThumbnailUrl) ? (
                        // Show thumbnail when available
                        <div className="relative w-64 h-36 rounded-lg overflow-hidden border-2 border-primary/20 bg-muted">
                          <Image
                            src={thumbPreview || (video?.thumbnailKey ? `/api/images/thumb?key=${encodeURIComponent(video.thumbnailKey)}&v=${encodeURIComponent(video?.updatedAt || video?.uploadedAt || "")}` : "")}
                            alt="Video thumbnail"
                            fill
                            sizes="256px"
                            className="object-cover"
                            onLoadingComplete={() => setImageLoading(false)}
                            onError={() => {
                              console.warn("Thumbnail failed to load; refreshing signed URL");
                              if (video?.thumbnailKey) {
                                try { videoCache.setThumbnailUrl(video.id, ""); } catch {}
                                loadThumbnailUrl(video.thumbnailKey);
                              } else {
                                setCurrentThumbnailUrl(null);
                              }
                              setImageLoading(false);
                            }}
                          />
                          
                          {/* Shimmer overlay while image is loading */}
                          {imageLoading && (
                            <div className="absolute inset-0 shimmer rounded-lg">
                              <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
                                <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                              </div>
                            </div>
                          )}
                          
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          <button
                            onClick={() => {
                              // If it's a new upload (thumbPreview), just clear locally
                              if (thumbPreview) {
                                setThumbFile(null);
                                setThumbPreview(null);
                                URL.revokeObjectURL(thumbPreview);
                              } else {
                                // If it's an existing thumbnail, delete from S3 and database
                                deleteThumbnail();
                              }
                            }}
                            disabled={thumbnailDeleting}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs hover:bg-red-600 disabled:opacity-50"
                            title={thumbPreview ? "Remove new thumbnail" : "Delete thumbnail permanently"}
                          >
                            {thumbnailDeleting ? (
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              "×"
                            )}
                          </button>
                        </div>
                      ) : (
                        // Show dotted box when no thumbnail
                        <label className="block w-64 h-36 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors mx-auto sm:mx-0">
                          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                            <ImageIcon className="w-12 h-12 mb-2" />
                            <span className="text-sm">Upload thumbnail</span>
                          </div>
                          <input 
                            type="file" 
                            accept="image/jpeg,image/png,image/gif,image/bmp" 
                            className="hidden" 
                            onChange={handleThumbnailFileChange} 
                          />
                        </label>
                      )}
                    </div>
                    
                    {/* Thumbnail Info */}
                    <div className="flex-1 w-full sm:w-auto text-sm text-muted-foreground mt-3 sm:mt-0">
                      <p className="mb-2">
                        Upload a custom thumbnail following YouTube's requirements.
                      </p>
                      <ul className="text-xs space-y-1">
                        <li>• Resolution: 1280×720 pixels (minimum 640px width)</li>
                        <li>• Aspect ratio: 16:9 (recommended by YouTube)</li>
                        <li>• Formats: JPG, PNG, GIF, or BMP</li>
                        <li>• File size: Under 2MB</li>
                      </ul>
                      {(thumbPreview || currentThumbnailUrl) && (
                        <label className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-primary/10 text-primary rounded cursor-pointer hover:bg-primary/20 transition-colors">
                          <ImageIcon className="w-4 h-4" />
                          Change thumbnail
                          <input 
                            type="file" 
                            accept="image/jpeg,image/png,image/gif,image/bmp" 
                            className="hidden" 
                            onChange={handleThumbnailFileChange} 
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">👥 Who's Watching?</label>
                      <label className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={madeForKids} 
                          onChange={(e) => setMadeForKids(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        /> 
                        <span className="flex items-center gap-2">
                          <span className="text-lg">🧸</span>
                          <span>Kid-friendly content</span>
                          <span className="text-xs text-muted-foreground">(Safe for little ones!)</span>
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Visibility</label>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      {(["private", "unlisted", "public"] as const).map((v) => {
                        const isActive = visibility === v;
                        const color = v === "private" ? (isActive ? "border-slate-500 bg-slate-500/10 text-slate-800 dark:text-slate-200" : "border-border")
                          : v === "unlisted" ? (isActive ? "border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-200" : "border-border")
                          : (isActive ? "border-green-500 bg-green-500/10 text-green-800 dark:text-green-200" : "border-border");
                        return (
                          <label
                            key={v}
                            onClick={() => setVisibility(v)}
                            aria-pressed={isActive}
                            className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors border ${color} ${!isActive ? 'hover:border-primary/40' : 'ring-1 ring-primary/30'}`}
                          >
                            <input type="radio" className="sr-only" checked={isActive} onChange={() => setVisibility(v)} />
                            <span className="capitalize">{v}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end" />
              </div>
            </div>

            {/* Right: bigger player + actions (desktop) */}
            <div className="hidden lg:block lg:col-span-5 space-y-3 lg:sticky lg:top-4 self-start">
              <div className="card p-3">
                <div className="w-full rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16 / 9' }}>
                  {urlError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-red-400 p-4">
                      <div className="text-sm mb-2">Error loading video:</div>
                      <div className="text-xs">{urlError}</div>
                    </div>
                  ) : webOptimizedUrl ? (
                    <div className="w-full h-full">
                      <video
                        key={webOptimizedUrl}
                        controls
                        className="w-full h-full object-contain"
                        preload="metadata"
                        src={webOptimizedUrl}
                        onError={() => {
                          console.error("Web-optimized video error");
                          setUrlError("Web-optimized video failed");
                        }}
                      />
                      <div className="p-2 text-xs text-blue-400">⚡ Web-optimized for fast streaming</div>
                    </div>
                  ) : blobUrl ? (
                    <div className="w-full h-full">
                      <video
                        key={blobUrl}
                        controls
                        className="w-full h-full object-contain"
                        src={blobUrl}
                        onError={() => {
                          console.error("Blob video error");
                          setUrlError("Blob video failed to load");
                        }}
                      />
                      <div className="p-2 text-xs text-green-400">✓ Playing from downloaded blob</div>
                    </div>
                  ) : playUrl ? (
                    <div className="w-full h-full">
                      <video
                        key={playUrl}
                        controls
                        className="w-full h-full object-contain"
                        preload="metadata"
                        playsInline
                        src={playUrl}
                        onError={() => {
                          console.error("Video error");
                          setUrlError("Video preview failed to stream. Try again, or use “Force download & play”.");
                        }}
                      />
                      <div className="p-2 text-xs text-gray-400 space-x-2">
                        <a href={playUrl} target="_blank" rel="noopener" className="text-blue-400 underline">Direct link</a>
                        <button onClick={downloadAsBlob} disabled={isDownloading} className="text-yellow-400 underline hover:text-yellow-300">
                          {isDownloading ? "Downloading..." : "Force download & play"}
                        </button>
                        <button onClick={processForWeb} disabled={isProcessing} className="text-green-400 underline hover:text-green-300">
                          {isProcessing ? "Optimizing..." : "⚡ Optimize for web"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">Generating preview...</div>
                  )}
                </div>
              </div>

              {/* Buttons BELOW video on the right side */}
              <div className="card p-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {/* Workflow (left) */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {(role === "EDITOR" || role === "MANAGER") && video.teamId && (video.status === "PROCESSING" || !video.status) && (
                      <button className="btn btn-ghost" disabled={submitting} onClick={markReady}>
                        {submitting ? "Working…" : "Mark ready"}
                      </button>
                    )}
                    {(role === "EDITOR" || role === "MANAGER") && video.teamId && video.status === "READY" && (
                      <button className="btn btn-primary" disabled={submitting} onClick={requestApproval}>
                        {submitting ? "Working…" : "Request approval"}
                      </button>
                    )}
                    {(role === "OWNER" || role === "ADMIN") && video.teamId && video.status === "PENDING" && (
                      <button className="btn btn-success" disabled={submitting} onClick={() => approveOrPublish()}>
                        {submitting ? "Approving…" : "Approve"}
                      </button>
                    )}
                  </div>

                  {/* Primary actions (right) - vertical stack */}
                  <div className="flex flex-col items-stretch gap-2 w-full sm:w-auto sm:min-w-[220px]">
                    <button
                      className="btn btn-primary w-full"
                      onClick={() => {
                        const el = document.getElementById('edit-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      Edit video
                    </button>

                    {(role === "OWNER" || role === "ADMIN" || (role === "MANAGER" && video.status === "APPROVED")) && (
                      <button
                        className="inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 font-semibold text-white bg-[#FF0000] hover:bg-[#E60000] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={submitting}
                        onClick={approveOrPublish}
                      >
                        <Youtube className="h-5 w-5" />
                        {submitting ? 'Working…' : 'Publish'}
                      </button>
                    )}

                    {(role === "OWNER" || role === "ADMIN" || role === "MANAGER") && (
                      <button className="btn btn-warning w-full" onClick={() => setDeleteModalOpen(true)} title="Delete video permanently">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {(role === "OWNER") && video.teamId && video.status === "PENDING" && (
                  <button
                    className="btn btn-ghost w-full mt-2"
                    disabled={submitting}
                    title="Revert to Processing so editors can continue editing"
                    onClick={async () => {
                      try {
                        setSubmitting(true);
                        const res = await fetch(`/api/videos/${video.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: "PROCESSING" })
                        });
                        if (!res.ok) throw new Error();
                        await res.json();
                        setVideo(v => v ? ({ ...v, status: "PROCESSING" }) : v);
                        notifications.addNotification({ type: "success", title: "Sent back for editing", message: "Editors can edit again." });
                      } catch {
                        notifications.addNotification({ type: "error", title: "Failed", message: "Could not send back for editing" });
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                  >
                    ↩ Send back for editing
                  </button>
                )}
              </div>
              {/* Upload timeline removed per request */}
            </div>
          </div>
        )}
      </div>
      
      
      {/* Delete Video Confirmation */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => (!deleting ? setDeleteModalOpen(false) : null)}
        onConfirm={deleteVideo}
        title="Delete Video?"
        message="This action cannot be undone. The video will be permanently deleted from both the platform and YouTube (if published)."
        itemName={video?.filename}
        confirmText={deleting ? "Deleting..." : "Delete Permanently"}
        cancelText="Cancel"
        variant="danger"
        isLoading={deleting}
      />
      </div>
    </AppShell>
  );
}
