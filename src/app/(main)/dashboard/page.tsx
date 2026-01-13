"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useNotifications } from "@/app/components/ui/Notification";
import { useTeam } from "@/context/TeamContext";
import { useContentCache } from "@/context/ContentCacheContext";
import { motion } from "framer-motion";
const MotionDiv = motion.div as any;
import EmailVerificationBanner from "@/app/components/pages/Dashboard/EmailVerificationBanner";
import { NextSeoNoSSR } from "@/app/components/seo/NoSSRSeo";
import { LoadingSpinner, PageLoader } from "@/app/components/ui/loading-spinner";
import { Button } from "@/app/components/ui/button";
import { BarChart3, TrendingUp, Users, Calendar, FileText, Image as ImageIcon, Video, Play, Edit, Trash2, Clock, Send, MoreVertical, CreditCard, Sparkles, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/app/components/ui/dropdown-menu";
import ParticleBackground from "@/app/components/ui/ParticleBackground";

export const dynamic = "force-dynamic";

import AppShell from "@/app/components/layout/AppLayout";

export default function Dashboard() {
  const { user } = useUser();
  const { selectedTeamId, selectedTeam } = useTeam();
  const { getCachedContent, setCachedContent, isStale, invalidateCache } = useContentCache();
  const notifications = useNotifications();
  const router = useRouter();
  
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

  const openPostDetails = (item: any) => {
    if (!item?.id) return;
    if (item.type === "video") router.push(`/videos/${item.id}`);
    else router.push(`/posts/${item.id}`);
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

  const handleScheduleContent = async (item: any) => {
    try {
      const input = window.prompt('Schedule time (YYYY-MM-DD HH:mm, 24h)');
      if (!input) return;
      const parsed = new Date(input.replace(' ', 'T'));
      if (isNaN(parsed.getTime())) {
        notifications.addNotification({ type: 'error', title: 'Invalid time', message: 'Use format YYYY-MM-DD HH:mm' });
        return;
      }
      const scheduledFor = parsed.toISOString();
      const res = await fetch(`/api/content/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledFor, status: 'SCHEDULED' }),
      });
      if (!res.ok) throw new Error('Failed to schedule');
      const updated = await res.json();
      setContent(prev => prev.map((c: any) => c.id === item.id ? { ...c, scheduledFor: updated.scheduledFor, status: 'SCHEDULED' } : c));
      notifications.addNotification({ type: 'success', title: 'Scheduled', message: 'Post scheduled successfully' });
    } catch (e) {
      notifications.addNotification({ type: 'error', title: 'Schedule failed', message: 'Try again' });
    }
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

  // Realtime: listen to post.* events for the current team and refresh
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
          // Invalidate cache and refetch to keep counts/metrics live
          invalidateCache(selectedTeamId);
          fetchContent();
          notifications.addNotification({
            type: "info",
            title: "Live update",
            message: evt.type === "post.status" || evt.type === "video.status" ? "Status updated" : "Content updated",
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

  
  // Show loading while team context is initializing
  if (!selectedTeamId && selectedTeam === null) {
    return <PageLoader />;
  }

  return (
    <>
      <AppShell>
      <NextSeoNoSSR title="Dashboard" noindex nofollow />

      <div className="relative min-h-screen">
        {/* Luxury Particle Background */}
        <ParticleBackground particleCount={40} />

        {/* Main Content Container */}
        <div className="relative z-10">
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
            {/* Luxury Header with Gradient */}
            <MotionDiv
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-primary rounded-2xl shadow-sage">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-display font-bold text-primary">
                      {selectedTeam?.name ? selectedTeam.name : "Personal Workspace"}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                      Manage your premium content in one elegant space
                    </p>
                  </div>
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={() => setTypeFilter(['text'])}
                  variant={selectedTypes.length === 1 && selectedTypes.includes('text') ? 'default' : 'outline'}
                  className="gap-2 hover-sage transition-luxury border-2"
                  size="lg"
                >
                  <FileText className="w-4 h-4" />
                  Text Post
                </Button>
                <Button
                  onClick={() => setTypeFilter(['image'])}
                  variant={selectedTypes.length === 1 && selectedTypes.includes('image') ? 'default' : 'outline'}
                  className="gap-2 hover-sage transition-luxury border-2"
                  size="lg"
                >
                  <ImageIcon className="w-4 h-4" />
                  Image Post
                </Button>
                <Button
                  onClick={() => setTypeFilter(['reel'])}
                  variant={selectedTypes.length === 1 && selectedTypes.includes('reel') ? 'default' : 'outline'}
                  className="gap-2 hover-sage transition-luxury border-2"
                  size="lg"
                >
                  <Play className="w-4 h-4" />
                  Reel
                </Button>
                <Button
                  onClick={() => setTypeFilter(['video'])}
                  variant={selectedTypes.length === 1 && selectedTypes.includes('video') ? 'default' : 'outline'}
                  className="gap-2 hover-sage transition-luxury border-2"
                  size="lg"
                >
                  <Video className="w-4 h-4" />
                  Video
                </Button>
                <Button
                  onClick={() => setTypeFilter(['video', 'image', 'text', 'reel'])}
                  variant={selectedTypes.length === 4 ? 'default' : 'outline'}
                  className="gap-2 hover-sage transition-luxury border-2"
                  size="lg"
                >
                  <Star className="w-4 h-4" />
                  All Content
                </Button>
              </div>
            </MotionDiv>
          
            {/* Luxury Stats Cards with Glassmorphism */}
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
            >
              {/* Total Content Card */}
              <MotionDiv
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="group"
              >
                <Card className="glass-card border-2 border-primary/20 hover:border-primary/40 transition-luxury shadow-medium hover:shadow-gold overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-primary opacity-5 group-hover:opacity-10 transition-luxury" />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">Total Content</p>
                        <p className="text-4xl font-display font-bold text-foreground">{content.length}</p>
                        <p className="text-xs text-muted-foreground mt-2">All your creations</p>
                      </div>
                      <div className="p-4 bg-gradient-primary rounded-2xl shadow-gold group-hover:animate-pulse-gold">
                        <BarChart3 className="w-8 h-8 text-secondary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </MotionDiv>

              {/* Published Card */}
              <MotionDiv
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="group"
              >
                <Card className="glass-card border-2 border-accent/20 hover:border-accent/40 transition-luxury shadow-medium hover:shadow-emerald overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-accent opacity-5 group-hover:opacity-10 transition-luxury" />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">Published</p>
                        <p className="text-4xl font-display font-bold text-foreground">
                          {content.filter((c: any) => c.status === 'PUBLISHED').length}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">Live content</p>
                      </div>
                      <div className="p-4 bg-gradient-accent rounded-2xl shadow-emerald group-hover:animate-pulse-gold">
                        <TrendingUp className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </MotionDiv>

              {/* Scheduled Card */}
              <MotionDiv
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="group"
              >
                <Card className="glass-card border-2 border-warning/20 hover:border-warning/40 transition-luxury shadow-medium hover:shadow-strong overflow-hidden relative">
                  <div className="absolute inset-0 bg-warning/5 group-hover:opacity-10 transition-luxury" />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">Scheduled</p>
                        <p className="text-4xl font-display font-bold text-foreground">
                          {content.filter((c: any) => c.status === 'SCHEDULED').length}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
                      </div>
                      <div className="p-4 bg-warning/20 border-2 border-warning/30 rounded-2xl group-hover:animate-pulse-gold">
                        <Calendar className="w-8 h-8 text-warning" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </MotionDiv>

              {/* Drafts Card */}
              <MotionDiv
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="group"
              >
                <Card className="glass-card border-2 border-muted/40 hover:border-muted/60 transition-luxury shadow-medium hover:shadow-strong overflow-hidden relative">
                  <div className="absolute inset-0 bg-muted/5 group-hover:opacity-10 transition-luxury" />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">Drafts</p>
                        <p className="text-4xl font-display font-bold text-foreground">
                          {content.filter((c: any) => c.status === 'DRAFT').length}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">In progress</p>
                      </div>
                      <div className="p-4 bg-muted/20 border-2 border-muted/30 rounded-2xl group-hover:animate-pulse-gold">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </MotionDiv>
            </MotionDiv>

            {/* Luxury Status Filters */}
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-primary rounded-full" />
                Filter by Status
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => setStatusFilter('ALL')}
                  variant={selectedStatus === 'ALL' ? 'default' : 'outline'}
                  size="default"
                  className="hover-gold transition-luxury border-2"
                >
                  All Status
                </Button>
                <Button
                  onClick={() => setStatusFilter('DRAFT')}
                  variant={selectedStatus === 'DRAFT' ? 'default' : 'outline'}
                  size="default"
                  className="hover-gold transition-luxury border-2"
                >
                  Drafts
                </Button>
                <Button
                  onClick={() => setStatusFilter('PUBLISHED')}
                  variant={selectedStatus === 'PUBLISHED' ? 'default' : 'outline'}
                  size="default"
                  className="hover-gold transition-luxury border-2"
                >
                  Published
                </Button>
                <Button
                  onClick={() => setStatusFilter('SCHEDULED')}
                  variant={selectedStatus === 'SCHEDULED' ? 'default' : 'outline'}
                  size="default"
                  className="hover-gold transition-luxury border-2"
                >
                  Scheduled
                </Button>
                <Button
                  onClick={() => setStatusFilter('PROCESSING')}
                  variant={selectedStatus === 'PROCESSING' ? 'default' : 'outline'}
                  size="default"
                  className="hover-gold transition-luxury border-2"
                >
                  Processing
                </Button>
              </div>
            </MotionDiv>

            {/* Luxury Content Display */}
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="glass-card border-2 border-primary/10 shadow-strong">
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="text-2xl font-display flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-gradient-primary rounded-full" />
                    Your Premium Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : content.length === 0 ? (
                  <MotionDiv
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-16"
                  >
                    <div className="w-24 h-24 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-gold animate-float">
                      <Sparkles className="w-12 h-12 text-secondary" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-foreground mb-3">No content yet</h3>
                    <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
                      Begin your creative journey by crafting your first masterpiece
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                      <Button
                        onClick={() => window.location.href = '/make-post/text'}
                        variant="outline"
                        className="gap-2 hover-gold transition-luxury border-2"
                        size="lg"
                      >
                        <FileText className="w-5 h-5" />
                        Create Text Post
                      </Button>
                      <Button
                        onClick={() => window.location.href = '/make-post/image'}
                        variant="outline"
                        className="gap-2 hover-gold transition-luxury border-2"
                        size="lg"
                      >
                        <ImageIcon className="w-5 h-5" />
                        Create Image Post
                      </Button>
                      <Button
                        onClick={() => window.location.href = '/make-post/reel'}
                        variant="outline"
                        className="gap-2 hover-gold transition-luxury border-2"
                        size="lg"
                      >
                        <Play className="w-5 h-5" />
                        Create Reel
                      </Button>
                      <Button
                        onClick={() => window.location.href = '/subscription'}
                        className="gap-2 gradient-primary hover-lift transition-luxury shadow-gold"
                        size="lg"
                      >
                        <Sparkles className="w-5 h-5" />
                        Upgrade Plan
                      </Button>
                    </div>
                  </MotionDiv>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {content.map((item: any, index: number) => (
                      <MotionDiv
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        whileHover={{ y: -8 }}
                        className="group"
                      >
                        <Card
                          role="button"
                          tabIndex={0}
                          onClick={() => openPostDetails(item)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openPostDetails(item);
                            }
                          }}
                          className="overflow-hidden glass-card border-2 border-primary/10 hover:border-primary/30 transition-luxury shadow-medium hover:shadow-gold relative cursor-pointer"
                        >
                          <CardContent className="p-0">
                            {/* Content Preview with Overlay */}
                            {item.type === 'image' && item.imageUrl && (
                              <div className="h-48 bg-gradient-to-br from-muted/30 to-muted/10 relative overflow-hidden">
                                <img
                                  src={item.imageUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-luxury"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-luxury" />
                              </div>
                            )}
                            {item.type === 'video' && item.thumbnailUrl && (
                              <div className="h-48 bg-gradient-to-br from-muted/30 to-muted/10 relative overflow-hidden">
                                <img
                                  src={item.thumbnailUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-luxury"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-luxury" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-gold group-hover:scale-110 transition-luxury">
                                    <Play className="w-8 h-8 text-secondary ml-1" />
                                  </div>
                                </div>
                              </div>
                            )}
                            {item.type === 'reel' && item.thumbnailUrl && (
                              <div className="h-48 bg-gradient-to-br from-muted/30 to-muted/10 relative overflow-hidden">
                                <img
                                  src={item.thumbnailUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-luxury"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-luxury" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center shadow-emerald group-hover:scale-110 transition-luxury">
                                    <Play className="w-8 h-8 text-white ml-1" />
                                  </div>
                                </div>
                              </div>
                            )}
                            {item.type === 'text' && (
                              <div className="h-48 bg-gradient-to-br from-primary/10 via-accent/5 to-muted/10 relative overflow-hidden flex items-center justify-center">
                                <FileText className="w-16 h-16 text-primary opacity-20 group-hover:opacity-40 transition-luxury group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-luxury" />
                              </div>
                            )}
                          
                          <div className="p-5 bg-gradient-subtle/50">
                            {/* Luxury Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {item.type === 'video' && (
                                  <div className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <Video className="w-4 h-4 text-red-600" />
                                  </div>
                                )}
                                {item.type === 'image' && (
                                  <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <ImageIcon className="w-4 h-4 text-blue-600" />
                                  </div>
                                )}
                                {item.type === 'text' && (
                                  <div className="p-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                                    <FileText className="w-4 h-4 text-green-600" />
                                  </div>
                                )}
                                {item.type === 'reel' && (
                                  <div className="p-1.5 bg-accent/10 border border-accent/20 rounded-lg">
                                    <Play className="w-4 h-4 text-accent" />
                                  </div>
                                )}
                                <Badge variant="outline" className="text-xs capitalize border-2 font-medium">
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
                                className="text-xs font-semibold px-3 py-1"
                              >
                                {item.status}
                              </Badge>
                            </div>

                            {/* Title and Content */}
                            <h3 className="font-semibold text-foreground mb-2 line-clamp-2 text-base">
                              {item.title}
                            </h3>
                            {item.content && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {item.content}
                              </p>
                            )}

                            {/* Luxury Metadata */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 pt-2 border-t border-border/50">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                              </div>
                              {item.platforms && item.platforms.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-gold" />
                                  <span className="font-medium">{item.platforms.length} platform{item.platforms.length > 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Luxury Action Buttons */}
                            <div className="flex items-center justify-between">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => { e.stopPropagation(); handleEditContent(item); }}
                                  className="h-9 px-3 hover-gold transition-luxury border-2 gap-1.5"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span className="text-xs font-medium">Edit</span>
                                </Button>

                                {item.status === 'DRAFT' && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={(e) => { e.stopPropagation(); handlePublishContent(item); }}
                                    className="h-9 px-3 gradient-accent transition-luxury gap-1.5"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    <span className="text-xs font-medium">Publish</span>
                                  </Button>
                                )}

                                {item.status === 'DRAFT' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => { e.stopPropagation(); handleScheduleContent(item); }}
                                    className="h-9 px-3 hover-gold transition-luxury border-2 gap-1.5"
                                  >
                                    <Calendar className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0 hover-gold transition-luxury" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="glass-card border-2 shadow-strong" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenuItem onClick={() => handleEditContent(item)} className="cursor-pointer">
                                    <Edit className="w-4 h-4 mr-2 text-primary" />
                                    <span className="font-medium">Edit</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDuplicateContent(item)} className="cursor-pointer">
                                    <FileText className="w-4 h-4 mr-2 text-accent" />
                                    <span className="font-medium">Duplicate</span>
                                  </DropdownMenuItem>
                                  {item.status === 'DRAFT' && (
                                    <DropdownMenuItem onClick={() => handlePublishContent(item)} className="cursor-pointer">
                                      <Send className="w-4 h-4 mr-2 text-success" />
                                      <span className="font-medium">Publish Now</span>
                                    </DropdownMenuItem>
                                  )}
                                  {item.status === 'DRAFT' && (
                                    <DropdownMenuItem onClick={() => handleScheduleContent(item)} className="cursor-pointer">
                                      <Calendar className="w-4 h-4 mr-2 text-warning" />
                                      <span className="font-medium">Schedule</span>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator className="bg-border/50" />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteContent(item)}
                                    className="text-destructive focus:text-destructive cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    <span className="font-medium">Delete</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                        </Card>
                      </MotionDiv>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </MotionDiv>
          </div>
        </div>
        </div>
        </AppShell>
    </>
  );
}
