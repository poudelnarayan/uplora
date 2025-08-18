"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  FileVideo, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Youtube,
  Sparkles,
  Zap,
  Target,
  Clock,
  FileText,
  Settings,
  Shield
} from "lucide-react";
import { useNotifications } from "@/components/ui/Notification";
import { useRouter } from "next/navigation";
import { useUploads } from "@/context/UploadContext";
import { useTeam } from "@/context/TeamContext";

export default function UploadZone() {
  const notifications = useNotifications();
  const router = useRouter();
  const { enqueueUpload, uploads, hasActive, cancelUpload } = useUploads() as any;
  const { selectedTeamId } = useTeam();
  // State management
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);
  const [s3Key, setS3Key] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [videoTitle, setVideoTitle] = useState("My Awesome Video");
  const [videoDescription, setVideoDescription] = useState("Uploaded with Uplora");
  const [privacyStatus, setPrivacyStatus] = useState<"private" | "unlisted" | "public">("private");

  // Mirror global uploads to detect completion for this page
  const uploadsRef = useRef<any[]>(uploads);
  uploadsRef.current = uploads;
  
  // Track last notification status to prevent duplicates
  const lastNotificationStatus = useRef<string | null>(null);
  
  // Sync local state with global upload state
  useEffect(() => {
    if (currentUploadId) {
      const currentUpload = uploads.find((u: any) => u.id === currentUploadId);
      if (currentUpload) {
        const statusChanged = lastNotificationStatus.current !== currentUpload.status;
        
        if (currentUpload.status === "cancelled" && statusChanged) {
          // Upload was cancelled, reset local state
          setIsUploading(false);
          setCurrentUploadId(null);
          setUploadProgress(0);
          lastNotificationStatus.current = "cancelled";
          
          // Clear any upload-related notifications when upload is cancelled
          notifications.clearNotifications();
          notifications.addNotification({ 
            type: "info", 
            title: "Upload cancelled", 
            message: "Your upload has been cancelled" 
          });
        } else if (currentUpload.status === "failed" && statusChanged) {
          // Upload failed, reset local state
          setIsUploading(false);
          setCurrentUploadId(null);
          setUploadProgress(0);
          lastNotificationStatus.current = "failed";
          
          // Clear any upload-related notifications when upload fails
          notifications.clearNotifications();
          notifications.addNotification({ 
            type: "error", 
            title: "Upload failed", 
            message: currentUpload.error || "Upload failed",
            sticky: true,
            stickyConditions: { dismissOnRouteChange: true }
          });
        } else if (currentUpload.status === "completed" && statusChanged) {
          // Upload completed, set s3Key and reset upload state
          setS3Key(currentUpload.s3Key || "");
          setIsUploading(false);
          setCurrentUploadId(null);
          setUploadProgress(100);
          lastNotificationStatus.current = "completed";
          
          // Clear any upload-related notifications when upload completes
          notifications.clearNotifications();
          notifications.addNotification({ 
            type: "success", 
            title: "Upload completed!", 
            message: "Your video has been uploaded successfully" 
          });
        }
      }
    }
  }, [uploads, currentUploadId, notifications]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (hasActive || isUploading) {
      notifications.addNotification({ type: "info", title: "Upload in progress", message: "Please wait for the current upload to finish." });
      return;
    }
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const videoFile = droppedFiles.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      setFile(videoFile);
      // Set video title to filename without extension
      const titleWithoutExt = videoFile.name.replace(/\.[^/.]+$/, '');
      setVideoTitle(titleWithoutExt);
      notifications.addNotification({ type: "success", title: "Video selected!", message: `${videoFile.name} is ready to upload` });
    } else {
      notifications.addNotification({ type: "error", title: "Invalid file type", message: "Please drop a video file (MP4, MOV, AVI, etc.)" });
    }
  }, [notifications]);

  // File size formatter
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Upload to S3 (small -> direct PUT, large -> multipart)
  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      notifications.addNotification({ type: "info", title: "Starting upload...", message: "Preparing upload" });

      const LARGE_THRESHOLD = 80 * 1024 * 1024; // 80 MB
      if (file.size < LARGE_THRESHOLD) {
        // Direct single-part PUT upload
        const presign = await fetch("/api/s3/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type || "application/octet-stream", sizeBytes: file.size }),
        }).then((r) => r.json());
        if (!presign?.putUrl || !presign?.key) throw new Error("Failed to presign upload");

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", presign.putUrl, true);
          xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.floor((e.loaded / e.total) * 100);
              setUploadProgress(Math.min(99, percent));
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
            }
          };
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.send(file);
        });

        setS3Key(presign.key);
        setUploadProgress(100);
        notifications.addNotification({ type: "success", title: "Upload complete!", message: "Your video is ready to publish" });
        return;
      }

      // 1) Init multipart
      const init = await fetch("/api/s3/multipart/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type || "application/octet-stream" }),
      }).then((r) => r.json());
      if (!init?.uploadId || !init?.key) throw new Error("Failed to init multipart upload");

      const PART_SIZE = init.partSize || 8 * 1024 * 1024; // 8MB default
      const totalParts = Math.ceil(file.size / PART_SIZE);
      const uploaded: Record<number, string> = {};
      let completedBytes = 0;

      const signPart = async (partNumber: number) => {
        const res = await fetch("/api/s3/multipart/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: init.key, uploadId: init.uploadId, partNumber }),
        });
        if (!res.ok) throw new Error("Failed to sign part");
        return res.json() as Promise<{ url: string }>;
      };

      const uploadPart = async (partNumber: number) => {
        const start = (partNumber - 1) * PART_SIZE;
        const end = Math.min(start + PART_SIZE, file.size);
        const blob = file.slice(start, end);
        const { url } = await signPart(partNumber);
        const putRes = await fetch(url, { method: "PUT", body: blob });
        if (!putRes.ok) {
          const txt = await putRes.text().catch(() => "");
          throw new Error(`Part ${partNumber} failed: ${putRes.status} ${txt}`);
        }
        const etag = (putRes.headers.get("ETag") || "").replaceAll('"', "");
        if (!etag) throw new Error(`Missing ETag for part ${partNumber}`);
        uploaded[partNumber] = etag;
        completedBytes += blob.size;
        const percent = Math.floor((completedBytes / file.size) * 100);
        setUploadProgress(Math.min(99, percent));
      };

      // 2) Upload parts with limited concurrency
      const CONCURRENCY = 5;
      let nextPart = 1;
      const inFlight = new Set<Promise<void>>();

      const launchNext = () => {
        if (nextPart > totalParts) return;
        const p = uploadPart(nextPart++).finally(() => {
          inFlight.delete(p);
          launchNext();
        });
        inFlight.add(p);
      };
      while (inFlight.size < CONCURRENCY && nextPart <= totalParts) launchNext();
      // Wait for all parts to finish (including those scheduled after initial seeding)
      while (Object.keys(uploaded).length < totalParts) {
        await new Promise((r) => setTimeout(r, 200));
      }

      // 3) Complete multipart
      const parts = Object.keys(uploaded)
        .map((n) => ({ partNumber: Number(n), etag: uploaded[Number(n)] }))
        .sort((a, b) => a.partNumber - b.partNumber);

      const completeRes = await fetch("/api/s3/multipart/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: init.key,
          uploadId: init.uploadId,
          parts,
          originalFilename: file.name,
          contentType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        }),
      });
      if (!completeRes.ok) {
        // As a safety net, verify object exists. If it does, continue as success.
        try {
          const probe = await fetch("/api/s3/get-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: init.key, expiresIn: 60 }),
          });
          if (!probe.ok) {
            const txt = await completeRes.text().catch(() => "");
            throw new Error(txt || "Failed to complete upload");
          }
        } catch (e) {
          throw e instanceof Error ? e : new Error("Failed to complete upload");
        }
      }

      setS3Key(init.key);
      setUploadProgress(100);
      notifications.addNotification({ type: "success", title: "Upload complete!", message: "Your video is ready to publish" });
    } catch (e) {
      notifications.addNotification({ type: "error", title: "Upload failed", message: e instanceof Error ? e.message : "Please try again", sticky: true, stickyConditions: { dismissOnRouteChange: true } });
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  // Publish to YouTube
  const handlePublish = async () => {
    if (!s3Key) return;
    
    setIsPublishing(true);
    
    try {
      notifications.addNotification({ type: "info", title: "Publishing to YouTube...", message: "This may take a few minutes" });
      
      const response = await fetch("/api/youtube/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: s3Key, title: videoTitle, description: videoDescription, privacyStatus }),
      });

      const result = await response.json();

      if (result.id) {
        notifications.addNotification({ type: "success", title: "Video published successfully!", message: "Your video is now live on YouTube" });
        // Reset form
        setFile(null);
        setS3Key("");
        setUploadProgress(0);
        setVideoTitle("My Awesome Video");
        setVideoDescription("Uploaded with Uplora");
        setPrivacyStatus("private");
        router.push("/dashboard");
      } else {
        notifications.addNotification({ type: "error", title: "Publishing failed", message: result.error || "Please try again", sticky: true, stickyConditions: { dismissOnRouteChange: true } });
      }
    } catch {
      notifications.addNotification({ type: "error", title: "Publishing failed", message: "Please check your connection", sticky: true, stickyConditions: { dismissOnRouteChange: true } });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Zone */}
      <div className="space-y-6">
        {!file ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`upload-zone ${isDragOver ? 'dragover' : ''} ${hasActive ? 'opacity-70 cursor-not-allowed' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (hasActive || isUploading) return;
              document.getElementById('file-input')?.click();
            }}
          >
            <input
              id="file-input"
              type="file"
              accept="video/*"
              disabled={hasActive || isUploading}
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) {
                  setFile(selectedFile);
                  // Set video title to filename without extension
                  const titleWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
                  setVideoTitle(titleWithoutExt);
                }
              }}
              className="hidden"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mx-auto flex items-center justify-center animate-pulse-glow">
                <FileVideo className="w-12 h-12 text-white" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">
                  {isDragOver ? "Drop your video here!" : "Upload your video"}
                </h3>
                <p className="text-muted-foreground">
                  {hasActive ? "Uploading Video. Please wait until it finishes." : (isDragOver ? "Release to upload" : "Drag and drop or click to browse")}
                </p>
              </div>
              
              <div className="hidden sm:flex flex-wrap gap-2 justify-center">
                {['MP4', 'MOV', 'AVI', 'WebM', 'MKV'].map(format => (
                  <span
                    key={format}
                    className="px-3 py-1 rounded-full bg-muted text-sm text-muted-foreground"
                  >
                    {format}
                  </span>
                ))}
              </div>

              <div className="hidden sm:flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Fast upload</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>Direct to YouTube</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* File Preview */}
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center animate-pulse-glow">
                  <FileVideo className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-lg truncate" title={file.name}>
                    {file.name}
                  </h3>
                  <p className="text-muted-foreground">
                    {formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
                  </p>
                </div>
                {!isUploading && (
                  <button
                    onClick={() => {
                      setFile(null);
                      setS3Key("");
                      setUploadProgress(0);
                    }}
                    className="btn btn-ghost p-2 hover:bg-destructive/10 hover:text-destructive"
                    title="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 space-y-3"
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">Uploading to cloud...</span>
                    <span className="text-muted-foreground">{
                      currentUploadId ? (() => { const it = uploads.find((u: any) => u.id === currentUploadId); return it ? `${it.progress}%` : `${uploadProgress}%`; })() : `${uploadProgress}%`
                    }</span>
                  </div>
                  <div className="progress">
                    <div
                      className="progress-bar"
                      style={{ width: `${currentUploadId ? (() => { const it = uploads.find((u: any) => u.id === currentUploadId); return it ? it.progress : uploadProgress; })() : uploadProgress}%` }}
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Upload Button */}
            {!s3Key && (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (!file) return;
                    const id = enqueueUpload(file, selectedTeamId);
                    setCurrentUploadId(id);
                    setIsUploading(true);
                    lastNotificationStatus.current = null; // Reset notification tracking
                    notifications.addNotification({ 
                      type: "info", 
                      title: "Uploading...", 
                      message: "Feel free to keep using the site. This page will track progress.",
                      sticky: true,
                      stickyConditions: {
                        dismissOnRouteChange: true,
                        dismissAfterSeconds: 25
                      }
                    });
                  }}
                  disabled={isUploading || hasActive}
                  className="btn btn-primary w-full"
                >
                  {isUploading || hasActive ? (
                    <>
                      <div className="spinner mr-2" />
                      Uploading Video
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload to Cloud
                    </>
                  )}
                </button>
                
                {/* Cancel Button - only show when uploading */}
                {isUploading && currentUploadId && (
                  <button
                    onClick={() => {
                      if (currentUploadId) {
                        cancelUpload(currentUploadId);
                        setIsUploading(false);
                        setCurrentUploadId(null);
                        setUploadProgress(0);
                        notifications.addNotification({ 
                          type: "info", 
                          title: "Upload cancelled", 
                          message: "Your upload has been cancelled" 
                        });
                      }
                    }}
                    className="btn btn-outline w-full text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="w-5 h-5" />
                    Cancel Upload
                  </button>
                )}
              </div>
            )}

            {/* Upload Complete */}
            {s3Key && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-4 border-green-500/20 bg-green-500/5"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="font-semibold text-foreground">Upload Complete!</p>
                    <p className="text-sm text-muted-foreground">You can find this upload in the Recent Videos on your dashboard.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* Publishing Section removed per request; show only Upload Complete card */}
    </div>
  );
}
