"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { TextField } from "@/components/ui/TextField";
import { api } from "@/lib/fetcher";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <div className="card max-w-md w-full p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-2">Forgot password</h1>
        <p className="text-sm text-muted-foreground mb-6">Enter your email to receive a password reset link.</p>
        {sent ? (
          <div className="text-sm">If that email exists, a reset link has been sent.</div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <TextField
              label="Email"
              type="email"
              icon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
              required
            />
            <motion.button className="btn btn-primary w-full" type="submit" disabled={loading} whileTap={{ scale: 0.98 }}>
              {loading ? "Sending..." : "Send Reset Link"}
            </motion.button>
          </form>
        )}
      </div>
      <motion.button
        type="button"
        className="btn"
        onClick={() => router.push("/")}
        whileTap={{ scale: 0.98 }}
      >
        Return to Home
      </motion.button>
    </div>
  );
}


