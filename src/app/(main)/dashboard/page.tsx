"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useNotifications } from "@/app/components/ui/Notification";
import { useTeam } from "@/context/TeamContext";
import { getTeamDisplayName } from "@/lib/teamDisplay";
import { formatPostContent } from "@/lib/formatPostContent";
import { useContentCache } from "@/context/ContentCacheContext";
import { motion } from "framer-motion";
import { NextSeoNoSSR } from "@/app/components/seo/NoSSRSeo";
import { CardSkeleton, Skeleton, DashboardSkeleton } from "@/app/components/ui/loading-spinner";
import { Button } from "@/app/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  FileText,
  Image as ImageIcon,
  Video,
  Play,
  Edit,
  Trash2,
  Clock,
  Send,
  MoreVertical,
  Sparkles,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/app/components/ui/dropdown-menu";
import AppShell from "@/app/components/layout/AppLayout";
import { StatTile } from "@/app/components/pages/Dashboard/StatTile";
import { TypeFilter } from "@/app/components/pages/Dashboard/TypeFilter";
import { NeedsAttention } from "@/app/components/pages/Dashboard/NeedsAttention";

const MotionDiv = motion.div as any;

export const dynamic = "force-dynamic";

const ALL_TYPES = ["video", "image", "text", "reel"];

function greetingFor(name?: string | null) {
  const h = new Date().getHours();
  const part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name.split(" ")[0]}` : part;
}

export default function Dashboard() {
  const { user } = useUser();
  const { selectedTeamId, selectedTeam, personalTeam } = useTeam();
  const { getCachedContent, setCachedContent, isStale, invalidateCache } = useContentCache();
  const notifications = useNotifications();
  const router = useRouter();

  // ---------- Data ----------
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // ---------- Filters ----------
  // selectedTypes: empty array = "all types" (matches existing API behavior of
  // sending the full list). UI shows pill chips that toggle.
  const [selectedTypes, setSelectedTypes] = useState<string[]>(ALL_TYPES);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // ---------- Fetch ----------
  const fetchContent = useCallback(async () => {
    if (!selectedTeamId) {
      setLoading(false);
      return;
    }
    const types = selectedTypes.length === 0 ? ALL_TYPES : selectedTypes;

    const cachedContent = getCachedContent(selectedTeamId, types, selectedStatus);
    if (cachedContent && !isStale(selectedTeamId, types, selectedStatus)) {
      setContent(cachedContent);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        teamId: selectedTeamId,
        types: types.join(","),
        status: selectedStatus,
        sortBy: "newest",
        limit: "100",
      });

      const response = await fetch(`/api/content?${params}`);
      const result = await response.json();

      if (response.ok) {
        const contentData = result.content || [];
        setContent(contentData);
        setTotalCount(result.total || 0);
        setCachedContent(selectedTeamId, types, selectedStatus, contentData, result.total || 0);
      } else {
        throw new Error(result.message || "Failed to fetch content");
      }
    } catch {
      notifications.addNotification({
        type: "error",
        title: "Failed to load content",
        message: "Please try refreshing the page",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedTeamId, selectedTypes, selectedStatus, notifications, getCachedContent, setCachedContent, isStale]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Realtime updates
  useEffect(() => {
    if (!selectedTeamId) return;
    let es: EventSource | null = null;
    try {
      es = new EventSource(`/api/events?teamId=${encodeURIComponent(selectedTeamId)}`);
      es.onmessage = (ev) => {
        try {
          const evt = JSON.parse(ev.data || "{}");
          if (!evt?.type) return;
          if (!evt.type.startsWith("post.") && !evt.type.startsWith("video.")) return;
          invalidateCache(selectedTeamId);
          fetchContent();
        } catch {
          // ignore
        }
      };
      es.onerror = () => { try { es?.close(); } catch {} es = null; };
    } catch {
      // ignore
    }
    return () => { try { es?.close(); } catch {} };
  }, [selectedTeamId, fetchContent, invalidateCache]);

  // ---------- Status filter via stat tiles ----------
  // Click a stat tile to filter to its status; click again to clear back to ALL.
  const setStatusFilter = (status: string) => {
    setSelectedStatus((prev) => (prev === status ? "ALL" : status));
  };

  // ---------- Derived counts ----------
  const counts = useMemo(() => {
    const c = { total: content.length, published: 0, scheduled: 0, drafts: 0, awaitingApproval: 0, failed: 0 };
    for (const item of content) {
      const s = String(item.status || "").toUpperCase();
      if (s === "PUBLISHED" || s === "POSTED") c.published++;
      else if (s === "SCHEDULED") c.scheduled++;
      else if (s === "DRAFT" || s === "PROCESSING") c.drafts++;
      if (s === "APPROVAL_REQUESTED" || s === "PENDING") c.awaitingApproval++;
      if (s === "FAILED") c.failed++;
    }
    return c;
  }, [content]);

  const role = String((selectedTeam as any)?.role || "").toUpperCase();
  const canApprove = role === "OWNER" || role === "ADMIN";

  // ---------- Content actions ----------
  const handleEditContent = (item: any) => {
    // Approved / published / scheduled items can't be edited via the make-post
    // editor — the server's PATCH endpoint rejects metadata edits once the
    // post leaves draft state for non-owners. Route to the preview page so
    // the user gets the correct affordances (e.g. "Send back for editing").
    const status = String(item.status || "").toUpperCase();
    const editorWouldBeLocked =
      status === "APPROVAL_APPROVED" ||
      status === "APPROVAL_REQUESTED" ||
      status === "PENDING" ||
      status === "PUBLISHED" ||
      status === "POSTED" ||
      status === "SCHEDULED";

    if (editorWouldBeLocked) {
      if (item.type === "video") router.push(`/videos/${item.id}`);
      else router.push(`/posts/${item.id}`);
      return;
    }

    const editRoutes: Record<string, string> = {
      text: "/make-post/text",
      image: "/make-post/image",
      reel: "/make-post/reel",
      video: "/make-post/video",
    };
    const route = editRoutes[item.type];
    if (route) router.push(`${route}?edit=${item.id}`);
  };

  const openPostDetails = (item: any) => {
    if (!item?.id) return;
    if (item.type === "video") router.push(`/videos/${item.id}`);
    else router.push(`/posts/${item.id}`);
  };

  const handleDeleteContent = async (item: any) => {
    try {
      const response = await fetch(`/api/content/${item.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete content");
      notifications.addNotification({
        type: "success",
        title: "Content deleted",
        message: `${item.type} post has been deleted successfully`,
      });
      setContent((prev) => prev.filter((c: any) => c.id !== item.id));
      setTotalCount((prev) => prev - 1);
    } catch {
      notifications.addNotification({
        type: "error",
        title: "Failed to delete content",
        message: "Please try again later",
      });
    }
  };

  const handlePublishContent = async (item: any) => {
    try {
      const response = await fetch(`/api/content/${item.id}/publish`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to publish content");
      notifications.addNotification({
        type: "success",
        title: "Content published",
        message: `${item.type} post has been published successfully`,
      });
      setContent((prev) => prev.map((c: any) => (c.id === item.id ? { ...c, status: "PUBLISHED" } : c)));
    } catch {
      notifications.addNotification({
        type: "error",
        title: "Failed to publish content",
        message: "Please try again later",
      });
    }
  };

  const handleScheduleContent = async (item: any) => {
    try {
      const input = window.prompt("Schedule time (YYYY-MM-DD HH:mm, 24h)");
      if (!input) return;
      const parsed = new Date(input.replace(" ", "T"));
      if (isNaN(parsed.getTime())) {
        notifications.addNotification({ type: "error", title: "Invalid time", message: "Use format YYYY-MM-DD HH:mm" });
        return;
      }
      const scheduledFor = parsed.toISOString();
      const res = await fetch(`/api/content/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledFor, status: "SCHEDULED" }),
      });
      if (!res.ok) throw new Error("Failed to schedule");
      const updated = await res.json();
      setContent((prev) => prev.map((c: any) => (c.id === item.id ? { ...c, scheduledFor: updated.scheduledFor, status: "SCHEDULED" } : c)));
      notifications.addNotification({ type: "success", title: "Scheduled", message: "Post scheduled successfully" });
    } catch {
      notifications.addNotification({ type: "error", title: "Schedule failed", message: "Try again" });
    }
  };

  const handleDuplicateContent = async (item: any) => {
    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, title: `${item.title} (Copy)`, status: "DRAFT" }),
      });
      if (!response.ok) throw new Error("Failed to duplicate content");
      notifications.addNotification({
        type: "success",
        title: "Content duplicated",
        message: `${item.type} post has been duplicated successfully`,
      });
      fetchContent();
    } catch {
      notifications.addNotification({
        type: "error",
        title: "Failed to duplicate content",
        message: "Please try again later",
      });
    }
  };

  // ---------- Render ----------
  if (!selectedTeamId && selectedTeam === null) {
    return (
      <AppShell>
        <DashboardSkeleton />
      </AppShell>
    );
  }

  const teamName = getTeamDisplayName(selectedTeam, personalTeam?.id);
  const greeting = greetingFor(user?.firstName || user?.fullName);

  const statusLabel: Record<string, string> = {
    ALL: "All posts",
    DRAFT: "Drafts",
    PUBLISHED: "Published",
    SCHEDULED: "Scheduled",
    PROCESSING: "Processing",
    APPROVAL_REQUESTED: "Awaiting approval",
  };

  return (
    <AppShell>
      <NextSeoNoSSR title="Dashboard" noindex nofollow />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* HERO — greeting + primary CTA */}
        <MotionDiv
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4"
        >
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{greeting}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate flex items-center gap-2">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
              <span className="truncate">{teamName}</span>
            </h1>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Link href="/make-post" className="flex-1 sm:flex-initial">
              <Button className="w-full sm:w-auto gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                <span>Create</span>
              </Button>
            </Link>
          </div>
        </MotionDiv>

        {/* NEEDS ATTENTION — only renders when there's something */}
        {!loading && (
          <NeedsAttention
            pendingApprovals={canApprove ? counts.awaitingApproval : 0}
            draftsReady={counts.drafts}
            failedPosts={counts.failed}
          />
        )}

        {/* STAT TILES — skeleton during load so we don't flash "0" */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-card p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Skeleton className="h-8 w-8 sm:h-10 sm:w-10" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <StatTile
              label="Total" value={counts.total} hint="All content" Icon={BarChart3}
              tone="bg-primary/10 text-primary"
              onClick={() => setStatusFilter("ALL")} active={selectedStatus === "ALL"}
            />
            <StatTile
              label="Published" value={counts.published} hint="Live" Icon={TrendingUp}
              tone="bg-emerald-500/10 text-emerald-600"
              onClick={() => setStatusFilter("PUBLISHED")} active={selectedStatus === "PUBLISHED"}
            />
            <StatTile
              label="Scheduled" value={counts.scheduled} hint="Upcoming" Icon={Calendar}
              tone="bg-amber-500/10 text-amber-600"
              onClick={() => setStatusFilter("SCHEDULED")} active={selectedStatus === "SCHEDULED"}
            />
            <StatTile
              label="Drafts" value={counts.drafts} hint="In progress" Icon={FileText}
              tone="bg-sky-500/10 text-sky-600"
              onClick={() => setStatusFilter("DRAFT")} active={selectedStatus === "DRAFT"}
            />
          </div>
        )}

        {/* FILTER BAR */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <TypeFilter selected={selectedTypes} onChange={setSelectedTypes} />
          </div>
          <div className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
            {loading ? (
              <Skeleton className="h-3.5 w-32" />
            ) : (
              <>
                {content.length}{" "}
                <span className="hidden sm:inline">of {Math.max(totalCount, content.length)}</span>{" "}
                <span>· {statusLabel[selectedStatus] || selectedStatus}</span>
              </>
            )}
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <DashboardLoadingGrid />
        ) : content.length === 0 ? (
          <EmptyState selectedStatus={selectedStatus} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {content.map((item: any, index: number) => (
              <ContentCard
                key={item.id}
                item={item}
                index={index}
                onOpen={openPostDetails}
                onEdit={handleEditContent}
                onPublish={handlePublishContent}
                onSchedule={handleScheduleContent}
                onDuplicate={handleDuplicateContent}
                onDelete={handleDeleteContent}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ============================================================================
// DashboardLoadingGrid — shape-match the real ContentCard grid so the
// skeleton looks like the page that's about to appear, not three blank tiles.
// Renders 6 cards on lg, 4 on sm, 2 on mobile to roughly fill the viewport.
// ============================================================================
function DashboardLoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton className="hidden sm:block" />
      <CardSkeleton className="hidden sm:block" />
      <CardSkeleton className="hidden lg:block" />
      <CardSkeleton className="hidden lg:block" />
    </div>
  );
}

// ============================================================================
// EmptyState
// ============================================================================
function EmptyState({ selectedStatus }: { selectedStatus: string }) {
  const isFiltered = selectedStatus !== "ALL";
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-6 py-12 sm:py-16 text-center">
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
        {isFiltered ? `No ${selectedStatus.toLowerCase()} posts` : "Nothing here yet"}
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mb-5">
        {isFiltered
          ? "Try changing the status filter, or create something new."
          : "Create your first post to start publishing across your platforms."}
      </p>
      <div className="flex gap-2 justify-center flex-wrap">
        <Link href="/make-post">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            New post
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// ContentCard — slimmer, mobile-first card
// ============================================================================
function ContentCard({
  item, index, onOpen, onEdit, onPublish, onSchedule, onDuplicate, onDelete,
}: {
  item: any; index: number;
  onOpen: (i: any) => void;
  onEdit: (i: any) => void;
  onPublish: (i: any) => void;
  onSchedule: (i: any) => void;
  onDuplicate: (i: any) => void;
  onDelete: (i: any) => void;
}) {
  const status = String(item.status || "").toUpperCase();
  const statusVariant: any =
    status === "PUBLISHED" || status === "POSTED" ? "default" :
    status === "DRAFT" ? "secondary" :
    status === "SCHEDULED" ? "outline" :
    status === "FAILED" ? "destructive" : "outline";
  const isDraft = status === "DRAFT" || status === "PROCESSING";

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.2) }}
    >
      <Card
        role="button"
        tabIndex={0}
        onClick={() => onOpen(item)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(item); }
        }}
        className="overflow-hidden border border-border/60 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
      >
        <CardContent className="p-0">
          {/* Visual */}
          <ContentPreview item={item} />

          {/* Body */}
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <TypeIndicator type={item.type} />
              <Badge variant={statusVariant} className="text-xs font-semibold">
                {status || "—"}
              </Badge>
            </div>

            <h3 className="font-semibold text-base text-foreground line-clamp-2 mb-1">
              {item.title || item.filename || "Untitled"}
            </h3>
            {item.content && (
              <p
                className="text-sm text-muted-foreground line-clamp-2 mb-3 [&_strong]:text-foreground [&_em]:text-foreground"
                // Render the same inline formatting (bold, italic, hashtags,
                // links, timestamps) that the live preview on /videos/[id]
                // shows so the dashboard isn't a downgraded-looking duplicate.
                dangerouslySetInnerHTML={{ __html: formatPostContent(item.content) }}
              />
            )}

            {/* Meta row */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 pt-2 border-t border-border/60">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
              {item.platforms?.length > 0 && (
                <span>{item.platforms.length} platform{item.platforms.length > 1 ? "s" : ""}</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1.5">
                <Button
                  size="sm" variant="outline"
                  className="h-9 px-3 text-sm gap-1.5"
                  onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Button>
                {isDraft && (
                  <Button
                    size="sm"
                    className="h-9 px-3 text-sm gap-1.5"
                    onClick={(e) => { e.stopPropagation(); onPublish(item); }}
                  >
                    <Send className="w-3.5 h-3.5" /> Publish
                  </Button>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm" variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(item)}>
                    <FileText className="w-4 h-4 mr-2" /> Duplicate
                  </DropdownMenuItem>
                  {isDraft && (
                    <DropdownMenuItem onClick={() => onSchedule(item)}>
                      <Calendar className="w-4 h-4 mr-2" /> Schedule
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(item)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </MotionDiv>
  );
}

function TypeIndicator({ type }: { type: string }) {
  const map: Record<string, { Icon: any; cls: string; label: string }> = {
    video: { Icon: Video,     cls: "bg-red-500/10 text-red-600",    label: "Video" },
    image: { Icon: ImageIcon, cls: "bg-blue-500/10 text-blue-600",   label: "Image" },
    text:  { Icon: FileText,  cls: "bg-emerald-500/10 text-emerald-600", label: "Text" },
    reel:  { Icon: Play,      cls: "bg-purple-500/10 text-purple-600", label: "Reel" },
  };
  const def = map[type] || map.text;
  const { Icon, cls, label } = def;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium ${cls}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function ContentPreview({ item }: { item: any }) {
  const isVideo = item.type === "video";
  const isReel = item.type === "reel";
  const isImage = item.type === "image";

  // /api/s3/get-url returns JSON by default (the existing behavior used by
  // fetch-based callers). Pass `redirect=1` so the route 302s to the actual
  // signed S3 URL, making it usable as <img src> / <video src> directly.
  const signedSrc = (key: string) =>
    `/api/s3/get-url?redirect=1&key=${encodeURIComponent(key)}`;

  const thumbUrl =
    item.thumbnailKey
      ? signedSrc(item.thumbnailKey)
      : isImage && (item.imageKey || item.key)
        ? signedSrc(item.imageKey || item.key)
        : null;

  const videoSrc =
    (isVideo || isReel) && (item.videoKey || item.key)
      ? signedSrc(item.videoKey || item.key)
      : null;

  // Image post: just show the image
  if (isImage && thumbUrl) {
    return (
      <div className="aspect-video bg-muted relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumbUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
      </div>
    );
  }

  // Video / Reel: prefer thumbnail (lighter), fall back to <video> first frame
  if (isVideo || isReel) {
    if (thumbUrl) {
      return (
        <div className="aspect-video bg-muted relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-10 h-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </span>
          </div>
        </div>
      );
    }
    if (videoSrc) {
      // Use the actual media file as a poster source — preload="metadata"
      // grabs only the first frame, no full download.
      return (
        <div className="aspect-video bg-muted relative overflow-hidden">
          <video
            src={videoSrc}
            preload="metadata"
            muted
            playsInline
            className="w-full h-full object-cover bg-black"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-10 h-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </span>
          </div>
        </div>
      );
    }
  }

  // Final placeholder — text posts or missing media
  return (
    <div className="aspect-video bg-gradient-to-br from-muted/40 to-muted/10 flex items-center justify-center">
      {isVideo || isReel ? (
        <Video className="w-8 h-8 text-muted-foreground/40" />
      ) : (
        <FileText className="w-8 h-8 text-muted-foreground/40" />
      )}
    </div>
  );
}
