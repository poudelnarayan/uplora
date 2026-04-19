"use client";

import {
  Play,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Music2,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReelPreviewProps {
  selectedVideo: string | null;
  content: string;
  title: string;
  selectedPlatforms: string[];
  previewPlatform: string;
  onPreviewPlatformChange: (p: string) => void;
}

function formatCaption(text: string) {
  if (!text)
    return (
      <span className="text-white/50">
        Your caption appears here… #trending
      </span>
    );
  return text.split(/(\s+)/).map((word, i) => {
    if (word.startsWith("#"))
      return (
        <span key={i} className="text-sky-300">
          {word}
        </span>
      );
    if (word.startsWith("@"))
      return (
        <span key={i} className="text-violet-300">
          {word}
        </span>
      );
    if (word.match(/https?:\/\//))
      return (
        <span key={i} className="text-emerald-300 underline">
          {word}
        </span>
      );
    return <span key={i}>{word}</span>;
  });
}

const TABS = [
  { id: "Instagram", short: "IG" },
  { id: "TikTok", short: "TT" },
  { id: "YouTube", short: "YT" },
  { id: "Facebook", short: "FB" },
];

export default function ReelPreview({
  selectedVideo,
  content,
  title,
  selectedPlatforms,
  previewPlatform,
  onPreviewPlatformChange,
}: ReelPreviewProps) {
  const visibleTabs = TABS.filter((t) =>
    selectedPlatforms.length > 0
      ? selectedPlatforms.includes(t.id)
      : t.id === "Instagram"
  );

  return (
    <div className="bg-background border border-border/60 rounded-xl p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Preview</h3>
        <span className="text-[11px] text-muted-foreground">
          Indicative only
        </span>
      </div>

      {/* Platform tabs */}
      {visibleTabs.length > 1 && (
        <div className="flex gap-1 bg-muted/60 p-1 rounded-lg">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => onPreviewPlatformChange(t.id)}
              className={cn(
                "flex-1 text-[11px] font-medium py-1.5 rounded-md transition-colors",
                previewPlatform === t.id
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.id}
            </button>
          ))}
        </div>
      )}

      {/* Phone mockup */}
      <div className="flex justify-center">
        <div
          className="relative w-full max-w-[220px] bg-black rounded-[2rem] overflow-hidden border-[6px] border-foreground shadow-xl"
          style={{ aspectRatio: "9/19.5" }}
        >
          {selectedVideo ? (
            <video
              src={selectedVideo}
              className="w-full h-full object-cover"
              muted
              loop
              autoPlay
              playsInline
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-500 via-pink-500 to-amber-400 flex items-center justify-center">
              <Play className="h-10 w-10 text-white/80" fill="white" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

          {/* Platform-specific chrome */}
          {previewPlatform === "Instagram" && (
            <InstagramChrome title={title} content={content} />
          )}
          {previewPlatform === "TikTok" && (
            <TikTokChrome title={title} content={content} />
          )}
          {previewPlatform === "YouTube" && (
            <YouTubeChrome title={title} content={content} />
          )}
          {previewPlatform === "Facebook" && (
            <FacebookChrome title={title} content={content} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Platform-specific chrome ───

function InstagramChrome({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <>
      <div className="absolute top-3 left-4 right-4 flex justify-between items-center text-white text-[10px] font-semibold">
        <span>Reels</span>
      </div>
      <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4 text-white">
        <ActionIcon icon={Heart} count="12k" />
        <ActionIcon icon={MessageCircle} count="482" />
        <ActionIcon icon={Share2} />
        <ActionIcon icon={Bookmark} />
      </div>
      <div className="absolute bottom-3 left-3 right-12 text-white">
        <p className="text-[10px] font-semibold mb-1">your_brand</p>
        {title && (
          <p className="text-[9px] font-medium mb-0.5 truncate">{title}</p>
        )}
        <p className="text-[9px] leading-snug line-clamp-2">
          {formatCaption(content)}
        </p>
      </div>
    </>
  );
}

function TikTokChrome({ title, content }: { title: string; content: string }) {
  return (
    <>
      <div className="absolute top-3 left-0 right-0 flex justify-center gap-4 text-white text-[10px]">
        <span className="opacity-70">Following</span>
        <span className="font-bold border-b border-white pb-0.5">For You</span>
      </div>
      <div className="absolute right-2 bottom-16 flex flex-col items-center gap-4 text-white">
        <ActionIcon icon={Heart} count="45k" />
        <ActionIcon icon={MessageCircle} count="1.2k" />
        <ActionIcon icon={Bookmark} count="820" />
        <ActionIcon icon={Share2} />
      </div>
      <div className="absolute bottom-3 left-3 right-12 text-white">
        <p className="text-[10px] font-bold mb-1">@your_brand</p>
        <p className="text-[9px] leading-snug line-clamp-3 mb-1">
          {formatCaption(content)}
        </p>
        <div className="flex items-center gap-1 text-[8px]">
          <Music2 className="h-2.5 w-2.5" />
          <span>original sound</span>
        </div>
      </div>
    </>
  );
}

function YouTubeChrome({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <>
      <div className="absolute top-3 left-3 text-white text-[10px] font-bold">
        Shorts
      </div>
      <div className="absolute right-2 bottom-16 flex flex-col items-center gap-4 text-white">
        <ActionIcon icon={ThumbsUp} count="32k" />
        <ActionIcon icon={ThumbsDown} />
        <ActionIcon icon={MessageCircle} count="890" />
        <ActionIcon icon={Share2} />
      </div>
      <div className="absolute bottom-3 left-3 right-12 text-white">
        <p className="text-[10px] font-bold mb-1">@your_brand</p>
        {title && (
          <p className="text-[9px] font-medium mb-0.5 truncate">{title}</p>
        )}
        <p className="text-[9px] leading-snug line-clamp-2">
          {formatCaption(content)}
        </p>
      </div>
    </>
  );
}

function FacebookChrome({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <>
      <div className="absolute top-3 left-3 right-3 flex justify-between items-center text-white text-[10px]">
        <span className="font-bold">Reels</span>
        <MoreHorizontal className="h-3.5 w-3.5" />
      </div>
      <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4 text-white">
        <ActionIcon icon={ThumbsUp} count="8.2k" />
        <ActionIcon icon={MessageCircle} count="312" />
        <ActionIcon icon={Share2} />
      </div>
      <div className="absolute bottom-3 left-3 right-12 text-white">
        <p className="text-[10px] font-semibold mb-1">Your Brand</p>
        {title && (
          <p className="text-[9px] font-medium mb-0.5 truncate">{title}</p>
        )}
        <p className="text-[9px] leading-snug line-clamp-2">
          {formatCaption(content)}
        </p>
      </div>
    </>
  );
}

function ActionIcon({
  icon: Icon,
  count,
}: {
  icon: React.ElementType;
  count?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon className="h-4 w-4" strokeWidth={2} />
      {count && (
        <span className="text-[8px] font-semibold">{count}</span>
      )}
    </div>
  );
}
