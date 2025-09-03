"use client";

import { useState } from "react";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { FileText, Video, Image as ImageIcon, Filter, Search, Grid, List, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AppShell from "@/components/layout/AppLayout";

const MotionDiv = motion.div as any;

interface Post {
  id: string;
  title: string;
  type: 'video' | 'image' | 'text';
  status: 'draft' | 'scheduled' | 'posted';
  createdAt: string;
  scheduledFor?: string;
  postedAt?: string;
  platform: string[];
  thumbnail?: string;
  description: string;
  views?: number;
  likes?: number;
}

const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Product Launch Video',
    type: 'video',
    status: 'scheduled',
    createdAt: '2024-01-12T10:00:00Z',
    scheduledFor: '2024-01-15T10:00:00Z',
    platform: ['YouTube', 'TikTok'],
    description: 'Exciting product launch announcement video',
    views: 0,
    likes: 0,
  },
  {
    id: '2',
    title: 'Behind the Scenes',
    type: 'image',
    status: 'posted',
    createdAt: '2024-01-08T14:30:00Z',
    postedAt: '2024-01-10T14:30:00Z',
    platform: ['Instagram', 'Facebook'],
    description: 'Behind the scenes content from our latest shoot',
    views: 1250,
    likes: 89,
  },
  {
    id: '3',
    title: 'Weekly Update',
    type: 'text',
    status: 'draft',
    createdAt: '2024-01-05T09:00:00Z',
    platform: ['LinkedIn', 'X'],
    description: 'Weekly company update and news',
    views: 0,
    likes: 0,
  },
  {
    id: '4',
    title: 'Tutorial Series Part 1',
    type: 'video',
    status: 'posted',
    createdAt: '2024-01-03T16:00:00Z',
    postedAt: '2024-01-04T16:00:00Z',
    platform: ['YouTube'],
    description: 'First part of our comprehensive tutorial series',
    views: 3420,
    likes: 156,
  },
  {
    id: '5',
    title: 'Team Photo',
    type: 'image',
    status: 'posted',
    createdAt: '2024-01-01T12:00:00Z',
    postedAt: '2024-01-02T12:00:00Z',
    platform: ['Instagram', 'LinkedIn'],
    description: 'Our amazing team photo from the holiday party',
    views: 890,
    likes: 67,
  },
];

const AllPosts = () => {
  const { user, isLoaded } = useUser();
  const [posts] = useState<Post[]>(mockPosts);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || post.type === filterType;
    const matchesStatus = filterStatus === "all" || post.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'posted': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-5 w-5" />;
      case 'image': return <ImageIcon className="h-5 w-5" />;
      case 'text': return <FileText className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!isLoaded) return null;
  if (!user) return <RedirectToSignIn redirectUrl="/all" />;

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
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">

        {/* Posts Grid/List */}
        {filteredPosts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No posts found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search terms" : "Start creating your first post"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(post.type)}
                      <h3 className="font-semibold truncate">{post.title}</h3>
                    </div>
                    <Badge className={getStatusColor(post.status)}>
                      {post.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{post.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.platform.map((platform) => (
                      <Badge key={platform} variant="outline" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Created {formatDate(post.createdAt)}</span>
                    {post.status === 'posted' && (
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.views?.toLocaleString()}
                        </span>
                        <span>❤️ {post.likes}</span>
                      </div>
                    )}
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

export default AllPosts;
