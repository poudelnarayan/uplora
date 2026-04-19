"use client";

import { CloudUpload, X, Film, CheckCircle2, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReelUploadAreaProps {
  dragActive: boolean;
  selectedVideo: string | null;
  selectedFile: File | null;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ReelUploadArea({
  dragActive,
  selectedVideo,
  selectedFile,
  onDrag,
  onDrop,
  onFileChange,
  onClear,
}: ReelUploadAreaProps) {
  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Film className="h-3 w-3 text-primary" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">Video File</span>
        </div>
        <span className="text-[0.65rem] text-muted-foreground/60 font-medium">MP4 · MOV · max 500 MB</span>
      </div>

      {selectedVideo ? (
        /* ── Uploaded state ── */
        <div className="relative rounded-xl overflow-hidden bg-black/95 border border-border/20 group" style={{ aspectRatio: "16/9" }}>
          <video
            src={selectedVideo}
            className="w-full h-full object-cover"
            controls
            muted
            loop
            playsInline
          />

          {/* Overlay gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

          {/* Top controls */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            {/* Replace button */}
            <label className="w-8 h-8 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center text-white transition-all cursor-pointer border border-white/10 hover:border-white/20 active:scale-95">
              <RotateCcw className="h-3.5 w-3.5" />
              <input
                type="file"
                accept="video/mp4,video/mov,video/quicktime"
                onChange={onFileChange}
                className="hidden"
              />
            </label>
            {/* Clear button */}
            <button
              onClick={onClear}
              className="w-8 h-8 rounded-lg bg-black/60 hover:bg-destructive/80 backdrop-blur-sm flex items-center justify-center text-white transition-all border border-white/10 hover:border-destructive/30 active:scale-95"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Bottom file info bar */}
          {selectedFile && (
            <div className="absolute bottom-0 inset-x-0 px-4 py-2.5 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-white text-xs font-semibold truncate">{selectedFile.name}</span>
              </div>
              <span className="text-white/40 text-[0.65rem] font-medium shrink-0 ml-auto tabular-nums">
                {formatBytes(selectedFile.size)}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* ── Empty / drag-drop state ── */
        <div
          className={cn(
            "relative rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer group overflow-hidden",
            dragActive
              ? "border-primary bg-primary/5 shadow-glow"
              : "border-border/40 hover:border-primary/40 hover:bg-muted/20"
          )}
          style={{ minHeight: 220 }}
          onDragEnter={onDrag}
          onDragLeave={onDrag}
          onDragOver={onDrag}
          onDrop={onDrop}
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <input
            type="file"
            accept="video/mp4,video/mov,video/quicktime"
            onChange={onFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          />

          <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center pointer-events-none select-none relative">
            {/* Icon with animated ring */}
            <div className="relative mb-5">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
                dragActive
                  ? "bg-primary scale-110 shadow-glow"
                  : "bg-muted/60 group-hover:bg-primary/10 group-hover:scale-105"
              )}>
                {dragActive ? (
                  <Film className="h-7 w-7 text-white" />
                ) : (
                  <CloudUpload className="h-7 w-7 text-muted-foreground group-hover:text-primary stroke-[1.5] transition-colors" />
                )}
              </div>
              {/* Pulse ring on drag */}
              {dragActive && (
                <div className="absolute inset-0 rounded-2xl border-2 border-primary animate-ping opacity-30" />
              )}
            </div>

            <p className="font-bold text-sm text-foreground mb-1">
              {dragActive ? "Drop to upload" : "Drag & drop your video"}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px]">
              or <span className="text-primary font-semibold cursor-pointer hover:underline">browse files</span>
              <br />
              <span className="text-muted-foreground/50">9:16 ratio · max 60 seconds · MP4 or MOV</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
