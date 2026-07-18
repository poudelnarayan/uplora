"use client";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Link2, Youtube, RefreshCw, Unplug, ShieldAlert, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { useNotifications } from "@/app/components/ui/Notification";
import AppShell from "@/app/components/layout/AppLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { useTeam } from "@/context/TeamContext";
import { getPlatform } from "@/config/platforms";

type CachedYouTubeStatus = {
  isConnected: boolean;
  channelTitle?: string | null;
  updatedAt: number;
};

const YT_CACHE_KEY = "uplora:social:status:youtube:v2";
const TEAM_OWNER_CACHE_PREFIX = "uplora:social:status:team-owner:v2:";
const CACHE_MAX_AGE_MS = 60_000; // 60s SWR window

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

const youtube = getPlatform("youtube");

const SocialConnections = () => {
  const notifications = useNotifications();
  const { selectedTeamId, selectedTeam, teams } = useTeam();

  const isTeamWorkspace = useMemo(() => {
    if (!selectedTeamId) return false;
    return Array.isArray(teams) && teams.some((t) => t.id === selectedTeamId);
  }, [teams, selectedTeamId]);

  const isTeamOwner = isTeamWorkspace && selectedTeam?.role === "OWNER";

  // Load cached values synchronously to avoid a loading flash on every navigation.
  const cached = readJson<CachedYouTubeStatus>(YT_CACHE_KEY);

  const [yt, setYt] = useState<{ loading: boolean; isConnected: boolean; channelTitle?: string | null }>(() => ({
    loading: !cached,
    isConnected: !!cached?.isConnected,
    channelTitle: cached?.channelTitle || null,
  }));

  const [teamOwner, setTeamOwner] = useState<{
    loading: boolean;
    ownerConnected: boolean;
    ownerName?: string | null;
  }>({ loading: false, ownerConnected: false, ownerName: null });

  // Team workspaces publish through the owner's channel — show members whether
  // the owner has YouTube connected.
  useEffect(() => {
    (async () => {
      if (!isTeamWorkspace || isTeamOwner || !selectedTeamId) {
        setTeamOwner({ loading: false, ownerConnected: false, ownerName: null });
        return;
      }

      const teamKey = `${TEAM_OWNER_CACHE_PREFIX}${selectedTeamId}`;
      const cachedTeam = readJson<{ ownerConnected: boolean; ownerName?: string | null; updatedAt: number }>(teamKey);
      if (cachedTeam) {
        setTeamOwner({
          loading: false,
          ownerConnected: cachedTeam.ownerConnected,
          ownerName: cachedTeam.ownerName || null,
        });
      }

      const isFresh = cachedTeam && Date.now() - cachedTeam.updatedAt < CACHE_MAX_AGE_MS;
      if (!isFresh) setTeamOwner((p) => ({ ...p, loading: !cachedTeam }));
      try {
        const res = await fetch(`/api/social-connections/status?teamId=${encodeURIComponent(selectedTeamId)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load team connections");
        const ownerConnected = Array.isArray(data?.connectedPlatforms) && data.connectedPlatforms.includes("youtube");
        writeJson(teamKey, { ownerConnected, ownerName: data?.ownerName || null, updatedAt: Date.now() });
        setTeamOwner({ loading: false, ownerConnected, ownerName: data?.ownerName || null });
      } catch {
        setTeamOwner((p) => ({ ...p, loading: false }));
      }
    })();
  }, [isTeamWorkspace, isTeamOwner, selectedTeamId]);

  useEffect(() => {
    // One-time success/error banners after the OAuth redirect.
    let shouldRefetch = false;
    try {
      const sp = new URLSearchParams(window.location.search);
      const error = sp.get("error");
      const success = sp.get("success");
      if (success) {
        shouldRefetch = true;
        notifications.addNotification({ type: "success", title: "Success", message: "YouTube connected." });
      }
      if (error) {
        shouldRefetch = true;
        notifications.addNotification({
          type: "error",
          title: "Connection issue",
          message: "YouTube connection failed. Please try again.",
        });
      }
      if (error || success) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    } catch {}

    if (shouldRefetch) {
      invalidateKey(YT_CACHE_KEY);
      if (selectedTeamId) invalidateKey(`${TEAM_OWNER_CACHE_PREFIX}${selectedTeamId}`);
    }

    const abort = new AbortController();
    const cachedNow = readJson<CachedYouTubeStatus>(YT_CACHE_KEY);
    const isFresh = cachedNow && Date.now() - cachedNow.updatedAt < CACHE_MAX_AGE_MS;
    if (!isFresh) setYt((p) => ({ ...p, loading: !cachedNow }));

    (async () => {
      const res = await fetch("/api/youtube/status", { signal: abort.signal });
      const data = await res.json().catch(() => ({}));
      const next = {
        isConnected: !!data?.isConnected,
        channelTitle: data?.channelTitle || null,
      };
      setYt({ loading: false, ...next });
      writeJson(YT_CACHE_KEY, { ...next, updatedAt: Date.now() } satisfies CachedYouTubeStatus);
    })().catch(() => {
      setYt((p) => ({ ...p, loading: false }));
    });

    return () => abort.abort();
    // Intentionally only on first mount; caching handles subsequent navigations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDisconnect = async () => {
    try {
      const resp = await fetch(youtube.disconnectHref, { method: "POST" });
      if (!resp.ok) throw new Error("Failed");
      setYt({ loading: false, isConnected: false, channelTitle: null });
      invalidateKey(YT_CACHE_KEY);
      notifications.addNotification({ type: "success", title: "Disconnected", message: "YouTube disconnected" });
    } catch {
      notifications.addNotification({ type: "error", title: "Disconnect failed", message: "Try again." });
    }
  };

  return (
    <AppShell>
      <div className="relative lg:fixed lg:inset-0 lg:left-64 bg-background lg:overflow-auto">
        <div className="min-h-full">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground truncate">YouTube connection</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Connect the channel your team publishes to.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-w-2xl">
            {/* Team workspaces publish via the owner's channel */}
            {isTeamWorkspace && !isTeamOwner && (
              <Card className="border border-warning/30 bg-warning-muted">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="text-sm">
                        <span className="font-semibold text-foreground">Team workspace.</span>{" "}
                        <span className="text-muted-foreground">
                          Videos publish using the team owner&apos;s channel. The connection below is your personal one.
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {teamOwner.loading
                          ? "Checking team connection…"
                          : teamOwner.ownerConnected
                            ? `Owner${teamOwner.ownerName ? ` (${teamOwner.ownerName})` : ""} has YouTube connected — this workspace can publish.`
                            : "The team owner hasn't connected YouTube yet — publishing is blocked until they do."}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* YouTube connection card */}
            <Card className={yt.isConnected ? "border-success/30" : "border-border"}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${youtube.iconBg} ${youtube.iconFg}`}>
                      <Youtube className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground">{youtube.displayName}</h3>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {yt.loading
                          ? "Checking connection…"
                          : yt.isConnected
                            ? yt.channelTitle || "Connected"
                            : "Not connected"}
                      </p>
                    </div>
                  </div>

                  {yt.isConnected && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[180px]">
                        <DropdownMenuItem asChild>
                          <a href={youtube.connectHref} className="cursor-pointer gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Reconnect
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                          onSelect={handleDisconnect}
                        >
                          <Unplug className="h-4 w-4" />
                          Disconnect
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="mt-4">
                  {yt.isConnected ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-success-muted text-success text-xs font-medium">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Ready to publish
                    </div>
                  ) : (
                    <Button asChild size="sm" className="gap-1.5 h-9" aria-disabled={yt.loading}>
                      <a href={youtube.connectHref} className={yt.loading ? "pointer-events-none opacity-50" : ""}>
                        <Link2 className="h-3.5 w-3.5" />
                        {yt.loading ? "Checking…" : "Connect YouTube"}
                      </a>
                    </Button>
                  )}
                </div>

                <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                  Uplora uploads approved videos to this channel via the YouTube API.
                  Editors never see your Google credentials — only the owner connects,
                  and every publish goes through the approval workflow.
                </p>
              </CardContent>
            </Card>

            {yt.isConnected && (
              <Badge variant="outline" className="text-xs text-muted-foreground font-normal">
                Signed in as {yt.channelTitle || "your channel"} · manage from the card above
              </Badge>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default SocialConnections;
