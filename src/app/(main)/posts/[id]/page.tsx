"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/app/components/layout/AppLayout";
import { LoadingSpinner, PageLoader } from "@/app/components/ui/loading-spinner";
import { useNotifications } from "@/app/components/ui/Notification";

export default function PostDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const notifications = useNotifications();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        const resp = await fetch(`/api/content/${encodeURIComponent(String(id))}`, { cache: "no-store" });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(data?.error || "Failed to load post details");
        if (cancelled) return;
        const t = String(data?.type || "");
        if (!t) throw new Error("Missing type");
        if (t === "video") {
          router.replace(`/videos/${encodeURIComponent(String(id))}`);
        } else {
          router.replace(`/posts/${encodeURIComponent(t)}/${encodeURIComponent(String(id))}`);
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
        // no-op
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, notifications, router]);

  if (!id) return <PageLoader />;

  return (
    <AppShell>
      <div className="fixed inset-0 lg:left-64 bg-background overflow-auto">
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    </AppShell>
  );
}


