"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Youtube, CheckCircle, XCircle, Loader2, AlertCircle, Upload, Sparkles } from "lucide-react";
import { Button } from "./button";
import { Dialog, DialogContent } from "./dialog";

type UploadStep = "uploading" | "success" | "error";

type YouTubeUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  videoTitle?: string;
  uploadPromise: Promise<Response>;
};

export function YouTubeUploadModal({
  isOpen,
  onClose,
  onSuccess,
  videoTitle,
  uploadPromise,
}: YouTubeUploadModalProps) {
  const [step, setStep] = useState<UploadStep>("uploading");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [thumbnailStatus, setThumbnailStatus] = useState<"success" | "failed" | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const handleUpload = async () => {
      try {
        setStep("uploading");
        setProgress(0);
        setError(null);
        setThumbnailStatus(null);
        setThumbnailError(null);

        // Simulate progress (since we don't have real-time progress from the API)
        const progressInterval = setInterval(() => {
          if (cancelled) {
            clearInterval(progressInterval);
            return;
          }
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + Math.random() * 10;
          });
        }, 500);

        const response = await uploadPromise;

        clearInterval(progressInterval);
        setProgress(100);

        // Parse response
        let result: any = {};
        try {
          result = await response.json();
        } catch (parseError) {
          console.error("Failed to parse response:", parseError);
          // If response is not ok, throw error
          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
          }
        }

        // Check if upload was successful
        // HTTP status check
        if (!response.ok) {
          const errorMsg = result?.error || result?.message || `Upload failed: ${response.status} ${response.statusText}`;
          console.error("[YouTubeUploadModal] Upload failed:", response.status, errorMsg, result);
          throw new Error(errorMsg);
        }

        // Check for success indicators in response body
        if (result?.ok === false || result?.success === false) {
          const errorMsg = result?.error || result?.message || "Upload failed";
          console.error("[YouTubeUploadModal] Upload marked as failed in response:", errorMsg, result);
          throw new Error(errorMsg);
        }

        // If we have a youtubeVideoId, consider it successful even if other fields are missing
        if (!result?.youtubeVideoId && !result?.video?.youtubeVideoId) {
          console.warn("[YouTubeUploadModal] No youtubeVideoId in response:", result);
          // Don't throw error here - let it continue and show success if status is 200
        }

        // Extract YouTube video ID
        const videoId = result?.youtubeVideoId || result?.video?.youtubeVideoId || null;
        setYoutubeVideoId(videoId);

        // Check thumbnail upload status
        if (result?.thumbnailUploadStatus !== undefined) {
          setThumbnailStatus(result.thumbnailUploadStatus === "SUCCESS" ? "success" : "failed");
          if (result.thumbnailUploadStatus === "FAILED") {
            setThumbnailError(result.thumbnailUploadError || "Thumbnail upload failed");
          }
        } else if (result?.video?.youtubeThumbnailUploadStatus) {
          // Check nested video object
          const thumbStatus = result.video.youtubeThumbnailUploadStatus;
          setThumbnailStatus(thumbStatus === "SUCCESS" ? "success" : thumbStatus === "FAILED" ? "failed" : null);
          if (thumbStatus === "FAILED") {
            setThumbnailError(result.video.youtubeThumbnailUploadError || "Thumbnail upload failed");
          }
        }

        // Mark as success immediately - don't wait for YouTube processing
        // The video is successfully sent to YouTube, processing happens on YouTube's side
        if (cancelled) return;

        setStep("success");

        // Auto-close after 2 seconds and call onSuccess
        setTimeout(() => {
          if (!cancelled) {
            onSuccess?.();
            onClose();
          }
        }, 2000);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Upload failed");
        setStep("error");
      }
    };

    handleUpload();

    return () => {
      cancelled = true;
    };
  }, [isOpen, uploadPromise, onSuccess, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Prevent closing during upload
      if (!open && step === "uploading") {
        return;
      }
      onClose();
    }}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden border-0 shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-red-500 via-red-600 to-red-700 px-6 py-5 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyMCIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          <div className="relative flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg">
              <Youtube className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white mb-1">Publishing to YouTube</h3>
              {videoTitle && (
                <p className="text-sm text-white/90 truncate font-medium">{videoTitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {step === "uploading" && (
            <div className="space-y-6 py-2">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse"></div>
                  <div className="relative p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-2xl border-2 border-red-200 dark:border-red-800">
                    <Upload className="h-10 w-10 text-red-600 dark:text-red-400 animate-bounce" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-base font-semibold text-foreground">Uploading to YouTube</p>
                  <p className="text-xs text-muted-foreground">Sending your video to YouTube...</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-red-500 via-red-600 to-red-500 rounded-full relative overflow-hidden"
                  >
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />
                  </motion.div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Uploading</span>
                  <span className="font-semibold text-foreground">{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
          )}

          {step === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="space-y-5 py-2"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl"
                  />
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                    className="relative p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl border-2 border-green-200 dark:border-green-800 shadow-lg"
                  >
                    <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                  </motion.div>
                </div>
                <div className="text-center space-y-2">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl font-bold text-foreground"
                  >
                    Successfully Published! 🎉
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-muted-foreground"
                  >
                    Your video has been sent to YouTube and is being processed
                  </motion.p>
                  {youtubeVideoId && (
                    <motion.a
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      href={`https://www.youtube.com/watch?v=${youtubeVideoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-3 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-md"
                    >
                      <Youtube className="h-4 w-4" />
                      View on YouTube
                    </motion.a>
                  )}
                </div>
              </div>

              {/* Thumbnail status */}
              {thumbnailStatus && (
                <div className={`p-3 rounded-lg border ${
                  thumbnailStatus === "success"
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                }`}>
                  <div className="flex items-center gap-2">
                    {thumbnailStatus === "success" ? (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    )}
                    <p className={`text-xs ${
                      thumbnailStatus === "success"
                        ? "text-green-700 dark:text-green-300"
                        : "text-amber-700 dark:text-amber-300"
                    }`}>
                      {thumbnailStatus === "success"
                        ? "Thumbnail uploaded successfully"
                        : `Thumbnail upload failed: ${thumbnailError || "Unknown error"}`}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">Upload Failed</p>
                  <p className="text-sm text-muted-foreground mt-1 break-words">
                    {error || "An error occurred"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        {step === "error" && (
          <div className="px-6 py-4 bg-muted/50 border-t border-border">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}
        {step === "uploading" && (
          <div className="px-6 py-3 bg-muted/50 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              Please don't close this window
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

