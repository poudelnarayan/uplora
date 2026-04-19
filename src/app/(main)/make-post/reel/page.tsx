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
        style={{ background: "radial-gradient(circle at 50% -20%, hsl(var(--muted)) 0%, hsl(var(--background)) 100%)" }}
      >
        {/* ── Page header ──────────────────────────────────────────────── */}
        <header className="w-full pt-12 pb-6 flex flex-col items-center gap-2 px-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Short Reel</p>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
            Create Short Reel
          </h2>
          <p className="text-muted-foreground font-medium flex items-center gap-2 mt-1">
            Vertical video masterpiece
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            Max 60 seconds
          </p>

          {/* Pending banner */}
          {editId && postStatus === "PENDING" && (
            <div className="mt-4 w-full max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-800 text-center font-medium">
              {role === "EDITOR"
                ? "Awaiting approval — editing locked until approved or returned."
                : "Awaiting your approval. Use the Approve button below."}
            </div>
          )}
        </header>

        {/* ── Main grid ────────────────────────────────────────────────── */}
        <section className="w-full px-6 pb-24">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

              {/* Left column */}
              <div className={`lg:col-span-7 space-y-8 ${locked ? "opacity-60 pointer-events-none select-none" : ""}`}>
                <ReelUploadArea
                  dragActive={dragActive}
                  selectedVideo={selectedVideo}
                  onDrag={handleDrag}
                  onDrop={handleDrop}
                  onFileChange={handleFileChange}
                  onClear={() => { setSelectedVideo(null); setSelectedFile(null); }}
                />
                <ReelPlatformSelector
                  selected={selectedPlatforms}
                  onChange={setSelectedPlatforms}
                />
                <ReelPostDetails
                  title={title}
                  content={content}
                  onTitleChange={setTitle}
                  onContentChange={setContent}
                  locked={locked}
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

              {/* Right column — preview */}
              <div className="lg:col-span-5">
                <ReelPreview
                  selectedVideo={selectedVideo}
                  content={content}
                  title={title}
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
