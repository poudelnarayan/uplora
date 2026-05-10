"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Layers,
  Loader2,
  Image as ImageIcon,
  Clock,
  Eye,
  Hash,
  Upload,
  X,
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import AppShell from "@/app/components/layout/AppLayout";
import RichTextEditor from "@/app/components/editor/RichTextEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { useTeam } from "@/context/TeamContext";
import { getTeamDisplayName } from "@/lib/teamDisplay";
import { useNotifications } from "@/app/components/ui/Notification";
import { InlineSpinner } from "@/app/components/ui/loading-spinner";
import { useTeamPlatforms } from "@/hooks/use-team-platforms";
import { PlatformGrid } from "@/app/components/upload/PlatformGrid";
import { cn } from "@/lib/utils";

const IMAGE_PLATFORMS = [
  { id: "Instagram",   label: "Instagram",   limit: 2200,  key: "instagram" },
  { id: "Facebook",    label: "Facebook",    limit: 63206, key: "facebook"  },
  { id: "X (Twitter)", label: "X (Twitter)", limit: 280,   key: "twitter"   },
  { id: "LinkedIn",    label: "LinkedIn",    limit: 3000,  key: "linkedin"  },
  { id: "Pinterest",   label: "Pinterest",   limit: 500,   key: "pinterest" },
  { id: "Threads",     label: "Threads",     limit: 500,   key: "threads"   },
] as const;

function MakePostImageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { selectedTeamId, selectedTeam, personalTeam } = useTeam();
  const { addNotification } = useNotifications();
  const { isPersonal, has, team: teamFromHook } = useTeamPlatforms();

  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram", "Facebook"]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [postStatus, setPostStatus] = useState<string | null>(null);
  const [role, setRole] = useState<"OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | null>(null);

  const [loadingExisting, setLoadingExisting] = useState<boolean>(!!editId);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRequestingApproval, setIsRequestingApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const locked = !!editId && postStatus === "PENDING" && role === "EDITOR";
  const busy = isSaving || isUploading;
  const isPendingApproval = postStatus === "PENDING";
  const showRequestApproval = !!editId && role === "EDITOR";
  const showApprove = !!editId && isPendingApproval && !!role && ["OWNER", "ADMIN", "MANAGER"].includes(role);

  const isLocked = (key: string) => !isPersonal && !has(key as any);

  // Load existing post
  useEffect(() => {
    if (!editId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/content/${editId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load post");
        setContent(data.content || "");
        if (Array.isArray(data.platforms)) setSelectedPlatforms(data.platforms);
        if (typeof data.status === "string") setPostStatus(data.status);
        if (data.imageKey) {
          const urlRes = await fetch(`/api/s3/get-url?key=${encodeURIComponent(data.imageKey)}`);
          const { url } = await urlRes.json();
          if (url) setSelectedImage(url);
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

  const togglePlatform = (id: string) => {
    const def = IMAGE_PLATFORMS.find((p) => p.id === id);
    if (def && isLocked(def.key) && !selectedPlatforms.includes(id)) return;
    setSelectedPlatforms((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const processFile = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setSelectedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

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

  const uploadImageToS3 = async (file: File): Promise<string> => {
    const presign = await fetch("/api/s3/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType: file.type, sizeBytes: file.size, teamId: selectedTeamId }),
    });
    if (!presign.ok) throw new Error("Failed to get upload URL");
    const { putUrl, key } = await presign.json();
    const putRes = await fetch(putUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    if (!putRes.ok) throw new Error("Failed to upload image");
    return key as string;
  };

  const save = async () => {
    if (!selectedTeamId && !editId) {
      addNotification({ type: "error", title: "No workspace selected", message: "Pick a workspace first" });
      return;
    }
    if (!content.trim()) {
      addNotification({ type: "error", title: "Caption required", message: "Write a caption for your image" });
      return;
    }
    setIsSaving(true);
    try {
      let imageKey: string | null = null;
      if (selectedFile) {
        setIsUploading(true);
        imageKey = await uploadImageToS3(selectedFile);
        setIsUploading(false);
      }
      let response: Response;
      if (editId) {
        response = await fetch(`/api/content/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, platforms: selectedPlatforms, imageKey: imageKey ?? undefined }),
        });
      } else {
        response = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "image", content, teamId: selectedTeamId, platforms: selectedPlatforms, imageKey, metadata: {} }),
        });
      }
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.message || "Failed to save post");
      addNotification({
        type: "success",
        title: editId ? "Post updated" : "Post saved",
        message: editId ? "Your changes have been saved" : "Saved as draft",
      });
      router.push("/dashboard");
    } catch (e) {
      addNotification({ type: "error", title: "Save failed", message: e instanceof Error ? e.message : "Try again" });
    } finally {
      setIsSaving(false);
      setIsUploading(false);
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
      addNotification({ type: "success", title: "Request sent", message: "Owner/Admin/Manager can now approve it." });
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
      addNotification({ type: "success", title: "Approved", message: `Status set to ${js?.status || "PUBLISHED"}` });
      router.push("/approvals");
    } catch (e) {
      addNotification({ type: "error", title: "Approve failed", message: e instanceof Error ? e.message : "Try again" });
    } finally {
      setIsApproving(false);
    }
  };

  const limits = selectedPlatforms
    .map((id) => IMAGE_PLATFORMS.find((p) => p.id === id)?.limit)
    .filter((n) => typeof n === "number") as number[];
  const lowestLimit: number = limits.length > 0 ? Math.min(...limits) : Infinity;
  const charCount = content.length;
  const overLimit = lowestLimit !== Infinity && charCount > lowestLimit;

  const saveLabel = editId ? "Save changes" : "Save post";

  return (
    <AppShell>
      <div className="min-h-screen flex flex-col" style={{ background: "var(--gradient-subtle)" }}>
        {/* ── TOP NAV BAR ── */}
        <header className="lg:sticky lg:top-0 lg:z-20 border-b border-border/50 backdrop-blur-xl bg-card/80">
          <div className="px-3 sm:px-6 lg:px-8 xl:px-10">
            <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => router.push("/make-post")}
                  className="flex items-center justify-center w-9 h-9 rounded-xl border border-border/60 bg-background hover:bg-muted hover:border-primary/30 transition-all active:scale-95 shrink-0 group"
                  aria-label="Back to Make Post"
                >
                  <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>

                <nav className="hidden sm:flex items-center gap-1.5 text-sm min-w-0">
                  <button onClick={() => router.push("/make-post")} className="text-muted-foreground hover:text-foreground transition-colors font-medium whitespace-nowrap">
                    Make Post
                  </button>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  <span className="text-foreground font-semibold whitespace-nowrap flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-primary" />
                    Image Post
                  </span>
                </nav>

                <span className="sm:hidden text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-primary" />
                  Image Post
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {selectedTeam && (
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/40">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-foreground max-w-[140px] truncate">
                      {getTeamDisplayName(selectedTeam, personalTeam?.id)}
                    </span>
                  </div>
                )}

                <div className={cn("hidden sm:flex items-center gap-2", locked && "opacity-60 pointer-events-none")}>
                  {showApprove && (
                    <button
                      onClick={approve}
                      disabled={isApproving || busy}
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
                        disabled={isRequestingApproval || busy}
                        className="flex items-center gap-2 bg-warning hover:bg-warning/90 text-warning-foreground font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-all disabled:opacity-50 active:scale-95"
                      >
                        {isRequestingApproval && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {isPendingApproval ? "Resend approval" : "Request approval"}
                      </button>
                    </>
                  )}
                  <button
                    onClick={save}
                    disabled={busy || loadingExisting}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4 py-2 rounded-lg shadow-md shadow-primary/20 transition-all disabled:opacity-50 active:scale-95"
                  >
                    {(isSaving || isUploading) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {isUploading ? "Uploading…" : saveLabel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── Pending banner ── */}
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

        {/* ── HERO ── */}
        <div className="px-3 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground leading-none">
                {editId ? "Edit image post" : "Create image post"}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/8 text-primary text-xs font-bold">
                  <ImageIcon className="h-3 w-3" />
                  Single image
                </span>
                <span className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold tabular-nums",
                  overLimit ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                )}>
                  <Hash className="h-3 w-3" />
                  {charCount}{lowestLimit !== Infinity ? ` / ${lowestLimit}` : ""}
                </span>
                {selectedTeam && (
                  <span className="md:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/60 border border-border/40 text-xs font-semibold text-foreground">
                    <Layers className="h-3 w-3 text-primary" />
                    {getTeamDisplayName(selectedTeam, personalTeam?.id)}
                  </span>
                )}
              </div>
            </div>

            <div className="hidden lg:block">
              <PlatformGrid
                items={[...IMAGE_PLATFORMS]}
                selected={selectedPlatforms}
                onToggle={togglePlatform}
                isLocked={isLocked}
                teamName={teamFromHook?.name || selectedTeam?.name || null}
              />
            </div>
          </div>
        </div>

        {/* ── MAIN ── */}
        <section className="flex-1 px-3 sm:px-6 lg:px-8 xl:px-10 pt-3 sm:pt-4 pb-32 sm:pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px] gap-4 sm:gap-6 lg:gap-8 items-start">
            {/* Left: upload + caption + (mobile) platforms */}
            <div className={cn("space-y-4 sm:space-y-5 min-w-0", locked && "opacity-60 pointer-events-none select-none")}>
              {/* Upload card */}
              <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5 shadow-soft">
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-bold text-foreground">Image</h2>
                </div>

                {!selectedImage ? (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={cn(
                      "border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all py-12 px-6 text-center",
                      dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/20",
                    )}
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-1">Drop image here</p>
                    <p className="text-xs text-muted-foreground mb-4">PNG, JPG, GIF — up to 10 MB</p>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="image-upload" />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all"
                    >
                      Choose file
                    </label>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden bg-muted/40 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedImage}
                      alt="Selected"
                      loading="lazy"
                      className="w-full max-h-[480px] object-contain bg-background"
                    />
                    <button
                      onClick={() => { setSelectedImage(null); setSelectedFile(null); }}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/90 border border-border/60 flex items-center justify-center text-foreground hover:bg-background shadow-sm transition-all"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile/tablet platform selector */}
              <div className="lg:hidden rounded-2xl border border-border/50 bg-card p-4 sm:p-5 shadow-soft">
                <PlatformGrid
                  items={[...IMAGE_PLATFORMS]}
                  selected={selectedPlatforms}
                  onToggle={togglePlatform}
                  isLocked={isLocked}
                  teamName={teamFromHook?.name || selectedTeam?.name || null}
                />
              </div>

              {/* Caption editor card */}
              <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5 shadow-soft">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold text-foreground">Caption</h2>
                  </div>
                  <span className={cn(
                    "text-xs font-semibold tabular-nums",
                    overLimit ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {charCount}{lowestLimit !== Infinity ? ` / ${lowestLimit}` : ""} chars
                  </span>
                </div>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Write a caption for your image — **bold**, *italic*, #hashtags, @mentions, links…"
                  platforms={IMAGE_PLATFORMS.map((p) => ({ id: p.id, name: p.label, limit: p.limit }))}
                  selectedPlatforms={selectedPlatforms}
                />
                {overLimit && (
                  <p className="mt-3 text-xs text-destructive font-medium">
                    Over the {lowestLimit}-char limit for one of your selected platforms — it will be rejected on publish.
                  </p>
                )}
              </div>
            </div>

            {/* Right: preview */}
            <aside className="hidden lg:block sticky top-24">
              <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-soft">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-bold text-foreground">Preview</h2>
                </div>
                {selectedPlatforms.length > 0 ? (
                  <Tabs defaultValue={selectedPlatforms[0]} className="w-full">
                    <TabsList className="w-full grid grid-cols-2 mb-4 h-auto">
                      {selectedPlatforms.slice(0, 4).map((platform) => (
                        <TabsTrigger key={platform} value={platform} className="text-xs">
                          {platform === "X (Twitter)" ? "X" : platform}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {selectedPlatforms.map((platform) => (
                      <TabsContent key={platform} value={platform} className="mt-0">
                        <ImagePreviewCard platform={platform} content={content} image={selectedImage} />
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    Pick a platform above to see preview.
                  </div>
                )}
              </div>
            </aside>
          </div>
        </section>

        {/* ── MOBILE BOTTOM ACTION BAR ── */}
        <div
          className={cn(
            "sm:hidden fixed inset-x-0 z-20 border-t border-border/40 backdrop-blur-xl bg-card/90 px-4 py-3",
            locked && "opacity-60 pointer-events-none"
          )}
          style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
        >
          <div className="space-y-2">
            {showApprove && (
              <button
                onClick={approve}
                disabled={isApproving || busy}
                className="w-full flex items-center justify-center gap-2 bg-success text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {isApproving && <Loader2 className="h-4 w-4 animate-spin" />}
                Approve & Publish
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
                  disabled={isRequestingApproval || busy}
                  className="w-full flex items-center justify-center gap-2 bg-warning text-warning-foreground font-bold py-3 rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {isRequestingApproval && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isPendingApproval ? "Resend approval" : "Request approval"}
                </button>
              </>
            )}
            <button
              onClick={save}
              disabled={busy || loadingExisting}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {(isSaving || isUploading) && <Loader2 className="h-4 w-4 animate-spin" />}
              {isUploading ? "Uploading…" : saveLabel}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Local components
// ──────────────────────────────────────────────────────────────────────────

function ImagePreviewCard({ platform, content, image }: { platform: string; content: string; image: string | null }) {
  const formatted = formatContent(content);

  if (platform === "Instagram") {
    return (
      <div className="border border-border/60 rounded-xl bg-background overflow-hidden">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400" />
            <div>
              <p className="font-semibold text-sm text-foreground">your_brand</p>
              <p className="text-[10px] text-muted-foreground">2 minutes ago</p>
            </div>
          </div>
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>
        <ImageOrPlaceholder image={image} aspect="1/1" />
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-3 text-foreground">
              <Heart className="h-5 w-5" />
              <MessageCircle className="h-5 w-5" />
              <Share className="h-5 w-5" />
            </div>
            <Bookmark className="h-5 w-5 text-foreground" />
          </div>
          <p className="text-xs font-semibold text-foreground mb-1">1,234 likes</p>
          <div className="text-xs leading-relaxed whitespace-pre-wrap break-words">
            <span className="font-semibold text-foreground mr-1">your_brand</span>
            {formatted}
          </div>
        </div>
      </div>
    );
  }

  if (platform === "X (Twitter)") {
    return (
      <div className="border border-border/60 rounded-xl p-3 bg-background">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 text-sm">
              <span className="font-semibold text-foreground">Your brand</span>
              <span className="text-muted-foreground">@yourbrand · 2m</span>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words mb-2">{formatted}</div>
            <div className="rounded-xl overflow-hidden border border-border/40">
              <ImageOrPlaceholder image={image} aspect="16/9" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (platform === "LinkedIn") {
    return (
      <div className="border border-border/60 rounded-xl bg-background overflow-hidden">
        <div className="flex items-center gap-3 p-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-800" />
          <div>
            <p className="font-semibold text-sm text-foreground">Your brand</p>
            <p className="text-xs text-muted-foreground">CEO · 2m</p>
          </div>
        </div>
        <div className="px-3 pb-3 text-sm leading-relaxed whitespace-pre-wrap break-words">{formatted}</div>
        <ImageOrPlaceholder image={image} aspect="4/3" />
      </div>
    );
  }

  if (platform === "Pinterest") {
    return (
      <div className="border border-border/60 rounded-xl bg-background overflow-hidden">
        <div className="rounded-xl overflow-hidden">
          <ImageOrPlaceholder image={image} aspect="3/4" />
        </div>
        <div className="p-3 space-y-1">
          <p className="font-semibold text-sm text-foreground line-clamp-1">{content || "Pin description"}</p>
          <p className="text-xs text-muted-foreground">your_brand</p>
        </div>
      </div>
    );
  }

  // Facebook / Threads default
  return (
    <div className="border border-border/60 rounded-xl bg-background overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700" />
        <div>
          <p className="font-semibold text-sm text-foreground">Your brand</p>
          <p className="text-xs text-muted-foreground">2m · Public</p>
        </div>
      </div>
      <div className="px-3 pb-3 text-sm leading-relaxed whitespace-pre-wrap break-words">{formatted}</div>
      <ImageOrPlaceholder image={image} aspect="4/3" />
    </div>
  );
}

function ImageOrPlaceholder({ image, aspect }: { image: string | null; aspect: string }) {
  if (image) {
    return (
      <div style={{ aspectRatio: aspect }} className="w-full bg-muted/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" loading="lazy" className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div
      style={{ aspectRatio: aspect }}
      className="w-full bg-gradient-to-br from-muted to-muted/60 flex flex-col items-center justify-center text-muted-foreground"
    >
      <ImageIcon className="h-7 w-7 mb-1.5 opacity-60" />
      <span className="text-[11px] font-medium">Your image</span>
    </div>
  );
}

function formatContent(text: string): React.ReactNode {
  if (!text) return <span className="text-muted-foreground">Write a caption…</span>;
  return text.split(/(\s+)/).map((word, i) => {
    if (word.startsWith("#")) return <span key={i} className="text-primary font-medium">{word}</span>;
    if (word.startsWith("@")) return <span key={i} className="text-purple-600 dark:text-purple-400 font-medium">{word}</span>;
    if (word.match(/https?:\/\/[^\s]+/) || word.match(/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/)) {
      return <span key={i} className="text-emerald-600 dark:text-emerald-400 font-medium underline">{word}</span>;
    }
    if (word.startsWith("**") && word.endsWith("**") && word.length > 4) {
      return <span key={i} className="font-bold">{word.slice(2, -2)}</span>;
    }
    if (word.startsWith("*") && word.endsWith("*") && word.length > 2) {
      return <span key={i} className="italic">{word.slice(1, -1)}</span>;
    }
    return <span key={i}>{word}</span>;
  });
}

export default function MakePostImagePage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <InlineSpinner size="sm" />
        </div>
      </AppShell>
    }>
      <MakePostImageContent />
    </Suspense>
  );
}
