"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/app/components/layout/AppLayout";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { LoadingSpinner, PageLoader } from "@/app/components/ui/loading-spinner";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import { useNotifications } from "@/app/components/ui/Notification";
import { useUploads } from "@/context/UploadContext";

type ContentType = "video" | "image" | "text" | "reel";

function toDatetimeLocalValue(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const notifications = useNotifications();
  const { uploads, enqueueUpload } = useUploads();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<any>(null);

  // Common editable fields
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [platformsCsv, setPlatformsCsv] = useState("");
  const [scheduledForLocal, setScheduledForLocal] = useState("");

  // Video-specific fields
  const [visibility, setVisibility] = useState("public");
  const [madeForKids, setMadeForKids] = useState(false);

  // Media replacement
  const [newThumbFile, setNewThumbFile] = useState<File | null>(null);
  const [newThumbPreview, setNewThumbPreview] = useState<string | null>(null);
  const [newMediaFile, setNewMediaFile] = useState<File | null>(null);
  const [newMediaUploadId, setNewMediaUploadId] = useState<string | null>(null);

  const type = useMemo(() => (post?.type as ContentType | undefined) || undefined, [post]);
  const teamId = useMemo(() => (post?.teamId ? String(post.teamId) : null), [post]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Fetch via content endpoint (works for all types)
        const resp = await fetch(`/api/content/${encodeURIComponent(String(id))}`, { cache: "no-store" });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(data?.error || "Failed to load post");
        if (cancelled) return;
        setPost(data);

        const t = String(data?.type || "") as ContentType;
        setContent(String(data?.content || data?.description || ""));
        setTitle(String(data?.title || data?.filename || ""));
        setPlatformsCsv(Array.isArray(data?.platforms) ? data.platforms.join(", ") : "");
        setScheduledForLocal(toDatetimeLocalValue(data?.scheduledFor || null));

        if (t === "video") {
          // Video metadata is stored on video_posts; default values come from /api/videos/:id PATCH semantics
          setVisibility(String(data?.visibility || "public"));
          setMadeForKids(Boolean(data?.madeForKids || false));
        }
      } catch (e) {
        notifications.addNotification({
          type: "error",
          title: "Failed to load post",
          message: e instanceof Error ? e.message : "Please try again",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, notifications]);

  // If we kicked off a "replace video" upload, sync state when it finishes
  useEffect(() => {
    if (!newMediaUploadId) return;
    const u = uploads.find((x) => x.id === newMediaUploadId);
    if (!u) return;
    if (u.status === "completed") {
      notifications.addNotification({ type: "success", title: "Video replaced", message: "Upload complete." });
    } else if (u.status === "failed") {
      notifications.addNotification({ type: "error", title: "Upload failed", message: u.error || "Try again." });
    }
  }, [newMediaUploadId, uploads, notifications]);

  if (!id) return <PageLoader />;

  const platforms = platformsCsv
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const scheduledForIso = scheduledForLocal ? new Date(scheduledForLocal).toISOString() : null;

  const save = async () => {
    if (!post || !type) return;
    setSaving(true);
    try {
      // Upload thumbnail if user chose a new one (video + reel/video thumb supported)
      let thumbnailKey: string | null | undefined = undefined;
      if (newThumbFile && type === "video") {
        const presign = await fetch("/api/s3/presign-thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: newThumbFile.name, contentType: newThumbFile.type, videoId: String(id) }),
        });
        if (!presign.ok) throw new Error("Failed to prepare thumbnail upload");
        const { putUrl, key } = await presign.json();
        await fetch(putUrl, { method: "PUT", headers: { "Content-Type": newThumbFile.type }, body: newThumbFile });
        thumbnailKey = key;
      }

      if (type === "video") {
        // Update video metadata
        const resp = await fetch(`/api/videos/${encodeURIComponent(String(id))}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description: content,
            visibility,
            madeForKids,
            ...(thumbnailKey !== undefined ? { thumbnailKey } : {}),
          }),
        });
        const j = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(j?.error || "Failed to save video");
      } else {
        // Update non-video posts
        const body: any = {
          content,
          platforms,
          scheduledFor: scheduledForIso,
        };
        if (type === "reel") body.title = title;

        const resp = await fetch(`/api/content/${encodeURIComponent(String(id))}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const j = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(j?.error || "Failed to save post");
      }

      notifications.addNotification({ type: "success", title: "Saved", message: "Changes updated." });
      router.push(`/posts/${encodeURIComponent(String(id))}`);
    } catch (e) {
      notifications.addNotification({
        type: "error",
        title: "Save failed",
        message: e instanceof Error ? e.message : "Please try again",
      });
    } finally {
      setSaving(false);
    }
  };

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
                <h1 className="text-xl font-semibold text-foreground truncate">Edit post</h1>
                {type ? (
                  <div className="text-xs text-muted-foreground flex items-center gap-2 capitalize">
                    <Badge variant="outline" className="text-xs capitalize">
                      {type}
                    </Badge>
                    {teamId ? <span>• Team {teamId}</span> : null}
                  </div>
                ) : null}
              </div>
            </div>

            <Button onClick={save} disabled={saving || loading} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save"}
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
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Main</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {type === "reel" || type === "video" ? (
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[180px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="platforms">Platforms (comma separated)</Label>
                      <Input
                        id="platforms"
                        value={platformsCsv}
                        onChange={(e) => setPlatformsCsv(e.target.value)}
                        placeholder="YouTube, TikTok, Instagram…"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scheduledFor">Scheduled for</Label>
                      <Input
                        id="scheduledFor"
                        type="datetime-local"
                        value={scheduledForLocal}
                        onChange={(e) => setScheduledForLocal(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {type === "video" ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Video settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="visibility">Visibility</Label>
                        <Input id="visibility" value={visibility} onChange={(e) => setVisibility(e.target.value)} />
                        <p className="text-xs text-muted-foreground">Use: public / unlisted / private</p>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
                        <div className="text-sm">
                          <div className="font-medium text-foreground">Made for kids</div>
                          <div className="text-xs text-muted-foreground">Updates the video metadata</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={madeForKids}
                          onChange={(e) => setMadeForKids(e.target.checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>

              <div className="space-y-6">
                {type === "video" ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Thumbnail</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {newThumbPreview ? (
                        <div className="relative rounded-lg overflow-hidden border bg-black">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={newThumbPreview} alt="New thumbnail" className="w-full h-40 object-contain bg-black" />
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setNewThumbFile(null);
                              setNewThumbPreview(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">Upload a new thumbnail to replace the current one.</div>
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setNewThumbFile(f);
                          const r = new FileReader();
                          r.onload = () => setNewThumbPreview(String(r.result || ""));
                          r.readAsDataURL(f);
                        }}
                      />
                    </CardContent>
                  </Card>
                ) : null}

                {type === "video" ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Replace video file</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-xs text-muted-foreground">
                        Selecting a new file will upload it using multipart and keep the same post id.
                      </div>
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f || !teamId) return;
                          setNewMediaFile(f);
                          const uploadId = enqueueUpload(f, teamId, { videoId: String(id) });
                          setNewMediaUploadId(uploadId);
                        }}
                      />

                      {newMediaUploadId ? (
                        <div className="rounded-lg border bg-card p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">
                                {newMediaFile?.name || "Uploading…"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {uploads.find((u) => u.id === newMediaUploadId)?.status || "uploading"}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-foreground">
                              {uploads.find((u) => u.id === newMediaUploadId)?.progress ?? 0}%
                            </div>
                          </div>
                          <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-[width] duration-200"
                              style={{ width: `${uploads.find((u) => u.id === newMediaUploadId)?.progress ?? 0}%` }}
                            />
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ) : null}

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Raw</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs whitespace-pre-wrap break-words rounded-lg border bg-muted/30 p-3 max-h-[320px] overflow-auto">
                      {JSON.stringify(post, null, 2)}
                    </pre>
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


