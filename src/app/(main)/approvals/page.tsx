"use client";

import { useEffect, useMemo, useState } from "react";
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
  const notifications = useNotifications();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ApprovalItem[]>([]);

  useEffect(() => {
    const load = async () => {
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
          status: "APPROVAL_REQUESTED", // Use new status value
          sortBy: "newest",
          limit: "100",
          offset: "0",
        });
        const res = await fetch(`/api/content?${params.toString()}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load approvals");

        const list = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
        setItems(list);
      } catch (e) {
        notifications.addNotification({
          type: "error",
          title: "Failed to load approvals",
          message: e instanceof Error ? e.message : "Try again",
        });
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedTeamId, notifications]);

  const title = useMemo(() => selectedTeam?.name ? `${selectedTeam.name} • Approvals` : "Approvals", [selectedTeam?.name]);

  const openItem = (it: ApprovalItem) => {
    if (it.type === "video") {
      router.push(`/videos/${it.id}`);
      return;
    }
    const route = it.type === "text" ? "/make-post/text" : it.type === "image" ? "/make-post/image" : "/make-post/reel";
    router.push(`${route}?edit=${encodeURIComponent(it.id)}`);
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pending items that require owner/admin/manager approval before publishing.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.refresh()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Awaiting Approval</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </div>
              ) : items.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6">No pending approvals.</div>
              ) : (
                <div className="space-y-3">
                  {items.map((it) => {
                    const displayTitle =
                      it.type === "video"
                        ? (it.filename || "Video")
                        : (it.title || (it.content ? String(it.content).slice(0, 60) : "Post"));
                    return (
                      <div key={it.id} className="flex items-center justify-between gap-4 border border-border rounded-lg p-4">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">{displayTitle}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Type: {it.type} • Status: {it.status}
                          </div>
                        </div>
                        <Button onClick={() => openItem(it)} className="shrink-0">
                          Review <ArrowRight className="h-4 w-4 ml-2" />
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


