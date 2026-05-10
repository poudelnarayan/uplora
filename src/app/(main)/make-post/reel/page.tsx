"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft, Sparkles, ChevronRight, Layers, Clock, Film } from "lucide-react";
import AppShell from "@/app/components/layout/AppLayout";
import { useTeam } from "@/context/TeamContext";
import { getTeamDisplayName, PERSONAL_SPACE_LABEL } from "@/lib/teamDisplay";
import { useNotifications } from "@/app/components/ui/Notification";
import { InlineSpinner } from "@/app/components/ui/loading-spinner";

import ReelUploadArea from "./components/ReelUploadArea";
import ReelPlatformSelector from "./components/ReelPlatformSelector";
import ReelPostDetails from "./components/ReelPostDetails";
import ReelPreview from "./components/ReelPreview";

function MakePostReelsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { selectedTeamId, selectedTeam, personalTeam } = useTeam();
  const { addNotification } = useNotifications();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram", "TikTok"]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [postStatus, setPostStatus] = useState<string | null>(null);
  const [role, setRole] = useState<"OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | null>(null);

  const [loadingExisting, setLoadingExisting] = useState(!!editId);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRequestingApproval, setIsRequestingApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const locked = !!editId && postStatus === "PENDING" && role === "EDITOR";
  const busy = isPublishing || isDrafting || isUploading;

  const showRequestApproval = !!editId && role === "EDITOR";
  const isPendingApproval = postStatus === "PENDING";
  const showApprove = !!editId && isPendingApproval && !!role && ["OWNER", "ADMIN", "MANAGER"].includes(role);

  useEffect(() => {
    if (!editId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/content/${editId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load post");
        setTitle(data.title || "");
        setContent(data.content || "");
        if (Array.isArray(data.platforms)) setSelectedPlatforms(data.platforms);
        if (data.status) setPostStatus(data.status);
        if (data.videoKey) {
          const urlRes = await fetch(`/api/s3/get-url?key=${encodeURIComponent(data.videoKey)}`);
          const { url } = await urlRes.json();
          if (url) setSelectedVideo(url);
        }
        try {
          const rr = await fetch(`/api/content/${editId}/role`, { cache: "no-store" });
          if (rr.ok) setRole((await rr.json())?.role ?? null);
        } catch {}
      } catch (e) {
        addNotification({ type: "error", title: "Failed to load", message: e instanceof Error ? e.message : "Try again" });
      } finally {
        setLoadingExisting(false);
      }
    };
    load();
  }, [editId, addNotification]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = ev => setSelectedVideo(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadToS3 = async (file: File): Promise<string> => {
    const presignRes = await fetch("/api/s3/presign-reel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType: file.type, sizeBytes: file.size, teamId: selectedTeamId }),
    });
    if (!presignRes.ok) throw new Error("Failed to get upload URL");
    const { putUrl, key } = await presignRes.json();
    const uploadRes = await fetch(putUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    if (!uploadRes.ok) throw new Error("Failed to upload reel");
    return key;
  };

  const save = async (asDraft: boolean) => {
    if (!selectedTeamId && !editId) {
      addNotification({ type: "error", title: "No Team Selected", message: "Please select a team first" });
      return;
    }
    if (!title.trim()) {
      addNotification({ type: "error", title: "Title Required", message: "Please enter a title" });
      return;
    }
    if (asDraft) setIsDrafting(true); else setIsPublishing(true);
    try {
      let videoKey: string | null = null;
      if (selectedFile) {
        setIsUploading(true);
        videoKey = await uploadToS3(selectedFile);
        setIsUploading(false);
      }
      let res: Response;
      if (editId) {
        res = await fetch(`/api/content/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, platforms: selectedPlatforms, videoKey: videoKey ?? undefined }),
        });
      } else {
        res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "reel", title, content, teamId: selectedTeamId, platforms: selectedPlatforms, videoKey, metadata: {} }),
        });
      }
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || result.error || "Failed to save");
      addNotification({
        type: "success",
        title: editId ? "Post Updated!" : asDraft ? "Draft Saved!" : "Post Published!",
        message: editId ? "Changes saved." : `Reel saved to ${selectedTeam?.name || "team"}`,
      });
      router.push("/dashboard");
    } catch (e) {
      setIsUploading(false);
      addNotification({ type: "error", title: "Save Failed", message: e instanceof Error ? e.message : "Try again" });
    } finally {
      setIsPublishing(false);
      setIsDrafting(false);
    }
  };

  const requestApproval = async () => {
    if (!editId) {
      addNotification({ type: "error", title: "Save first", message: "Save the post before requesting approval." });
      return;
    }
    setIsRequestingApproval(true);
    try {
      const res = await fetch(`/api/content/${editId}/request-approval`, { method: "POST" });
      const js = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(js?.error || "Failed to request approval");
      setPostStatus("PENDING");
      addNotification({ type: "success", title: "Request sent", message: "Owner/Admin/Manager can now approve." });
    } catch (e) {
      addNotification({ type: "error", title: "Request failed", message: e instanceof Error ? e.message : "Try again" });
    } finally {
      setIsRequestingApproval(false);
    }
  };

  const approve = async () => {
    if (!editId) return;
    setIsApproving(true);
    try {
      const res = await fetch(`/api/content/${editId}/approve`, { method: "POST" });
      const js = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(js?.error || "Failed to approve");
      setPostStatus(js?.status || "PUBLISHED");
      addNotification({ type: "success", title: "Approved!", message: `Status: ${js?.status || "PUBLISHED"}` });
      router.push("/approvals");
    } catch (e) {
      addNotification({ type: "error", title: "Approve failed", message: e instanceof Error ? e.message : "Try again" });
    } finally {
      setIsApproving(false);
    }
  };

  if (loadingExisting) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center">
          <InlineSpinner size="md" />
        </div>
      </AppShell>
    );
  }

  const publishLabel = isUploading
    ? "Uploading…"
    : isPublishing
    ? "Saving…"
    : selectedPlatforms.length > 0
    ? `Publish to ${selectedPlatforms.length} Platform${selectedPlatforms.length > 1 ? "s" : ""}`
    : "Publish";

  return (
    <AppShell>
      <div className="min-h-screen flex flex-col" style={{ background: "var(--gradient-subtle)" }}>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            TOP NAVIGATION BAR — back button, breadcrumbs, workspace, actions
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <header className="lg:sticky lg:top-0 lg:z-20 border-b border-border/50 backdrop-blur-xl bg-card/80">
          <div className="px-3 sm:px-6 lg:px-8 xl:px-10">

            {/* Row 1: Back + Breadcrumbs + Workspace + Actions */}
            <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">

              {/* Left: Back + Breadcrumbs */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => router.push("/make-post")}
                  className="flex items-center justify-center w-9 h-9 rounded-xl border border-border/60 bg-background hover:bg-muted hover:border-primary/30 transition-all duration-200 active:scale-95 shrink-0 group"
                  aria-label="Back to Make Post"
                >
                  <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>

                {/* Breadcrumbs */}
                <nav className="hidden sm:flex items-center gap-1.5 text-sm min-w-0">
                  <button
                    onClick={() => router.push("/make-post")}
                    className="text-muted-foreground hover:text-foreground transition-colors font-medium whitespace-nowrap"
                  >
                    Make Post
                  </button>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  <span className="text-foreground font-semibold whitespace-nowrap flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Short Reel
                  </span>
                </nav>

                {/* Mobile title */}
                <span className="sm:hidden text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Short Reel
                </span>
              </div>

              {/* Right: Workspace indicator + Desktop Actions */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Workspace badge */}
                {selectedTeam && (
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/40">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-foreground max-w-[140px] truncate">
                      {getTeamDisplayName(selectedTeam, personalTeam?.id)}
                    </span>
                  </div>
                )}

                {/* Desktop action buttons */}
                <div className={`hidden sm:flex items-center gap-2 ${locked ? "opacity-60 pointer-events-none" : ""}`}>
                  {showApprove && (
                    <button
                      onClick={approve}
                      disabled={!!isApproving || busy}
                      className="flex items-center gap-2 bg-success hover:bg-success/90 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-all disabled:opacity-50 active:scale-95"
                    >
                      {isApproving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Approve
                    </button>
                  )}
                  {showRequestApproval && (
                    <>
                      {isPendingApproval && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-warning-muted text-warning-foreground text-xs font-bold">
                          <Clock className="h-3.5 w-3.5 text-warning" />
                          Waiting for approval
                        </span>
                      )}
                      <button
                        onClick={requestApproval}
                        disabled={!!isRequestingApproval || busy}
                        className="flex items-center gap-2 bg-warning hover:bg-warning/90 text-warning-foreground font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-all disabled:opacity-50 active:scale-95"
                      >
                        {isRequestingApproval && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {isPendingApproval ? "Resend Approval" : "Request Approval"}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => save(true)}
                    disabled={busy}
                    className="flex items-center gap-2 bg-background border border-border/60 hover:bg-muted text-foreground font-semibold text-xs px-4 py-2 rounded-lg transition-all disabled:opacity-50 active:scale-95"
                  >
                    {isDrafting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save Draft
                  </button>
                  <button
                    onClick={() => save(false)}
                    disabled={busy}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4 py-2 rounded-lg shadow-md shadow-primary/20 transition-all disabled:opacity-50 active:scale-95"
                  >
                    {(isPublishing || isUploading) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {publishLabel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── Pending approval banner ── */}
        {editId && postStatus === "PENDING" && (
          <div className="px-4 sm:px-6 lg:px-8 xl:px-10 pt-4">
            <div className="rounded-xl border border-warning/30 bg-warning-muted px-4 py-3 text-sm text-warning-foreground font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning shrink-0" />
              {role === "EDITOR"
                ? "Awaiting approval — editing is locked until approved or returned."
                : "This post is awaiting your approval. Use the Approve button above."}
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            HERO SECTION — Title + Specs + Platform selector (horizontal pills)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="px-3 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            {/* Left: Title + Spec chips */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground leading-none">
                {editId ? "Edit Short Reel" : "Create Short Reel"}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/8 text-primary text-xs font-bold">
                  <Film className="h-3 w-3" />
                  9:16 Vertical
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-semibold">
                  <Clock className="h-3 w-3" />
                  60s Max
                </span>
                {/* Mobile workspace badge */}
                {selectedTeam && (
                  <span className="md:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/60 border border-border/40 text-xs font-semibold text-foreground">
                    <Layers className="h-3 w-3 text-primary" />
                    {getTeamDisplayName(selectedTeam, personalTeam?.id)}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Horizontal platform pills (desktop) */}
            <div className="hidden lg:block">
              <ReelPlatformSelector
                selected={selectedPlatforms}
                onChange={setSelectedPlatforms}
              />
            </div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            MAIN CONTENT — Two-column layout
            Left: Upload + Post Details
            Right: Phone Preview (sticky)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="flex-1 px-3 sm:px-6 lg:px-8 xl:px-10 pt-3 sm:pt-4 pb-32 sm:pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] gap-4 sm:gap-6 lg:gap-8 items-start">

            {/* ── Left column: Upload + Details ── */}
            <div className={`space-y-4 sm:space-y-5 min-w-0 ${locked ? "opacity-60 pointer-events-none select-none" : ""}`}>

              {/* Upload area card */}
              <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5 shadow-soft">
                <ReelUploadArea
                  dragActive={dragActive}
                  selectedVideo={selectedVideo}
                  selectedFile={selectedFile}
                  onDrag={handleDrag}
                  onDrop={handleDrop}
                  onFileChange={handleFileChange}
                  onClear={() => { setSelectedVideo(null); setSelectedFile(null); }}
                />
              </div>

              {/* Post details card */}
              <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-soft">
                <ReelPostDetails
                  title={title}
                  content={content}
                  onTitleChange={setTitle}
                  onContentChange={setContent}
                  selectedPlatforms={selectedPlatforms}
                  locked={locked}
                />
              </div>

              {/* Mobile/tablet: platforms */}
              <div className="lg:hidden">
                <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-soft">
                  <ReelPlatformSelector
                    selected={selectedPlatforms}
                    onChange={setSelectedPlatforms}
                  />
                </div>
              </div>
            </div>

            {/* ── Right column: Phone Preview (hidden on mobile) ── */}
            <div className="hidden lg:block sticky top-[5.5rem]">
              <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-soft">
                <ReelPreview
                  selectedVideo={selectedVideo}
                  content={content}
                  title={title}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            MOBILE BOTTOM ACTION BAR — glass morphism sticky bar.
            Sits above the global mobile tab bar. The bottom offset is the
            tab bar's height (4rem) plus the iOS safe-area inset, so this
            bar tucks flush against the tab bar's top edge with no gap.
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div
          className={`sm:hidden fixed inset-x-0 z-20 border-t border-border/40 backdrop-blur-xl bg-card/90 px-4 py-3 ${locked ? "opacity-60 pointer-events-none" : ""}`}
          style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
        >
          <div className="space-y-2">
            {/* Approval actions */}
            {showApprove && (
              <button
                onClick={approve}
                disabled={!!isApproving || busy}
                className="w-full flex items-center justify-center gap-2 bg-success text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {isApproving && <Loader2 className="h-4 w-4 animate-spin" />}
                Approve &amp; Publish
              </button>
            )}
            {showRequestApproval && (
              <>
                {isPendingApproval && (
                  <div className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-warning-muted text-warning-foreground text-xs font-bold">
                    <Clock className="h-3.5 w-3.5 text-warning" />
                    Waiting for approval
                  </div>
                )}
                <button
                  onClick={requestApproval}
                  disabled={!!isRequestingApproval || busy}
                  className="w-full flex items-center justify-center gap-2 bg-warning text-warning-foreground font-bold py-3 rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {isRequestingApproval && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isPendingApproval ? "Resend Approval" : "Request Approval"}
                </button>
              </>
            )}
            {/* Primary actions row */}
            <div className="flex gap-2">
              <button
                onClick={() => save(false)}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 rounded-xl shadow-md shadow-primary/20 transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {(isPublishing || isUploading) && <Loader2 className="h-4 w-4 animate-spin" />}
                {publishLabel}
              </button>
              <button
                onClick={() => save(true)}
                disabled={busy}
                className="px-5 py-3 rounded-xl bg-muted text-foreground font-semibold transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {isDrafting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Draft"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}

export default function MakePostReelsPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="min-h-screen flex items-center justify-center">
            <InlineSpinner size="md" />
          </div>
        </AppShell>
      }
    >
      <MakePostReelsContent />
    </Suspense>
  );
}
