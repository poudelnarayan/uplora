"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AppShell from "@/components/layout/AppShell";
import { Play, Trash2 } from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { useNotifications } from "@/components/ui/Notification";
import { useTeam } from "@/context/TeamContext";

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  status: "PROCESSING" | "PENDING" | "PUBLISHED";
  uploadedAt: string;
}

export default function AllVideosPage() {
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
        setVideos(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    };
    load();
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
        return "Pending";
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
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="heading-2">
            {selectedTeam ? `${selectedTeam.name} - All Videos` : "Personal Videos"}
          </h1>
          <p className="text-muted-foreground">
            {selectedTeam 
              ? `All videos uploaded to ${selectedTeam.name}` 
              : "Your personal uploaded videos"
            }
          </p>
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
                    <div className="w-40 h-24 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No thumbnail</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-foreground truncate" title={fullTitle}>{title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(video.status)}`}>{getStatusText(video.status)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Uploaded: {uploaded}</div>
                      <div className="mt-3 flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => location.assign(`/videos/${video.id}`)}>
                          <Play className="w-4 h-4 mr-1" /> Preview
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm text-gray-500 hover:text-red-500 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950/30"
                          onClick={() => handleDeleteVideo(video)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </button>
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
