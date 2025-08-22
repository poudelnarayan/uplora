"use client";

import { motion } from "framer-motion";

const MotionDiv = motion.div as any;
import { Upload, Play, Image as ImageIcon, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { StatusChip } from "@/components/ui/StatusChip";

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  status: "PROCESSING" | "PENDING" | "PUBLISHED";
  uploadedAt: string;
  updatedAt: string;
  thumbnailKey?: string | null;
  userRole?: "OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | null;
  uploader?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface VideosListProps {
  videos: VideoItem[];
  loading: boolean;
  thumbnailUrls: Record<string, string>;
  loadingThumbnails: Record<string, boolean>;
  onChangeVideoStatus: (videoId: string, newStatus: string) => void;
  onDeleteVideo?: (videoId: string, videoTitle: string) => void;
  processingVideoId?: string | null;
  deletingVideoId?: string | null;
  showAll?: boolean;
}

export default function VideosList({
  videos,
  loading,
  thumbnailUrls,
  loadingThumbnails,
  onChangeVideoStatus,
  onDeleteVideo,
  processingVideoId,
  deletingVideoId,
  showAll = false
}: VideosListProps) {
  const router = useRouter();
  const displayVideos = showAll ? videos : videos.slice(0, 3);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="spinner-lg mx-auto mb-4" />
        <p className="text-muted-foreground">Loading videos...</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
          <Upload className="w-8 h-8" />
        </div>
        <h4 className="text-lg font-semibold mb-2 text-foreground">No videos yet</h4>
        <p className="text-muted-foreground mb-6">Create your first post to see it here.</p>
        <button className="btn btn-primary" onClick={() => router.push('/upload')}>
          Make Your First Post
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 lg:space-y-4">
        {displayVideos.map((video) => {
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
            <MotionDiv
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
                    {video.status === 'PROCESSING' && video.userRole && ["EDITOR","MANAGER","ADMIN"].includes(video.userRole) && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => { e.stopPropagation(); onChangeVideoStatus(video.id, 'PENDING'); }}
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
                    {onDeleteVideo && video.userRole && ["OWNER","ADMIN","MANAGER"].includes(video.userRole) && (
                      <button
                        className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onDeleteVideo(video.id, video.title || "Untitled"); 
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
            </MotionDiv>
          );
        })}
      </div>
      {!showAll && videos.length > 3 && (
        <div className="mt-4 text-center">
          <button className="btn btn-ghost w-full" onClick={() => router.push('/videos')}>
            View all
          </button>
        </div>
      )}
    </>
  );
}