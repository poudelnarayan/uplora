"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/app/components/layout/AppLayout";
import { useTeam } from "@/context/TeamContext";
import { useNotifications } from "@/app/components/ui/Notification";
import { InlineSpinner } from "@/app/components/ui/loading-spinner";

import ReelUploadArea from "./components/ReelUploadArea";
import ReelPlatformSelector from "./components/ReelPlatformSelector";
import ReelPostDetails from "./components/ReelPostDetails";
import ReelActionBar from "./components/ReelActionBar";
import ReelPreview from "./components/ReelPreview";

function MakePostReelsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { selectedTeamId, selectedTeam } = useTeam();
  const { addNotification } = useNotifications();

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram", "TikTok"]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Status / workflow state
  const [postStatus, setPostStatus] = useState<string | null>(null);
  const [role, setRole] = useState<"OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | null>(null);

  // Loading flags
  const [loadingExisting, setLoadingExisting] = useState(!!editId);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRequestingApproval, setIsRequestingApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const locked = !!editId && postStatus === "PENDING" && role === "EDITOR";

  // ── Load existing post for edit mode ──────────────────────────────────────
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

  // ── Drag & drop ────────────────────────────────────────────────────────────
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

  // ── S3 upload ──────────────────────────────────────────────────────────────
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

  // ── Save (publish or draft) ────────────────────────────────────────────────
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

  // ── Approval workflow ──────────────────────────────────────────────────────
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

  return (
    <AppShell>
      <div
        className="min-h-screen"
        style={{ background: "radial-gradient(ellipse 80% 40% at 50% -10%, hsl(var(--muted)) 0%, hsl(var(--background)) 70%)" }}
      >
        {/* ── Page header ──────────────────────────────────────────────── */}
        <header className="px-6 lg:px-10 xl:px-14 pt-10 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-primary mb-1">Short Reel</p>
              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-foreground leading-none">
                Create Short Reel
              </h1>
              <p className="text-sm text-muted-foreground font-medium mt-2">
                Vertical video · Max 60 seconds · 9:16 ratio
              </p>
            </div>
            {editId && postStatus === "PENDING" && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800 font-medium max-w-sm shrink-0">
                {role === "EDITOR"
                  ? "Awaiting approval — editing locked."
                  : "Awaiting your approval. Use the Approve button below."}
              </div>
            )}
          </div>
        </header>

        {/* ── Main grid ────────────────────────────────────────────────── */}
        {/*
          Mobile (< lg):
            Single column — Upload → Caption → Platforms → Actions. No phone.

          Laptop + Wide (lg+):
            Left col  — Upload → Caption (full width)
            Right col — Actions → Phone → Platforms
        */}
        <section className="px-6 lg:px-10 xl:px-14 pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_340px] gap-8 xl:gap-12 items-start">

            {/* ── Left: upload + caption ── */}
            <div className={`space-y-6 min-w-0 ${locked ? "opacity-60 pointer-events-none select-none" : ""}`}>
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

              {/* Mobile only: platforms + actions shown inline */}
              <div className="lg:hidden space-y-6">
                <ReelPlatformSelector
                  selected={selectedPlatforms}
                  onChange={setSelectedPlatforms}
                />
                <ReelActionBar
                  onPublish={() => save(false)}
                  onDraft={() => save(true)}
                  onRequestApproval={requestApproval}
                  onApprove={approve}
                  isPublishing={isPublishing}
                  isDrafting={isDrafting}
                  isUploading={isUploading}
                  isRequestingApproval={isRequestingApproval}
                  isApproving={isApproving}
                  showRequestApproval={!!editId && role === "EDITOR" && postStatus !== "PENDING"}
                  showApprove={!!editId && postStatus === "PENDING" && !!role && ["OWNER", "ADMIN", "MANAGER"].includes(role)}
                  selectedPlatforms={selectedPlatforms}
                />
              </div>
            </div>

            {/* ── Right: Actions → Phone → Platforms  (hidden on mobile) ── */}
            <div className={`hidden lg:flex lg:flex-col lg:gap-6 sticky top-6 ${locked ? "opacity-60 pointer-events-none select-none" : ""}`}>
              {/* Publish / Save draft at top */}
              <ReelActionBar
                onPublish={() => save(false)}
                onDraft={() => save(true)}
                onRequestApproval={requestApproval}
                onApprove={approve}
                isPublishing={isPublishing}
                isDrafting={isDrafting}
                isUploading={isUploading}
                isRequestingApproval={isRequestingApproval}
                isApproving={isApproving}
                showRequestApproval={!!editId && role === "EDITOR" && postStatus !== "PENDING"}
                showApprove={!!editId && postStatus === "PENDING" && !!role && ["OWNER", "ADMIN", "MANAGER"].includes(role)}
                selectedPlatforms={selectedPlatforms}
              />
              {/* Phone preview */}
              <ReelPreview
                selectedVideo={selectedVideo}
                content={content}
                title={title}
              />
              {/* Platform selector below phone */}
              <ReelPlatformSelector
                selected={selectedPlatforms}
                onChange={setSelectedPlatforms}
              />
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
