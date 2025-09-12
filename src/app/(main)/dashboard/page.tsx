"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useNotifications } from "@/components/ui/Notification";
import { useTeam } from "@/context/TeamContext";
import { useContentCache } from "@/context/ContentCacheContext";
import { motion } from "framer-motion";
const MotionDiv = motion.div as any;
import EmailVerificationBanner from "@/components/pages/Dashboard/EmailVerificationBanner";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import { LoadingSpinner, PageLoader } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users, Calendar, FileText, Image as ImageIcon, Video, Play, Edit, Trash2, Clock, Send, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export const dynamic = "force-dynamic";

import AppShell from "@/components/layout/AppLayout";

export default function Dashboard() {
  const { user } = useUser();
  const { selectedTeamId, selectedTeam } = useTeam();
  const { getCachedContent, setCachedContent, isStale } = useContentCache();
  const notifications = useNotifications();
  
  // Content state
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['video', 'image', 'text', 'reel']);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  
  // Email verification state
  const [showEmailBanner, setShowEmailBanner] = useState(true);
  const [resendingEmail, setResendingEmail] = useState(false);

  // Function to resend verification email
  const handleResendVerification = async () => {
    if (!user?.emailAddresses?.[0]) return;
    
    setResendingEmail(true);
    try {
      notifications.addNotification({
        type: "success",
        title: "Verification email sent",
        message: "Please check your inbox and spam folder"
      });
    } catch (error) {
      notifications.addNotification({
        type: "error",
        title: "Failed to send email",
        message: "Please try again later"
      });
    } finally {
      setResendingEmail(false);
    }
  };

  // Fetch all content
  const fetchContent = useCallback(async () => {
    if (!selectedTeamId) {
      setLoading(false);
      return;
    }
    
    // Check cache first
    const cachedContent = getCachedContent(selectedTeamId, selectedTypes, selectedStatus);
    if (cachedContent && !isStale(selectedTeamId, selectedTypes, selectedStatus)) {
      setContent(cachedContent);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        teamId: selectedTeamId,
        types: selectedTypes.join(','),
        status: selectedStatus,
        sortBy: 'newest',
        limit: '100'
      });

      const response = await fetch(`/api/content?${params}`);
      
      const result = await response.json();
      
      if (response.ok) {
        const contentData = result.content || [];
        setContent(contentData);
        setTotalCount(result.total || 0);
        
        // Cache the result
        setCachedContent(selectedTeamId, selectedTypes, selectedStatus, contentData, result.total || 0);
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
  }, [selectedTeamId, selectedTypes, selectedStatus, notifications, getCachedContent, setCachedContent, isStale]);

  // Filter functions
  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const setTypeFilter = (types: string[]) => {
    setSelectedTypes(types);
  };

  const setStatusFilter = (status: string) => {
    setSelectedStatus(status);
  };

  // Content action functions
  const handleEditContent = (item: any) => {
    // Navigate to edit page based on content type
    const editRoutes = {
      text: '/make-post/text',
      image: '/make-post/image', 
      reel: '/make-post/reel',
      video: '/make-post/video'
    };
    
    const route = editRoutes[item.type as keyof typeof editRoutes];
    if (route) {
      window.location.href = `${route}?edit=${item.id}`;
    }
  };

  const handleDeleteContent = async (item: any) => {
    try {
      const response = await fetch(`/api/content/${item.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        notifications.addNotification({
          type: "success",
          title: "Content deleted",
          message: `${item.type} post has been deleted successfully`
        });
        
        // Remove from cache and update UI
        setContent(prev => prev.filter((c: any) => c.id !== item.id));
        setTotalCount(prev => prev - 1);
      } else {
        throw new Error('Failed to delete content');
      }
    } catch (error) {
      notifications.addNotification({
        type: "error",
        title: "Failed to delete content",
        message: "Please try again later"
      });
    }
  };

  const handlePublishContent = async (item: any) => {
    try {
      const response = await fetch(`/api/content/${item.id}/publish`, {
        method: 'POST',
      });

      if (response.ok) {
        notifications.addNotification({
          type: "success",
          title: "Content published",
          message: `${item.type} post has been published successfully`
        });
        
        // Update status in cache and UI
        setContent(prev => prev.map((c: any) => 
          c.id === item.id ? { ...c, status: 'PUBLISHED' } : c
        ));
      } else {
        throw new Error('Failed to publish content');
      }
    } catch (error) {
      notifications.addNotification({
        type: "error",
        title: "Failed to publish content",
        message: "Please try again later"
      });
    }
  };

  const handleScheduleContent = (item: any) => {
    // Navigate to schedule page
    window.location.href = `/schedule/${item.id}`;
  };

  const handleDuplicateContent = async (item: any) => {
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...item,
          title: `${item.title} (Copy)`,
          status: 'DRAFT'
        }),
      });

      if (response.ok) {
        notifications.addNotification({
          type: "success",
          title: "Content duplicated",
          message: `${item.type} post has been duplicated successfully`
        });
        
        // Refresh content
        fetchContent();
      } else {
        throw new Error('Failed to duplicate content');
      }
    } catch (error) {
      notifications.addNotification({
        type: "error",
        title: "Failed to duplicate content",
        message: "Please try again later"
      });
    }
  };

  // Load content when filters change
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  
  // Show loading while team context is initializing
  if (!selectedTeamId && selectedTeam === null) {
    return <PageLoader />;
  }

  return (
    <>
      <AppShell>
      <NextSeoNoSSR title="Dashboard" noindex nofollow />
          
      <div className="min-h-screen bg-gray-50">
        {/* Email Verification Banner */}
        {showEmailBanner && user && !user.emailAddresses?.[0]?.verification?.status && (
          <EmailVerificationBanner
            show={showEmailBanner}
            onResend={handleResendVerification}
            onDismiss={() => setShowEmailBanner(false)}
            isResending={resendingEmail}
          />
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
                <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {selectedTeam?.name ? `${selectedTeam.name} Dashboard` : "Dashboard"}
                  </h1>
                <p className="text-gray-600 mt-1">
                  Manage all your content in one place
                  </p>
                </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setTypeFilter(['text'])}
                  variant={selectedTypes.length === 1 && selectedTypes.includes('text') ? 'default' : 'outline'}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Text Post
                </Button>
                <Button
                  onClick={() => setTypeFilter(['image'])}
                  variant={selectedTypes.length === 1 && selectedTypes.includes('image') ? 'default' : 'outline'}
                  className="gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Image Post
                </Button>
                <Button
                  onClick={() => setTypeFilter(['reel'])}
                  variant={selectedTypes.length === 1 && selectedTypes.includes('reel') ? 'default' : 'outline'}
                  className="gap-2"
                >
                  <Play className="w-4 h-4" />
                  Reel
                </Button>
                <Button
                  onClick={() => setTypeFilter(['video'])}
                  variant={selectedTypes.length === 1 && selectedTypes.includes('video') ? 'default' : 'outline'}
                  className="gap-2"
                >
                  <Video className="w-4 h-4" />
                  Video
                </Button>
                <Button
                  onClick={() => setTypeFilter(['video', 'image', 'text', 'reel'])}
                  variant={selectedTypes.length === 4 ? 'default' : 'outline'}
                  className="gap-2"
                >
                  All Content
                </Button>
              </div>
            </div>
          </div>
          
          {/* Stats Cards */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Content</p>
                    <p className="text-2xl font-bold text-gray-900">{content.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Published</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {content.filter((c: any) => c.status === 'PUBLISHED').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Scheduled</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {content.filter((c: any) => c.status === 'SCHEDULED').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Drafts</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {content.filter((c: any) => c.status === 'DRAFT').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionDiv>

          {/* Status Filters */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setStatusFilter('ALL')}
                variant={selectedStatus === 'ALL' ? 'default' : 'outline'}
                size="sm"
              >
                All Status
              </Button>
              <Button
                onClick={() => setStatusFilter('DRAFT')}
                variant={selectedStatus === 'DRAFT' ? 'default' : 'outline'}
                size="sm"
              >
                Drafts
              </Button>
              <Button
                onClick={() => setStatusFilter('PUBLISHED')}
                variant={selectedStatus === 'PUBLISHED' ? 'default' : 'outline'}
                size="sm"
              >
                Published
              </Button>
              <Button
                onClick={() => setStatusFilter('SCHEDULED')}
                variant={selectedStatus === 'SCHEDULED' ? 'default' : 'outline'}
                size="sm"
              >
                Scheduled
              </Button>
              <Button
                onClick={() => setStatusFilter('PROCESSING')}
                variant={selectedStatus === 'PROCESSING' ? 'default' : 'outline'}
                size="sm"
              >
                Processing
              </Button>
            </div>
          </div>

          {/* Content Display */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Content</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : content.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
                    <p className="text-gray-600 mb-6">Get started by creating your first post, image, reel, or video.</p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={() => window.location.href = '/make-post/text'}
                        variant="outline"
                        className="gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Create Text Post
                      </Button>
                      <Button
                        onClick={() => window.location.href = '/make-post/image'}
                        variant="outline"
                        className="gap-2"
                      >
                        <ImageIcon className="w-4 h-4" />
                        Create Image Post
                      </Button>
                      <Button
                        onClick={() => window.location.href = '/make-post/reel'}
                        variant="outline"
                        className="gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Create Reel
                      </Button>
                      <Button
                        onClick={() => window.location.href = '/make-post/video'}
                        className="gap-2"
                      >
                        <Video className="w-4 h-4" />
                        Create Video
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {content.map((item: any) => (
                      <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                        <CardContent className="p-0">
                          {/* Content Preview */}
                          {item.type === 'image' && item.imageUrl && (
                            <div className="h-48 bg-gray-100 relative overflow-hidden">
                              <img 
                                src={item.imageUrl} 
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          {item.type === 'video' && item.thumbnailUrl && (
                            <div className="h-48 bg-gray-100 relative overflow-hidden">
                              <img 
                                src={item.thumbnailUrl} 
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                                  <Play className="w-6 h-6 text-white ml-1" />
                                </div>
                              </div>
                            </div>
                          )}
                          {item.type === 'reel' && item.thumbnailUrl && (
                            <div className="h-48 bg-gray-100 relative overflow-hidden">
                              <img 
                                src={item.thumbnailUrl} 
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                                  <Play className="w-6 h-6 text-white ml-1" />
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="p-4">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {item.type === 'video' && <Video className="w-4 h-4 text-red-500" />}
                                {item.type === 'image' && <ImageIcon className="w-4 h-4 text-blue-500" />}
                                {item.type === 'text' && <FileText className="w-4 h-4 text-green-500" />}
                                {item.type === 'reel' && <Play className="w-4 h-4 text-purple-500" />}
                                <Badge variant="outline" className="text-xs capitalize">
                                  {item.type}
                                </Badge>
                              </div>
                              <Badge 
                                variant={
                                  item.status === 'PUBLISHED' ? 'default' : 
                                  item.status === 'DRAFT' ? 'secondary' :
                                  item.status === 'SCHEDULED' ? 'outline' :
                                  'destructive'
                                }
                                className="text-xs"
                              >
                                {item.status}
                              </Badge>
                            </div>
                            
                            {/* Title and Content */}
                            <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                              {item.title}
                            </h3>
                            {item.content && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                                {item.content}
                              </p>
                            )}
                            
                            {/* Metadata */}
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                              {item.platforms && item.platforms.length > 0 && (
                                <span>{item.platforms.length} platform{item.platforms.length > 1 ? 's' : ''}</span>
                              )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center justify-between">
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditContent(item)}
                                  className="h-8 px-2"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                
                                {item.status === 'DRAFT' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handlePublishContent(item)}
                                    className="h-8 px-2"
                                  >
                                    <Send className="w-3 h-3" />
                                  </Button>
                                )}
                                
                                {item.status === 'DRAFT' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleScheduleContent(item)}
                                    className="h-8 px-2"
                                  >
                                    <Clock className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditContent(item)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDuplicateContent(item)}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  {item.status === 'DRAFT' && (
                                    <DropdownMenuItem onClick={() => handlePublishContent(item)}>
                                      <Send className="w-4 h-4 mr-2" />
                                      Publish Now
                                    </DropdownMenuItem>
                                  )}
                                  {item.status === 'DRAFT' && (
                                    <DropdownMenuItem onClick={() => handleScheduleContent(item)}>
                                      <Clock className="w-4 h-4 mr-2" />
                                      Schedule
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteContent(item)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </MotionDiv>
        </div>
        </div>
        </AppShell>
    </>
  );
}
