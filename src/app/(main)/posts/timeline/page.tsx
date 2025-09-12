"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Clock, Calendar, Video, Image as ImageIcon, FileText, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTeam } from "@/context/TeamContext";
import { useContentCache } from "@/context/ContentCacheContext";
import { useNotifications } from "@/components/ui/Notification";
import { LoadingSpinner, PageLoader } from "@/components/ui/loading-spinner";
import AppShell from "@/components/layout/AppLayout";

const MotionDiv = motion.div as any;

interface TimelinePost {
  id: string;
  title: string;
  type: 'video' | 'image' | 'text';
  status: 'draft' | 'scheduled' | 'posted';
  date: string; // Date in YYYY-MM-DD format
  time?: string;
  platform: string[];
  description: string;
}


const Timeline = () => {
  const { user, isLoaded } = useUser();
  const { selectedTeamId, selectedTeam } = useTeam();
  const { getCachedContent, setCachedContent, isStale } = useContentCache();
  const notifications = useNotifications();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week');

  // Fetch content for timeline
  const fetchContent = useCallback(async () => {
    if (!selectedTeamId) {
      setLoading(false);
      return;
    }
    
    // Check cache first
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
        
        // Cache the result
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

  // Load content when component mounts
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Calendar navigation functions
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

  // Get calendar days based on view mode
  const getCalendarDays = () => {
    const days = [];
    
    if (viewMode === 'month') {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
      
      for (let i = 0; i < 42; i++) { // 6 weeks × 7 days
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        days.push(date);
      }
    } else {
      // Week view
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Start from Sunday
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        days.push(date);
      }
    }
    
    return days;
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const getPostsForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    return posts.filter(post => {
      // Check if post has scheduledFor date
      if (post.scheduledFor) {
        const scheduledDate = new Date(post.scheduledFor);
        return formatDateKey(scheduledDate) === dateKey;
      }
      // Check if post has createdAt date
      if (post.createdAt) {
        const createdDate = new Date(post.createdAt);
        return formatDateKey(createdDate) === dateKey;
      }
      return false;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-3 w-3" />;
      case 'image': return <ImageIcon className="h-3 w-3" />;
      case 'text': return <FileText className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
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
  
  // Show loading while team context is initializing
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
        <div className="px-6 py-3 border-b border-border bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-foreground">Timeline</h1>
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
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => viewMode === 'month' ? navigateMonth('next') : navigateWeek('next')}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="flex border border-border rounded-md overflow-hidden ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1 text-xs rounded-none ${
                    viewMode === 'week' 
                      ? 'bg-primary text-white' 
                      : 'hover:bg-muted'
                  }`}
                >
                  Week
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 text-xs rounded-none ${
                    viewMode === 'month' 
                      ? 'bg-primary text-white' 
                      : 'hover:bg-muted'
                  }`}
                >
                  Month
                </Button>
              </div>
              <Button 
                size="sm"
                onClick={goToToday}
                className="px-3 py-1 text-xs ml-2"
              >
                Today
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white border border-gray-200 overflow-hidden m-6 rounded-lg">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {viewMode === 'week' ? (
            <>
              {/* Week View - Day Headers */}
              <div className="grid grid-cols-7">
                {calendarDays.map((date, index) => (
                  <div key={index} className="p-4 border-r border-gray-200 last:border-r-0 bg-gray-50">
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      {dayNames[date.getDay()]} {date.getDate()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Week View - Calendar Days Content */}
              <div className="grid grid-cols-7 min-h-[600px]">
                {calendarDays.map((date, index) => {
                  const dayPosts = getPostsForDate(date);
                  const isTodayDay = isToday(date);
                  
                  return (
                    <div
                      key={index}
                      className={`p-4 border-r border-gray-200 last:border-r-0 bg-white ${
                        isTodayDay ? 'bg-blue-50' : ''
                      }`}
                    >
                      {/* Posts for this day */}
                      <div className="space-y-2">
                        {dayPosts.length === 0 ? (
                          <div className="text-sm text-gray-400 text-center py-8">
                            No posts for this day
                          </div>
                        ) : (
                          dayPosts.map((post) => (
                            <div
                              key={post.id}
                              className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer"
                            >
                              <div className="flex items-start gap-2 mb-2">
                                {post.scheduledFor && (
                                  <div className="text-xs text-gray-500 font-medium">
                                    {new Date(post.scheduledFor).toLocaleTimeString('en-US', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  {getTypeIcon(post.type)}
                                  <Badge 
                                    className={`text-xs ${getStatusColor(post.status)} border-0`}
                                  >
                                    {post.status === 'PUBLISHED' ? 'Posted' : post.status === 'SCHEDULED' ? 'Scheduled' : 'Draft'}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                {post.title}
                              </div>
                              <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                                {post.content || post.description}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {post.platforms && post.platforms.map((platform: string) => (
                                  <Badge key={platform} variant="outline" className="text-xs px-1 py-0">
                                    {platform}
                                  </Badge>
                                ))}
                              </div>
                            </div>
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
              {/* Month View - Day Headers */}
              <div className="grid grid-cols-7 border-b border-gray-200">
                {dayNames.map((day) => (
                  <div key={day} className="p-3 text-center font-medium text-gray-600 bg-gray-50 border-r border-gray-200 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>

              {/* Month View - Calendar Grid */}
              <div className="grid grid-cols-7 grid-rows-6">
                {calendarDays.map((date, index) => {
                  const dayPosts = getPostsForDate(date);
                  const isCurrentMonthDay = isCurrentMonth(date);
                  const isTodayDay = isToday(date);
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-32 p-2 border-r border-b border-gray-200 last:border-r-0 ${
                        !isCurrentMonthDay ? 'bg-gray-50 text-gray-400' : 'bg-white'
                      } ${isTodayDay ? 'bg-green-50' : ''}`}
                    >
                      {/* Date Number */}
                      <div className={`text-sm font-medium mb-2 ${
                        isTodayDay ? 'text-green-600 font-bold' : 
                        !isCurrentMonthDay ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {date.getDate()}
                      </div>

                      {/* Posts for this day */}
                      <div className="space-y-1">
                        {dayPosts.length === 0 ? (
                          <div className="text-xs text-gray-400 text-center py-2">
                            No posts
                          </div>
                        ) : (
                          <>
                            {dayPosts.slice(0, 2).map((post) => (
                              <div
                                key={post.id}
                                className={`p-1.5 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(post.status)}`}
                                title={`${post.title} - ${post.description}`}
                              >
                                <div className="flex items-center gap-1 mb-1">
                                  {post.scheduledFor && (
                                    <span className="text-xs font-medium">
                                      {new Date(post.scheduledFor).toLocaleTimeString('en-US', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </span>
                                  )}
                                  {getTypeIcon(post.type)}
                                </div>
                                <div className="font-medium truncate">{post.title}</div>
                                <div className="text-xs opacity-75 truncate">{post.content || post.description}</div>
                              </div>
                            ))}
                            {dayPosts.length > 2 && (
                              <div className="text-xs text-gray-500 text-center py-1">
                                +{dayPosts.length - 2} more
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
            </>
          )}
        </div>
        </MotionDiv>
      </div>
      </AppShell>
  );
};

export default Timeline;
