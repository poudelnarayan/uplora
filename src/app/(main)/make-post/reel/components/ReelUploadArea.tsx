"use client";

import { forwardRef } from "react";
import { UploadCloud, Film, X, Replace } from "lucide-react";
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

const ReelUploadArea = forwardRef<HTMLInputElement, ReelUploadAreaProps>(
  function ReelUploadArea(
    {
      dragActive,
      selectedVideo,
      selectedFile,
      onDrag,
      onDrop,
      onFileChange,
      onClear,
    },
    ref
  ) {
    return (
      <section>
        <SectionHeader title="Video" hint="MP4 · MOV · up to 500 MB" />

        {selectedVideo && selectedFile ? (
          <div className="bg-background border border-border/60 rounded-xl p-3 flex gap-3">
            <div className="relative w-24 h-32 rounded-lg overflow-hidden bg-black shrink-0">
              <video
                src={selectedVideo}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatBytes(selectedFile.size)}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer">
                  <Replace className="h-3.5 w-3.5" />
                  Replace
                  <input
                    ref={ref}
                    type="file"
                    accept="video/mp4,video/mov,video/quicktime"
                    onChange={onFileChange}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={onClear}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "relative rounded-xl border border-dashed transition-colors overflow-hidden",
              dragActive
                ? "border-foreground/40 bg-muted/60"
                : "border-border/80 hover:border-border bg-background"
            )}
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
          >
            <input
              ref={ref}
              type="file"
              accept="video/mp4,video/mov,video/quicktime"
              onChange={onFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className="py-10 px-6 flex flex-col items-center justify-center text-center pointer-events-none">
              <div
                className={cn(
                  "w-12 h-12 rounded-xl grid place-items-center mb-3 transition-colors",
                  dragActive
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {dragActive ? (
                  <Film className="h-5 w-5" />
                ) : (
                  <UploadCloud className="h-5 w-5" />
                )}
              </div>
              <p className="text-sm font-medium">
                {dragActive ? "Release to upload" : "Drop your video here"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or{" "}
                <span className="text-foreground font-medium underline underline-offset-2">
                  browse files
                </span>{" "}
                — 9:16 recommended, max 60s
              </p>
            </div>
          </div>
        )}
      </section>
    );
  }
);

export default ReelUploadArea;

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between mb-2.5">
      <h3 className="text-sm font-medium">{title}</h3>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}
