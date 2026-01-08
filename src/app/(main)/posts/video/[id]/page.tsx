"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// Legacy route -> canonical route
export default function VideoPostDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    router.replace(`/videos/${encodeURIComponent(String(id))}`);
  }, [id, router]);

  return null;
}
