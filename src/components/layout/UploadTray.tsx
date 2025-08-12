"use client";

import { useUploads } from "@/context/UploadContext";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Upload } from "lucide-react";

export default function UploadTray() {
  const { uploads, dismiss, cancelUpload } = useUploads();
  const hasActive = uploads.length > 0;

  // Auto-dismiss rules:
  // - completed: 3s
  // - cancelled: 3s
  // - failed: 5s
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    uploads.forEach((u) => {
      if (u.status === "completed") {
        timers.push(setTimeout(() => dismiss(u.id), 3000));
      } else if (u.status === "cancelled") {
        timers.push(setTimeout(() => dismiss(u.id), 3000));
      } else if (u.status === "failed") {
        timers.push(setTimeout(() => dismiss(u.id), 5000));
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [uploads, dismiss]);

  return (
    <AnimatePresence>
      {hasActive && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 right-4 z-50 w-80 space-y-2"
        >
          {uploads.map((u) => (
            <div key={u.id} className="card p-3 shadow-lg border bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {u.status === "completed" ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : u.status === "failed" ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : u.status === "cancelled" ? (
                    <X className="w-5 h-5 text-orange-500" />
                  ) : (
                    <Upload className="w-5 h-5 text-primary" />
                  )}
                  <div className="truncate">
                    <div className="text-sm font-medium truncate">{u.fileName}</div>
                    <div className="text-xs text-muted-foreground">{u.status === "uploading" ? `${u.progress}%` : u.status}</div>
                  </div>
                </div>
                {u.status === "completed" || u.status === "failed" || u.status === "cancelled" ? (
                  <button
                    aria-label="Dismiss upload"
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                    onClick={() => dismiss(u.id)}
                  >
                    <X className="w-4 h-4 text-foreground" strokeWidth={2.5} />
                  </button>
                ) : u.status === "uploading" || u.status === "queued" ? (
                  <button
                    aria-label="Cancel upload"
                    className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                    onClick={() => cancelUpload(u.id)}
                  >
                    <X className="w-4 h-4 text-red-500" strokeWidth={2.5} />
                  </button>
                ) : null}
              </div>
              {u.status === "uploading" && (
                <div className="progress mt-2">
                  <div className="progress-bar" style={{ width: `${u.progress}%` }} />
                </div>
              )}
              {u.status === "failed" && u.error && (
                <div className="text-xs text-red-500 mt-1">{u.error}</div>
              )}
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}


