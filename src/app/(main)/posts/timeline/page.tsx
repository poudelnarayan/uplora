"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Clock, Calendar, Video, Image as ImageIcon, FileText, ChevronLeft, ChevronRight, Plus, Sparkles } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { useTeam } from "@/context/TeamContext";
import { useContentCache } from "@/context/ContentCacheContext";
import { usePreferences } from "@/context/PreferencesContext";
import { stripPostMarkup, formatPostContent } from "@/lib/formatPostContent";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/app/components/ui/Notification";
import { Skeleton, TimelineSkeleton, AppShellSkeleton } from "@/app/components/ui/loading-spinner";
import AppShell from "@/app/components/layout/AppLayout";
import Link from "next/link";

const MotionDiv = motion.div as any;

const Timeline = () => {
  const { user, isLoaded } = useUser();
  const { selectedTeamId, selectedTeam } = useTeam();
  const { getCachedContent, setCachedContent, isStale, invalidateCache } = useContentCache();
  const notifications = useNotifications();
  const router = useRouter();
  const { compact } = usePreferences();

  // Timeline rows route through /posts/[id] which redirects to the
  // right detail page based on type (video → /videos/[id], etc.).
  const openPost = (post: any) => router.push(`/posts/${encodeURIComponent(String(post.id))}`);

  // Build the row's display: title if present, then text-post snippet,
  // then image caption — or the image itself if there's no caption.
  const renderRowContent = (post: any) => {
    const title = String(post.title || "").trim();
    const content = String(post.content || "").trim();
    const type = String(post.type || "").toLowerCase();

    // Image post with no caption → show thumbnail-sized image
    if (type === "image" && !content && (post.imageUrl || post.imageKey)) {
      return (
        <span className="flex-1 min-w-0 flex items-center gap-2 text-foreground/80 text-xs">
          {post.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imageUrl}
              alt=""
              loading="lazy"
              className="h-7 w-7 rounded object-cover shrink-0"
            />
          ) : (
            <span className="h-7 w-7 rounded bg-muted flex items-center justify-center shrink-0">
              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
          )}
          <span className="italic text-muted-foreground truncate">Image · no caption</span>
        </span>
      );
    }

    // Otherwise: title preferred, then stripped content snippet
    const display = title || stripPostMarkup(content) || "Untitled";
    return (
      <span className="flex-1 min-w-0 truncate font-semibold text-foreground">
        {display}
      </span>
    );
  };

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week');

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
        title: "Failed to load timeline",
        message: "Please try refreshing the page"
      });
    } finally {
      setLoading(false);
    }
  }, [selectedTeamId, getCachedContent, setCachedContent, isStale, notifications]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Realtime: refresh on post.* events for this team
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(prev.getDate() - 7);
      } else {
        newDate.setDate(prev.getDate() + 7);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getCalendarDays = () => {
    const days = [];

    if (viewMode === 'month') {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());

      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        days.push(date);
      }
    } else {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        days.push(date);
      }
    }

    return days;
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getPostsForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    return posts.filter(post => {
      if (post.scheduledFor) {
        const scheduledDate = new Date(post.scheduledFor);
        return formatDateKey(scheduledDate) === dateKey;
      }
      if (post.createdAt) {
        const createdDate = new Date(post.createdAt);
        return formatDateKey(createdDate) === dateKey;
      }
      return false;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
      case 'PENDING': return 'bg-orange/10 text-orange';
      case 'SCHEDULED': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'PUBLISHED': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'PROCESSING': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'text': return <FileText className="h-4 w-4" />;
      case 'reel': return <Sparkles className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const calendarDays = getCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (!isLoaded) return <AppShellSkeleton />;
  if (!user) return <RedirectToSignIn redirectUrl="/posts/timeline" />;

  if (!selectedTeamId || !selectedTeam) {
    return (
      <AppShell>
        <TimelineSkeleton />
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
          {/* Header — mobile-first: title row then a separate controls row.
              On desktop the two rows collapse into one. */}
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:sticky lg:top-0 lg:z-10 space-y-3 sm:space-y-0">
            {/* Title + date label */}
            <div className="sm:flex sm:items-center sm:justify-between sm:gap-3">
              <div className="flex items-baseline gap-2 sm:gap-3 min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground shrink-0">Timeline</h1>
                <span className="text-sm text-muted-foreground truncate">
                  {viewMode === 'month'
                    ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                    : `${calendarDays[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${calendarDays[6]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  }
                </span>
              </div>

              {/* Desktop-only New Post button (mobile gets its own slot below) */}
              <Link href="/make-post" className="hidden sm:inline-flex">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Post
                </Button>
              </Link>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-2 sm:mt-3">
              {/* Prev/Next */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => viewMode === 'month' ? navigateMonth('prev') : navigateWeek('prev')}
                  className="h-9 w-9 p-0"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => viewMode === 'month' ? navigateMonth('next') : navigateWeek('next')}
                  className="h-9 w-9 p-0"
                  aria-label="Next"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Week/Month segmented — flex so it shrinks gracefully */}
              <div className="flex border border-border rounded-lg overflow-hidden shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('week')}
                  className={`px-3 h-9 text-sm rounded-none border-r ${
                    viewMode === 'week'
                      ? 'bg-primary text-primary-foreground hover:bg-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  Week
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('month')}
                  className={`px-3 h-9 text-sm rounded-none ${
                    viewMode === 'month'
                      ? 'bg-primary text-primary-foreground hover:bg-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  Month
                </Button>
              </div>

              <Button size="sm" variant="outline" onClick={goToToday} className="h-9 shrink-0">
                Today
              </Button>

              {/* Mobile: New Post pushed to the right and icon-only to save width */}
              <Link href="/make-post" className="sm:hidden ml-auto">
                <Button size="sm" className="h-9 w-9 p-0" aria-label="New post">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-3 sm:p-6">
            {loading ? (
              <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-4 space-y-3">
                {[0,1,2,3,4,5].map(i => (
                  <div key={i} className="flex items-center gap-3"><Skeleton className="h-12 w-12" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-3 w-2/3" /></div></div>
                ))}
              </div>
            ) : (
              <>
                {/* MOBILE — stacked list of days. The 7-col grid is unusable below lg. */}
                <div className="lg:hidden bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
                  {calendarDays
                    .filter((date) => viewMode === 'week' || isCurrentMonth(date))
                    .map((date, index) => {
                      const dayPosts = getPostsForDate(date);
                      const isTodayDay = isToday(date);
                      return (
                        <div key={index} className={`px-3 py-3 ${isTodayDay ? 'bg-primary/5' : ''}`}>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-baseline gap-2 min-w-0">
                              <span className={`text-base font-bold ${isTodayDay ? 'text-primary' : 'text-foreground'}`}>
                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                              </span>
                              <span className={`text-sm ${isTodayDay ? 'text-primary' : 'text-muted-foreground'}`}>
                                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              {isTodayDay && (
                                <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary text-primary-foreground shrink-0">
                                  Today
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {dayPosts.length === 0 ? 'No posts' : `${dayPosts.length} post${dayPosts.length > 1 ? 's' : ''}`}
                            </span>
                          </div>
                          {dayPosts.length > 0 && (
                            <div className={compact ? "space-y-1" : "space-y-1.5"}>
                              {dayPosts.map((post) => (
                                <button
                                  type="button"
                                  key={post.id}
                                  onClick={() => openPost(post)}
                                  className={`w-full text-left ${compact ? "px-2.5 py-1.5" : "px-3 py-2"} rounded-lg border text-sm flex items-center gap-2 ${getStatusColor(post.status)} border-border/50 hover:border-primary/40 active:scale-[0.99] transition-all`}
                                >
                                  <span className="shrink-0 [&_svg]:w-3.5 [&_svg]:h-3.5">{getTypeIcon(post.type)}</span>
                                  {renderRowContent(post)}
                                  {post.scheduledFor && (
                                    <span className="shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      {new Date(post.scheduledFor).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>

                {/* DESKTOP — original grid layout */}
                <div className="hidden lg:block bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                {viewMode === 'week' ? (
                  <>
                    {/* Week View */}
                    <div className="grid grid-cols-7 border-b border-border">
                      {calendarDays.map((date, index) => {
                        const isTodayDay = isToday(date);
                        return (
                          <div key={index} className="px-2 sm:px-4 py-2 sm:py-3 border-r border-border last:border-r-0 bg-muted/30">
                            <div className={`text-[10px] sm:text-sm font-semibold ${isTodayDay ? 'text-primary' : 'text-foreground'}`}>
                              {dayNames[date.getDay()]}
                            </div>
                            <div className={`text-base sm:text-xl md:text-2xl font-bold mt-0.5 sm:mt-1 ${isTodayDay ? 'text-primary' : 'text-muted-foreground'}`}>
                              {date.getDate()}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-7 min-h-[600px]">
                      {calendarDays.map((date, index) => {
                        const dayPosts = getPostsForDate(date);
                        const isTodayDay = isToday(date);

                        return (
                          <div
                            key={index}
                            className={`p-4 border-r border-border last:border-r-0 ${
                              isTodayDay ? 'bg-primary/5' : 'bg-background'
                            }`}
                          >
                            <div className="space-y-3">
                              {dayPosts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                  <Calendar className="h-8 w-8 text-muted-foreground/40 mb-2" />
                                  <p className="text-sm text-muted-foreground/60">No posts</p>
                                </div>
                              ) : (
                                dayPosts.map((post) => {
                                  const title = String(post.title || "").trim();
                                  const content = String(post.content || post.description || "").trim();
                                  const type = String(post.type || "").toLowerCase();
                                  const displayTitle = title || stripPostMarkup(content) || "Untitled";
                                  const showImageOnly = type === "image" && !title && !content;

                                  return (
                                  <Card
                                    key={post.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => openPost(post)}
                                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPost(post); } }}
                                    className={`hover:shadow-md transition-all cursor-pointer border-l-4 border-l-primary/40 ${compact ? "" : ""}`}
                                  >
                                    <CardContent className={compact ? "p-2.5" : "p-4"}>
                                      <div className={`flex items-start gap-3 ${compact ? "mb-1.5" : "mb-3"}`}>
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <div className="p-1.5 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                                            {getTypeIcon(post.type)}
                                          </div>
                                          {post.scheduledFor && (
                                            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                              <Clock className="h-3 w-3" />
                                              {new Date(post.scheduledFor).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </div>
                                          )}
                                        </div>
                                        <Badge className={`text-xs ${getStatusColor(post.status)} border-0 flex-shrink-0`}>
                                          {post.status === 'PUBLISHED' ? 'Posted' : post.status === 'SCHEDULED' ? 'Scheduled' : 'Draft'}
                                        </Badge>
                                      </div>

                                      {showImageOnly && post.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={post.imageUrl}
                                          alt=""
                                          loading="lazy"
                                          className="w-full aspect-video object-cover rounded-md mb-2 border border-border/40"
                                        />
                                      ) : (
                                        <h4 className={`font-semibold text-foreground line-clamp-2 ${compact ? "text-xs mb-1" : "text-sm mb-2"}`}>
                                          {displayTitle}
                                        </h4>
                                      )}
                                      {!compact && !showImageOnly && content && (
                                        <p
                                          className="text-xs text-muted-foreground mb-3 line-clamp-2 [&_strong]:text-foreground [&_em]:text-foreground"
                                          dangerouslySetInnerHTML={{ __html: formatPostContent(content) }}
                                        />
                                      )}
                                      {post.platforms && post.platforms.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                          {post.platforms.slice(0, 2).map((platform: string) => (
                                            <Badge key={platform} variant="outline" className="text-xs px-2 py-0.5">
                                              {platform}
                                            </Badge>
                                          ))}
                                          {post.platforms.length > 2 && (
                                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                                              +{post.platforms.length - 2}
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Month View */}
                    <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                      {dayNames.map((day) => (
                        <div key={day} className="px-3 py-3 text-center font-semibold text-sm text-foreground border-r border-border last:border-r-0">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 grid-rows-6">
                      {calendarDays.map((date, index) => {
                        const dayPosts = getPostsForDate(date);
                        const isCurrentMonthDay = isCurrentMonth(date);
                        const isTodayDay = isToday(date);

                        return (
                          <div
                            key={index}
                            className={`min-h-32 p-3 border-r border-b border-border last:border-r-0 ${
                              !isCurrentMonthDay ? 'bg-muted/20 text-muted-foreground' : 'bg-background'
                            } ${isTodayDay ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset' : ''}`}
                          >
                            <div className={`text-sm font-semibold mb-2 ${
                              isTodayDay ? 'text-primary' :
                              !isCurrentMonthDay ? 'text-muted-foreground' : 'text-foreground'
                            }`}>
                              {date.getDate()}
                            </div>

                            <div className="space-y-1.5">
                              {dayPosts.length === 0 ? (
                                <div className="text-xs text-muted-foreground/50 text-center py-4">
                                  No posts
                                </div>
                              ) : (
                                <>
                                  {dayPosts.slice(0, 3).map((post) => (
                                    <div
                                      key={post.id}
                                      className={`p-2 rounded-md text-xs cursor-pointer hover:shadow-sm transition-all border ${getStatusColor(post.status)} border-border/50`}
                                      title={`${post.title} - ${post.description}`}
                                    >
                                      <div className="flex items-center gap-1.5 mb-1">
                                        {post.scheduledFor && (
                                          <span className="text-xs font-medium flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(post.scheduledFor).toLocaleTimeString('en-US', {
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </span>
                                        )}
                                        <div className="flex-shrink-0">
                                          {getTypeIcon(post.type)}
                                        </div>
                                      </div>
                                      <div className="font-semibold truncate text-xs">{post.title || 'Untitled'}</div>
                                    </div>
                                  ))}
                                  {dayPosts.length > 3 && (
                                    <div className="text-xs text-muted-foreground text-center py-1 font-medium">
                                      +{dayPosts.length - 3} more
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                </div>
              </>
            )}
          </div>
        </MotionDiv>
      </div>
    </AppShell>
  );
};

export default Timeline;
