"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { CheckCircle, Video, Image as ImageIcon, FileText, Eye, Heart, Share, ExternalLink, TrendingUp, Calendar, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTeam } from "@/context/TeamContext";
import { useContentCache } from "@/context/ContentCacheContext";
import { useNotifications } from "@/components/ui/Notification";
import { LoadingSpinner, PageLoader } from "@/components/ui/loading-spinner";
import AppShell from "@/components/layout/AppLayout";
const MotionDiv = motion.div as any;

interface PostedContent {
  id: string;
  title: string;
  type: 'video' | 'image' | 'text';
  postedAt: string;
  platform: string[];
  description: string;
  thumbnail?: string;
  metrics: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
  performance: 'excellent' | 'good' | 'average' | 'poor';
  url?: string;
}


const Posted = () => {
  const { user, isLoaded } = useUser();
  const { selectedTeamId, selectedTeam } = useTeam();
  const { getCachedContent, setCachedContent, isStale } = useContentCache();
  const notifications = useNotifications();
  
  const [postedContent, setPostedContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'performance' | 'engagement'>('recent');

  // Fetch published content
  const fetchContent = useCallback(async () => {
    if (!selectedTeamId) {
      setLoading(false);
      return;
    }
    
    // Check cache first
    const cachedContent = getCachedContent(selectedTeamId, ['video', 'image', 'text', 'reel'], 'PUBLISHED');
    if (cachedContent && !isStale(selectedTeamId, ['video', 'image', 'text', 'reel'], 'PUBLISHED')) {
      setPostedContent(cachedContent);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        teamId: selectedTeamId,
        types: 'video,image,text,reel',
        status: 'PUBLISHED',
        sortBy: 'newest',
        limit: '100'
      });

      const response = await fetch(`/api/content?${params}`);
      const result = await response.json();
      
      if (response.ok) {
        const contentData = result.content || [];
        setPostedContent(contentData);
        
        // Cache the result
        setCachedContent(selectedTeamId, ['video', 'image', 'text', 'reel'], 'PUBLISHED', contentData, result.total || 0);
      } else {
        throw new Error(result.message || 'Failed to fetch content');
      }
    } catch (error) {
      notifications.addNotification({
        type: "error",
        title: "Failed to load posted content",
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

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'average': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const sortedContent = [...postedContent].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      case 'performance':
        const performanceOrder: Record<string, number> = { excellent: 4, good: 3, average: 2, poor: 1 };
        return (performanceOrder[b.performance] || 0) - (performanceOrder[a.performance] || 0);
      case 'engagement':
        const engagementA = a.metrics.likes + a.metrics.shares + a.metrics.comments;
        const engagementB = b.metrics.likes + b.metrics.shares + b.metrics.comments;
        return engagementB - engagementA;
      default:
        return 0;
    }
  });

  const totalMetrics = postedContent.reduce((acc, post) => ({
    views: acc.views + post.metrics.views,
    likes: acc.likes + post.metrics.likes,
    shares: acc.shares + post.metrics.shares,
    comments: acc.comments + post.metrics.comments,
  }), { views: 0, likes: 0, shares: 0, comments: 0 });

  if (!isLoaded) return <PageLoader />;
  if (!user) return <RedirectToSignIn redirectUrl="/posts/posted" />;
  
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
            <h1 className="text-2xl font-semibold text-foreground">Posted</h1>
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-md bg-background text-sm"
              >
                <option value="recent">Most Recent</option>
                <option value="performance">Best Performance</option>
                <option value="engagement">Most Engaged</option>
              </select>
              <Button variant="outline" size="sm" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Analytics
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
              {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{totalMetrics.views.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                <div>
                  <div className="text-2xl font-bold">{totalMetrics.likes.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Share className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{totalMetrics.shares.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Total Shares</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{postedContent.length}</div>
                  <p className="text-sm text-muted-foreground">Total Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posted Content */}
        {postedContent.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No posted content yet</h3>
              <p className="text-muted-foreground mb-4">
                Your published content will appear here with performance metrics
              </p>
              <Button className="gap-2">
                <Calendar className="h-4 w-4" />
                Create First Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedContent.map((post) => (
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
                    <Badge className={`${getPerformanceColor(post.performance)} border`}>
                      {post.performance}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Platforms and Date */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {post.platform.map((platform: string) => (
                          <Badge key={platform} variant="outline" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(post.postedAt)}
                      </span>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">{post.metrics.views.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">{post.metrics.likes}</span>
                        <span className="text-xs text-muted-foreground">likes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Share className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">{post.metrics.shares}</span>
                        <span className="text-xs text-muted-foreground">shares</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">{post.metrics.comments}</span>
                        <span className="text-xs text-muted-foreground">comments</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm text-muted-foreground">
                        Engagement: {((post.metrics.likes + post.metrics.shares + post.metrics.comments) / post.metrics.views * 100).toFixed(1)}%
                      </div>
                      {post.url && (
                        <Button variant="outline" size="sm" className="gap-1">
                          <ExternalLink className="h-3 w-3" />
                          View Post
                        </Button>
                      )}
                    </div>
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
      </AppShell>
  );
};

export default Posted;
