"use client";

// This component is now replaced by MakePostInterface
// Keeping for backward compatibility but redirecting functionality

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UploadZone() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the new make post interface
    router.replace("/upload");
  }, [router]);

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading content creator...</p>
      </div>
    </div>
  );
}