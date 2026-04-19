"use client";

import { CloudUpload, X, Film, CheckCircle2 } from "lucide-react";
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-[0.18em] text-primary">Video File</span>
        <span className="text-[0.65rem] text-muted-foreground/60 font-medium">MP4 · MOV · max 500 MB</span>
      </div>

      {selectedVideo ? (
        /* ── Uploaded state ── */
        <div className="relative rounded-2xl overflow-hidden bg-black border border-border/30" style={{ aspectRatio: "16/9" }}>
          <video
            src={selectedVideo}
            className="w-full h-full object-cover"
            controls
            muted
            loop
            playsInline
          />
          {/* Top-right clear button */}
          <button
            onClick={onClear}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 flex items-center justify-center text-white transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>
          {/* Bottom file info */}
          {selectedFile && (
            <div className="absolute bottom-0 inset-x-0 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-2 min-w-0">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="text-white text-xs font-semibold truncate">{selectedFile.name}</span>
              <span className="text-white/50 text-xs shrink-0 ml-auto">{formatBytes(selectedFile.size)}</span>
            </div>
          )}
        </div>
      ) : (
        /* ── Empty / drag-drop state ── */
        <div
          className={cn(
            "relative rounded-2xl border-2 border-dashed transition-all cursor-pointer group",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border/40 hover:border-primary/40 hover:bg-muted/30"
          )}
          style={{ minHeight: 200 }}
          onDragEnter={onDrag}
          onDragLeave={onDrag}
          onDragOver={onDrag}
          onDrop={onDrop}
        >
          <input
            type="file"
            accept="video/mp4,video/mov,video/quicktime"
            onChange={onFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          />
          <div className="flex flex-col items-center justify-center h-full py-14 px-6 text-center pointer-events-none select-none">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300",
              dragActive ? "bg-primary scale-110" : "bg-muted group-hover:bg-primary/10 group-hover:scale-105"
            )}>
              {dragActive
                ? <Film className="h-6 w-6 text-white" />
                : <CloudUpload className="h-6 w-6 text-muted-foreground group-hover:text-primary stroke-[1.5] transition-colors" />
              }
            </div>
            <p className="font-semibold text-sm text-foreground mb-1">
              {dragActive ? "Release to upload" : "Drop your video here"}
            </p>
            <p className="text-xs text-muted-foreground">
              or <span className="text-primary font-semibold">browse files</span>
              {" · "}9:16 ratio · max 60 s
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
