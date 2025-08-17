"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, Eye, EyeOff, AlertTriangle, LogIn } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/components/ui/Notification";
import { TextField } from "@/components/ui/TextField";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";

export default function AdminLoginPage() {
  const router = useRouter();
  const notifications = useNotifications();
  const { data: session, status } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  // Check if user is already logged in and is admin
  useEffect(() => {
    let mounted = true;
    const checkAdminStatus = async () => {
      if (status !== "authenticated") return;
      try {
        const adminCheck = await fetch("/api/admin/check", { cache: "no-store" });
        const adminData = await adminCheck.json();
        if (mounted && adminData.isAdmin) {
          notifications.addNotification({
            type: "success",
            title: "Welcome Admin",
            message: "Redirecting to admin dashboard..."
          });
          router.push("/admin");
        }
      } catch {}
    };
    checkAdminStatus();
    return () => { mounted = false; };
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", { 
        email: formData.email, 
        password: formData.password, 
        redirect: false 
      });

      if (result?.error) {
        notifications.addNotification({ 
          type: "error", 
          title: "Login Failed", 
          message: "Invalid email or password" 
        });
      } else {
        // Check if user is admin
        const adminCheck = await fetch("/api/admin/check");
        const adminData = await adminCheck.json();

        if (adminData.isAdmin) {
          notifications.addNotification({ 
            type: "success", 
            title: "Welcome Admin", 
            message: "Redirecting to admin dashboard..." 
          });
          router.push("/admin");
        } else {
          notifications.addNotification({ 
            type: "error", 
            title: "Access Denied", 
            message: "You don't have admin privileges" 
          });
          // Sign out the user
          await signIn("credentials", { redirect: false });
        }
      }
    } catch (error) {
      notifications.addNotification({ 
        type: "error", 
        title: "Error", 
        message: "An error occurred during login" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <NextSeoNoSSR title="Admin Login" noindex nofollow />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
          <p className="text-slate-400">Secure admin portal for Uplora</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <TextField
              label="Admin Email"
              icon={<Mail className="w-4 h-4" />}
              type="email"
              placeholder="admin@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: (e.target as HTMLInputElement).value })}
              required
              className="bg-white/5 border-white/20 text-white placeholder-slate-400"
            />

            <TextField
              label="Password"
              icon={<Lock className="w-4 h-4" />}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: (e.target as HTMLInputElement).value })}
              rightIcon={
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
              className="bg-white/5 border-white/20 text-white placeholder-slate-400"
            />

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner w-4 h-4" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Access Admin Panel
                </>
              )}
            </button>

            {/* Credentials-only: Google sign-in intentionally removed */}
          </form>

                  {/* Session Status */}
        {session?.user?.email && (
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <LogIn className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-blue-400 font-medium mb-1">Logged In</p>
                <p className="text-slate-400">
                  Currently signed in as: {session.user.email}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  If this is an admin account, you'll be redirected automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-red-400 font-medium mb-1">Restricted Access</p>
              <p className="text-slate-400">
                This portal is for authorized administrators only. All access attempts are logged and monitored.
              </p>
            </div>
          </div>
        </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-500 text-sm">
            © 2024 Uplora Admin Portal
          </p>
        </div>
      </motion.div>
    </div>
  );
}
