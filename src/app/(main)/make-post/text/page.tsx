"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Layers,
  Loader2,
  Type,
  Clock,
  Eye,
  Check,
  Lock,
  Hash,
} from "lucide-react";
import AppShell from "@/app/components/layout/AppLayout";
import RichTextEditor from "@/app/components/editor/RichTextEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { useTeam } from "@/context/TeamContext";
import { getTeamDisplayName } from "@/lib/teamDisplay";
import { useNotifications } from "@/app/components/ui/Notification";
import { InlineSpinner } from "@/app/components/ui/loading-spinner";
import { useTeamPlatforms } from "@/hooks/use-team-platforms";
import { cn } from "@/lib/utils";

// Text-post platforms — these are the only platforms that accept a
// text-only post. Image/Reel/YouTube platforms are intentionally absent.
const TEXT_PLATFORMS = [
  { id: "X (Twitter)", label: "X (Twitter)", limit: 280,   key: "twitter"  },
  { id: "Facebook",    label: "Facebook",    limit: 63206, key: "facebook" },
  { id: "LinkedIn",    label: "LinkedIn",    limit: 3000,  key: "linkedin" },
  { id: "Threads",     label: "Threads",     limit: 500,   key: "threads"  },
] as const;

function MakePostTextContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { selectedTeamId, selectedTeam, personalTeam } = useTeam();
  const { addNotification } = useNotifications();
  const { isPersonal, has, team: teamFromHook } = useTeamPlatforms();

  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["X (Twitter)", "LinkedIn"]);
  const [postStatus, setPostStatus] = useState<string | null>(null);
  const [role, setRole] = useState<"OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | null>(null);

  const [loadingExisting, setLoadingExisting] = useState<boolean>(!!editId);
  const [isSaving, setIsSaving] = useState(false);
  const [isRequestingApproval, setIsRequestingApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const locked = !!editId && postStatus === "PENDING" && role === "EDITOR";
  const busy = isSaving;
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
    const def = TEXT_PLATFORMS.find((p) => p.id === id);
    if (def && isLocked(def.key) && !selectedPlatforms.includes(id)) return;
    setSelectedPlatforms((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const save = async () => {
    if (!selectedTeamId && !editId) {
      addNotification({ type: "error", title: "No workspace selected", message: "Pick a workspace first" });
      return;
    }
    if (!content.trim()) {
      addNotification({ type: "error", title: "Content required", message: "Write something before saving" });
      return;
    }
    setIsSaving(true);
    try {
      let response: Response;
      if (editId) {
        response = await fetch(`/api/content/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, platforms: selectedPlatforms }),
        });
      } else {
        response = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "text", content, teamId: selectedTeamId, platforms: selectedPlatforms, metadata: {} }),
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

  // Tightest character limit across selected platforms (drives the counter)
  const limits = selectedPlatforms
    .map((id) => TEXT_PLATFORMS.find((p) => p.id === id)?.limit)
    .filter((n) => typeof n === "number") as number[];
  const lowestLimit: number = limits.length > 0 ? Math.min(...limits) : Infinity;
  const charCount = content.length;
  const overLimit = lowestLimit !== Infinity && charCount > lowestLimit;

  const saveLabel = editId ? "Save changes" : "Save post";

  return (
    <AppShell>
      <div className="min-h-screen flex flex-col" style={{ background: "var(--gradient-subtle)" }}>
        {/* ── TOP NAV BAR — back, breadcrumbs, workspace, actions ── */}
        <header className="lg:sticky lg:top-0 lg:z-20 border-b border-border/50 backdrop-blur-xl bg-card/80">
          <div className="px-3 sm:px-6 lg:px-8 xl:px-10">
            <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
              {/* Left */}
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
                    <Type className="h-3.5 w-3.5 text-primary" />
                    Text Post
                  </span>
                </nav>

                <span className="sm:hidden text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5 text-primary" />
                  Text Post
                </span>
              </div>

              {/* Right */}
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
                    {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {saveLabel}
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

        {/* ── HERO: title + spec chips + desktop platform selector ── */}
        <div className="px-3 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground leading-none">
                {editId ? "Edit text post" : "Create text post"}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/8 text-primary text-xs font-bold">
                  <Type className="h-3 w-3" />
                  Text only
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

            {/* Desktop platform selector lives in hero so left column stays
                focused on writing. Mobile/tablet gets it inside the form. */}
            <div className="hidden lg:block">
              <PlatformPills
                selected={selectedPlatforms}
                onToggle={togglePlatform}
                isLocked={isLocked}
                teamName={teamFromHook?.name || selectedTeam?.name || null}
              />
            </div>
          </div>
        </div>

        {/* ── MAIN: Editor (left) + Preview (right) ── */}
        <section className="flex-1 px-3 sm:px-6 lg:px-8 xl:px-10 pt-3 sm:pt-4 pb-32 sm:pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px] gap-4 sm:gap-6 lg:gap-8 items-start">
            {/* Left: editor + (mobile) platforms */}
            <div className={cn("space-y-4 sm:space-y-5 min-w-0", locked && "opacity-60 pointer-events-none select-none")}>
              {/* Mobile/tablet platform selector */}
              <div className="lg:hidden rounded-2xl border border-border/50 bg-card p-4 sm:p-5 shadow-soft">
                <PlatformPills
                  selected={selectedPlatforms}
                  onToggle={togglePlatform}
                  isLocked={isLocked}
                  teamName={teamFromHook?.name || selectedTeam?.name || null}
                />
              </div>

              {/* Editor card */}
              <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5 shadow-soft">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Type className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold text-foreground">Write your post</h2>
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
                  placeholder="What's on your mind? Use **bold**, *italic*, #hashtags, @mentions, links…"
                  platforms={TEXT_PLATFORMS.map((p) => ({ id: p.id, name: p.label, limit: p.limit }))}
                  selectedPlatforms={selectedPlatforms}
                />
                {overLimit && (
                  <p className="mt-3 text-xs text-destructive font-medium">
                    Over the {lowestLimit}-char limit for one of your selected platforms — it will be rejected on publish.
                  </p>
                )}
              </div>
            </div>

            {/* Right: live preview (desktop only — phone-mock previews don't fit on mobile) */}
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
                        <PreviewCard platform={platform} content={content} />
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

        {/* ── MOBILE BOTTOM ACTION BAR — sits above the global tab bar ── */}
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
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saveLabel}
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

function PlatformPills({
  selected, onToggle, isLocked, teamName,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  isLocked: (key: string) => boolean;
  teamName: string | null;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-foreground">Platforms</span>
        <span className="text-[0.65rem] text-muted-foreground/50 font-medium tabular-nums">
          {selected.length} of {TEXT_PLATFORMS.length} selected
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {TEXT_PLATFORMS.map(({ id, label, key, limit }) => {
          const active = selected.includes(id);
          const lockedHere = isLocked(key);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(id)}
              disabled={lockedHere}
              title={lockedHere ? `Not enabled for ${teamName || "this workspace"}.` : undefined}
              className={cn(
                "relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all duration-200 text-left select-none group",
                lockedHere
                  ? "bg-muted/40 border-dashed border-border/60 text-muted-foreground/60 cursor-not-allowed opacity-70"
                  : active
                    ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/15"
                    : "bg-background border-border/50 hover:border-primary/30 hover:bg-muted/30",
              )}
            >
              <span className={cn(
                "w-4 h-4 rounded-md flex items-center justify-center shrink-0 border",
                lockedHere
                  ? "bg-muted border-border/60"
                  : active
                    ? "bg-white/20 border-white/30"
                    : "bg-muted/40 border-border/60 group-hover:border-primary/40",
              )}>
                {lockedHere
                  ? <Lock className="h-2.5 w-2.5 text-muted-foreground" strokeWidth={2.5} />
                  : active && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
              </span>
              <div className="min-w-0">
                <span className={cn(
                  "font-semibold text-xs leading-tight block",
                  lockedHere ? "text-muted-foreground/70" : active ? "text-white" : "text-foreground"
                )}>
                  {label}
                </span>
                <span className={cn(
                  "text-[0.6rem] leading-snug block tabular-nums",
                  lockedHere ? "text-muted-foreground/50 italic"
                  : active ? "text-white/60" : "text-muted-foreground/50"
                )}>
                  {lockedHere ? "Not enabled" : `${limit.toLocaleString()} char limit`}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreviewCard({ platform, content }: { platform: string; content: string }) {
  const formatted = formatContent(content);
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
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{formatted}</div>
          </div>
        </div>
      </div>
    );
  }
  if (platform === "LinkedIn") {
    return (
      <div className="border border-border/60 rounded-xl bg-background overflow-hidden">
        <div className="flex items-center gap-3 p-3 border-b border-border/40">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-800" />
          <div>
            <p className="font-semibold text-sm text-foreground">Your brand</p>
            <p className="text-xs text-muted-foreground">CEO · 2m</p>
          </div>
        </div>
        <div className="p-3 text-sm leading-relaxed whitespace-pre-wrap break-words">{formatted}</div>
      </div>
    );
  }
  if (platform === "Facebook") {
    return (
      <div className="border border-border/60 rounded-xl bg-background overflow-hidden">
        <div className="flex items-center gap-3 p-3 border-b border-border/40">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700" />
          <div>
            <p className="font-semibold text-sm text-foreground">Your brand</p>
            <p className="text-xs text-muted-foreground">2m · Public</p>
          </div>
        </div>
        <div className="p-3 text-sm leading-relaxed whitespace-pre-wrap break-words">{formatted}</div>
      </div>
    );
  }
  // Threads default
  return (
    <div className="border border-border/60 rounded-xl bg-background overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <div className="w-9 h-9 rounded-full bg-foreground" />
        <div>
          <p className="font-semibold text-sm text-foreground">your_brand</p>
          <p className="text-xs text-muted-foreground">2m</p>
        </div>
      </div>
      <div className="px-3 pb-3 text-sm leading-relaxed whitespace-pre-wrap break-words">{formatted}</div>
    </div>
  );
}

function formatContent(text: string): React.ReactNode {
  if (!text) return <span className="text-muted-foreground">Start writing your post…</span>;
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

export default function MakePostTextPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <InlineSpinner size="sm" />
        </div>
      </AppShell>
    }>
      <MakePostTextContent />
    </Suspense>
  );
}
