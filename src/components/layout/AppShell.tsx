"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Upload,
  Users,
  Settings,
  LogOut,
  CreditCard,
  ChevronDown,
  Menu,
  Bell,
  User,
  X,
  Sun,
  Moon,
  MessageCircle,
  Lightbulb,
  Send,
  Sparkles,
  Heart,
  Zap
} from "lucide-react";
import { useTeam } from "@/context/TeamContext";
import { useNotifications } from "@/components/ui/Notification";

const routes = [
  { href: "/dashboard", label: "Dashboard", icon: Video },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/subscription", label: "Subscription", icon: CreditCard },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const path = usePathname();
  const { teams, selectedTeam, selectedTeamId, setSelectedTeamId } = useTeam();

  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const teamMenuRef = useRef<HTMLDivElement | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Creative notification system
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showFeedbackStudio, setShowFeedbackStudio] = useState(false);
  const [showIdeaLab, setShowIdeaLab] = useState(false);

  // Feedback Studio state
  const [feedbackType, setFeedbackType] = useState<"bug" | "improvement" | "praise">("improvement");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Idea Lab state
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDescription, setIdeaDescription] = useState("");
  const [ideaPriority, setIdeaPriority] = useState<"low" | "medium" | "high">("medium");
  const [ideaSubmitting, setIdeaSubmitting] = useState(false);
  const [ideaSent, setIdeaSent] = useState(false);

  const { notifications, clearNotifications, removeNotification } = useNotifications();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (teamMenuRef.current && !teamMenuRef.current.contains(e.target as Node)) {
        setTeamMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Submit feedback
  const submitFeedback = async () => {
    if (!feedbackMessage.trim()) return;
    
    setFeedbackSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `[${feedbackType.toUpperCase()}] ${feedbackMessage.trim()}`,
          category: feedbackType,
          includeEmail: true,
          path,
          teamId: selectedTeamId,
          teamName: selectedTeam?.name,
        }),
      });
      setFeedbackSent(true);
      setTimeout(() => {
        setShowFeedbackStudio(false);
        setFeedbackSent(false);
        setFeedbackMessage("");
      }, 2000);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Submit idea
  const submitIdea = async () => {
    if (!ideaTitle.trim() || !ideaDescription.trim()) return;
    
    setIdeaSubmitting(true);
    try {
      const ideaContent = `Feature Request: ${ideaTitle}\nPriority: ${ideaPriority}\n\nDescription:\n${ideaDescription}`;
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: ideaContent,
          category: "Feature Request",
          includeEmail: true,
          path,
          teamId: selectedTeamId,
          teamName: selectedTeam?.name,
        }),
      });
      setIdeaSent(true);
      setTimeout(() => {
        setShowIdeaLab(false);
        setIdeaSent(false);
        setIdeaTitle("");
        setIdeaDescription("");
      }, 2000);
    } finally {
      setIdeaSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card min-h-screen fixed inset-y-0 left-0 z-40">
        <header className="h-auto flex items-center justify-center p-4 m-0 border-b border-border">
          <Image src="/text-logo.png" alt="Uplora" width={140} height={140} className="rounded-md block" />
        </header>

        {/* Team selector */}
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Current Workspace</div>
          <div className="relative" ref={teamMenuRef}>
            <button
              onClick={() => teams.length > 1 && setTeamMenuOpen((o) => !o)}
              className={`w-full inline-flex items-center justify-between px-3 py-2.5 rounded-lg border border-border text-sm transition-all duration-200 ${
                teams.length > 1 ? "bg-card hover:bg-muted hover:border-primary/30" : "bg-muted cursor-default"
              }`}
            >
              <span className="font-medium text-foreground truncate">
                {selectedTeam?.name || (teams.length === 0 ? "No team" : teams[0]?.name)}
              </span>
              <div className="flex items-center gap-2 text-muted-foreground">
                {teams.length > 1 && <ChevronDown className="w-4 h-4" />}
              </div>
            </button>
            {teamMenuOpen && teams.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl z-50 p-1"
              >
                {teams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTeamId(t.id);
                      setTeamMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-md text-sm hover:bg-muted transition-colors ${
                      selectedTeamId === t.id ? "bg-primary/10 text-primary" : "text-foreground"
                    }`}
                  >
                    <div className="font-medium truncate">{t.name}</div>
                    {t.description && (
                      <div className="text-xs text-muted-foreground truncate mt-0.5">{t.description}</div>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {routes.map(({ href, label, icon: Icon }) => {
            const active = path === href || path.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}

          {/* Creative Action Buttons */}
          <div className="my-6 mx-3 border-t border-border pt-4" />
          
          {/* Feedback Studio */}
          <button
            onClick={() => setShowFeedbackStudio(true)}
            className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10"
          >
            <MessageCircle className="h-5 w-5 shrink-0" />
            <span className="truncate">Feedback Studio</span>
            <Sparkles className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Idea Lab */}
          <button
            onClick={() => setShowIdeaLab(true)}
            className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-orange-500/10"
          >
            <Lightbulb className="h-5 w-5 shrink-0" />
            <span className="truncate">Idea Lab</span>
            <Zap className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-4 py-4">
          <div className="text-[11px] text-muted-foreground space-y-2">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/copyright" className="hover:text-foreground transition-colors">Copyright</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            </div>
            <div>© {new Date().getFullYear()} Uplora</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:ml-64 ml-0">
        {/* Creative Top Bar */}
        <div className="sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 py-3">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile logo */}
            <div className="lg:hidden">
              <Image src="/text-logo.png" alt="Uplora" width={96} height={24} className="h-6 w-auto" />
            </div>

            {/* Creative Action Bar */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className="relative p-2.5 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 hover:from-amber-400/30 hover:to-orange-500/30 transition-all duration-300 group"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                <AnimatePresence mode="wait">
                  {theme === "dark" ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="w-5 h-5 text-amber-600" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="w-5 h-5 text-slate-600" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Notification Center */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotificationCenter(true)}
                className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-400/20 to-indigo-500/20 hover:from-blue-400/30 hover:to-indigo-500/30 transition-all duration-300"
                title="Notification Center"
              >
                <Bell className="w-5 h-5 text-blue-600" />
                {notifications.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-card"
                  >
                    {notifications.length}
                  </motion.span>
                )}
              </motion.button>

              {/* User Profile */}
              <div className="relative" ref={userMenuRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="relative p-1 rounded-xl bg-gradient-to-br from-purple-400/20 to-pink-500/20 hover:from-purple-400/30 hover:to-pink-500/30 transition-all duration-300"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
                    </span>
                  </div>
                </motion.button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-3 w-72 rounded-2xl border border-border bg-card shadow-2xl p-4 z-50"
                    >
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="text-lg font-bold text-white">
                            {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">{session?.user?.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{session?.user?.email}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <Link
                          href="/settings"
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Account Settings</span>
                        </Link>
                        
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            setShowFeedbackStudio(true);
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm"
                        >
                          <Heart className="w-4 h-4 text-red-500" />
                          <span>Share Feedback</span>
                        </button>
                        
                        <div className="my-2 border-t border-border" />
                        
                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-red-500/10 transition-colors text-sm text-red-600"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="min-h-[calc(100vh-4rem)] flex flex-col">
          <div className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
            <div className="max-w-6xl mx-auto w-full h-full">{children}</div>
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 lg:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-card border-r border-border shadow-2xl z-50 lg:hidden flex flex-col"
            >
              <header className="h-auto flex items-center justify-between p-4 border-b border-border">
                <Image src="/text-logo.png" alt="Uplora" width={120} height={30} className="rounded-md block" />
                <button onClick={() => setMobileNavOpen(false)} className="btn btn-ghost btn-sm">
                  <X className="w-4 h-4" />
                </button>
              </header>
              
              <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {routes.map(({ href, label, icon: Icon }) => {
                  const active = path === href || path.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Creative Notification Center */}
      <AnimatePresence>
        {showNotificationCenter && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-50"
              onClick={() => setShowNotificationCenter(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-20 right-4 w-96 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Notification Center</h3>
                      <p className="text-xs text-muted-foreground">Stay updated with your team</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNotificationCenter(false)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="max-h-96 overflow-y-auto p-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-blue-500" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">All caught up!</h4>
                    <p className="text-sm text-muted-foreground">No new notifications right now</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
                      >
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          notification.type === "success" ? "bg-green-500" :
                          notification.type === "error" ? "bg-red-500" :
                          notification.type === "warning" ? "bg-amber-500" :
                          "bg-blue-500"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-semibold text-foreground">{notification.title}</h5>
                          {notification.message && (
                            <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-muted transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                    
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="w-full mt-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Clear all notifications
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Creative Feedback Studio */}
      <AnimatePresence>
        {showFeedbackStudio && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-50"
              onClick={() => setShowFeedbackStudio(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {feedbackSent ? (
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6"
                  >
                    <Heart className="w-10 h-10 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Thank you!</h3>
                  <p className="text-muted-foreground">Your feedback helps us build better experiences</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <MessageCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground">Feedback Studio</h3>
                          <p className="text-sm text-muted-foreground">Help us improve Uplora</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowFeedbackStudio(false)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                    {/* Feedback Type Selector */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-3">What's on your mind?</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { type: "bug", label: "Bug Report", icon: "🐛", color: "from-red-500/20 to-pink-500/20" },
                          { type: "improvement", label: "Improvement", icon: "✨", color: "from-blue-500/20 to-indigo-500/20" },
                          { type: "praise", label: "Praise", icon: "❤️", color: "from-green-500/20 to-emerald-500/20" }
                        ].map(({ type, label, icon, color }) => (
                          <button
                            key={type}
                            onClick={() => setFeedbackType(type as any)}
                            className={`p-3 rounded-xl border transition-all text-center ${
                              feedbackType === type
                                ? `bg-gradient-to-br ${color} border-primary text-foreground`
                                : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <div className="text-lg mb-1">{icon}</div>
                            <div className="text-xs font-medium">{label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Your message</label>
                      <textarea
                        value={feedbackMessage}
                        onChange={(e) => setFeedbackMessage(e.target.value)}
                        placeholder="Tell us what you think..."
                        className="w-full h-32 p-4 rounded-xl border border-border bg-muted/30 text-foreground placeholder-muted-foreground resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowFeedbackStudio(false)}
                        className="flex-1 py-3 px-4 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={submitFeedback}
                        disabled={!feedbackMessage.trim() || feedbackSubmitting}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium disabled:opacity-50 hover:shadow-lg transition-all text-sm"
                      >
                        {feedbackSubmitting ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Send className="w-4 h-4" />
                            Send Feedback
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Creative Idea Lab */}
      <AnimatePresence>
        {showIdeaLab && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-50"
              onClick={() => setShowIdeaLab(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {ideaSent ? (
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-6"
                  >
                    <Lightbulb className="w-10 h-10 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Idea submitted!</h3>
                  <p className="text-muted-foreground">We'll review your suggestion and get back to you</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-6 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                          <Lightbulb className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground">Idea Lab</h3>
                          <p className="text-sm text-muted-foreground">Share your brilliant ideas</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowIdeaLab(false)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                    {/* Idea Title */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Feature Title</label>
                      <input
                        type="text"
                        value={ideaTitle}
                        onChange={(e) => setIdeaTitle(e.target.value)}
                        placeholder="What would you like to see?"
                        className="w-full p-4 rounded-xl border border-border bg-muted/30 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-3">Priority Level</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { priority: "low", label: "Nice to have", color: "from-gray-500/20 to-slate-500/20" },
                          { priority: "medium", label: "Would help", color: "from-blue-500/20 to-indigo-500/20" },
                          { priority: "high", label: "Game changer", color: "from-amber-500/20 to-orange-500/20" }
                        ].map(({ priority, label, color }) => (
                          <button
                            key={priority}
                            onClick={() => setIdeaPriority(priority as any)}
                            className={`p-3 rounded-xl border transition-all text-center ${
                              ideaPriority === priority
                                ? `bg-gradient-to-br ${color} border-primary text-foreground`
                                : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <div className="text-xs font-medium capitalize">{priority}</div>
                            <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Tell us more</label>
                      <textarea
                        value={ideaDescription}
                        onChange={(e) => setIdeaDescription(e.target.value)}
                        placeholder="How would this feature work? What problem would it solve?"
                        className="w-full h-32 p-4 rounded-xl border border-border bg-muted/30 text-foreground placeholder-muted-foreground resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowIdeaLab(false)}
                        className="flex-1 py-3 px-4 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={submitIdea}
                        disabled={!ideaTitle.trim() || !ideaDescription.trim() || ideaSubmitting}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium disabled:opacity-50 hover:shadow-lg transition-all text-sm"
                      >
                        {ideaSubmitting ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Submitting...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Submit Idea
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}