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
import { useNotifications } from "@/app/components/ui/Notification";
import { LoadingSpinner, PageLoader } from "@/app/components/ui/loading-spinner";
import AppShell from "@/app/components/layout/AppLayout";
import Link from "next/link";

const MotionDiv = motion.div as any;

const Timeline = () => {
  const { user, isLoaded } = useUser();
  const { selectedTeamId, selectedTeam } = useTeam();
  const { getCachedContent, setCachedContent, isStale, invalidateCache } = useContentCache();
  const notifications = useNotifications();

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

  if (!isLoaded) return <PageLoader />;
  if (!user) return <RedirectToSignIn redirectUrl="/posts/timeline" />;

  if (!selectedTeamId || !selectedTeam) {
    return <PageLoader />;
  }

  return (
    <AppShell>
      <div className="fixed inset-0 lg:left-64 bg-background overflow-auto">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-full"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-semibold text-foreground">Timeline</h1>
                <span className="text-sm text-muted-foreground">
                  {viewMode === 'month'
                    ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                    : `${calendarDays[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${calendarDays[6]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${currentDate.getFullYear()}`
                  }
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => viewMode === 'month' ? navigateMonth('prev') : navigateWeek('prev')}
                  className="h-9 w-9 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => viewMode === 'month' ? navigateMonth('next') : navigateWeek('next')}
                  className="h-9 w-9 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="flex border border-border rounded-lg overflow-hidden ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1.5 text-sm rounded-none border-r ${
                      viewMode === 'week'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    Week
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1.5 text-sm rounded-none ${
                      viewMode === 'month'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    Month
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={goToToday}
                  className="ml-2"
                >
                  Today
                </Button>
                <Link href="/make-post">
                  <Button size="sm" className="ml-2 gap-2">
                    <Plus className="h-4 w-4" />
                    New Post
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-24">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                {viewMode === 'week' ? (
                  <>
                    {/* Week View */}
                    <div className="grid grid-cols-7 border-b border-border">
                      {calendarDays.map((date, index) => {
                        const isTodayDay = isToday(date);
                        return (
                          <div key={index} className="px-4 py-3 border-r border-border last:border-r-0 bg-muted/30">
                            <div className={`text-sm font-semibold ${isTodayDay ? 'text-primary' : 'text-foreground'}`}>
                              {dayNames[date.getDay()]}
                            </div>
                            <div className={`text-2xl font-bold mt-1 ${isTodayDay ? 'text-primary' : 'text-muted-foreground'}`}>
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
                                dayPosts.map((post) => (
                                  <Card key={post.id} className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-primary/40">
                                    <CardContent className="p-4">
                                      <div className="flex items-start gap-3 mb-3">
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
                                      <h4 className="text-sm font-semibold text-foreground mb-2 line-clamp-2">
                                        {post.title || 'Untitled Post'}
                                      </h4>
                                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                                        {post.content || post.description || 'No description'}
                                      </p>
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
                                ))
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
            )}
          </div>
        </MotionDiv>
      </div>
    </AppShell>
  );
};

export default Timeline;
