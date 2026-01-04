"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/app/components/layout/AppLayout";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { LoadingSpinner, PageLoader } from "@/app/components/ui/loading-spinner";
import { ArrowLeft, Edit, Film, Shield, Users } from "lucide-react";
import { useNotifications } from "@/app/components/ui/Notification";
import { CopyField, formatDate, getStatusColor } from "@/app/(main)/posts/_components/detail-utils";

export default function VideoPostDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const notifications = useNotifications();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  const title = useMemo(() => post?.filename || post?.title || "Video", [post]);
  const status = useMemo(() => String(post?.status || "—"), [post]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setPost(null);
      setVideoUrl(null);
      setThumbUrl(null);
      try {
        // For video, use the dedicated endpoint so we get uploader + visibility fields reliably
        const resp = await fetch(`/api/videos/${encodeURIComponent(String(id))}`, { cache: "no-store" });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(data?.error || "Failed to load video");
        if (cancelled) return;
        setPost({ ...data, type: "video" });

        // Video playback URL (auth-checked)
        if (data?.key) {
          const v = await fetch(`/api/video-url?key=${encodeURIComponent(String(data.key))}`, { cache: "no-store" });
          const vj = await v.json().catch(() => ({}));
          if (v.ok) setVideoUrl(vj?.url || null);
        }
        // Thumbnail signed URL
        if (data?.thumbnailKey) {
          const t = await fetch(`/api/s3/get-url?key=${encodeURIComponent(String(data.thumbnailKey))}`, { cache: "no-store" });
          const tj = await t.json().catch(() => ({}));
          if (t.ok) setThumbUrl(tj?.url || null);
        }
      } catch (e) {
        if (!cancelled) {
          notifications.addNotification({
            type: "error",
            title: "Failed to load video",
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
                    <Film className="h-3.5 w-3.5" />
                    Video
                  </span>
                  <span>•</span>
                  <Badge className={`${getStatusColor(status)} text-[11px] border`}>{status}</Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push(`/posts/${encodeURIComponent(String(id))}/edit`)}>
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
              <CardContent className="py-12 text-center text-muted-foreground">Video not found.</CardContent>
            </Card>
          ) : (
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Playback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl overflow-hidden border bg-black">
                      {videoUrl ? (
                        <video src={videoUrl} poster={thumbUrl || undefined} controls playsInline className="w-full max-h-[460px] object-contain" />
                      ) : (
                        <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground bg-muted">
                          Preview not ready yet.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-foreground whitespace-pre-wrap break-words">{post.description || "—"}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Publishing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-muted-foreground">Visibility</div>
                      <div className="text-sm font-medium text-foreground capitalize">{String(post.visibility || "public")}</div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <Shield className="h-3.5 w-3.5" />
                        Made for kids
                      </div>
                      <div className="text-sm font-medium text-foreground">{post.madeForKids ? "Yes" : "No"}</div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        Team
                      </div>
                      <div className="text-sm font-medium text-foreground">{post.teamId ? String(post.teamId) : "—"}</div>
                    </div>
                    <div className="pt-2 grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                      <div className="rounded-lg border bg-card p-3">
                        <div className="font-medium text-foreground mb-1">Uploaded</div>
                        <div className="break-words">{formatDate(post.uploadedAt || post.updatedAt)}</div>
                      </div>
                      <div className="rounded-lg border bg-card p-3">
                        <div className="font-medium text-foreground mb-1">Updated</div>
                        <div className="break-words">{formatDate(post.updatedAt)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Storage</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <CopyField label="Video key" value={post.key} />
                    <CopyField label="Thumbnail key" value={post.thumbnailKey} />
                    <CopyField label="Content type" value={post.contentType} />
                    <CopyField label="Size (bytes)" value={typeof post.sizeBytes === "number" ? String(post.sizeBytes) : null} />
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


