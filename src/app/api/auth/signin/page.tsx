"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NextAuthSignInPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to our custom signin page
    router.replace("/signin");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <p>Redirecting to sign in...</p>
      </div>
    </div>
  );
}
