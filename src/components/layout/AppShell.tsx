"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
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
  Lightbulb
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
  // Feature request drawer state
  const [featureOpen, setFeatureOpen] = useState(false);
  const [featureTitle, setFeatureTitle] = useState("");
  const [featureImpact, setFeatureImpact] = useState("Medium");
  const [featureUseCase, setFeatureUseCase] = useState("");
  const [featureSubmitting, setFeatureSubmitting] = useState(false);
  const [featureSent, setFeatureSent] = useState(false);

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

  // Close feedback drawer with ESC
  useEffect(() => {
    if (!feedbackOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFeedbackOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [feedbackOpen]);

  // Close notifications drawer with ESC
  useEffect(() => {
    if (!notifOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotifOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [notifOpen]);

  // Close user menu with ESC
  useEffect(() => {
    if (!userMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [userMenuOpen]);

  // Close feature drawer with ESC
  useEffect(() => {
    if (!featureOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFeatureOpen(false);
    };
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
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-card min-h-screen fixed inset-y-0 left-0 z-40">
        <header className="h-16 flex items-center px-6 text-[18px] font-extrabold tracking-tight text-foreground">
          YTUploader
        </header>

        {/* Team selector block */}
        <div className="px-4 pt-2 pb-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">You are viewing</div>
          <div className="relative" ref={teamMenuRef}>
            <button
              onClick={() => teams.length > 1 && setTeamMenuOpen((o) => !o)}
              className={`w-full inline-flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors ${teams.length > 1 ? "bg-card hover:bg-muted" : "bg-muted cursor-default"}`}
              aria-haspopup="listbox"
              aria-expanded={teamMenuOpen}
              aria-label="Select team workspace"
            >
              <span className="font-semibold text-foreground truncate">
                {selectedTeam?.name || (teams.length === 0 ? "No team" : teams[0]?.name)}
              </span>
              <div className="flex items-center gap-2 text-muted-foreground">
                {teams.length > 1 && <ChevronDown className="w-4 h-4" />}
              </div>
            </button>
            {teamMenuOpen && teams.length > 1 && (
              <div className="mt-2 w-full rounded-md border bg-card shadow-lg p-1">
                {teams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTeamId(t.id); setTeamMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted ${selectedTeamId === t.id ? "bg-slate-50/20" : ""}`}
                    role="option"
                    aria-selected={selectedTeamId === t.id}
                  >
                    <div className="font-medium text-foreground truncate">{t.name}</div>
                    {t.description ? (
                      <div className="text-xs text-muted-foreground truncate">{t.description}</div>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4">
          {routes.map(({ href, label, icon: Icon }) => {
            const active = path === href || path.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-6 rounded-md pl-8 pr-4 py-3 text-sm transition-all duration-200 ${
                  active
                    ? "bg-slate-50/25 dark:bg-slate-800/10 text-foreground"
                    : "hover:bg-slate-50/15 dark:hover:bg-slate-800/5 text-muted-foreground hover:text-foreground hover:translate-x-1"
                }`}
              >
                {active && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1.5 rounded-r bg-primary"
                  />
                )}
                <Icon
                  className={`h-5 w-5 shrink-0 transition-colors ${active ? "text-primary" : "text-foreground/70 group-hover:text-foreground"}`}
                  strokeWidth={active ? 2.6 : 2.2}
                />
                <span className={`${active ? "font-semibold" : "font-medium"} truncate`}>{label}</span>
              </Link>
            );
          })}

          {/* Separator above feedback */}
          <div className="my-2 mx-2 border-t" />

          {/* Send feedback */}
          <button
            onClick={() => { setFeedbackOpen(true); setFeatureOpen(false); }}
            className={`group relative flex w-full items-center gap-6 rounded-md pl-8 pr-4 py-3 text-left text-sm transition-all duration-200 ${
              feedbackOpen
                ? "bg-slate-50/25 dark:bg-slate-800/10 text-foreground"
                : "hover:bg-slate-50/15 dark:hover:bg-slate-800/5 text-muted-foreground hover:text-foreground hover:translate-x-1"
            }`}
          >
            {feedbackOpen && (
              <span aria-hidden className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1.5 rounded-r bg-primary" />
            )}
            <MessageSquare className="h-5 w-5 shrink-0 text-foreground/70 group-hover:text-foreground absolute left-2" />
            <span className="font-medium truncate">Send feedback</span>
          </button>

          {/* Request a feature (no separator above) */}
          <button
            onClick={() => { setFeatureOpen(true); setFeedbackOpen(false); setFeatureTitle(""); setFeatureUseCase(""); setFeatureImpact("Medium"); setFeatureSent(false); }}
            className={`group relative flex w-full items-center gap-6 rounded-md pl-8 pr-4 py-3 text-left text-sm transition-all duration-200 ${
              featureOpen
                ? "bg-slate-50/25 dark:bg-slate-800/10 text-foreground"
                : "hover:bg-slate-50/15 dark:hover:bg-slate-800/5 text-muted-foreground hover:text-foreground hover:translate-x-1"
            }`}
          >
            {featureOpen && (
              <span aria-hidden className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1.5 rounded-r bg-primary" />
            )}
            <Lightbulb className="h-5 w-5 shrink-0 text-foreground/70 group-hover:text-foreground absolute left-2" />
            <span className="font-medium truncate">Request a feature</span>
          </button>
        </nav>

        {/* Footer copyright */}
        <div className="border-t my-2 mx-2" />
        <div className="px-4 pb-2 text-[11px] text-muted-foreground">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <Link href="/about" className="hover:underline">About</Link>
            <Link href="/copyright" className="hover:underline">Copyright</Link>
            <Link href="/contact" className="hover:underline">Contact us</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          </div>
        </div>
        <div className="px-4 py-4 text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} YTUploader
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 lg:ml-64 ml-0">
        <div className="max-w-6xl mx-auto w-full">
          <div className="relative flex items-center justify-end mb-4 gap-2">
            <button aria-label="Notifications" className="p-2 rounded-md border bg-card hover:bg-muted" onClick={() => setNotifOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 5 3 9H3c0-4 3-2 3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </button>
            <div className="relative" ref={userMenuRef}>
              <button aria-label="Profile" className="p-2 rounded-md border bg-card hover:bg-muted" onClick={() => setUserMenuOpen(v => !v)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-white dark:bg-slate-900 shadow-xl p-2 z-10">
                  <div className="px-2 py-1.5 text-xs uppercase tracking-wide text-muted-foreground">Account</div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="mt-1 w-full inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          {children}
        </div>
      </main>

      {/* Right Feedback Drawer */}
      <AnimatePresence>
        {feedbackOpen && (
          <motion.aside
            initial={{ x: 400, opacity: 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-[380px] bg-white dark:bg-slate-900 border-l shadow-xl z-50"
            role="dialog"
            aria-label="Send feedback"
          >
            <div className="h-16 flex items-center justify-between px-5 border-b bg-white dark:bg-slate-900">
              <div className="text-sm font-semibold flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Send feedback</div>
              <button onClick={() => setFeedbackOpen(false)} className="btn btn-ghost btn-sm">Close</button>
            </div>
            <div className="p-5 space-y-4 bg-white dark:bg-slate-900">
              <div>
                <label className="block text-xs uppercase tracking-wide text-muted-foreground mb-1">Category</label>
                <select className="input" value={feedbackCat} onChange={(e) => setFeedbackCat(e.target.value)}>
                  <option>UI/UX</option>
                  <option>Performance</option>
                  <option>Team management</option>
                  <option>Uploads</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-muted-foreground mb-1">Your feedback</label>
                <textarea className="textarea" rows={6} placeholder="Tell us what prompted this feedback..." value={feedbackMsg} onChange={(e) => setFeedbackMsg(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeEmail} onChange={(e) => setIncludeEmail(e.target.checked)} />
                Include my email for follow-up
              </label>
              <div className="pt-2 flex gap-2 justify-end">
                <button className="btn btn-ghost" onClick={() => setFeedbackOpen(false)}>Cancel</button>
                <button className="btn btn-primary" disabled={!feedbackMsg.trim() || submittingFeedback} onClick={submitFeedback}>
                  {submittingFeedback ? <><div className="spinner mr-2" />Sending...</> : "Send"}
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Right Notifications Drawer */}
      <AnimatePresence>
        {notifOpen && (
          <motion.aside
            initial={{ x: 400, opacity: 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-[360px] bg-white dark:bg-slate-900 border-l shadow-xl z-50"
            role="dialog"
            aria-label="Notifications"
          >
            <div className="h-16 flex items-center justify-between px-5 border-b bg-white dark:bg-slate-900">
              <div className="text-sm font-semibold">Notifications</div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => clearNotifications()}>Clear all</button>
                )}
                <button onClick={() => setNotifOpen(false)} className="btn btn-ghost btn-sm">Close</button>
              </div>
            </div>
            <div className="p-5 space-y-3 bg-white dark:bg-slate-900 h-[calc(100%-4rem)] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-sm text-muted-foreground">No notifications</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="flex items-start gap-3 p-3 rounded-md border bg-card w-full">
                    <div className={`mt-0.5 w-2 h-2 rounded-full ${n.type === 'success' ? 'bg-green-500' : n.type === 'error' ? 'bg-red-500' : n.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{n.title}</div>
                      {n.message && <div className="text-xs text-muted-foreground">{n.message}</div>}
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => removeNotification(n.id)}>Dismiss</button>
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Right Feature Request Drawer */}
      <AnimatePresence>
        {featureOpen && (
          <motion.aside
            initial={{ x: 400, opacity: 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-[420px] bg-white dark:bg-slate-900 border-l shadow-xl z-50"
            role="dialog"
            aria-label="Request a feature"
          >
            <div className="h-16 flex items-center justify-between px-5 border-b bg-white dark:bg-slate-900">
              <div className="text-sm font-semibold flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Request a feature</div>
              <button onClick={() => setFeatureOpen(false)} className="btn btn-ghost btn-sm">Close</button>
            </div>
            <div className="p-5 space-y-4 bg-white dark:bg-slate-900 h-[calc(100%-4rem)] overflow-y-auto">
              {featureSent ? (
                <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm">
                  Thanks! Your feature request was submitted.
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-muted-foreground mb-1">Title</label>
                    <input className="input" placeholder="Short descriptive title" value={featureTitle} onChange={(e) => setFeatureTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-muted-foreground mb-1">Impact</label>
                    <select className="input" value={featureImpact} onChange={(e) => setFeatureImpact(e.target.value)}>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-muted-foreground mb-1">Describe the use case</label>
                    <textarea className="textarea" rows={6} placeholder="What problem does this solve? How would you use it?" value={featureUseCase} onChange={(e) => setFeatureUseCase(e.target.value)} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button className="btn btn-ghost" onClick={() => setFeatureOpen(false)}>Cancel</button>
                    <button
                      className="btn btn-primary"
                      disabled={featureSubmitting || !featureTitle.trim() || !featureUseCase.trim()}
                      onClick={async () => {
                        setFeatureSubmitting(true);
                        try {
                          const summary = `Title: ${featureTitle}\nImpact: ${featureImpact}\n\nUse case:\n${featureUseCase}`;
                          await fetch("/api/feedback", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ message: summary, category: "Feature request", includeEmail: true, path, teamId: selectedTeamId, teamName: selectedTeam?.name })
                          });
                          setFeatureSent(true);
                          setFeatureTitle("");
                          setFeatureUseCase("");
                        } finally {
                          setFeatureSubmitting(false);
                        }
                      }}
                    >
                      {featureSubmitting ? (<><div className="spinner mr-2" />Submitting...</>) : "Submit"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
