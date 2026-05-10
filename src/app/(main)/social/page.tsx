"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Link2, Plus, Instagram, Youtube, Twitter, Facebook, Linkedin, Clock, MoreHorizontal, RefreshCw, Unplug, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { useNotifications } from "@/app/components/ui/Notification";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import AppShell from "@/app/components/layout/AppLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { useTeam } from "@/context/TeamContext";
import { cn } from "@/lib/utils";

const MotionDiv = motion.div as any;

type CachedUserStatuses = {
  yt: { isConnected: boolean; channelTitle?: string | null };
  fb: { connected: boolean; instagramConnected: boolean; userName?: string | null; pages: any[]; instagramAccounts: any[] };
  tt: { isConnected: boolean; username?: string | null };
  th: { isConnected: boolean; threadsUserId?: string | null };
  pin: { isConnected: boolean; username?: string | null };
  li: { isConnected: boolean; name?: string | null };
  x: { isConnected: boolean; username?: string | null };
  updatedAt: number;
};

type CachedTeamOwnerPlatforms = {
  connectedPlatforms: string[];
  ownerName?: string | null;
  updatedAt: number;
};

const SOCIAL_CACHE_USER_KEY = "uplora:social:status:user:v1";
const SOCIAL_CACHE_TEAM_OWNER_PREFIX = "uplora:social:status:team-owner:v1:";
const SOCIAL_CACHE_MAX_AGE_MS = 60_000; // 60s SWR window

function readJson<T>(key: string): T | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage issues (private mode, quota, etc.)
  }
}

function invalidateKey(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

const SocialConnections = () => {
  const notifications = useNotifications();
  const { selectedTeamId, selectedTeam, teams } = useTeam();

  const isTeamWorkspace = useMemo(() => {
    if (!selectedTeamId) return false;
    return Array.isArray(teams) && teams.some((t) => t.id === selectedTeamId);
  }, [teams, selectedTeamId]);

  const isTeamOwner = isTeamWorkspace && selectedTeam?.role === "OWNER";

  // Load cached values synchronously to avoid "loading flash" on every navigation.
  const cachedUser = readJson<CachedUserStatuses>(SOCIAL_CACHE_USER_KEY);

  const [teamOwnerPlatforms, setTeamOwnerPlatforms] = useState<{
    loading: boolean;
    connectedPlatforms: string[];
    ownerName?: string | null;
  }>({ loading: false, connectedPlatforms: [], ownerName: null });
  const [yt, setYt] = useState<{ loading: boolean; isConnected: boolean; channelTitle?: string | null }>(() => ({
    loading: !cachedUser,
    isConnected: !!cachedUser?.yt?.isConnected,
    channelTitle: cachedUser?.yt?.channelTitle || null,
  }));
  const [fb, setFb] = useState<{ loading: boolean; isConnected: boolean; instagramConnected: boolean; userName?: string | null; pages: any[]; instagramAccounts: any[] }>({ 
    loading: !cachedUser, 
    isConnected: !!cachedUser?.fb?.connected, 
    instagramConnected: !!cachedUser?.fb?.instagramConnected,
    userName: cachedUser?.fb?.userName || null,
    pages: cachedUser?.fb?.pages || [], 
    instagramAccounts: cachedUser?.fb?.instagramAccounts || [] 
  });
  const [tt, setTt] = useState<{ loading: boolean; isConnected: boolean; username?: string | null }>({
    loading: !cachedUser,
    isConnected: !!cachedUser?.tt?.isConnected,
    username: cachedUser?.tt?.username || null,
  });
  const [th, setTh] = useState<{ loading: boolean; isConnected: boolean; userId?: string | null }>({
    loading: !cachedUser,
    isConnected: !!cachedUser?.th?.isConnected,
    userId: cachedUser?.th?.threadsUserId || null,
  });
  const [pin, setPin] = useState<{ loading: boolean; isConnected: boolean; username?: string | null }>({
    loading: !cachedUser,
    isConnected: !!cachedUser?.pin?.isConnected,
    username: cachedUser?.pin?.username || null,
  });
  const [li, setLi] = useState<{ loading: boolean; isConnected: boolean; name?: string | null }>({
    loading: !cachedUser,
    isConnected: !!cachedUser?.li?.isConnected,
    name: cachedUser?.li?.name || null,
  });
  const [x, setX] = useState<{ loading: boolean; isConnected: boolean; username?: string | null }>({
    loading: !cachedUser,
    isConnected: !!cachedUser?.x?.isConnected,
    username: cachedUser?.x?.username || null,
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

      // Cache team-owner platforms per teamId (avoids reloading on every nav)
      const teamKey = `${SOCIAL_CACHE_TEAM_OWNER_PREFIX}${selectedTeamId}`;
      const cachedTeam = readJson<CachedTeamOwnerPlatforms>(teamKey);
      if (cachedTeam) {
        setTeamOwnerPlatforms({
          loading: false,
          connectedPlatforms: cachedTeam.connectedPlatforms,
          ownerName: cachedTeam.ownerName || null,
        });
      }

      // SWR: always revalidate, but avoid flipping to "loading" if we already have cached data.
      const isFresh = cachedTeam && Date.now() - cachedTeam.updatedAt < SOCIAL_CACHE_MAX_AGE_MS;
      if (!isFresh) setTeamOwnerPlatforms((p) => ({ ...p, loading: true }));
      try {
        const res = await fetch(`/api/social-connections/status?teamId=${encodeURIComponent(selectedTeamId)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load team connections");
        writeJson(teamKey, {
          connectedPlatforms: Array.isArray(data?.connectedPlatforms) ? data.connectedPlatforms : [],
          ownerName: data?.ownerName || null,
          updatedAt: Date.now(),
        } satisfies CachedTeamOwnerPlatforms);
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
    let shouldRefetch = false;
    try {
      const sp = new URLSearchParams(window.location.search);
      const error = sp.get("error");
      const warning = sp.get("warning");
      const success = sp.get("success");
      if (success) {
        shouldRefetch = true;
        const msg =
          success === "youtube_connected" ? "YouTube connected." :
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
        shouldRefetch = true;
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
        shouldRefetch = true;
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

    // If we just returned from an OAuth flow, the status has changed => invalidate cache.
    if (shouldRefetch) {
      invalidateKey(SOCIAL_CACHE_USER_KEY);
      if (selectedTeamId) invalidateKey(`${SOCIAL_CACHE_TEAM_OWNER_PREFIX}${selectedTeamId}`);
    }

    const abort = new AbortController();

    const cached = readJson<CachedUserStatuses>(SOCIAL_CACHE_USER_KEY);
    const isFresh = cached && Date.now() - cached.updatedAt < SOCIAL_CACHE_MAX_AGE_MS;

    // Always revalidate once per mount for correctness, but don't flip to loading if we have a fresh cache.
    if (!isFresh) {
      setYt((p) => ({ ...p, loading: true }));
      setFb((p) => ({ ...p, loading: true }));
      setTt((p) => ({ ...p, loading: true }));
      setTh((p) => ({ ...p, loading: true }));
      setPin((p) => ({ ...p, loading: true }));
      setLi((p) => ({ ...p, loading: true }));
      setX((p) => ({ ...p, loading: true }));
    }

    (async () => {
      const fetchJson = async (url: string) => {
        const res = await fetch(url, { signal: abort.signal });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, data };
      };

      const [
        ytRes,
        fbRes,
        ttRes,
        thRes,
        pinRes,
        liRes,
        xRes,
      ] = await Promise.allSettled([
        fetchJson("/api/youtube/status"),
        fetchJson("/api/facebook/status"),
        fetchJson("/api/tiktok/status"),
        fetchJson("/api/threads/status"),
        fetchJson("/api/pinterest/status"),
        fetchJson("/api/linkedin/status"),
        fetchJson("/api/twitter/status"),
      ]);

      // Extract results safely
      const ytData = ytRes.status === "fulfilled" ? ytRes.value : { ok: false, data: {} };
      const fbData = fbRes.status === "fulfilled" ? fbRes.value : { ok: false, data: {} };
      const ttData = ttRes.status === "fulfilled" ? ttRes.value : { ok: false, data: {} };
      const thData = thRes.status === "fulfilled" ? thRes.value : { ok: false, data: {} };
      const pinData = pinRes.status === "fulfilled" ? pinRes.value : { ok: false, data: {} };
      const liData = liRes.status === "fulfilled" ? liRes.value : { ok: false, data: {} };
      const xData = xRes.status === "fulfilled" ? xRes.value : { ok: false, data: {} };

      // Update state (never leave in loading=true)
      setYt({ loading: false, isConnected: !!ytData.data?.isConnected, channelTitle: ytData.data?.channelTitle || null });
      setFb({
        loading: false,
        isConnected: !!fbData.data?.connected,
        instagramConnected: !!fbData.data?.instagramConnected,
        userName: fbData.data?.user?.name || null,
        pages: fbData.data?.pages || [],
        instagramAccounts: fbData.data?.instagramAccounts || [],
      });
      setTt({ loading: false, isConnected: !!ttData.data?.isConnected, username: ttData.data?.username || ttData.data?.displayName || null });
      setTh({ loading: false, isConnected: !!thData.data?.isConnected, userId: thData.data?.threadsUserId || null });
      setPin({ loading: false, isConnected: !!pinData.data?.isConnected, username: pinData.data?.username || null });
      setLi({ loading: false, isConnected: !!liData.data?.isConnected, name: liData.data?.name || null });
      setX({ loading: false, isConnected: !!xData.data?.isConnected, username: xData.data?.username || null });

      // Write cache from the *fresh response*, not from React state.
      writeJson(SOCIAL_CACHE_USER_KEY, {
        yt: { isConnected: !!ytData.data?.isConnected, channelTitle: ytData.data?.channelTitle || null },
        fb: {
          connected: !!fbData.data?.connected,
          instagramConnected: !!fbData.data?.instagramConnected,
          userName: fbData.data?.user?.name || null,
          pages: fbData.data?.pages || [],
          instagramAccounts: fbData.data?.instagramAccounts || [],
        },
        tt: { isConnected: !!ttData.data?.isConnected, username: ttData.data?.username || ttData.data?.displayName || null },
        th: { isConnected: !!thData.data?.isConnected, threadsUserId: thData.data?.threadsUserId || null },
        pin: { isConnected: !!pinData.data?.isConnected, username: pinData.data?.username || null },
        li: { isConnected: !!liData.data?.isConnected, name: liData.data?.name || null },
        x: { isConnected: !!xData.data?.isConnected, username: xData.data?.username || null },
        updatedAt: Date.now(),
      } satisfies CachedUserStatuses);
    })().catch(() => {
      // If the page was loaded from cache and revalidation fails, keep UI as-is.
      setYt((p) => ({ ...p, loading: false }));
      setFb((p) => ({ ...p, loading: false }));
      setTt((p) => ({ ...p, loading: false }));
      setTh((p) => ({ ...p, loading: false }));
      setPin((p) => ({ ...p, loading: false }));
      setLi((p) => ({ ...p, loading: false }));
      setX((p) => ({ ...p, loading: false }));
    });

    return () => abort.abort();
  // Intentionally only on first mount; caching handles subsequent navigations.
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Data-driven platform config — single source of truth for each
  // platform's connect URL, disconnect URL, brand color, and how to
  // reset its local state on disconnect. Lets the UI loop instead of
  // repeating an if/else chain per platform.
  type PlatformDef = {
    id: string;
    connectHref: string;
    disconnectHref: string;
    /** brand-tinted icon background — light tint over the card surface */
    iconBg: string;
    /** brand-tinted icon color */
    iconFg: string;
    loading: boolean;
    onDisconnected: () => void;
  };

  const PLATFORM_DEFS: Record<string, PlatformDef> = {
    instagram: {
      id: "instagram",
      connectHref: "/api/instagram/start",
      // Instagram is wired to the same auth as Facebook server-side
      disconnectHref: "/api/facebook/disconnect",
      iconBg: "bg-pink-500/10",
      iconFg: "text-pink-600 dark:text-pink-400",
      loading: fb.loading,
      onDisconnected: () => setFb({ loading: false, isConnected: false, instagramConnected: false, pages: [], instagramAccounts: [] }),
    },
    youtube: {
      id: "youtube",
      connectHref: "/api/youtube/start",
      disconnectHref: "/api/youtube/disconnect",
      iconBg: "bg-red-500/10",
      iconFg: "text-red-600 dark:text-red-400",
      loading: yt.loading,
      onDisconnected: () => setYt({ loading: false, isConnected: false }),
    },
    twitter: {
      id: "twitter",
      connectHref: "/api/twitter/connect",
      disconnectHref: "/api/twitter/disconnect",
      iconBg: "bg-foreground/5 dark:bg-foreground/10",
      iconFg: "text-foreground",
      loading: x.loading,
      onDisconnected: () => setX({ loading: false, isConnected: false, username: null }),
    },
    facebook: {
      id: "facebook",
      connectHref: "/api/facebook/start?intent=facebook",
      disconnectHref: "/api/facebook/disconnect",
      iconBg: "bg-blue-500/10",
      iconFg: "text-blue-600 dark:text-blue-400",
      loading: fb.loading,
      onDisconnected: () => setFb({ loading: false, isConnected: false, instagramConnected: false, pages: [], instagramAccounts: [] }),
    },
    linkedin: {
      id: "linkedin",
      connectHref: "/api/linkedin/connect",
      disconnectHref: "/api/linkedin/disconnect",
      iconBg: "bg-sky-500/10",
      iconFg: "text-sky-700 dark:text-sky-400",
      loading: li.loading,
      onDisconnected: () => setLi({ loading: false, isConnected: false, name: null }),
    },
    pinterest: {
      id: "pinterest",
      connectHref: "/api/pinterest/auth/connect",
      disconnectHref: "/api/pinterest/disconnect",
      iconBg: "bg-rose-500/10",
      iconFg: "text-rose-600 dark:text-rose-400",
      loading: pin.loading,
      onDisconnected: () => setPin({ loading: false, isConnected: false, username: null }),
    },
    threads: {
      id: "threads",
      connectHref: "/api/threads/auth/connect",
      disconnectHref: "/api/threads/disconnect",
      iconBg: "bg-foreground/5 dark:bg-foreground/10",
      iconFg: "text-foreground",
      loading: th.loading,
      onDisconnected: () => setTh({ loading: false, isConnected: false, userId: null }),
    },
    tiktok: {
      id: "tiktok",
      connectHref: "/api/tiktok/auth/connect",
      disconnectHref: "/api/tiktok/disconnect",
      iconBg: "bg-foreground/5 dark:bg-foreground/10",
      iconFg: "text-foreground",
      loading: tt.loading,
      onDisconnected: () => setTt({ loading: false, isConnected: false, username: null }),
    },
  };

  const handleDisconnect = async (platform: { id: string; name: string }) => {
    const def = PLATFORM_DEFS[platform.id];
    if (!def) return;
    try {
      const resp = await fetch(def.disconnectHref, { method: "POST" });
      if (!resp.ok) throw new Error("Failed");
      def.onDisconnected();
      invalidateKey(SOCIAL_CACHE_USER_KEY);
      notifications.addNotification({ type: "success", title: "Disconnected", message: `${platform.name} disconnected` });
    } catch {
      notifications.addNotification({ type: "error", title: "Disconnect failed", message: "Try again." });
    }
  };

  // Sort: connected first, then unconnected. This keeps the user's wins
  // up top without needing two separate sections.
  const sortedPlatforms = useMemo(
    () => [...platforms].sort((a, b) => Number(b.connected) - Number(a.connected)),
    [platforms],
  );
  const connectedCount = platforms.filter((p) => p.connected).length;
  const totalCount = platforms.length;
  const progressPct = Math.round((connectedCount / totalCount) * 100);

  return (
    <AppShell>
      <div className="relative lg:fixed lg:inset-0 lg:left-64 bg-background lg:overflow-auto">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-full"
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground truncate">Social connections</h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Link the accounts you want to publish to.
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={() => setRequestOpen(true)}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Request a platform</span>
                <span className="sm:hidden">Request</span>
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
            {/* Summary strip — at-a-glance "where am I" without scrolling */}
            <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="text-sm text-muted-foreground">Connected accounts</div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
                      {connectedCount}
                    </span>
                    <span className="text-sm text-muted-foreground">of {totalCount} platforms</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    {connectedCount > 0 ? "Active" : "None yet"}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Workspace-aware hint (team workspaces publish using owner connections) */}
            {isTeamWorkspace && !isTeamOwner && (
              <Card className="border border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="text-sm">
                        <span className="font-semibold text-foreground">Team workspace.</span>{" "}
                        <span className="text-muted-foreground">
                          Posts publish using the team owner&apos;s accounts. The connections below are your personal ones.
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          {teamOwnerPlatforms.loading ? "Checking team connections…" : "Owner connected:"}
                        </span>
                        {!teamOwnerPlatforms.loading && (
                          teamOwnerPlatforms.connectedPlatforms.length > 0 ? (
                            teamOwnerPlatforms.connectedPlatforms.map((p) => (
                              <Badge key={p} variant="secondary" className="text-xs">
                                {p}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs">None</Badge>
                          )
                        )}
                        {teamOwnerPlatforms.ownerName && !teamOwnerPlatforms.loading && (
                          <span className="text-xs text-muted-foreground">· {teamOwnerPlatforms.ownerName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Unified platforms grid — connected first, then unconnected.
                Each card is compact (~140px) so 6+ fit on one screen. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {sortedPlatforms.map((platform) => {
                const def = PLATFORM_DEFS[platform.id];
                const isLoading = def?.loading ?? false;
                return (
                  <Card
                    key={platform.id}
                    className={cn(
                      "transition-all duration-200 hover:shadow-md",
                      platform.connected
                        ? "border-emerald-500/30 bg-card"
                        : "border-border/60 bg-card",
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              "h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
                              def?.iconBg || "bg-muted",
                              def?.iconFg || "text-foreground",
                            )}
                          >
                            {getPlatformIcon(platform.id)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground text-sm truncate">{platform.name}</h3>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {platform.connected
                                ? (platform.username || "Connected")
                                : "Not connected"}
                            </p>
                          </div>
                        </div>

                        {platform.connected ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[180px]">
                              {def && (
                                <DropdownMenuItem asChild>
                                  <a href={def.connectHref} className="cursor-pointer gap-2">
                                    <RefreshCw className="h-4 w-4" />
                                    Reconnect
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                                onSelect={() => handleDisconnect(platform)}
                              >
                                <Unplug className="h-4 w-4" />
                                Disconnect
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Badge variant="outline" className="text-[10px] shrink-0 px-1.5 py-0">
                            New
                          </Badge>
                        )}
                      </div>

                      {/* Primary action */}
                      {platform.connected ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Ready to publish
                        </div>
                      ) : def ? (
                        <Button asChild size="sm" className="w-full gap-1.5 h-9" aria-disabled={isLoading}>
                          <a
                            href={def.connectHref}
                            className={isLoading ? "pointer-events-none opacity-50" : ""}
                          >
                            <Link2 className="h-3.5 w-3.5" />
                            {isLoading ? "Checking…" : `Connect ${platform.name}`}
                          </a>
                        </Button>
                      ) : (
                        <Button type="button" size="sm" className="w-full gap-1.5 h-9" disabled>
                          <Clock className="h-3.5 w-3.5" />
                          Coming soon
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Request platform card — sits in the same grid, dashed border
                  signals it's a different kind of action. */}
              <Card className="border-dashed border-2 border-border/80 hover:border-primary/40 transition-colors">
                <CardContent className="p-4 h-full flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground text-sm">Request a platform</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Don&apos;t see yours? Let us know.</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full h-9 gap-1.5" onClick={() => setRequestOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    Submit request
                  </Button>
                </CardContent>
              </Card>
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