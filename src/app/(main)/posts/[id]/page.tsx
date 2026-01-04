"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/app/components/layout/AppLayout";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { LoadingSpinner, PageLoader } from "@/app/components/ui/loading-spinner";
import { ArrowLeft, Calendar, Clock, FileText, Image as ImageIcon, Sparkles, Video } from "lucide-react";
import { useNotifications } from "@/app/components/ui/Notification";

type ContentType = "video" | "image" | "text" | "reel";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusColor(status: string) {
  switch (status) {
    case "DRAFT":
      return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    case "PENDING":
      return "bg-orange/10 text-orange border-orange/20";
    case "SCHEDULED":
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    case "PUBLISHED":
      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
    case "PROCESSING":
      return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    default:
      return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700";
  }
}

function TypeIcon({ type }: { type: ContentType }) {
  switch (type) {
    case "video":
      return <Video className="h-5 w-5" />;
    case "image":
      return <ImageIcon className="h-5 w-5" />;
    case "reel":
      return <Sparkles className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
}

export default function PostDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const notifications = useNotifications();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);
  const [media, setMedia] = useState<{ videoUrl?: string | null; imageUrl?: string | null; thumbnailUrl?: string | null }>({});

  const type = useMemo(() => (post?.type as ContentType | undefined) || undefined, [post]);
  const title = useMemo(() => post?.title || post?.filename || "Post details", [post]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchSignedUrl = async (key: string, contentTypeParam?: string) => {
      const params = new URLSearchParams({ key });
      if (contentTypeParam) params.set("contentType", contentTypeParam);
      const r = await fetch(`/api/s3/get-url?${params.toString()}`, { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to fetch media URL");
      const j = await r.json().catch(() => ({}));
      return j?.url as string | undefined;
    };

    const fetchVideoUrl = async (key: string) => {
      // This route enforces authorization via video_posts
      const r = await fetch(`/api/video-url?key=${encodeURIComponent(key)}`, { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to fetch video URL");
      const j = await r.json().catch(() => ({}));
      return j?.url as string | undefined;
    };

    (async () => {
      setLoading(true);
      setPost(null);
      setMedia({});
      try {
        const resp = await fetch(`/api/content/${encodeURIComponent(String(id))}`, { cache: "no-store" });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(data?.error || "Failed to load post details");
        if (cancelled) return;
        setPost(data);

        const t = String(data?.type || "") as ContentType;
        if (t === "video") {
          const [thumb, video] = await Promise.all([
            data?.thumbnailKey ? fetchSignedUrl(String(data.thumbnailKey)) : Promise.resolve(undefined),
            data?.key ? fetchVideoUrl(String(data.key)) : Promise.resolve(undefined),
          ]);
          if (!cancelled) setMedia({ thumbnailUrl: thumb, videoUrl: video });
        } else if (t === "reel") {
          // Reels live in reel_posts; use signed S3 URL directly
          const [thumb, video] = await Promise.all([
            data?.thumbnailKey ? fetchSignedUrl(String(data.thumbnailKey)) : Promise.resolve(undefined),
            data?.videoKey ? fetchSignedUrl(String(data.videoKey), "video/mp4") : Promise.resolve(undefined),
          ]);
          if (!cancelled) setMedia({ thumbnailUrl: thumb, videoUrl: video });
        } else if (t === "image") {
          const img = data?.imageKey ? await fetchSignedUrl(String(data.imageKey)) : undefined;
          if (!cancelled) setMedia({ imageUrl: img });
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
                {post ? (
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    {type ? (
                      <span className="inline-flex items-center gap-1 capitalize">
                        <TypeIcon type={type} />
                        {type}
                      </span>
                    ) : null}
                    {post.status ? <span>• {String(post.status)}</span> : null}
                  </div>
                ) : null}
              </div>
            </div>
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
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Media */}
                {media.videoUrl ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-xl overflow-hidden border bg-black">
                        <video src={media.videoUrl} controls className="w-full max-h-[420px] object-contain" />
                      </div>
                    </CardContent>
                  </Card>
                ) : media.imageUrl ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-xl overflow-hidden border bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={media.imageUrl} alt="Post media" className="w-full max-h-[420px] object-contain" />
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {/* Content */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-foreground whitespace-pre-wrap break-words">
                      {post.content || post.description || "—"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {post.status ? (
                        <Badge className={`${getStatusColor(String(post.status))} text-xs border`}>
                          {String(post.status)}
                        </Badge>
                      ) : null}
                      {type ? (
                        <Badge variant="outline" className="text-xs capitalize">
                          {type}
                        </Badge>
                      ) : null}
                    </div>

                    {Array.isArray(post.platforms) && post.platforms.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {post.platforms.map((p: string) => (
                          <Badge key={p} variant="outline" className="text-xs">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">No platforms selected</div>
                    )}

                    <div className="grid grid-cols-1 gap-2 pt-2">
                      <div className="rounded-lg border bg-card p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span className="font-medium text-foreground">Created</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground break-words">
                          {post.createdAt ? formatDate(String(post.createdAt)) : "—"}
                        </div>
                      </div>
                      <div className="rounded-lg border bg-card p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span className="font-medium text-foreground">Scheduled</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground break-words">
                          {post.scheduledFor ? formatDate(String(post.scheduledFor)) : "—"}
                        </div>
                      </div>
                    </div>
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


