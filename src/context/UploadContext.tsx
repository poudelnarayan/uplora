"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

type UploadStatus = "queued" | "uploading" | "completed" | "failed" | "cancelled";

export interface UploadItem {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number; // 0-100
  status: UploadStatus;
  s3Key?: string;
  videoId?: string;
  uploadId?: string; // for multipart
  error?: string;
}

interface UploadContextValue {
  uploads: UploadItem[];
  enqueueUpload: (file: File, teamId?: string | null) => string;
  dismiss: (id: string) => void;
  cancelUpload: (id: string) => void;
  hasActive: boolean;
}

const UploadContext = createContext<UploadContextValue | null>(null);

export function useUploads() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error("useUploads must be used within UploadProvider");
  return ctx;
}

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const cancelledUploads = useRef<Set<string>>(new Set());
  const hasActive = uploads.some((u) => u.status === "uploading" || u.status === "queued");

  // Persist to localStorage so navigation doesn't lose state
  useEffect(() => {
    try {
      const saved = localStorage.getItem("uploads");
      if (saved) setUploads(JSON.parse(saved));
    } catch {}
    
    // Clean up any stale upload locks on initialization
    fetch('/api/s3/lock/cleanup', { method: 'POST' }).catch(() => {
      // Silent fail - cleanup is not critical
    });
  }, []);
  useEffect(() => {
    try { localStorage.setItem("uploads", JSON.stringify(uploads)); } catch {}
  }, [uploads]);

  // Clean up upload locks when page is unloaded
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Release any upload locks synchronously
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/s3/lock/release', JSON.stringify({}));
      } else {
        // Fallback for browsers without sendBeacon
        fetch('/api/s3/lock/release', { 
          method: 'DELETE',
          keepalive: true 
        }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const uploadFile = async (itemId: string, file: File, teamId?: string | null) => {
    const LARGE_THRESHOLD = 80 * 1024 * 1024; // 80 MB
    const update = (patch: Partial<UploadItem>) => {
      setUploads((list) => list.map((u) => (u.id === itemId ? { ...u, ...patch } : u)));
    };
    
    // Create AbortController for this upload
    const abortController = new AbortController();
    abortControllers.current.set(itemId, abortController);
    
    try {
      update({ status: "uploading", progress: 0 });
      
      // Check if cancelled before starting
      if (cancelledUploads.current.has(itemId)) {
        update({ status: "cancelled", error: "Upload cancelled" });
        return;
      }
      
      // Try to release any existing upload lock before starting
      try {
        await fetch("/api/s3/lock/release", { method: "DELETE" });
      } catch {
        // Silent fail - continue with upload attempt
      }
      
      if (file.size < LARGE_THRESHOLD) {
        // direct PUT with XHR for progress
        const presignResponse = await fetch("/api/s3/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type || "application/octet-stream", sizeBytes: file.size, teamId }),
        });
        
        if (!presignResponse.ok) {
          const errorData = await presignResponse.json().catch(() => ({}));
          throw new Error(`Presign failed: ${errorData.error || presignResponse.statusText}`);
        }
        
        const presign = await presignResponse.json();
        if (!presign?.putUrl || !presign?.key) throw new Error("Presign failed");
        // Record key/videoId early so cancellation can clean up
        update({ s3Key: presign.key, videoId: presign.videoId });
        
        // Check if cancelled before starting XHR
        if (cancelledUploads.current.has(itemId)) {
          update({ status: "cancelled", error: "Upload cancelled" });
          return;
        }
        
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", presign.putUrl, true);
          xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
          xhr.upload.onprogress = (e) => {
            // Check for cancellation during progress
            if (cancelledUploads.current.has(itemId)) {
              xhr.abort();
              return;
            }
            if (e.lengthComputable) update({ progress: Math.min(99, Math.floor((e.loaded / e.total) * 100)) });
          };
          xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(String(xhr.status))));
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.onabort = () => reject(new Error("Upload cancelled"));
          
          xhr.send(file);
        });
        
        // Call completion endpoint to release lock and create DB record with filename
        try {
          await fetch("/api/s3/put-complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              key: presign.key,
              filename: file.name,
              contentType: file.type || "application/octet-stream",
              sizeBytes: file.size,
              teamId
            })
          });
        } catch (error) {
          console.warn("Failed to complete upload:", error);
        }
        
        update({ s3Key: presign.key, progress: 100, status: "completed" });
        return;
      }
      // Check if cancelled before multipart init
      if (cancelledUploads.current.has(itemId)) {
        update({ status: "cancelled", error: "Upload cancelled" });
        return;
      }
      
      // Multipart path (re-use logic from UploadZone)
      const initResponse = await fetch("/api/s3/multipart/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type || "application/octet-stream", teamId }),
      });
      
      if (!initResponse.ok) {
        const errorData = await initResponse.json().catch(() => ({}));
        throw new Error(`Failed to init multipart upload: ${errorData.error || initResponse.statusText}`);
      }
      
      const init = await initResponse.json();
      if (!init?.uploadId || !init?.key) throw new Error("Failed to init multipart upload");
      // Record identifiers so cancellation can abort and cleanup
      update({ s3Key: init.key, videoId: init.videoId, uploadId: init.uploadId });

      const PART_SIZE = init.partSize || 8 * 1024 * 1024;
      const totalParts = Math.ceil(file.size / PART_SIZE);
      let completedBytes = 0;
      const uploaded: Record<number, string> = {};
      const signPart = async (partNumber: number) => {
        // Check cancellation before signing
        if (cancelledUploads.current.has(itemId)) {
          throw new Error("Upload cancelled");
        }
        const res = await fetch("/api/s3/multipart/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: init.key, uploadId: init.uploadId, partNumber }),
        });
        if (!res.ok) throw new Error("Sign failed");
        return res.json() as Promise<{ url: string }>;
      };
      const uploadPart = async (partNumber: number) => {
        // Check cancellation before uploading each part
        if (cancelledUploads.current.has(itemId)) {
          throw new Error("Upload cancelled");
        }
        const start = (partNumber - 1) * PART_SIZE;
        const end = Math.min(start + PART_SIZE, file.size);
        const blob = file.slice(start, end);
        const { url } = await signPart(partNumber);
        const res = await fetch(url, { method: "PUT", body: blob });
        if (!res.ok) throw new Error(`Part ${partNumber} failed`);
        const etag = (res.headers.get("ETag") || "").replace(/"/g, "");
        if (!etag) throw new Error("Missing ETag");
        uploaded[partNumber] = etag;
        completedBytes += blob.size;
        const percent = Math.floor((completedBytes / file.size) * 100);
        update({ progress: Math.min(99, percent) });
      };
      const CONCURRENCY = 5;
      let next = 1;
      const inflight = new Set<Promise<void>>();
      const launch = () => {
        if (next > totalParts) return;
        const p = uploadPart(next++).finally(() => {
          inflight.delete(p);
          launch();
        });
        inflight.add(p);
      };
      while (inflight.size < CONCURRENCY && next <= totalParts) launch();
      while (Object.keys(uploaded).length < totalParts) {
        // Check cancellation while waiting for parts
        if (cancelledUploads.current.has(itemId)) {
          throw new Error("Upload cancelled");
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      
      // Final cancellation check before completing
      if (cancelledUploads.current.has(itemId)) {
        throw new Error("Upload cancelled");
      }
      
      const parts = Object.keys(uploaded).map((n) => ({ partNumber: Number(n), etag: uploaded[Number(n)] })).sort((a, b) => a.partNumber - b.partNumber);
      const complete = await fetch("/api/s3/multipart/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: init.key, uploadId: init.uploadId, parts, originalFilename: file.name, contentType: file.type || "application/octet-stream", sizeBytes: file.size, teamId }),
      });
      if (!complete.ok) throw new Error("Complete failed");
      let completeJson: any = {};
      try { completeJson = await complete.json(); } catch {}
      update({ s3Key: init.key, progress: 100, status: "completed", videoId: completeJson?.videoId });
    } catch (e) {
      const error = e as Error;
      if (cancelledUploads.current.has(itemId) || error.message === "Upload cancelled") {
        update({ status: "cancelled", error: "Upload cancelled" });
        return;
      } else {
        update({ status: "failed", error: error.message || "Upload failed" });
        console.error("Upload failed:", error);
      }
    } finally {
      // Clean up abort controller and cancelled flag
      abortControllers.current.delete(itemId);
      cancelledUploads.current.delete(itemId);
      
      // Always try to release upload lock on completion (success, failure, or cancellation)
      try {
        await fetch("/api/s3/lock/release", { method: "DELETE" });
      } catch {
        // Silent fail - lock will be cleaned up eventually
      }
    }
  };

  const enqueueUpload = (file: File, teamId?: string | null) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const item: UploadItem = { id, fileName: file.name, fileSize: file.size, progress: 0, status: "queued" };
    setUploads((l) => [item, ...l]);
    // kick off in background
    void uploadFile(id, file, teamId);
    return id;
  };

  const dismiss = (id: string) => setUploads((l) => l.filter((u) => u.id !== id));

  const cancelUpload = (id: string) => {
    // Mark as cancelled first to prevent error reporting
    cancelledUploads.current.add(id);
    
    // Update the upload status immediately
    setUploads((list) => 
      list.map((u) => 
        u.id === id ? { ...u, status: "cancelled" as UploadStatus, error: "Upload cancelled" } : u
      )
    );
    
    // Clean up controller without calling abort
    const controller = abortControllers.current.get(id);
    if (controller) {
      abortControllers.current.delete(id);
    }
    
    // Also release upload lock and clean provisional video on server
    const item = uploads.find(u => u.id === id);
    if (item) {
      fetch("/api/uploads/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: item.s3Key, uploadId: item.uploadId, videoId: item.videoId })
      }).catch(() => {});
    } else {
      fetch("/api/s3/lock/release", { method: "DELETE" }).catch(() => {});
    }
  };

  const value: UploadContextValue = useMemo(() => ({ uploads, enqueueUpload, dismiss, cancelUpload, hasActive }), [uploads, hasActive]);

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
}


