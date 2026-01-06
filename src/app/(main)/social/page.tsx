"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Link2, Plus, Instagram, Youtube, Twitter, Facebook, Linkedin, Clock } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { useNotifications } from "@/app/components/ui/Notification";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import AppShell from "@/app/components/layout/AppLayout";
import { useTeam } from "@/context/TeamContext";

const MotionDiv = motion.div as any;

const SocialConnections = () => {
  const notifications = useNotifications();
  const { selectedTeamId, selectedTeam, teams } = useTeam();

  const isTeamWorkspace = useMemo(() => {
    if (!selectedTeamId) return false;
    return Array.isArray(teams) && teams.some((t) => t.id === selectedTeamId);
  }, [teams, selectedTeamId]);

  const isTeamOwner = isTeamWorkspace && selectedTeam?.role === "OWNER";

  const [teamOwnerPlatforms, setTeamOwnerPlatforms] = useState<{
    loading: boolean;
    connectedPlatforms: string[];
    ownerName?: string | null;
  }>({ loading: false, connectedPlatforms: [], ownerName: null });
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
  const [pin, setPin] = useState<{ loading: boolean; isConnected: boolean; username?: string | null }>({
    loading: true,
    isConnected: false,
    username: null,
  });
  const [li, setLi] = useState<{ loading: boolean; isConnected: boolean; name?: string | null }>({
    loading: true,
    isConnected: false,
    name: null,
  });
  const [x, setX] = useState<{ loading: boolean; isConnected: boolean; username?: string | null }>({
    loading: true,
    isConnected: false,
    username: null,
  });

  const [requestOpen, setRequestOpen] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestForm, setRequestForm] = useState<{ platformName: string; platformUrl: string; details: string }>({
    platformName: "",
    platformUrl: "",
    details: "",
  });

  useEffect(() => {
    (async () => {
      if (!isTeamWorkspace || isTeamOwner || !selectedTeamId) {
        setTeamOwnerPlatforms({ loading: false, connectedPlatforms: [], ownerName: null });
        return;
      }
      setTeamOwnerPlatforms((p) => ({ ...p, loading: true }));
      try {
        const res = await fetch(`/api/social-connections/status?teamId=${encodeURIComponent(selectedTeamId)}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load team connections");
        setTeamOwnerPlatforms({
          loading: false,
          connectedPlatforms: Array.isArray(data?.connectedPlatforms) ? data.connectedPlatforms : [],
          ownerName: data?.ownerName || null,
        });
      } catch {
        setTeamOwnerPlatforms({ loading: false, connectedPlatforms: [], ownerName: null });
      }
    })();
  }, [isTeamWorkspace, isTeamOwner, selectedTeamId]);

  useEffect(() => {
    // Show one-time success/error banners based on query params (useful after OAuth redirects).
    try {
      const sp = new URLSearchParams(window.location.search);
      const error = sp.get("error");
      const warning = sp.get("warning");
      const success = sp.get("success");
      if (success) {
        const msg =
          success === "facebook_connected" ? "Facebook connected." :
          success === "instagram_connected" ? "Instagram connected." :
          success === "tiktok_connected" ? "TikTok connected." :
          success === "threads_connected" ? "Threads connected." :
          success === "pinterest_connected" ? "Pinterest connected." :
          success === "linkedin_connected" ? "LinkedIn connected." :
          success === "x_connected" ? "X connected." :
          "Connected.";
        notifications.addNotification({ type: "success", title: "Success", message: msg });
      }
      if (warning === "facebook_no_pages") {
        notifications.addNotification({
          type: "error",
          title: "Facebook connected, but no Pages found",
          message: "Create a Facebook Page (or get Page access) to enable posting, then reconnect.",
        });
      } else if (warning === "facebook_page_token_missing") {
        notifications.addNotification({
          type: "error",
          title: "Facebook connected, but missing Page token",
          message: "Please reconnect and ensure you grant all requested permissions.",
        });
      }
      if (error) {
        const msg =
          error === "facebook_no_pages" ? "No Facebook Pages found for this account." :
          error === "tiktok_token_failed" ? "TikTok token exchange failed. Check redirect URI + env vars." :
          "Connection failed. Please try again.";
        notifications.addNotification({ type: "error", title: "Connection issue", message: msg });
      }
      // Clean URL to avoid repeated toasts on refresh.
      if (error || warning || success) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    } catch {}

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

    // Load Pinterest status
    (async () => {
      try {
        const res = await fetch("/api/pinterest/status", { cache: "no-store" });
        const data = await res.json();
        setPin({ loading: false, isConnected: !!data?.isConnected, username: data?.username || null });
      } catch {
        setPin({ loading: false, isConnected: false, username: null });
      }
    })();

    // Load LinkedIn status
    (async () => {
      try {
        const res = await fetch("/api/linkedin/status", { cache: "no-store" });
        const data = await res.json();
        setLi({ loading: false, isConnected: !!data?.isConnected, name: data?.name || null });
      } catch {
        setLi({ loading: false, isConnected: false, name: null });
      }
    })();

    // Load X status
    (async () => {
      try {
        const res = await fetch("/api/twitter/status", { cache: "no-store" });
        const data = await res.json();
        setX({ loading: false, isConnected: !!data?.isConnected, username: data?.username || null });
      } catch {
        setX({ loading: false, isConnected: false, username: null });
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
    },
    {
      id: "youtube",
      name: "YouTube", 
      connected: yt.isConnected,
      username: yt.channelTitle ? `@${yt.channelTitle}` : null,
    },
    {
      id: "twitter",
      name: "X (Twitter)",
      connected: x.isConnected,
      username: x.username ? `@${x.username}` : null,
    },
    {
      id: "facebook",
      name: "Facebook",
      connected: fb.isConnected,
      username: fb.userName || null,
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      connected: li.isConnected,
      username: li.name || null,
    },
    {
      id: "pinterest",
      name: "Pinterest",
      connected: pin.isConnected,
      username: pin.username ? `@${pin.username}` : null,
    },
    {
      id: "threads",
      name: "Threads",
      connected: th.isConnected,
      username: th.userId ? `ID: ${th.userId}` : null,
    },
    {
      id: "tiktok",
      name: "TikTok",
      connected: tt.isConnected,
      username: tt.username ? `@${tt.username}` : null,
    }
  ];

  const connectedPlatforms = platforms.filter((p) => p.connected);
  const availablePlatforms = platforms.filter((p) => !p.connected);

  return (
    <AppShell>
      <div className="fixed inset-0 lg:left-64 bg-background overflow-auto">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-full"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Social Media Connections</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Connect accounts to publish content. Tokens are stored securely in your <span className="font-medium text-foreground">socialConnections</span>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="gap-2" onClick={() => setRequestOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Request a platform
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-10">
            {/* Workspace-aware hint (team workspaces publish using owner connections) */}
            {isTeamWorkspace && !isTeamOwner && (
              <Card className="border border-border/60">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-xs shrink-0">Team workspace</Badge>
                      <div className="text-sm font-medium text-foreground truncate">
                        {selectedTeam?.name || "Team"}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Publishing for this workspace uses the <span className="font-medium text-foreground">team owner&apos;s</span> connected accounts.
                      The connections shown below are <span className="font-medium text-foreground">your personal</span> connections.
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-xs text-muted-foreground">
                        {teamOwnerPlatforms.loading ? "Checking team connections…" : "Team owner connected:"}
                      </div>
                      {teamOwnerPlatforms.loading ? null : (
                        teamOwnerPlatforms.connectedPlatforms.length > 0 ? (
                          teamOwnerPlatforms.connectedPlatforms.map((p) => (
                            <Badge key={p} className="bg-primary/10 text-foreground border border-border/60">
                              {p}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">None</Badge>
                        )
                      )}
                      {teamOwnerPlatforms.ownerName && !teamOwnerPlatforms.loading && (
                        <span className="text-xs text-muted-foreground">({teamOwnerPlatforms.ownerName})</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Connected */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Connected</h2>
                  <p className="text-sm text-muted-foreground">These accounts can publish once you take action.</p>
                </div>
                <Badge className="bg-success/10 text-success border border-success/20">
                  {connectedPlatforms.length} connected
                </Badge>
              </div>

              {connectedPlatforms.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    No platforms connected yet. Connect one below to start publishing.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {connectedPlatforms.map((platform) => (
                    <Card key={platform.id} className="hover:shadow-lg transition-all duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                              {getPlatformIcon(platform.id)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground">{platform.name}</h3>
                                <Badge className="bg-success/10 text-success border border-success/20">Connected</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{platform.username || "Connected"}</p>
                            </div>
                          </div>
                          <CheckCircle className="h-5 w-5 text-success" />
                        </div>

                        <div className="mt-6">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={async () => {
                              try {
                                let resp;
                                if (platform.id === "youtube") {
                                  resp = await fetch("/api/youtube/disconnect", { method: "POST" });
                                  if (!resp.ok) throw new Error("Failed");
                                  notifications.addNotification({ type: "success", title: "Disconnected", message: "YouTube account disconnected" });
                                  setYt({ loading: false, isConnected: false });
                                } else if (platform.id === "facebook" || platform.id === "instagram") {
                                  resp = await fetch("/api/facebook/disconnect", { method: "POST" });
                                  if (!resp.ok) throw new Error("Failed");
                                  notifications.addNotification({ type: "success", title: "Disconnected", message: "Facebook/Instagram disconnected" });
                                  setFb({ loading: false, isConnected: false, instagramConnected: false, pages: [], instagramAccounts: [] });
                                } else if (platform.id === "tiktok") {
                                  resp = await fetch("/api/tiktok/disconnect", { method: "POST" });
                                  if (!resp.ok) throw new Error("Failed");
                                  notifications.addNotification({ type: "success", title: "Disconnected", message: "TikTok disconnected" });
                                  setTt({ loading: false, isConnected: false, username: null });
                                } else if (platform.id === "threads") {
                                  resp = await fetch("/api/threads/disconnect", { method: "POST" });
                                  if (!resp.ok) throw new Error("Failed");
                                  notifications.addNotification({ type: "success", title: "Disconnected", message: "Threads disconnected" });
                                  setTh({ loading: false, isConnected: false, userId: null });
                                } else if (platform.id === "pinterest") {
                                  resp = await fetch("/api/pinterest/disconnect", { method: "POST" });
                                  if (!resp.ok) throw new Error("Failed");
                                  notifications.addNotification({ type: "success", title: "Disconnected", message: "Pinterest disconnected" });
                                  setPin({ loading: false, isConnected: false, username: null });
                                } else if (platform.id === "linkedin") {
                                  resp = await fetch("/api/linkedin/disconnect", { method: "POST" });
                                  if (!resp.ok) throw new Error("Failed");
                                  notifications.addNotification({ type: "success", title: "Disconnected", message: "LinkedIn disconnected" });
                                  setLi({ loading: false, isConnected: false, name: null });
                                } else if (platform.id === "twitter") {
                                  resp = await fetch("/api/twitter/disconnect", { method: "POST" });
                                  if (!resp.ok) throw new Error("Failed");
                                  notifications.addNotification({ type: "success", title: "Disconnected", message: "X disconnected" });
                                  setX({ loading: false, isConnected: false, username: null });
                                }
                              } catch {
                                notifications.addNotification({ type: "error", title: "Disconnect failed", message: "Try again." });
                              }
                            }}
                          >
                            Disconnect
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Available */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Available platforms</h2>
                <p className="text-sm text-muted-foreground">Connect more accounts to publish everywhere.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availablePlatforms.map((platform) => (
                  <Card key={platform.id} className="hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                            {getPlatformIcon(platform.id)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground">{platform.name}</h3>
                              <Badge variant="outline" className="text-muted-foreground">Not connected</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">Connect to start publishing</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        {platform.id === "youtube" ? (
                          <Button asChild className="w-full gap-2" aria-disabled={yt.loading}>
                            <a href="/api/youtube/start" className={yt.loading ? "pointer-events-none opacity-50" : ""}>
                              <Link2 className="h-4 w-4" />
                              {yt.loading ? "Checking…" : "Connect YouTube"}
                            </a>
                          </Button>
                        ) : platform.id === "tiktok" ? (
                          <Button asChild className="w-full gap-2" aria-disabled={tt.loading}>
                            <a href="/api/tiktok/auth/connect" className={tt.loading ? "pointer-events-none opacity-50" : ""}>
                              <Link2 className="h-4 w-4" />
                              {tt.loading ? "Checking…" : "Connect TikTok"}
                            </a>
                          </Button>
                        ) : platform.id === "threads" ? (
                          <Button asChild className="w-full gap-2" aria-disabled={th.loading}>
                            <a href="/api/threads/auth/connect" className={th.loading ? "pointer-events-none opacity-50" : ""}>
                              <Link2 className="h-4 w-4" />
                              {th.loading ? "Checking…" : "Connect Threads"}
                            </a>
                          </Button>
                        ) : platform.id === "pinterest" ? (
                          <Button asChild className="w-full gap-2" aria-disabled={pin.loading}>
                            <a href="/api/pinterest/auth/connect" className={pin.loading ? "pointer-events-none opacity-50" : ""}>
                              <Link2 className="h-4 w-4" />
                              {pin.loading ? "Checking…" : "Connect Pinterest"}
                            </a>
                          </Button>
                        ) : platform.id === "linkedin" ? (
                          <Button asChild className="w-full gap-2" aria-disabled={li.loading}>
                            <a href="/api/linkedin/connect" className={li.loading ? "pointer-events-none opacity-50" : ""}>
                              <Link2 className="h-4 w-4" />
                              {li.loading ? "Checking…" : "Connect LinkedIn"}
                            </a>
                          </Button>
                        ) : platform.id === "twitter" ? (
                          <Button asChild className="w-full gap-2" aria-disabled={x.loading}>
                            <a href="/api/twitter/connect" className={x.loading ? "pointer-events-none opacity-50" : ""}>
                              <Link2 className="h-4 w-4" />
                              {x.loading ? "Checking…" : "Connect X"}
                            </a>
                          </Button>
                        ) : platform.id === "instagram" ? (
                          <Button asChild className="w-full gap-2">
                            <a href="/api/instagram/start">
                              <Link2 className="h-4 w-4" />
                              Connect Instagram
                            </a>
                          </Button>
                        ) : platform.id === "facebook" ? (
                          <Button asChild className="w-full gap-2" aria-disabled={fb.loading}>
                            <a href="/api/facebook/start?intent=facebook" className={fb.loading ? "pointer-events-none opacity-50" : ""}>
                              <Link2 className="h-4 w-4" />
                              {fb.loading ? "Checking…" : "Connect Facebook"}
                            </a>
                          </Button>
                        ) : (
                          <Button type="button" className="w-full gap-2" disabled>
                            <Clock className="h-4 w-4" />
                            Coming soon
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Request Platform Card */}
                <Card className="hover:shadow-lg transition-all duration-200 border-dashed border-2">
                  <CardContent className="p-6">
                    <div className="h-full flex flex-col justify-between gap-6">
                      <div className="space-y-2">
                        <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                          <Plus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Request a platform</h3>
                          <p className="text-sm text-muted-foreground">
                            Don’t see your platform? Tell us what you need and we’ll prioritize it.
                          </p>
                        </div>
                      </div>

                      <Button variant="outline" className="w-full gap-2" onClick={() => setRequestOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Request platform
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

      <Dialog open={requestOpen} onOpenChange={(v) => { if (!requestSubmitting) setRequestOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a platform</DialogTitle>
            <DialogDescription>
              Tell us which platform you want next and how you plan to use it. We’ll prioritize based on demand.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platformName">Platform name *</Label>
              <Input
                id="platformName"
                placeholder="e.g. Reddit, Snapchat, Medium"
                value={requestForm.platformName}
                onChange={(e) => setRequestForm((p) => ({ ...p, platformName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="platformUrl">Platform URL (optional)</Label>
              <Input
                id="platformUrl"
                placeholder="https://…"
                value={requestForm.platformUrl}
                onChange={(e) => setRequestForm((p) => ({ ...p, platformUrl: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">What do you want to do? (optional)</Label>
              <Textarea
                id="details"
                placeholder="e.g. Connect account + publish posts + analytics…"
                value={requestForm.details}
                onChange={(e) => setRequestForm((p) => ({ ...p, details: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRequestOpen(false)}
              disabled={requestSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const platformName = requestForm.platformName.trim();
                if (!platformName) {
                  notifications.addNotification({ type: "error", title: "Missing platform name", message: "Please enter a platform name." });
                  return;
                }

                setRequestSubmitting(true);
                try {
                  const res = await fetch("/api/platform-requests", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      platformName,
                      platformUrl: requestForm.platformUrl.trim(),
                      details: requestForm.details.trim(),
                    }),
                  });
                  const js = await res.json().catch(() => ({}));
                  if (!res.ok) throw new Error(js?.message || "Failed to submit request");
                  notifications.addNotification({ type: "success", title: "Request sent", message: "Thanks! We’ll review it soon." });
                  setRequestOpen(false);
                  setRequestForm({ platformName: "", platformUrl: "", details: "" });
                } catch (e) {
                  notifications.addNotification({ type: "error", title: "Request failed", message: e instanceof Error ? e.message : "Try again" });
                } finally {
                  setRequestSubmitting(false);
                }
              }}
              disabled={requestSubmitting}
            >
              {requestSubmitting ? "Sending…" : "Submit request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </MotionDiv>
      </div>
    </AppShell>
  );
};

export default SocialConnections;