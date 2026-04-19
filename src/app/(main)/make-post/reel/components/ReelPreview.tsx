"use client";

import { Play, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Plus, Smartphone } from "lucide-react";

interface ReelPreviewProps {
  selectedVideo: string | null;
  content: string;
  title: string;
}

function formatCaption(text: string) {
  if (!text) return <span className="text-white/50">Your caption will appear here… #trending</span>;
  return text.split(/(\s+)/).map((word, i) => {
    if (word.startsWith("#")) return <span key={i} className="text-blue-300 font-medium">{word}</span>;
    if (word.startsWith("@")) return <span key={i} className="text-purple-300 font-medium">{word}</span>;
    if (word.match(/https?:\/\//)) return <span key={i} className="text-green-300 underline">{word}</span>;
    return <span key={i}>{word}</span>;
  });
}

export default function ReelPreview({ selectedVideo, content, title }: ReelPreviewProps) {
  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Smartphone className="h-3 w-3 text-primary" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">Preview</span>
        </div>
        <span className="text-[0.6rem] text-muted-foreground/40 font-medium uppercase tracking-wider">Mockup</span>
      </div>

      {/* Phone container */}
      <div className="flex justify-center">
        <div className="w-full max-w-[240px] xl:max-w-[280px]">
          {/* Phone shell — 9:19.5 matches modern smartphone proportions */}
          <div
            className="bg-black rounded-[2.5rem] relative overflow-hidden border-[8px] border-foreground/90 ring-1 ring-white/10"
            style={{
              aspectRatio: "9/19.5",
              boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.05) inset"
            }}
          >
            {/* Dynamic Island / Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[60px] h-[18px] bg-black rounded-full z-20" />

            {/* Video or placeholder gradient */}
            {selectedVideo ? (
              <video src={selectedVideo} className="w-full h-full object-cover" muted loop autoPlay playsInline />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/80 via-accent/60 to-warning/70 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Play className="h-6 w-6 text-white ml-0.5" fill="white" />
                </div>
              </div>
            )}

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

            {/* Top bar */}
            <div className="absolute top-7 left-4 right-4 flex justify-between items-center text-white z-10">
              <span className="text-[0.55rem] font-black uppercase tracking-[0.12em] opacity-90">Reels</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-3.5 h-3.5 opacity-70">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </div>

            {/* Right action icons */}
            <div className="absolute right-2.5 bottom-20 flex flex-col items-center gap-4 z-10">
              {/* Profile avatar */}
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
                  <span className="text-white text-[0.55rem] font-bold">U</span>
                </div>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-2 border-black flex items-center justify-center">
                  <Plus className="h-2 w-2 text-white" strokeWidth={3} />
                </div>
              </div>
              <ActionIcon icon={Heart} count="12k" />
              <ActionIcon icon={MessageCircle} count="482" />
              <ActionIcon icon={Share2} />
              <ActionIcon icon={Bookmark} />
              <MoreHorizontal className="h-4 w-4 text-white drop-shadow-lg" />
            </div>

            {/* Bottom caption */}
            <div className="absolute bottom-3 left-3.5 right-12 z-10">
              {/* Author line */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-5 h-5 rounded-full bg-white/20 border border-white/40 flex items-center justify-center">
                  <span className="text-white text-[0.4rem] font-bold">U</span>
                </div>
                <span className="text-white text-[0.6rem] font-bold">your_brand</span>
                <span className="border border-white/40 text-white text-[0.45rem] font-black uppercase px-1.5 py-0.5 rounded">Follow</span>
              </div>
              {/* Title */}
              {title && (
                <p className="text-white font-semibold text-[0.6rem] mb-0.5 truncate">{title}</p>
              )}
              {/* Caption */}
              <p className="text-[0.6rem] text-white/85 leading-relaxed line-clamp-2">
                {formatCaption(content)}
              </p>
            </div>

            {/* Bottom home indicator */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[60px] h-[3px] bg-white/30 rounded-full z-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionIcon({ icon: Icon, count }: { icon: React.ElementType; count?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon className="h-5 w-5 text-white drop-shadow-lg" />
      {count && <span className="text-[0.5rem] text-white font-bold">{count}</span>}
    </div>
  );
}
