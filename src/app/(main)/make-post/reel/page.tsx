"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import AppShell from "@/app/components/layout/AppLayout";
import { useTeam } from "@/context/TeamContext";
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
  const { selectedTeamId, selectedTeam } = useTeam();
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

  const showRequestApproval = !!editId && role === "EDITOR" && postStatus !== "PENDING";
  const showApprove = !!editId && postStatus === "PENDING" && !!role && ["OWNER", "ADMIN", "MANAGER"].includes(role);

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
    asDraft ? setIsDrafting(true) : setIsPublishing(true);
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
      <div
        className="min-h-screen"
        style={{ background: "radial-gradient(ellipse 80% 50% at 60% -5%, hsl(var(--muted)) 0%, hsl(var(--background)) 65%)" }}
      >

        {/* ── Top header bar — title left, action buttons right ── */}
        <header className="px-6 lg:px-10 xl:px-14 pt-8 pb-6 flex items-center justify-between gap-6">

          {/* Left: title block */}
          <div className="min-w-0">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.24em] text-primary mb-0.5">Short Reel</p>
            <h1 className="text-2xl lg:text-3xl xl:text-4xl font-black tracking-tight text-foreground leading-none truncate">
              Create Short Reel
            </h1>
            <p className="text-xs text-muted-foreground font-medium mt-1.5 hidden sm:block">
              Vertical video · 60 s max · 9:16
            </p>
          </div>

          {/* Right: action buttons — hidden on mobile (shown at bottom instead) */}
          <div className={`hidden sm:flex items-center gap-3 shrink-0 ${locked ? "opacity-60 pointer-events-none" : ""}`}>
            {showApprove && (
              <button
                onClick={approve}
                disabled={!!isApproving || busy}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 active:scale-95"
              >
                {isApproving && <Loader2 className="h-4 w-4 animate-spin" />}
                Approve &amp; Publish
              </button>
            )}
            {showRequestApproval && (
              <button
                onClick={requestApproval}
                disabled={!!isRequestingApproval || busy}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 active:scale-95"
              >
                {isRequestingApproval && <Loader2 className="h-4 w-4 animate-spin" />}
                Request Approval
              </button>
            )}
            <button
              onClick={() => save(true)}
              disabled={busy}
              className="flex items-center gap-2 bg-background border border-border hover:bg-muted text-foreground font-semibold text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 active:scale-95"
            >
              {isDrafting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Draft
            </button>
            <button
              onClick={() => save(false)}
              disabled={busy}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-primary/25 transition-all disabled:opacity-50 active:scale-95"
            >
              {(isPublishing || isUploading) && <Loader2 className="h-4 w-4 animate-spin" />}
              {publishLabel}
            </button>
          </div>
        </header>

        {/* Pending banner */}
        {editId && postStatus === "PENDING" && (
          <div className="px-6 lg:px-10 xl:px-14 pb-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800 font-medium">
              {role === "EDITOR"
                ? "Awaiting approval — editing is locked until approved or returned."
                : "This post is awaiting your approval. Use the Approve button above."}
            </div>
          </div>
        )}

        {/* ── Main two-column grid ── */}
        {/*
          Mobile (< sm):  single column — no phone preview, actions at bottom
          sm / lg+:       left 60% content  |  right 40% phone+platforms
        */}
        <section className="px-6 lg:px-10 xl:px-14 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-[60%_40%] gap-6 lg:gap-8 xl:gap-10 items-start">

            {/* ── Left 60%: upload + caption ── */}
            <div className={`space-y-5 min-w-0 ${locked ? "opacity-60 pointer-events-none select-none" : ""}`}>
              <ReelUploadArea
                dragActive={dragActive}
                selectedVideo={selectedVideo}
                selectedFile={selectedFile}
                onDrag={handleDrag}
                onDrop={handleDrop}
                onFileChange={handleFileChange}
                onClear={() => { setSelectedVideo(null); setSelectedFile(null); }}
              />
              <ReelPostDetails
                title={title}
                content={content}
                onTitleChange={setTitle}
                onContentChange={setContent}
                selectedPlatforms={selectedPlatforms}
                locked={locked}
              />

              {/* Wide screen (xl+): platforms sit just below caption in left column */}
              <div className="hidden xl:block">
                <ReelPlatformSelector
                  selected={selectedPlatforms}
                  onChange={setSelectedPlatforms}
                />
              </div>

              {/* Mobile-only: platforms + action buttons at bottom */}
              <div className="sm:hidden space-y-4">
                <ReelPlatformSelector
                  selected={selectedPlatforms}
                  onChange={setSelectedPlatforms}
                />
                <div className={`flex flex-col gap-3 ${locked ? "opacity-60 pointer-events-none" : ""}`}>
                  {showApprove && (
                    <button onClick={approve} disabled={!!isApproving || busy}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50">
                      {isApproving && <Loader2 className="h-4 w-4 animate-spin" />}
                      Approve &amp; Publish
                    </button>
                  )}
                  {showRequestApproval && (
                    <button onClick={requestApproval} disabled={!!isRequestingApproval || busy}
                      className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50">
                      {isRequestingApproval && <Loader2 className="h-4 w-4 animate-spin" />}
                      Request Approval
                    </button>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => save(false)} disabled={busy}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50">
                      {(isPublishing || isUploading) && <Loader2 className="h-4 w-4 animate-spin" />}
                      {publishLabel}
                    </button>
                    <button onClick={() => save(true)} disabled={busy}
                      className="px-6 py-4 rounded-2xl bg-muted text-foreground font-semibold transition-all disabled:opacity-50">
                      {isDrafting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Draft"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right 40%: phone preview (hidden on mobile) ── */}
            <div className="hidden sm:flex flex-col gap-5 sticky top-6">
              <ReelPreview
                selectedVideo={selectedVideo}
                content={content}
                title={title}
              />
              {/* Laptop only (sm–xl): platforms below phone. On xl+ they live in left col. */}
              <div className="xl:hidden">
                <ReelPlatformSelector
                  selected={selectedPlatforms}
                  onChange={setSelectedPlatforms}
                />
              </div>
            </div>

          </div>
        </section>
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
