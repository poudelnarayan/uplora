import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Videos are part of the unified Posts UI. Keep /videos/[id] for detail/approval,
// but redirect /videos to the unified list filtered to videos.
export default function VideosPage() {
  redirect("/posts/all?type=video");
}


