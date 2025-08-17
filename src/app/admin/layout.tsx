"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield, LogOut, Users, Settings, BarChart3, AlertTriangle } from "lucide-react";
import { signOut } from "next-auth/react";
import { useNotifications } from "@/components/ui/Notification";
import { motion } from "framer-motion";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const notifications = useNotifications();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const isAdminCheckInitiated = useRef(false);

  // Check if we're on admin subdomain
  const isAdminSubdomain = typeof window !== 'undefined' && window.location.host.startsWith('admin.');

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (status === "loading" || isAdminCheckInitiated.current) return;

      if (!session) {
        if (isAdminSubdomain) {
          router.push("/admin-login");
        } else {
          router.push("/signin");
        }
        return;
      }

      isAdminCheckInitiated.current = true;
      try {
        const response = await fetch("/api/admin/check", { cache: "no-store" });
        const data = await response.json();

        if (data.isAdmin) {
          setIsAdmin(true);
        } else {
          if (isAdminSubdomain) {
            notifications.addNotification({
              type: "error",
              title: "Access Denied",
              message: "You don't have admin privileges"
            });
            router.push("/admin-login");
          } else {
            router.push("/dashboard");
          }
        }
      } catch (error) {
        console.error("Admin check failed:", error);
        if (isAdminSubdomain) {
          router.push("/admin-login");
        } else {
          router.push("/signin");
        }
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [session, status, router, notifications, isAdminSubdomain]);

  const handleSignOut = () => {
    if (isAdminSubdomain) {
      signOut({ callbackUrl: "/admin-login" });
    } else {
      signOut({ callbackUrl: "/signin" });
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-slate-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Uplora Admin</h1>
                <p className="text-xs text-slate-400">Administrative Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">{session.user?.name}</p>
                <p className="text-xs text-slate-400">{session.user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <a
              href="/admin"
              className="flex items-center gap-2 px-3 py-4 text-sm font-medium text-white border-b-2 border-red-500"
            >
              <Users className="w-4 h-4" />
              User Management
            </a>
            <a
              href="/admin/analytics"
              className="flex items-center gap-2 px-3 py-4 text-sm font-medium text-slate-300 hover:text-white border-b-2 border-transparent hover:border-slate-600"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </a>
            <a
              href="/admin/settings"
              className="flex items-center gap-2 px-3 py-4 text-sm font-medium text-slate-300 hover:text-white border-b-2 border-transparent hover:border-slate-600"
            >
              <Settings className="w-4 h-4" />
              Settings
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Security Notice */}
      <div className="fixed bottom-4 right-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 max-w-sm">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <p className="text-red-400 font-medium">Admin Session</p>
            <p className="text-slate-400">All actions are logged and monitored</p>
          </div>
        </div>
      </div>
    </div>
  );
}
