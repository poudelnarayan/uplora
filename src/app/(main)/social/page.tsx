"use client";
import { useEffect, useState } from "react";
import { CheckCircle, Link2, Plus, Instagram, Youtube, Twitter, Facebook, Linkedin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/components/ui/Notification";
import AppShell from "@/components/layout/AppLayout";

const SocialConnections = () => {
  const notifications = useNotifications();
  const [yt, setYt] = useState<{ loading: boolean; isConnected: boolean; channelTitle?: string | null }>({ loading: true, isConnected: false });
  const [fb, setFb] = useState<{ loading: boolean; isConnected: boolean; instagramConnected: boolean; userName?: string | null; pages: any[]; instagramAccounts: any[] }>({ 
    loading: true, 
    isConnected: false, 
    instagramConnected: false,
    pages: [], 
    instagramAccounts: [] 
  });
  const [tt, setTt] = useState<{ loading: boolean; isConnected: boolean; username?: string | null }>({
    loading: true,
    isConnected: false,
    username: null,
  });
  const [th, setTh] = useState<{ loading: boolean; isConnected: boolean; userId?: string | null }>({
    loading: true,
    isConnected: false,
    userId: null,
  });

  useEffect(() => {
    // Load YouTube status
    (async () => {
      try {
        const res = await fetch('/api/youtube/status', { cache: 'no-store' });
        const data = await res.json();
        setYt({ loading: false, isConnected: !!data?.isConnected, channelTitle: data?.channelTitle || null });
      } catch {
        setYt({ loading: false, isConnected: false });
      }
    })();

    // Load Facebook status
    (async () => {
      try {
        const res = await fetch('/api/facebook/status', { cache: 'no-store' });
        const data = await res.json();
        setFb({ 
          loading: false, 
          isConnected: !!data?.connected, 
          instagramConnected: !!data?.instagramConnected,
          userName: data?.user?.name || null,
          pages: data?.pages || [],
          instagramAccounts: data?.instagramAccounts || []
        });
      } catch {
        setFb({ loading: false, isConnected: false, instagramConnected: false, pages: [], instagramAccounts: [] });
      }
    })();

    // Load TikTok status
    (async () => {
      try {
        const res = await fetch("/api/tiktok/status", { cache: "no-store" });
        const data = await res.json();
        const username = data?.username || data?.displayName || null;
        setTt({ loading: false, isConnected: !!data?.isConnected, username });
      } catch {
        setTt({ loading: false, isConnected: false, username: null });
      }
    })();

    // Load Threads status
    (async () => {
      try {
        const res = await fetch("/api/threads/status", { cache: "no-store" });
        const data = await res.json();
        setTh({ loading: false, isConnected: !!data?.isConnected, userId: data?.threadsUserId || null });
      } catch {
        setTh({ loading: false, isConnected: false, userId: null });
      }
    })();
  }, []);
  const getPlatformIcon = (platformId: string) => {
    const iconMap = {
      instagram: Instagram,
      youtube: Youtube, 
      twitter: Twitter,
      facebook: Facebook,
      linkedin: Linkedin,
      tiktok: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.321 5.562a5.124 5.124 0 01-.443-.258 6.228 6.228 0 01-1.137-.966c-.849-.849-1.342-2.019-1.342-3.196h-3.064v13.814c0 1.384-1.117 2.507-2.5 2.507s-2.5-1.123-2.5-2.507c0-1.384 1.117-2.507 2.5-2.507.284 0 .556.048.81.135V9.321c-.254-.052-.516-.08-.785-.08C7.486 9.241 5 11.727 5 14.861c0 3.134 2.486 5.62 5.86 5.62 3.374 0 5.86-2.486 5.86-5.62V8.797c1.26.9 2.799 1.425 4.46 1.425v-3.064c-1.385 0-2.599-.562-3.459-1.476z"/>
        </svg>
      ),
      pinterest: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2C6.5 2 3 5.73 3 10.1c0 2.62 1.47 4.9 3.86 5.76.36.13.55.01.64-.26.06-.18.22-.77.3-1.06.1-.26.06-.35-.2-.65-.78-.93-1.27-2.13-1.27-3.42 0-3.3 2.5-6.25 6.5-6.25 3.54 0 5.49 2.16 5.49 5.05 0 3.8-1.68 7.01-4.17 7.01-1.38 0-2.4-1.13-2.07-2.52.39-1.66 1.14-3.45 1.14-4.65 0-1.07-.57-1.96-1.76-1.96-1.39 0-2.5 1.44-2.5 3.37 0 1.23.41 2.06.41 2.06s-1.43 6.06-1.68 7.12c-.5 2.13-.07 4.75-.03 5.01.02.16.23.2.32.08.13-.17 1.8-2.2 2.36-4.25.16-.58.94-3.65.94-3.65.47.9 1.83 1.7 3.28 1.7 4.31 0 7.23-3.93 7.23-9.19C21.9 5.72 18.5 2 12.04 2z"/>
        </svg>
      ),
      threads: ({ className }: { className?: string }) => (
        <img src="/icons/threads.svg" alt="Threads" className={className} />
      ),
    };
    
    const IconComponent = iconMap[platformId as keyof typeof iconMap];
    return IconComponent ? <IconComponent className="h-6 w-6" /> : null;
  };
  const platforms = [
    {
      id: "instagram",
      name: "Instagram",
      connected: fb.instagramConnected || (fb.isConnected && fb.instagramAccounts.length > 0),
      username: null,
      bgColor: "bg-gradient-to-br from-purple-500/10 to-pink-500/10"
    },
    {
      id: "youtube",
      name: "YouTube", 
      connected: yt.isConnected,
      username: yt.channelTitle ? `@${yt.channelTitle}` : null,
      bgColor: "bg-gradient-to-br from-red-500/10 to-red-600/10"
    },
    {
      id: "twitter",
      name: "X (Twitter)",
      connected: false,
      username: null,
      bgColor: "bg-gradient-to-br from-gray-800/10 to-black/10"
    },
    {
      id: "facebook",
      name: "Facebook",
      connected: fb.isConnected,
      username: fb.userName || null,
      bgColor: "bg-gradient-to-br from-blue-500/10 to-blue-600/10"
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      connected: false,
      username: null,
      bgColor: "bg-gradient-to-br from-blue-600/10 to-blue-700/10"
    },
    {
      id: "pinterest",
      name: "Pinterest",
      connected: false,
      username: null,
      bgColor: "bg-gradient-to-br from-red-600/10 to-rose-600/10"
    },
    {
      id: "threads",
      name: "Threads",
      connected: th.isConnected,
      username: th.userId ? `ID: ${th.userId}` : null,
      bgColor: "bg-gradient-to-br from-zinc-800/10 to-black/10"
    },
    {
      id: "tiktok",
      name: "TikTok",
      connected: tt.isConnected,
      username: tt.username ? `@${tt.username}` : null,
      bgColor: "bg-gradient-to-br from-gray-900/10 to-black/10"
    }
  ];

  return (
    <AppShell>
    <div className="container mx-auto px-4 py-12 space-y-8">
      
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Social Media Connections</h1>
        <p className="text-muted-foreground">Connect your social media accounts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((platform) => (
          <Card key={platform.id} className="hover:shadow-lg transition-all duration-300">
            <CardContent className={`p-6 ${platform.bgColor}`}>
              {platform.connected ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getPlatformIcon(platform.id)}
                      <div>
                        <h3 className="font-semibold text-foreground">{platform.name}</h3>
                        <p className="text-sm text-muted-foreground">{platform.username}</p>
                      </div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={async () => {
                      try {
                        let resp;
                        if (platform.id === 'youtube') {
                          resp = await fetch('/api/youtube/disconnect', { method: 'POST' });
                          if (!resp.ok) throw new Error('Failed');
                          notifications.addNotification({ type: 'success', title: 'Disconnected', message: 'YouTube account disconnected' });
                          setYt({ loading: false, isConnected: false });
                        } else if (platform.id === 'facebook' || platform.id === 'instagram') {
                          resp = await fetch('/api/facebook/disconnect', { method: 'POST' });
                          if (!resp.ok) throw new Error('Failed');
                          notifications.addNotification({ type: 'success', title: 'Disconnected', message: 'Facebook/Instagram disconnected' });
                          setFb({ loading: false, isConnected: false, instagramConnected: false, pages: [], instagramAccounts: [] });
                        } else if (platform.id === 'tiktok') {
                          resp = await fetch('/api/tiktok/disconnect', { method: 'POST' });
                          if (!resp.ok) throw new Error('Failed');
                          notifications.addNotification({ type: 'success', title: 'Disconnected', message: 'TikTok disconnected' });
                          setTt({ loading: false, isConnected: false, username: null });
                        } else if (platform.id === 'threads') {
                          resp = await fetch('/api/threads/disconnect', { method: 'POST' });
                          if (!resp.ok) throw new Error('Failed');
                          notifications.addNotification({ type: 'success', title: 'Disconnected', message: 'Threads disconnected' });
                          setTh({ loading: false, isConnected: false, userId: null });
                        }
                      } catch (e) {
                        notifications.addNotification({ type: 'error', title: 'Disconnect failed', message: 'Try again' });
                      }
                    }}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <div className="flex flex-col items-center gap-3">
                    {getPlatformIcon(platform.id)}
                    <div>
                      <h3 className="font-semibold text-foreground">{platform.name}</h3>
                      <p className="text-sm text-muted-foreground">Not connected</p>
                    </div>
                  </div>

                  {platform.id === 'youtube' ? (
                    <Button
                      type="button"
                      className="w-full gap-2"
                      onClick={() => { window.location.href = '/api/youtube/start'; }}
                      disabled={yt.loading}
                    >
                      <Link2 className="h-4 w-4" />
                      {yt.loading ? 'Checking…' : 'Connect'}
                    </Button>
                  ) : platform.id === "tiktok" ? (
                    <Button asChild className="w-full gap-2" disabled={tt.loading}>
                      <a href="/api/tiktok/auth/connect">
                        <Link2 className="h-4 w-4" />
                        {tt.loading ? "Checking…" : "Connect TikTok"}
                      </a>
                    </Button>
                  ) : platform.id === "threads" ? (
                    <Button asChild className="w-full gap-2" disabled={th.loading}>
                      <a href="/api/threads/auth/connect">
                        <Link2 className="h-4 w-4" />
                        {th.loading ? "Checking…" : "Connect Threads"}
                      </a>
                    </Button>
                  ) : platform.id === 'facebook' || platform.id === 'instagram' ? (
                    platform.id === "instagram" ? (
                      <Button asChild className="w-full gap-2">
                        <a href="/api/instagram/start">
                          <Link2 className="h-4 w-4" />
                          Connect Instagram
                        </a>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        className="w-full gap-2"
                        onClick={() => {
                          window.location.href = "/api/facebook/start?intent=facebook";
                        }}
                        disabled={fb.loading}
                      >
                        <Link2 className="h-4 w-4" />
                        {fb.loading ? "Checking…" : "Connect"}
                      </Button>
                    )
                  ) : (
                    <Button type="button" className="w-full gap-2" disabled>
                      <Clock className="h-4 w-4" />
                      Coming Soon...
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {/* Request Platform Card */}
        <Card className="hover:shadow-lg transition-all duration-300 border-dashed border-2">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              
              <div>
                <h3 className="font-semibold">Request Platform</h3>
                <p className="text-sm text-muted-foreground">Don't see your platform?</p>
              </div>

              <Button variant="outline" className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Request Platform
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      </div>
      </AppShell>
  );
};

export default SocialConnections;