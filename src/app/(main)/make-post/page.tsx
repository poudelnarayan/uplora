import { redirect } from "next/navigation";

// YouTube-only product: "Create" goes straight to the video flow.
// When more content types return, this page becomes the type picker again.
export default function MakePostPage() {
  redirect("/make-post/video");
}
