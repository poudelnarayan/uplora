"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/app/components/layout/AppLayout";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { LoadingSpinner, PageLoader } from "@/app/components/ui/loading-spinner";
import { ArrowLeft, Edit, Image as ImageIcon } from "lucide-react";
import { useNotifications } from "@/app/components/ui/Notification";
import { CopyField, formatDate, getStatusColor, MetadataTable } from "@/app/(main)/posts/_components/detail-utils";

export default function ImagePostDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const notifications = useNotifications();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const title = useMemo(() => post?.title || "Image post", [post]);
  const status = useMemo(() => String(post?.status || "—"), [post]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setPost(null);
      setImageUrl(null);
      try {
        const resp = await fetch(`/api/content/${encodeURIComponent(String(id))}`, { cache: "no-store" });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(data?.error || "Failed to load image post");
        if (cancelled) return;
        if (String(data?.type) !== "image") throw new Error("Not an image post");
        setPost(data);

        if (data?.imageKey) {
          const r = await fetch(`/api/s3/get-url?key=${encodeURIComponent(String(data.imageKey))}`, { cache: "no-store" });
          const j = await r.json().catch(() => ({}));
          if (r.ok) setImageUrl(j?.url || null);
        }
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
                    <ImageIcon className="h-3.5 w-3.5" />
                    Image
                  </span>
                  <span>•</span>
                  <Badge className={`${getStatusColor(status)} text-[11px] border`}>{status}</Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push(`/make-post/image?edit=${encodeURIComponent(String(id))}`)}>
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
                    <CardTitle className="text-base">Image</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl overflow-hidden border bg-muted">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt="Image" className="w-full max-h-[520px] object-contain bg-black" />
                      ) : (
                        <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                          No image available.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Caption</CardTitle>
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
                    <CopyField label="Image key" value={post.imageKey} />
                    <CopyField label="Folder path" value={post.folderPath} />
                    <CopyField label="Team id" value={post.teamId ? String(post.teamId) : null} />
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


