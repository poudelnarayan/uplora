"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff } from "lucide-react";
import { TextField } from "@/components/ui/TextField";
import { api } from "@/lib/fetcher";

function ResetInner() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/api/auth/reset-password", { token, password });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/signin"), 1200);
      } else {
        setError(res.message || "Reset failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-2">Reset password</h1>
        <p className="text-sm text-muted-foreground mb-6">Set a new password for your account.</p>
        {error && (
          <div className="mb-4 p-3 rounded-md border bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">{error}</div>
        )}
        {success ? (
          <div className="text-sm">Password updated. Redirecting…</div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <TextField
              label="New Password"
              type={show ? "text" : "password"}
              icon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
              rightIcon={
                <button type="button" aria-label="Toggle password" onClick={() => setShow(!show)} tabIndex={-1}>
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />
            <motion.button className="btn btn-primary w-full" type="submit" disabled={loading} whileTap={{ scale: 0.98 }}>
              {loading ? "Updating..." : "Update Password"}
            </motion.button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetInner />
    </Suspense>
  );
}


