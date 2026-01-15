"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Youtube, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
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

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData?.error || `Upload failed: ${response.status}`);
        }

        const result = await response.json().catch(() => ({}));
        setYoutubeVideoId(result?.youtubeVideoId || result?.video?.youtubeVideoId || null);

        // Check thumbnail upload status
        if (result?.thumbnailUploadStatus) {
          setThumbnailStatus(result.thumbnailUploadStatus === "SUCCESS" ? "success" : "failed");
          if (result.thumbnailUploadStatus === "FAILED") {
            setThumbnailError(result.thumbnailUploadError || "Thumbnail upload failed");
          }
        }

        // Small delay to show completion
        await new Promise((resolve) => setTimeout(resolve, 800));

        if (cancelled) return;

        setStep("success");

        // Auto-close after 2.5 seconds and call onSuccess
        setTimeout(() => {
          if (!cancelled) {
            onSuccess?.();
            onClose();
          }
        }, 2500);
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
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Youtube className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white">Publishing to YouTube</h3>
              {videoTitle && (
                <p className="text-sm text-white/90 truncate">{videoTitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {step === "uploading" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Uploading video...</p>
                  <p className="text-xs text-muted-foreground">This may take a few minutes</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                />
              </div>
              <p className="text-xs text-center text-muted-foreground font-medium">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}

          {step === "success" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">Upload Successful!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your video has been published to YouTube
                  </p>
                  {youtubeVideoId && (
                    <a
                      href={`https://www.youtube.com/watch?v=${youtubeVideoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-red-600 dark:text-red-400 hover:underline mt-2 inline-block"
                    >
                      View on YouTube →
                    </a>
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

