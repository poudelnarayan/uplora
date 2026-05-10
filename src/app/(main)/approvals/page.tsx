"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/app/components/layout/AppLayout";
import { useTeam } from "@/context/TeamContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useNotifications } from "@/app/components/ui/Notification";
import { Loader2, ArrowRight } from "lucide-react";

type ApprovalItem = {
  id: string;
  type: "video" | "image" | "text" | "reel";
  status: string;
  title?: string | null;
  content?: string | null;
  filename?: string | null;
  teamId?: string | null;
  updatedAt?: string | null;
  uploadedAt?: string | null;
};

export default function ApprovalsPage() {
  const { selectedTeamId, selectedTeam } = useTeam();
  const router = useRouter();
  // Destructure only addNotification — it's stable (useCallback inside the provider)
  // Putting the whole `notifications` object in useEffect deps causes an infinite loop
  // because a new object reference is created whenever any notification is added.
  const { addNotification } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ApprovalItem[]>([]);

  const load = useCallback(async () => {
    if (!selectedTeamId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        teamId: selectedTeamId,
        types: "video,image,text,reel",
        status: "APPROVAL_REQUESTED",
        sortBy: "newest",
        limit: "100",
        offset: "0",
      });
      const res = await fetch(`/api/content?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || data?.error || "Failed to load approvals");

      const list: ApprovalItem[] = Array.isArray(data?.content) ? data.content : [];
      setItems(list);
    } catch (e) {
      addNotification({
        type: "error",
        title: "Failed to load approvals",
        message: e instanceof Error ? e.message : "Try again",
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTeamId, addNotification]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: refresh when an editor/manager requests approval, or when status changes,
  // so the owner sees new pending items without clicking Refresh.
  useEffect(() => {
    if (!selectedTeamId) return;
    let es: EventSource | null = null;
    try {
      es = new EventSource(`/api/events?teamId=${encodeURIComponent(selectedTeamId)}`);
      es.onmessage = (ev) => {
        try {
          const evt = JSON.parse(ev.data || "{}");
          if (!evt?.type) return;
          if (evt.type !== "post.status" && evt.type !== "video.status") return;
          load();
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
  }, [selectedTeamId, load]);

  const title = useMemo(
    () => (selectedTeam?.name ? `${selectedTeam.name} • Approvals` : "Approvals"),
    [selectedTeam?.name]
  );

  const openItem = (it: ApprovalItem) => {
    if (it.type === "video") {
      router.push(`/videos/${it.id}`);
      return;
    }
    const route =
      it.type === "text" ? "/make-post/text"
      : it.type === "image" ? "/make-post/image"
      : "/make-post/reel";
    router.push(`${route}?edit=${encodeURIComponent(it.id)}`);
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">{title}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
              Pending items that require owner/admin/manager approval before publishing.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="shrink-0 text-xs sm:text-sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        <div className="mt-4 sm:mt-6">
          <Card>
            <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-sm sm:text-base">Awaiting Approval</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </div>
              ) : items.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6">No pending approvals.</div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {items.map((it) => {
                    const displayTitle =
                      it.type === "video"
                        ? (it.filename || "Video")
                        : (it.title || (it.content ? String(it.content).slice(0, 60) : "Post"));
                    return (
                      <div
                        key={it.id}
                        className="flex items-center justify-between gap-3 sm:gap-4 border border-border rounded-lg p-3 sm:p-4"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">{displayTitle}</div>
                          <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                            Type: {it.type} • Status: {it.status}
                          </div>
                        </div>
                        <Button size="sm" onClick={() => openItem(it)} className="shrink-0 text-xs sm:text-sm">
                          Review <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1.5 sm:ml-2" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
