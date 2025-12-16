"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Calendar, Clock, Video, Image as ImageIcon, FileText, Edit, Trash2, Play } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { useTeam } from "@/context/TeamContext";
import { useContentCache } from "@/context/ContentCacheContext";
import { useNotifications } from "@/app/components/ui/Notification";
import { LoadingSpinner, PageLoader } from "@/app/components/ui/loading-spinner";
import AppShell from "@/app/components/layout/AppLayout";
const MotionDiv = motion.div as any;

interface ScheduledPost {
  id: string;
  title: string;
  type: 'video' | 'image' | 'text';
  scheduledFor: string;
  platform: string[];
  description: string;
  thumbnail?: string;
  timeUntilPost: string;
}



const Scheduled = () => {
  const { user, isLoaded } = useUser();
  const { selectedTeamId, selectedTeam } = useTeam();
  const { getCachedContent, setCachedContent, isStale } = useContentCache();
  const notifications = useNotifications();
  
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch scheduled content
  const fetchContent = useCallback(async () => {
    if (!selectedTeamId) {
      setLoading(false);
      return;
    }
    
    // Check cache first
    const cachedContent = getCachedContent(selectedTeamId, ['video', 'image', 'text', 'reel'], 'SCHEDULED');
    if (cachedContent && !isStale(selectedTeamId, ['video', 'image', 'text', 'reel'], 'SCHEDULED')) {
      setScheduledPosts(cachedContent);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        teamId: selectedTeamId,
        types: 'video,image,text,reel',
        status: 'SCHEDULED',
        sortBy: 'newest',
        limit: '100'
      });

      const response = await fetch(`/api/content?${params}`);
      const result = await response.json();
      
      if (response.ok) {
        const contentData = result.content || [];
        setScheduledPosts(contentData);
        
        // Cache the result
        setCachedContent(selectedTeamId, ['video', 'image', 'text', 'reel'], 'SCHEDULED', contentData, result.total || 0);
      } else {
        throw new Error(result.message || 'Failed to fetch content');
      }
    } catch (error) {
      notifications.addNotification({
        type: "error",
        title: "Failed to load scheduled content",
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-5 w-5 text-red-500" />;
      case 'image': return <ImageIcon className="h-5 w-5 text-blue-500" />;
      case 'text': return <FileText className="h-5 w-5 text-green-500" />;
      case 'reel': return <Play className="h-5 w-5 text-purple-500" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const formatScheduledTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getUrgencyColor = (timeUntil: string) => {
    const days = parseInt(timeUntil);
    if (days <= 1) return 'bg-red-100 text-red-800 border-red-200';
    if (days <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const handleEdit = (postId: string) => {
    console.log('Edit post:', postId);
  };

  const handleDelete = (postId: string) => {
    setScheduledPosts(posts => posts.filter(p => p.id !== postId));
  };

  const handlePostNow = (postId: string) => {
    console.log('Post now:', postId);
  };

  if (!isLoaded) return <PageLoader />;
  if (!user) return <RedirectToSignIn redirectUrl="/posts/scheduled" />;
  
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
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-foreground">Scheduled</h1>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <Clock className="h-4 w-4" />
                Schedule New
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{scheduledPosts.length}</div>
              <p className="text-sm text-muted-foreground">Total Scheduled</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {scheduledPosts.filter(p => parseInt(p.timeUntilPost) <= 1).length}
              </div>
              <p className="text-sm text-muted-foreground">Due Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {scheduledPosts.filter(p => parseInt(p.timeUntilPost) <= 7).length}
              </div>
              <p className="text-sm text-muted-foreground">This Week</p>
            </CardContent>
          </Card>
        </div>

        {/* Scheduled Posts */}
        {scheduledPosts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No scheduled posts</h3>
              <p className="text-muted-foreground mb-4">
                Schedule your first post to get started with automated publishing
              </p>
              <Button className="gap-2">
                <Clock className="h-4 w-4" />
                Schedule Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {scheduledPosts
              .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
              .map((post) => {
                const { date, time } = formatScheduledTime(post.scheduledFor);
                return (
                  <Card key={post.id} className="hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(post.type)}
                          <div>
                            <h3 className="text-lg font-semibold">{post.title}</h3>
                            <p className="text-muted-foreground text-sm">{post.description}</p>
                          </div>
                        </div>
                        <Badge className={`${getUrgencyColor(post.timeUntilPost)} border`}>
                          in {post.timeUntilPost}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{time}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {post.platform.map((platform: string) => (
                              <Badge key={platform} variant="outline" className="text-xs">
                                {platform}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(post.id)}
                            className="gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePostNow(post.id)}
                            className="gap-1 text-green-600 hover:text-green-700"
                          >
                            <Play className="h-3 w-3" />
                            Post Now
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(post.id)}
                            className="gap-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
            </>
          )}
        </div>
        </MotionDiv>
      </div>
      </AppShell>
  );
};

export default Scheduled;
