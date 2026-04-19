"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, MoreHorizontal, Loader2 } from "lucide-react";

import ReelUploadArea from "./ReelUploadArea";
import ReelPostDetails from "./ReelPostDetails";
import ReelPlatformSelector from "./ReelPlatformSelector";
import ReelReadinessPanel from "./ReelReadinessPanel";
import ReelPreview from "./ReelPreview";

type DraftStatus = "idle" | "saving" | "saved";

export default function CreateReelPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── state ──
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [previewPlatform, setPreviewPlatform] = useState<string>("Instagram");

  const [isPublishing, setIsPublishing] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("idle");
  const [showMenu, setShowMenu] = useState(false);

  // Permissions / approval logic (hook up to your real state)
  const showRequestApproval = false;
  const showApprove = false;
  const [isRequestingApproval, setIsRequestingApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // ── derived state ──
  const currentStep = useMemo(() => {
    if (!selectedFile) return 1;
    if (!title.trim() || !content.trim()) return 2;
    if (selectedPlatforms.length === 0) return 3;
    return 4;
  }, [selectedFile, title, content, selectedPlatforms]);

  // Keep preview tab in sync — prefer user's choice, fall back to first selected
  const effectivePreviewPlatform = useMemo(() => {
    if (selectedPlatforms.includes(previewPlatform)) return previewPlatform;
    return selectedPlatforms[0] ?? "Instagram";
  }, [selectedPlatforms, previewPlatform]);

  const canPublish =
    !!selectedFile && title.trim() && content.trim() && selectedPlatforms.length > 0;

  // ── handlers ──
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) return;
    if (file.size > 500 * 1024 * 1024) return;
    setSelectedFile(file);
    setSelectedVideo(URL.createObjectURL(file));
  }, []);

  const onDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const onClearVideo = useCallback(() => {
    if (selectedVideo) URL.revokeObjectURL(selectedVideo);
    setSelectedFile(null);
    setSelectedVideo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [selectedVideo]);

  const handlePublish = async () => {
    if (!canPublish) return;
    setIsPublishing(true);
    try {
      // your publish call
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDraft = async () => {
    setIsDrafting(true);
    setDraftStatus("saving");
    try {
      // your save-draft call
      setDraftStatus("saved");
    } finally {
      setIsDrafting(false);
    }
  };

  // ── render ──
  const busy = isPublishing || isUploading || isDrafting;

  const publishLabel = isUploading
    ? "Uploading…"
    : isPublishing
    ? "Publishing…"
    : showApprove
    ? "Approve & publish"
    : showRequestApproval
    ? "Request approval"
    : selectedPlatforms.length > 0
    ? `Publish to ${selectedPlatforms.length}`
    : "Publish";

  const primaryAction = showApprove
    ? () => setIsApproving(true)
    : showRequestApproval
    ? () => setIsRequestingApproval(true)
    : handlePublish;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* ═══════════ TOP BAR ═══════════ */}
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-md border-b border-border/60">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: back + title */}
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div className="flex flex-col leading-tight min-w-0">
              <h1 className="text-[15px] font-medium text-foreground truncate">
                New reel
              </h1>
              <span className="text-xs text-muted-foreground">
                {draftStatus === "saving"
                  ? "Saving…"
                  : draftStatus === "saved"
                  ? "Draft saved"
                  : "Draft"}
              </span>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDraft}
              disabled={busy}
              className="hidden sm:inline-flex px-3.5 py-2 text-sm rounded-lg border border-border/70 hover:bg-muted transition-colors disabled:opacity-50"
            >
              {isDrafting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save draft"
              )}
            </button>
            <button
              onClick={primaryAction}
              disabled={!canPublish || busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {(isPublishing || isUploading) && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              {publishLabel}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu((s) => !s)}
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-border/70 hover:bg-muted transition-colors"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {showMenu && (
                <div
                  className="absolute right-0 top-full mt-1 w-48 bg-background border border-border/70 rounded-lg shadow-lg py-1 text-sm"
                  onMouseLeave={() => setShowMenu(false)}
                >
                  <button className="w-full text-left px-3 py-2 hover:bg-muted sm:hidden">
                    Save draft
                  </button>
                  <button className="w-full text-left px-3 py-2 hover:bg-muted">
                    Schedule…
                  </button>
                  <button className="w-full text-left px-3 py-2 hover:bg-muted">
                    Duplicate
                  </button>
                  <div className="my-1 h-px bg-border/60" />
                  <button className="w-full text-left px-3 py-2 hover:bg-muted text-destructive">
                    Discard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-2.5 flex items-center gap-2 text-xs overflow-x-auto no-scrollbar">
          <Step n={1} label="Upload" active={currentStep === 1} done={currentStep > 1} />
          <Sep />
          <Step n={2} label="Details" active={currentStep === 2} done={currentStep > 2} />
          <Sep />
          <Step n={3} label="Platforms" active={currentStep === 3} done={currentStep > 3} />
          <Sep />
          <Step n={4} label="Review" active={currentStep === 4} done={false} />
        </div>
      </header>

      {/* ═══════════ MAIN TWO-PANE ═══════════ */}
      <main className="max-w-[1400px] mx-auto px-5 sm:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
          {/* LEFT: form */}
          <div className="flex flex-col gap-6 min-w-0">
            <ReelUploadArea
              ref={fileInputRef}
              dragActive={dragActive}
              selectedVideo={selectedVideo}
              selectedFile={selectedFile}
              onDrag={onDrag}
              onDrop={onDrop}
              onFileChange={onFileChange}
              onClear={onClearVideo}
            />

            <ReelPostDetails
              title={title}
              content={content}
              onTitleChange={setTitle}
              onContentChange={setContent}
              selectedPlatforms={selectedPlatforms}
              locked={!selectedFile}
            />

            <ReelPlatformSelector
              selected={selectedPlatforms}
              onChange={setSelectedPlatforms}
              locked={!selectedFile}
            />

            <ReelReadinessPanel
              hasVideo={!!selectedFile}
              title={title}
              content={content}
              selectedPlatforms={selectedPlatforms}
            />
          </div>

          {/* RIGHT: sticky preview */}
          <aside className="lg:sticky lg:top-[140px] lg:self-start lg:max-h-[calc(100vh-160px)]">
            <ReelPreview
              selectedVideo={selectedVideo}
              content={content}
              title={title}
              selectedPlatforms={selectedPlatforms}
              previewPlatform={effectivePreviewPlatform}
              onPreviewPlatformChange={setPreviewPlatform}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────
// Stepper helpers
// ─────────────────────────────────────────
function Step({
  n,
  label,
  active,
  done,
}: {
  n: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  const state = done ? "done" : active ? "active" : "idle";
  return (
    <div
      className={[
        "flex items-center gap-2 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors",
        state === "done" && "text-emerald-700 bg-emerald-50 border border-emerald-100",
        state === "active" && "text-foreground bg-background border border-border font-medium",
        state === "idle" && "text-muted-foreground/70",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={[
          "w-4 h-4 rounded-full grid place-items-center text-[9px] font-bold",
          state === "done" && "bg-emerald-600 text-white",
          state === "active" && "bg-foreground text-background",
          state === "idle" && "bg-muted text-muted-foreground",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {done ? "✓" : n}
      </span>
      {label}
    </div>
  );
}

function Sep() {
  return <span className="text-muted-foreground/40">›</span>;
}
