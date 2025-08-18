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
  MessageSquare,
  Lightbulb,
  Menu,
  Bell,
  User,
  X,
  Sun,
  Moon
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

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackCat, setFeedbackCat] = useState("UI/UX");
  const [includeEmail, setIncludeEmail] = useState(true);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);
  const { notifications, clearNotifications, removeNotification } = useNotifications();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const [featureOpen, setFeatureOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [featureTitle, setFeatureTitle] = useState("");
  const [featureImpact, setFeatureImpact] = useState("Medium");
  const [featureUseCase, setFeatureUseCase] = useState("");
  const [featureSubmitting, setFeatureSubmitting] = useState(false);
  const [featureSent, setFeatureSent] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Get theme from localStorage or default to light
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

  // Close drawers/menus with ESC
  useEffect(() => {
    if (!feedbackOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFeedbackOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [feedbackOpen]);

  useEffect(() => {
    if (!notifOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNotifOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [notifOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setUserMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [userMenuOpen]);

  useEffect(() => {
    if (!featureOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFeatureOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [featureOpen]);

  const submitFeedback = async () => {
    if (!feedbackMsg.trim()) return;
    try {
      setSubmittingFeedback(true);
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: feedbackMsg.trim(),
          category: feedbackCat,
          includeEmail,
          path,
          teamId: selectedTeamId,
          teamName: selectedTeam?.name,
        }),
      });
      setFeedbackMsg("");
      setFeedbackOpen(false);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card min-h-screen fixed inset-y-0 left-0 z-40">
        <header className="h-auto flex items-center justify-center p-4 m-0 border-b border-border">
          <Image src="/text-logo.png" alt="Uplora" width={140} height={140} className="rounded-md block" />
        </header>

        {/* Team selector block */}
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Current Workspace</div>
          <div className="relative" ref={teamMenuRef}>
            <button
              onClick={() => teams.length > 1 && setTeamMenuOpen((o) => !o)}
              className={`w-full inline-flex items-center justify-between px-3 py-2.5 rounded-lg border border-border text-sm transition-all duration-200 ${
                teams.length > 1 ? "bg-card hover:bg-muted hover:border-primary/30" : "bg-muted cursor-default"
              }`}
              aria-haspopup="listbox"
              aria-expanded={teamMenuOpen}
              aria-label="Select team workspace"
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
                    role="option"
                    aria-selected={selectedTeamId === t.id}
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
                aria-current={active ? "page" : undefined}
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

          {/* Separator */}
          <div className="my-4 mx-3 border-t border-border" />

          {/* Send feedback */}
          <button
            onClick={() => {
              setFeedbackOpen(true);
              setFeatureOpen(false);
            }}
            className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <MessageSquare className="h-5 w-5 shrink-0" />
            <span className="truncate">Send feedback</span>
          </button>

          {/* Request a feature */}
          <button
            onClick={() => {
              setFeatureOpen(true);
              setFeedbackOpen(false);
              setFeatureTitle("");
              setFeatureUseCase("");
              setFeatureImpact("Medium");
              setFeatureSent(false);
            }}
            className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Lightbulb className="h-5 w-5 shrink-0" />
            <span className="truncate">Request a feature</span>
          </button>
        </nav>

        {/* Footer links */}
        <div className="border-t border-border px-4 py-4">
          <div className="text-[11px] text-muted-foreground space-y-2">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <Link href="/about" className="hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/copyright" className="hover:text-foreground transition-colors">
                Copyright
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
            </div>
            <div>© {new Date().getFullYear()} Uplora</div>
          </div>
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto lg:ml-64 ml-0">
        {/* Top bar with account/notification icons */}
        <div className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 py-3">
            {/* Mobile menu button */}
            <button
              aria-label="Open menu"
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo for mobile */}
            <div className="lg:hidden">
              <Image src="/text-logo.png" alt="Uplora" width={96} height={24} className="h-6 w-auto" />
            </div>

            {/* Right side icons */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Toggle theme"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* Notifications */}
              <button
                aria-label="Notifications"
                className="p-2 rounded-lg hover:bg-muted transition-colors relative text-muted-foreground hover:text-foreground"
                onClick={() => setNotifOpen(true)}
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-card" />
                )}
              </button>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  aria-label="Profile"
                  className="p-1 rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setUserMenuOpen((v) => !v)}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
                    </span>
                  </div>
                </button>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-64 rounded-lg border border-border bg-card shadow-xl p-2 z-50"
                  >
                    <div className="px-3 py-2 border-b border-border mb-2">
                      <div className="text-sm font-medium text-foreground">{session?.user?.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{session?.user?.email}</div>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-2 text-sm px-3 py-2 rounded-md hover:bg-muted text-red-600 dark:text-red-400 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content with proper centering */}
        <div className="min-h-[calc(100vh-4rem)] flex flex-col">
          <div className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
            <div className="max-w-6xl mx-auto w-full h-full">{children}</div>
          </div>
        </div>
      </main>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-card border-r border-border shadow-2xl z-50 lg:hidden flex flex-col"
              role="dialog"
              aria-label="Navigation"
            >
              <header className="h-auto flex items-center justify-between p-4 border-b border-border">
                <Image src="/text-logo.png" alt="Uplora" width={120} height={30} className="rounded-md block" />
                <button onClick={() => setMobileNavOpen(false)} className="btn btn-ghost btn-sm">
                  <X className="w-4 h-4" />
                </button>
              </header>
              
              <div className="px-4 pt-4 pb-3 border-b border-border">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Current Workspace</div>
                <div className="relative" ref={teamMenuRef}>
                  <button
                    onClick={() => teams.length > 1 && setTeamMenuOpen((o) => !o)}
                    className={`w-full inline-flex items-center justify-between px-3 py-2.5 rounded-lg border border-border text-sm transition-all ${
                      teams.length > 1 ? "bg-card hover:bg-muted" : "bg-muted cursor-default"
                    }`}
                  >
                    <span className="font-medium text-foreground truncate">
                      {selectedTeam?.name || (teams.length === 0 ? "No team" : teams[0]?.name)}
                    </span>
                    {teams.length > 1 && <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>

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
              
              <div className="px-4 py-4 border-t border-border text-[11px] text-muted-foreground">
                © {new Date().getFullYear()} Uplora
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Enhanced Feedback Drawer */}
      <AnimatePresence>
        {feedbackOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setFeedbackOpen(false)}
            />
            <motion.aside
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-full max-w-[92vw] sm:w-[420px] bg-card border-l border-border shadow-2xl z-50"
              role="dialog"
              aria-label="Send feedback"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-lg font-semibold text-foreground">Send Feedback</div>
                </div>
                <button 
                  onClick={() => setFeedbackOpen(false)} 
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6 bg-card h-[calc(100%-4rem)] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                  <select 
                    className="input w-full" 
                    value={feedbackCat} 
                    onChange={(e) => setFeedbackCat(e.target.value)}
                  >
                    <option>UI/UX</option>
                    <option>Performance</option>
                    <option>Team management</option>
                    <option>Uploads</option>
                    <option>Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Your feedback</label>
                  <textarea
                    className="textarea w-full"
                    rows={6}
                    placeholder="Tell us what prompted this feedback..."
                    value={feedbackMsg}
                    onChange={(e) => setFeedbackMsg(e.target.value)}
                  />
                </div>
                
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={includeEmail}
                    onChange={(e) => setIncludeEmail(e.target.checked)}
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-foreground">Include my email for follow-up</span>
                </label>
                
                <div className="flex gap-3 pt-4 border-t border-border">
                  <button 
                    className="btn btn-ghost flex-1" 
                    onClick={() => setFeedbackOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary flex-1"
                    disabled={!feedbackMsg.trim() || submittingFeedback}
                    onClick={submitFeedback}
                  >
                    {submittingFeedback ? (
                      <>
                        <div className="spinner mr-2" />
                        Sending...
                      </>
                    ) : (
                      "Send Feedback"
                    )}
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Enhanced Notifications Drawer */}
      <AnimatePresence>
        {notifOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setNotifOpen(false)}
            />
            <motion.aside
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-full max-w-[92vw] sm:w-[400px] bg-card border-l border-border shadow-2xl z-50"
              role="dialog"
              aria-label="Notifications"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-lg font-semibold text-foreground">Notifications</div>
                </div>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button 
                      className="btn btn-ghost btn-sm" 
                      onClick={() => clearNotifications()}
                    >
                      Clear all
                    </button>
                  )}
                  <button 
                    onClick={() => setNotifOpen(false)} 
                    className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4 bg-card h-[calc(100%-4rem)] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-4 p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          n.type === "success"
                            ? "bg-emerald-500"
                            : n.type === "error"
                            ? "bg-red-500"
                            : n.type === "warning"
                            ? "bg-amber-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">{n.title}</div>
                        {n.message && (
                          <div className="text-xs text-muted-foreground mt-1">{n.message}</div>
                        )}
                      </div>
                      <button
                        className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        onClick={() => removeNotification(n.id)}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Enhanced Feature Request Drawer */}
      <AnimatePresence>
        {featureOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setFeatureOpen(false)}
            />
            <motion.aside
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-full max-w-[92vw] sm:w-[450px] bg-card border-l border-border shadow-2xl z-50"
              role="dialog"
              aria-label="Request a feature"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-lg font-semibold text-foreground">Request Feature</div>
                </div>
                <button 
                  onClick={() => setFeatureOpen(false)} 
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6 bg-card h-[calc(100%-4rem)] overflow-y-auto">
                {featureSent ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Request Sent!</h3>
                    <p className="text-muted-foreground">Thanks for your feature request. We'll review it and get back to you.</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Feature Title</label>
                      <input
                        className="input w-full"
                        placeholder="Short descriptive title"
                        value={featureTitle}
                        onChange={(e) => setFeatureTitle(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Impact Level</label>
                      <select
                        className="input w-full"
                        value={featureImpact}
                        onChange={(e) => setFeatureImpact(e.target.value)}
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Use Case Description</label>
                      <textarea
                        className="textarea w-full"
                        rows={6}
                        placeholder="What problem does this solve? How would you use it?"
                        value={featureUseCase}
                        onChange={(e) => setFeatureUseCase(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex gap-3 pt-4 border-t border-border">
                      <button 
                        className="btn btn-ghost flex-1" 
                        onClick={() => setFeatureOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary flex-1"
                        disabled={featureSubmitting || !featureTitle.trim() || !featureUseCase.trim()}
                        onClick={async () => {
                          setFeatureSubmitting(true);
                          try {
                            const summary = `Title: ${featureTitle}\nImpact: ${featureImpact}\n\nUse case:\n${featureUseCase}`;
                            await fetch("/api/feedback", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                message: summary,
                                category: "Feature request",
                                includeEmail: true,
                                path,
                                teamId: selectedTeamId,
                                teamName: selectedTeam?.name,
                              }),
                            });
                            setFeatureSent(true);
                            setFeatureTitle("");
                            setFeatureUseCase("");
                          } finally {
                            setFeatureSubmitting(false);
                          }
                        }}
                      >
                        {featureSubmitting ? (
                          <>
                            <div className="spinner mr-2" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Request"
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}