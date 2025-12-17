"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, Video, Image as ImageIcon, Filter, Search, Grid, List, Eye, Edit, Trash2, Calendar, Clock, Sparkles, Plus, MoreVertical, Send } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { useTeam } from "@/context/TeamContext";
import { useContentCache } from "@/context/ContentCacheContext";
import { useNotifications } from "@/app/components/ui/Notification";
import { LoadingSpinner, PageLoader } from "@/app/components/ui/loading-spinner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/app/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import AppShell from "@/app/components/layout/AppLayout";
import Link from "next/link";

const MotionDiv = motion.div as any;

const AllPosts = () => {
  const { selectedTeamId, selectedTeam } = useTeam();
  const { getCachedContent, setCachedContent, isStale } = useContentCache();
  const notifications = useNotifications();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

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

  const handleSchedulePost = async () => {
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

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/content/${postId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        notifications.addNotification({
          type: "success",
          title: "Post deleted",
          message: "Post has been removed"
        });
        fetchContent();
      } else {
        throw new Error('Failed to delete post');
      }
    } catch (error) {
      notifications.addNotification({
        type: "error",
        title: "Delete failed",
        message: "Please try again"
      });
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = (post.title && post.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === "all" || post.type === filterType;
    const matchesStatus = filterStatus === "all" || post.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
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
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold text-foreground">All Posts</h1>
              <div className="flex items-center gap-3">
                <div className="flex border border-border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="px-3"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="px-3"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                <Link href="/make-post">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Post
                  </Button>
                </Link>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  All Types
                </Button>
                <Button
                  variant={filterType === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('text')}
                >
                  Text
                </Button>
                <Button
                  variant={filterType === 'image' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('image')}
                >
                  Image
                </Button>
                <Button
                  variant={filterType === 'reel' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('reel')}
                >
                  Reel
                </Button>
                <Button
                  variant={filterType === 'video' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('video')}
                >
                  Video
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === 'DRAFT' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('DRAFT')}
                >
                  Drafts
                </Button>
                <Button
                  variant={filterStatus === 'SCHEDULED' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('SCHEDULED')}
                >
                  Scheduled
                </Button>
                <Button
                  variant={filterStatus === 'PUBLISHED' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('PUBLISHED')}
                >
                  Published
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-24">
                <LoadingSpinner size="lg" />
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
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                    {filteredPosts.map((post) => (
                      <Card key={post.id} className="hover:shadow-lg transition-all duration-300 group">
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
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  {post.status === 'DRAFT' && (
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
                                    onClick={() => handleDeletePost(post.id)}
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
                    ))}
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
    </AppShell>
  );
};

export default AllPosts;
