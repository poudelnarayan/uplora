"use client";

import { CloudUpload, X, Video, CheckCircle2 } from "lucide-react";
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
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary whitespace-nowrap">Video File</p>
        <span className="text-[0.68rem] text-muted-foreground font-medium whitespace-nowrap">MP4 · MOV · 9:16</span>
      </div>

      {selectedVideo ? (
        <div className="relative bg-black rounded-3xl overflow-hidden" style={{ aspectRatio: "9/16", maxHeight: 360 }}>
          <video
            src={selectedVideo}
            className="w-full h-full object-cover"
            controls
            muted
            loop
            playsInline
          />
          {/* top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 bg-gradient-to-b from-black/60 to-transparent">
            <span className="bg-primary text-white text-[0.6rem] font-black px-2 py-1 rounded-full uppercase tracking-wider">
              9:16
            </span>
            <button
              onClick={onClear}
              className="w-7 h-7 bg-black/60 hover:bg-black/90 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* file info bar */}
          {selectedFile && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="text-white text-[0.65rem] font-semibold truncate min-w-0">{selectedFile.name}</span>
                <span className="text-white/60 text-[0.6rem] shrink-0 ml-auto">{formatBytes(selectedFile.size)}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-3xl transition-all cursor-pointer group",
            dragActive
              ? "border-primary bg-primary/5 scale-[0.99]"
              : "border-border/50 hover:border-primary/50 hover:bg-primary/[0.02]"
          )}
          style={{ minHeight: 280 }}
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
          <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center pointer-events-none">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-500",
              dragActive ? "bg-primary scale-110" : "bg-primary/8 group-hover:bg-primary/12 group-hover:scale-105"
            )}>
              {dragActive
                ? <Video className="h-7 w-7 text-white" />
                : <CloudUpload className="h-7 w-7 text-primary stroke-[1.5]" />
              }
            </div>
            <p className="font-bold text-base text-foreground mb-1.5">
              {dragActive ? "Drop to upload" : "Drop video here"}
            </p>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              or <span className="text-primary font-semibold">browse files</span>
              <br />Max 60 seconds · 9:16 aspect ratio
            </p>
            <div className="flex items-center gap-2 text-[0.7rem] text-muted-foreground/60 font-medium">
              <span className="px-2.5 py-1 rounded-full bg-muted/60">MP4</span>
              <span className="px-2.5 py-1 rounded-full bg-muted/60">MOV</span>
              <span className="px-2.5 py-1 rounded-full bg-muted/60">≤ 500 MB</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
