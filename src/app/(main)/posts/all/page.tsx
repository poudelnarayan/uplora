"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Video, Image as ImageIcon, Filter, Search, Grid, List, Eye, Edit, Trash2, Calendar, Clock, Sparkles, Plus, MoreVertical, Send } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { useTeam } from "@/context/TeamContext";
import { useContentCache } from "@/context/ContentCacheContext";
import { useNotifications } from "@/app/components/ui/Notification";
import { CardSkeleton, PostsGridSkeleton } from "@/app/components/ui/loading-spinner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/app/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import AppShell from "@/app/components/layout/AppLayout";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const MotionDiv = motion.div as any;

function AllPostsInner() {
  const router = useRouter();
  const { selectedTeamId, selectedTeam } = useTeam();
  const { getCachedContent, setCachedContent, isStale, removeContentItem, invalidateCache } = useContentCache();
  const notifications = useNotifications();
  const searchParams = useSearchParams();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  // Initial filter values come from the URL once on first render. We do NOT
  // re-read searchParams on subsequent renders — doing so would clobber
  // user-selected filters back to whatever the URL says (the bug where
  // clicking "All" on /posts/all?status=DRAFT did nothing).
  const [filterType, setFilterType] = useState<string>(() => {
    const t = searchParams.get("type");
    return t && ["all", "text", "image", "reel", "video"].includes(t) ? t : "all";
  });
  const [filterStatus, setFilterStatus] = useState<string>(() => {
    const s = searchParams.get("status");
    return s && ["all", "DRAFT", "PENDING", "SCHEDULED", "PUBLISHED", "PROCESSING"].includes(s) ? s : "all";
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const canSchedule = ["OWNER", "ADMIN", "MANAGER"].includes(String((selectedTeam as any)?.role || ""));

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // (Deep-link defaults are read in the useState initializers above. We
  // intentionally don't keep a useEffect listening to `searchParams` because
  // it would overwrite user clicks back to the URL value on every render.)

  const fetchContent = useCallback(async () => {
    if (!selectedTeamId) {
      setLoading(false);
      return;
    }

    const cachedContent = getCachedContent(selectedTeamId, ['video', 'image', 'text', 'reel'], 'ALL');
    if (cachedContent && !isStale(selectedTeamId, ['video', 'image', 'text', 'reel'], 'ALL')) {
      setPosts(cachedContent);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        teamId: selectedTeamId,
        types: 'video,image,text,reel',
        status: 'ALL',
        sortBy: 'newest',
        limit: '100'
      });

      const response = await fetch(`/api/content?${params}`);
      const result = await response.json();

      if (response.ok) {
        const contentData = result.content || [];
        setPosts(contentData);
        setCachedContent(selectedTeamId, ['video', 'image', 'text', 'reel'], 'ALL', contentData, result.total || 0);
      } else {
        throw new Error(result.message || 'Failed to fetch content');
      }
    } catch (error) {
      notifications.addNotification({
        type: "error",
        title: "Failed to load content",
        message: "Please try refreshing the page"
      });
    } finally {
      setLoading(false);
    }
  }, [selectedTeamId, getCachedContent, setCachedContent, isStale, notifications]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Realtime: listen for post.* events on this team and refresh
  useEffect(() => {
    if (!selectedTeamId) return;
    let es: EventSource | null = null;
    try {
      const url = `/api/events?teamId=${encodeURIComponent(selectedTeamId)}`;
      es = new EventSource(url);
      es.onmessage = (ev) => {
        try {
          const evt = JSON.parse(ev.data || "{}");
          if (!evt?.type) return;
          if (!evt.type.startsWith("post.") && !evt.type.startsWith("video.")) return;
          invalidateCache(selectedTeamId);
          fetchContent();
          notifications.addNotification({
            type: "info",
            title: "Live update",
            message: evt.type === "post.status" || evt.type === "video.status" ? "Status updated" : "Posts updated",
          });
        } catch {
          // ignore parse errors
        }
      };
      es.onerror = () => {
        try { es?.close(); } catch {}
        es = null;
      };
    } catch {
      // ignore SSE setup errors
    }
    return () => {
      try { es?.close(); } catch {}
    };
  }, [selectedTeamId, fetchContent, invalidateCache, notifications]);

  const handleSchedulePost = async () => {
    if (!canSchedule) {
      notifications.addNotification({
        type: "error",
        title: "Not allowed",
        message: "Only owner/admin/manager can schedule posts."
      });
      return;
    }
    if (!selectedPost || !scheduleDate || !scheduleTime) {
      notifications.addNotification({
        type: "error",
        title: "Missing information",
        message: "Please select both date and time"
      });
      return;
    }

    setIsScheduling(true);
    try {
      const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();

      const response = await fetch(`/api/content/${selectedPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledFor,
          status: 'SCHEDULED'
        })
      });

      if (response.ok) {
        notifications.addNotification({
          type: "success",
          title: "Post scheduled",
          message: `Scheduled for ${new Date(scheduledFor).toLocaleString()}`
        });
        setScheduleDialogOpen(false);
        setSelectedPost(null);
        setScheduleDate("");
        setScheduleTime("");
        fetchContent();
      } else {
        throw new Error('Failed to schedule post');
      }
    } catch (error) {
      notifications.addNotification({
        type: "error",
        title: "Scheduling failed",
        message: "Please try again"
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const requestDeletePost = (post: any) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const openPostDetails = (postOrId: any) => {
    const id = typeof postOrId === "string" ? postOrId : String(postOrId?.id || "");
    if (!id) return;
    const t = typeof postOrId === "string" ? "" : String(postOrId?.type || "");
    if (t === "video") router.push(`/videos/${encodeURIComponent(id)}`);
    else router.push(`/posts/${encodeURIComponent(id)}`);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete || !selectedTeamId) return;
    const id = String(postToDelete.id);

    setIsDeleting(true);
    // Optimistic removal for snappy UX + animation
    setPosts((prev) => prev.filter((p) => String(p.id) !== id));
    setDeleteDialogOpen(false);

    try {
      const response = await fetch(`/api/content/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || "Failed to delete post");
      }

      // Remove from any cached views for this team (ALL/SCHEDULED/PUBLISHED/etc.)
      removeContentItem(selectedTeamId, id);

      notifications.addNotification({
        type: "success",
        title: "Deleted",
        message: "Post removed from database and storage",
      });
    } catch (error) {
      notifications.addNotification({
        type: "error",
        title: "Delete failed",
        message: error instanceof Error ? error.message : "Please try again",
      });
      // Restore correct state/order from source of truth
      fetchContent();
    } finally {
      setIsDeleting(false);
      setPostToDelete(null);
    }
  };

  // The API maps DB `draft` to "PROCESSING" for video posts (and "DRAFT" for
  // text/image/reel). We want a single "Drafts" filter bucket that catches
  // both — otherwise the dashboard's "Awaiting your action → drafts ready to
  // publish" link to /posts/all?status=DRAFT shows zero results when only
  // video drafts exist.
  const matchesStatusFilter = (postStatus: string, filter: string) => {
    if (filter === "all") return true;
    if (filter === "DRAFT") return postStatus === "DRAFT" || postStatus === "PROCESSING" || postStatus === "READY_TO_PUBLISH";
    if (filter === "PROCESSING") return postStatus === "PROCESSING" || postStatus === "DRAFT";
    if (filter === "PENDING") return postStatus === "PENDING" || postStatus === "APPROVAL_REQUESTED";
    return postStatus === filter;
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = (post.title && post.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === "all" || post.type === filterType;
    const matchesStatus = matchesStatusFilter(post.status, filterStatus);
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      case 'PENDING': return 'bg-orange/10 text-orange border-orange/20';
      case 'SCHEDULED': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'PUBLISHED': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'PROCESSING': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-5 w-5" />;
      case 'image': return <ImageIcon className="h-5 w-5" />;
      case 'text': return <FileText className="h-5 w-5" />;
      case 'reel': return <Sparkles className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'image': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'text': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'reel': return 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!selectedTeamId || !selectedTeam) {
    return (
      <AppShell>
        <PostsGridSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="relative lg:fixed lg:inset-0 lg:left-64 bg-background lg:overflow-auto">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-full"
        >
          {/* Header — compact: title row, search, then two horizontally
              scrollable chip rows for type and status. The previous
              double-row of full Buttons was eating ~140px on mobile. */}
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:sticky lg:top-0 lg:z-10 space-y-3">
            {/* Title row */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground truncate">All posts</h1>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {loading ? "Loading…" : `${filteredPosts.length} ${filteredPosts.length === 1 ? "post" : "posts"}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden sm:flex border border-border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 px-2.5"
                    aria-label="Grid view"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 px-2.5"
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                <Link href="/make-post">
                  <Button size="sm" className="h-9 gap-1.5">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New post</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Search + filter chips */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 text-sm"
                />
              </div>

              {/* Type chips — single horizontal scroll row, no wrap */}
              <FilterChipRow
                label="Type"
                value={filterType}
                onChange={(v) => setFilterType(v as typeof filterType)}
                options={[
                  { value: "all",   label: "All" },
                  { value: "text",  label: "Text" },
                  { value: "image", label: "Image" },
                  { value: "reel",  label: "Reel" },
                  { value: "video", label: "Video" },
                ]}
              />
              {/* Status chips */}
              <FilterChipRow
                label="Status"
                value={filterStatus}
                onChange={(v) => setFilterStatus(v as typeof filterStatus)}
                options={[
                  { value: "all",       label: "All" },
                  { value: "DRAFT",     label: "Drafts" },
                  { value: "PENDING",   label: "Pending" },
                  { value: "SCHEDULED", label: "Scheduled" },
                  { value: "PUBLISHED", label: "Published" },
                ]}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-6">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton className="hidden sm:block" />
                <CardSkeleton className="hidden sm:block" />
                <CardSkeleton className="hidden lg:block" />
                <CardSkeleton className="hidden lg:block" />
              </div>
            ) : (
              <>
                {filteredPosts.length === 0 ? (
                  <Card className="text-center py-16 border-dashed">
                    <CardContent>
                      <FileText className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                      <p className="text-muted-foreground mb-6">
                        {searchTerm ? "Try adjusting your search or filters" : "Start creating your first post"}
                      </p>
                      <Link href="/make-post">
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" />
                          Create Post
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6' : 'space-y-3 sm:space-y-4'}>
                    <AnimatePresence initial={false}>
                      {filteredPosts.map((post) => (
                        <motion.div
                          key={post.id}
                          layout
                          initial={{ opacity: 0, y: 10, scale: 0.99 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96, height: 0, marginBottom: 0 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          style={{ overflow: "hidden" }}
                        >
                          <Card
                            className="hover:shadow-lg transition-all duration-300 group cursor-pointer"
                            role="button"
                            tabIndex={0}
                            onClick={() => openPostDetails(post)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                openPostDetails(post);
                              }
                            }}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className={`p-2 rounded-lg ${getTypeColor(post.type)} flex-shrink-0`}>
                                    {getTypeIcon(post.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold truncate text-lg">{post.title || 'Untitled Post'}</h3>
                                    <p className="text-sm text-muted-foreground capitalize">{post.type}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={`${getStatusColor(post.status)} text-xs border`}>
                                    {post.status}
                                  </Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openPostDetails(post);
                                        }}
                                      >
                                        <Eye className="h-4 w-4 mr-2" />
                                        View
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          router.push(`/make-post/${encodeURIComponent(String(post.type))}?edit=${encodeURIComponent(String(post.id))}`);
                                        }}
                                      >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      {canSchedule && post.status === 'DRAFT' && (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedPost(post);
                                            setScheduleDialogOpen(true);
                                          }}
                                        >
                                          <Calendar className="h-4 w-4 mr-2" />
                                          Schedule
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          requestDeletePost(post);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-4">
                              <p className="text-muted-foreground text-sm line-clamp-3">
                                {post.content || post.description || 'No description provided'}
                              </p>

                              {post.platforms && post.platforms.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {post.platforms.map((platform: string) => (
                                    <Badge key={platform} variant="outline" className="text-xs">
                                      {platform}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatDate(post.scheduledFor || post.createdAt)}</span>
                                </div>
                                {post.status === 'SCHEDULED' && post.scheduledFor && (
                                  <Badge variant="outline" className="text-xs">
                                    Scheduled
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}
          </div>
        </MotionDiv>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Post</DialogTitle>
            <DialogDescription>
              Choose when you want this post to be published
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-date">Date</Label>
              <Input
                id="schedule-date"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-time">Time</Label>
              <Input
                id="schedule-time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setScheduleDialogOpen(false)}
              disabled={isScheduling}
            >
              Cancel
            </Button>
            <Button onClick={handleSchedulePost} disabled={isScheduling}>
              {isScheduling ? 'Scheduling...' : 'Schedule Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete post
            </DialogTitle>
            <DialogDescription>
              This will permanently delete this post from the database and remove its media from storage. This action can’t be undone.
            </DialogDescription>
          </DialogHeader>

          {postToDelete ? (
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="text-sm font-semibold text-foreground truncate">
                {postToDelete.title || "Untitled Post"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Type: <span className="capitalize">{String(postToDelete.type || "")}</span> • Status: {String(postToDelete.status || "")}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeletePost}
              disabled={isDeleting}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

/**
 * Single horizontal-scrollable chip row used for the type and status
 * filters. Replaces the old wrapping row of full <Button> components —
 * a single 32px row instead of two 36px rows of stacked buttons.
 */
function FilterChipRow({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0 w-14">
        {label}
      </span>
      <div className="flex-1 -mx-1 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 px-1">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                aria-pressed={active}
                className={`shrink-0 inline-flex items-center px-3 h-8 rounded-full text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-foreground/80 hover:bg-muted border border-border/40"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AllPostsPage() {
  // Next.js requires Suspense boundary when using useSearchParams() in app router pages.
  return (
    <Suspense fallback={<div />}>
      <AllPostsInner />
    </Suspense>
  );
}
