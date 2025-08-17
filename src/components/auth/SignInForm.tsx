"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Chrome, User2 } from "lucide-react";
import { useNotifications } from "@/components/ui/Notification";
import { TextField } from "@/components/ui/TextField";
import { useRouter } from "next/navigation";

export default function SignInForm() {
  const notifications = useNotifications();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: "", password: "", name: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          setInfo("Account created. Please check your email to verify your account.");
          setIsSignUp(false);
          setFormData({ email: formData.email, password: "", name: "" });
        } else {
          const error = await response.json();
          notifications.addNotification({ type: "error", title: "Registration failed", message: error.message || "Please try again" });
        }
      } else {
        const result = await signIn("credentials", { email: formData.email, password: formData.password, redirect: false });
        if (result?.error) {
          notifications.addNotification({ type: "error", title: "Invalid credentials", message: "Please check your email and password" });
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      notifications.addNotification({ type: "error", title: "Something went wrong", message: "Please try again later" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="card max-w-md w-full mx-auto p-6 md:p-8">
      <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-foreground mb-2">{isSignUp ? "Create Account" : "Welcome Back"}</h3>
          <p className="text-muted-foreground">
            {isSignUp ? "Join your team and start collaborating" : "Sign in to manage your YouTube team"}
          </p>
        </div>

        {info && (
          <div className="mb-4 text-sm p-3 rounded-md border bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <TextField
                label="Full Name"
                icon={<User2 className="w-4 h-4" />}
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: (e.target as HTMLInputElement).value })}
                required
              />
            </motion.div>
          )}

          <TextField
            label="Email Address"
            icon={<Mail className="w-4 h-4" />}
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: (e.target as HTMLInputElement).value })}
            required
          />

          <TextField
            label="Password"
            icon={<Lock className="w-4 h-4" />}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: (e.target as HTMLInputElement).value })}
            rightIcon={
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility" className="text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            required
          />

          <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">
            {loading ? <div className="spinner" /> : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="my-8 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 text-muted-foreground bg-background">Or</span>
          </div>
        </div>

        <button onClick={handleGoogleSignIn} className="btn btn-secondary w-full">
          <Chrome className="w-5 h-5" />
          Continue with Google
        </button>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setFormData({ email: "", password: "", name: "" });
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignUp ? "Already have an account? Sign in" : "Need an account? Create one"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
