"use client";

import { useState } from "react";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { CheckCircle, Video, Image as ImageIcon, FileText, Eye, Heart, Share, ExternalLink, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const mockPostedContent: PostedContent[] = [
  {
    id: '1',
    title: 'Behind the Scenes',
    type: 'image',
    postedAt: '2024-01-10T14:30:00Z',
    platform: ['Instagram', 'Facebook'],
    description: 'Behind the scenes content from our latest shoot',
    metrics: {
      views: 1250,
      likes: 89,
      shares: 23,
      comments: 15
    },
    performance: 'good',
    url: 'https://instagram.com/p/example'
  },
  {
    id: '2',
    title: 'Tutorial Series Part 1',
    type: 'video',
    postedAt: '2024-01-04T16:00:00Z',
    platform: ['YouTube'],
    description: 'First part of our comprehensive tutorial series',
    metrics: {
      views: 3420,
      likes: 156,
      shares: 45,
      comments: 32
    },
    performance: 'excellent',
    url: 'https://youtube.com/watch?v=example'
  },
  {
    id: '3',
    title: 'Team Photo',
    type: 'image',
    postedAt: '2024-01-02T12:00:00Z',
    platform: ['Instagram', 'LinkedIn'],
    description: 'Our amazing team photo from the holiday party',
    metrics: {
      views: 890,
      likes: 67,
      shares: 12,
      comments: 8
    },
    performance: 'average',
    url: 'https://linkedin.com/posts/example'
  },
  {
    id: '4',
    title: 'Year End Reflection',
    type: 'text',
    postedAt: '2023-12-31T18:00:00Z',
    platform: ['LinkedIn', 'X'],
    description: 'Reflecting on our achievements and looking forward to the new year',
    metrics: {
      views: 2100,
      likes: 134,
      shares: 67,
      comments: 28
    },
    performance: 'excellent',
  },
  {
    id: '5',
    title: 'Product Demo',
    type: 'video',
    postedAt: '2023-12-28T10:00:00Z',
    platform: ['YouTube', 'TikTok'],
    description: 'Quick demo of our latest product features',
    metrics: {
      views: 5670,
      likes: 234,
      shares: 89,
      comments: 45
    },
    performance: 'excellent',
    url: 'https://youtube.com/watch?v=example2'
  },
];

const Posted = () => {
  const { user, isLoaded } = useUser();
  const [postedContent] = useState<PostedContent[]>(mockPostedContent);
  const [sortBy, setSortBy] = useState<'recent' | 'performance' | 'engagement'>('recent');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-5 w-5 text-red-500" />;
      case 'image': return <ImageIcon className="h-5 w-5 text-blue-500" />;
      case 'text': return <FileText className="h-5 w-5 text-green-500" />;
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
        const performanceOrder = { excellent: 4, good: 3, average: 2, poor: 1 };
        return performanceOrder[b.performance] - performanceOrder[a.performance];
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

  if (!isLoaded) return null;
  if (!user) return <RedirectToSignIn redirectUrl="/posted" />;

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
                        {post.platform.map((platform) => (
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
        </div>
        </MotionDiv>
      </div>
    </AppShell>
  );
};

export default Posted;
