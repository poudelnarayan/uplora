"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Upload,
  Users,
  Settings,
  CreditCard,
  ChevronDown,
  Menu,
  X,
  MessageCircle,
  Lightbulb,
} from "lucide-react";
import { useTeam } from "@/context/TeamContext";
import NotificationCenter from "@/components/ui/NotificationCenter/NotificationCenter";
import FeedbackStudio from "@/components/ui/FeedbackStudio/FeedbackStudio";
import IdeaLab from "@/components/ui/IdeaLab/IdeaLab";
import UserMenu from "@/components/ui/UserMenu/UserMenu";
import ThemeToggle from "@/components/ui/ThemeToggle/ThemeToggle";
import NotificationBell from "@/components/ui/NotificationBell/NotificationBell";
import { usePathname as usePathnameForFeedback } from "next/navigation";

const routes = [
  { href: "/dashboard", label: "Dashboard", icon: Video },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/subscription", label: "Subscription", icon: CreditCard },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const pathForFeedback = usePathnameForFeedback();
  const { teams, selectedTeam, selectedTeamId, setSelectedTeamId } = useTeam();

  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showFeedbackStudio, setShowFeedbackStudio] = useState(false);
  const [showIdeaLab, setShowIdeaLab] = useState(false);

  // Feedback handlers
  const submitFeedback = async (type: string, message: string) => {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `[${type.toUpperCase()}] ${message}`,
        category: type,
        includeEmail: true,
        path: pathForFeedback,
        teamId: selectedTeamId,
        teamName: selectedTeam?.name,
      }),
    });
  };

  const submitIdea = async (title: string, description: string, priority: string) => {
    const ideaContent = `Feature Request: ${title}\nPriority: ${priority}\n\nDescription:\n${description}`;
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: ideaContent,
        category: "Feature Request",
        includeEmail: true,
        path: pathForFeedback,
        teamId: selectedTeamId,
        teamName: selectedTeam?.name,
      }),
    });
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
          <div className="relative">
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
          </button>

          {/* Idea Lab */}
          <button
            onClick={() => setShowIdeaLab(true)}
            className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-orange-500/10"
          >
            <Lightbulb className="h-5 w-5 shrink-0" />
            <span className="truncate">Idea Lab</span>
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
        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-card border-b border-border backdrop-blur-none lg:bg-card/95 lg:backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 py-3">
            {/* Left side - Icons and Mobile Menu */}
            <div className="flex items-center gap-3">
              {/* Perfect Circle Icons - Always Visible */}
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <NotificationBell onClick={() => setShowNotificationCenter(true)} />
              </div>
              
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
            </div>

            {/* Right side - User Menu */}
            <div className="flex items-center">
              <UserMenu onFeedbackClick={() => setShowFeedbackStudio(true)} />
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
              className="fixed inset-0 bg-black/30 z-50 lg:hidden"
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

      {/* Modals */}
      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
      />

      <FeedbackStudio
        isOpen={showFeedbackStudio}
        onClose={() => setShowFeedbackStudio(false)}
        onSubmit={submitFeedback}
      />

      <IdeaLab
        isOpen={showIdeaLab}
        onClose={() => setShowIdeaLab(false)}
        onSubmit={submitIdea}
      />
    </div>
  );
}