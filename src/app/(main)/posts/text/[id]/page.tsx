"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/app/components/layout/AppLayout";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { LoadingSpinner, PageLoader } from "@/app/components/ui/loading-spinner";
import { ArrowLeft, Edit, FileText } from "lucide-react";
import { useNotifications } from "@/app/components/ui/Notification";
import { CopyField, formatDate, getStatusColor, MetadataTable } from "@/app/(main)/posts/_components/detail-utils";
import { useTeam } from "@/context/TeamContext";

export default function TextPostDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const notifications = useNotifications();
  const { teams, personalTeam } = useTeam();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);

  const title = useMemo(() => post?.title || "Text post", [post]);
  const status = useMemo(() => String(post?.status || "—"), [post]);
  const teamName = useMemo(() => {
    const tid = post?.teamId ? String(post.teamId) : null;
    if (!tid) return null;
    if (personalTeam?.id === tid) return personalTeam.name || "Personal workspace";
    const t = (teams || []).find((x) => x.id === tid);
    return t?.name || null;
  }, [post?.teamId, teams, personalTeam]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setPost(null);
      try {
        const resp = await fetch(`/api/content/${encodeURIComponent(String(id))}`, { cache: "no-store" });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(data?.error || "Failed to load text post");
        if (cancelled) return;
        if (String(data?.type) !== "text") throw new Error("Not a text post");
        setPost(data);
      } catch (e) {
        if (!cancelled) {
          notifications.addNotification({
            type: "error",
            title: "Failed to load post",
            message: e instanceof Error ? e.message : "Please try again",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, notifications]);

  if (!id) return <PageLoader />;

  return (
    <AppShell>
      <div className="fixed inset-0 lg:left-64 bg-background overflow-auto">
        <div className="px-6 py-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-foreground truncate">{title}</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    Text
                  </span>
                  <span>•</span>
                  <Badge className={`${getStatusColor(status)} text-[11px] border`}>{status}</Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push(`/make-post/text?edit=${encodeURIComponent(String(id))}`)}>
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <LoadingSpinner size="lg" />
            </div>
          ) : !post ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">Post not found.</CardContent>
            </Card>
          ) : (
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Text</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-foreground whitespace-pre-wrap break-words">{post.content || "—"}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(post.platforms) && post.platforms.length > 0
                        ? post.platforms.map((p: string) => (
                            <Badge key={p} variant="outline" className="text-xs">
                              {p}
                            </Badge>
                          ))
                        : null}
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                      <div className="rounded-lg border bg-card p-3">
                        <div className="font-medium text-foreground mb-1">Created</div>
                        <div className="break-words">{formatDate(post.createdAt)}</div>
                      </div>
                      <div className="rounded-lg border bg-card p-3">
                        <div className="font-medium text-foreground mb-1">Updated</div>
                        <div className="break-words">{formatDate(post.updatedAt)}</div>
                      </div>
                      <div className="rounded-lg border bg-card p-3">
                        <div className="font-medium text-foreground mb-1">Scheduled for</div>
                        <div className="break-words">{formatDate(post.scheduledFor)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MetadataTable metadata={post.metadata} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Storage</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <CopyField label="Team" value={teamName || null} />
                    <CopyField label="User id" value={post.userId ? String(post.userId) : null} />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}


