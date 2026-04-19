"use client";

import { CloudUpload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReelUploadAreaProps {
  dragActive: boolean;
  selectedVideo: string | null;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

export default function ReelUploadArea({
  dragActive,
  selectedVideo,
  onDrag,
  onDrop,
  onFileChange,
  onClear,
}: ReelUploadAreaProps) {
  return (
    <div className="bg-white p-2 rounded-[2rem] shadow-[0px_30px_60px_rgba(0,88,190,0.06)] border border-white hover:border-primary/10 transition-all group cursor-pointer">
      {selectedVideo ? (
        <div className="relative rounded-[1.75rem] overflow-hidden aspect-[9/16] max-h-72 flex items-center justify-center bg-black">
          <video
            src={selectedVideo}
            className="w-full h-full object-cover"
            controls
            muted
            loop
          />
          <button
            onClick={onClear}
            className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="absolute top-3 left-3 bg-primary/80 text-white text-[0.65rem] font-black px-2 py-1 rounded-full uppercase tracking-wider">
            9:16
          </span>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-[1.75rem] py-16 flex flex-col items-center justify-center text-center transition-all",
            dragActive
              ? "border-primary/60 bg-primary/[0.03]"
              : "border-border/40 group-hover:bg-primary/[0.02]"
          )}
          onDragEnter={onDrag}
          onDragLeave={onDrag}
          onDragOver={onDrag}
          onDrop={onDrop}
        >
          <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <CloudUpload className="h-9 w-9 text-primary stroke-[1.5]" />
          </div>
          <h4 className="text-2xl font-bold mb-3 text-foreground">Drop your video here</h4>
          <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            High-quality MP4 or MOV recommended.<br />
            9:16 aspect ratio only. Max 60 seconds.
          </p>
          <input
            type="file"
            accept="video/*"
            onChange={onFileChange}
            className="hidden"
            id="reel-video-upload"
          />
          <label
            htmlFor="reel-video-upload"
            className="bg-primary text-white font-bold px-10 py-4 rounded-full shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 cursor-pointer"
          >
            Browse Files
          </label>
        </div>
      )}
    </div>
  );
}
