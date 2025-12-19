"use client";

import { useUploads } from "@/context/UploadContext";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Upload } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { InlineSpinner } from "@/app/components/ui/loading-spinner";

const MotionDiv = motion.div as any;

export default function UploadTray() {
  const { uploads, dismiss, cancelUpload } = useUploads();
  const hasActive = uploads.length > 0;
  const router = useRouter();
  const pathname = usePathname();

  // Hide tray on the upload page to avoid duplicate UI
  if (pathname && pathname.startsWith('/make-post/video')) {
    return null;
  }

  // Auto-dismiss rules:
  // - completed: 1.5s (faster to reduce UI residue)
  // - cancelled: 1.5s
  // - failed: 4s
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    uploads.forEach((u) => {
      if (u.status === "completed") {
        timers.push(setTimeout(() => dismiss(u.id), 1500));
      } else if (u.status === "cancelled") {
        timers.push(setTimeout(() => dismiss(u.id), 1500));
      } else if (u.status === "failed") {
        timers.push(setTimeout(() => dismiss(u.id), 4000));
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [uploads, dismiss]);

  return (
          <AnimatePresence>
        {hasActive && (
          <MotionDiv
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 right-4 z-50 w-80 space-y-2"
          >
          {uploads.map((u) => {
            const isActive = u.status === "uploading" || u.status === "queued";
            return (
            <div 
              key={u.id} 
              className={`card p-3 shadow-lg border bg-background ${isActive ? 'cursor-pointer pointer-events-auto' : 'cursor-default pointer-events-none'}`}
              onClick={() => {
                if (isActive) {
                  router.push('/make-post/video');
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {u.status === "completed" ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : u.status === "failed" ? (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  ) : u.status === "cancelled" ? (
                    <X className="w-5 h-5 text-orange" />
                  ) : u.status === "uploading" ? (
                    <InlineSpinner size="sm" className="text-primary" />
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
                    className="p-1 rounded-full hover:bg-muted transition-colors pointer-events-auto"
                    onClick={(e) => { e.stopPropagation(); dismiss(u.id); }}
                  >
                    <X className="w-4 h-4 text-foreground" strokeWidth={2.5} />
                  </button>
                ) : u.status === "uploading" || u.status === "queued" ? (
                  <button
                    aria-label="Cancel upload"
                    className="p-1 rounded-full hover:bg-destructive-muted transition-colors pointer-events-auto"
                    onClick={(e) => { e.stopPropagation(); cancelUpload(u.id); }}
                  >
                    <X className="w-4 h-4 text-destructive" strokeWidth={2.5} />
                  </button>
                ) : null}
              </div>
              {u.status === "uploading" && (
                <div className="mt-2 w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/80 transition-[width] duration-200"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              )}
              {u.status === "failed" && u.error && (
                <div className="text-xs text-destructive mt-1">{u.error}</div>
              )}
            </div>
          )})}
        </MotionDiv>
      )}
    </AnimatePresence>
  );
}


