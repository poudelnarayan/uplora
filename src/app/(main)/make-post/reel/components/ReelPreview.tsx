"use client";

import { Play, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Plus } from "lucide-react";

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
      <p className="text-xs font-black uppercase tracking-[0.2em] text-primary text-center">Live Preview</p>

      <div className="flex justify-center">
        <div className="w-full max-w-[300px]">
          {/* Phone shell — 9:19.5 matches modern smartphone proportions */}
          <div className="bg-black rounded-[3rem] relative overflow-hidden border-[10px] border-foreground shadow-[0px_40px_80px_rgba(0,0,0,0.18)] ring-1 ring-white/10" style={{ aspectRatio: "9/19.5" }}>

            {/* Video or placeholder gradient */}
            {selectedVideo ? (
              <video src={selectedVideo} className="w-full h-full object-cover" muted loop autoPlay playsInline />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-600 via-pink-500 to-orange-400 flex items-center justify-center">
                <Play className="h-14 w-14 text-white/80" />
              </div>
            )}

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

            {/* Top bar */}
            <div className="absolute top-4 left-5 right-5 flex justify-between items-center text-white">
              <span className="text-[0.6rem] font-black uppercase tracking-widest">Reels</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4 opacity-80">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </div>

            {/* Right action icons */}
            <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
                  <span className="text-white text-xs font-bold">YB</span>
                </div>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full border-2 border-black flex items-center justify-center">
                  <Plus className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
              <ActionIcon icon={Heart} count="12k" />
              <ActionIcon icon={MessageCircle} count="482" />
              <ActionIcon icon={Share2} />
              <ActionIcon icon={Bookmark} />
              <MoreHorizontal className="h-5 w-5 text-white drop-shadow-lg" />
            </div>

            {/* Bottom caption */}
            <div className="absolute bottom-3 left-4 right-14">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-white/20 border border-white/40 flex items-center justify-center">
                  <span className="text-white text-[0.5rem] font-bold">YB</span>
                </div>
                <span className="text-white text-[0.65rem] font-bold">your_brand</span>
                <span className="border border-white/50 text-white text-[0.5rem] font-black uppercase px-1.5 py-0.5 rounded">Follow</span>
              </div>
              {title && (
                <p className="text-white font-semibold text-[0.65rem] mb-1 truncate">{title}</p>
              )}
              <p className="text-[0.65rem] text-white/90 leading-relaxed line-clamp-2">
                {formatCaption(content)}
              </p>
            </div>
          </div>

          <p className="text-[0.62rem] font-bold text-center text-muted-foreground/35 uppercase tracking-widest mt-3">
            Mockup only
          </p>
        </div>
      </div>
    </div>
  );
}

function ActionIcon({ icon: Icon, count }: { icon: React.ElementType; count?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon className="h-6 w-6 text-white drop-shadow-lg" />
      {count && <span className="text-[0.55rem] text-white font-bold">{count}</span>}
    </div>
  );
}
