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
import { useModalManager } from "@/components/ui/Modal";

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
  const { openModal } = useModalManager();

  // Feedback handlers
  const submitFeedback = async (type: string, message: string) => {
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          category: type,
          type: "feedback",
          includeEmail: true,
          path: pathForFeedback,
          teamId: selectedTeamId,
          teamName: selectedTeam?.name,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        if (result.emailSent) {
          // Success with email sent
          return { success: true, message: "Feedback submitted and email sent successfully!" };
        } else {
          // Success but email failed
          return { 
            success: true, 
            message: "Feedback submitted successfully, but email delivery failed. We've logged your feedback for review." 
          };
        }
      } else {
        throw new Error(result.error || "Failed to submit feedback");
      }
    } catch (error) {
      console.error("Feedback submission error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to submit feedback");
    }
  };

  const submitIdea = async (title: string, description: string, priority: string) => {
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: description,
          category: "Feature Request",
          type: "idea",
          title: title,
          priority: priority,
          includeEmail: true,
          path: pathForFeedback,
          teamId: selectedTeamId,
          teamName: selectedTeam?.name,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        if (result.emailSent) {
          // Success with email sent
          return { success: true, message: "Idea submitted and email sent successfully!" };
        } else {
          // Success but email failed
          return { 
            success: true, 
            message: "Idea submitted successfully, but email delivery failed. We've logged your idea for review." 
          };
        }
      } else {
        throw new Error(result.error || "Failed to submit idea");
      }
    } catch (error) {
      console.error("Idea submission error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to submit idea");
    }
  };

  const submitFeedbackOld = async (type: string, message: string) => {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message,
        category: type,
        type: "feedback",
        includeEmail: true,
        path: pathForFeedback,
        teamId: selectedTeamId,
        teamName: selectedTeam?.name,
      }),
    });
  };

  const submitIdeaOld = async (title: string, description: string, priority: string) => {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: description,
        category: "Feature Request",
        type: "idea",
        title: title,
        priority: priority,
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
          <div className="text-xs font-medium text-muted-foreground mb-3 flex items-center justify-between">
            <span>Workspace</span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
              {teams.length}
            </span>
          </div>
          <div className="relative">
            <button
              onClick={() => setTeamMenuOpen((o) => !o)}
              className={`group w-full inline-flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-200 ${
                teams.length > 1 
                  ? "bg-card border-border hover:border-primary/50 hover:shadow-md cursor-pointer" 
                  : "bg-card border-border cursor-pointer"
              }`}
              aria-expanded={teamMenuOpen}
              aria-haspopup="listbox"
              role="combobox"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-all ${
                  selectedTeam 
                    ? "bg-gradient-to-br from-green-400 to-green-500 shadow-sm animate-pulse" 
                    : "bg-muted-foreground/40"
                }`} />
                <span className="font-medium text-foreground truncate">
                  {selectedTeam?.name || "Personal Workspace"}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-all duration-200 text-muted-foreground group-hover:text-primary ${
                teamMenuOpen ? "rotate-180" : ""
              }`} />
            </button>
            
            <AnimatePresence>
              {teamMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  className="absolute top-full left-0 right-0 mt-2 z-50"
                >
                  <div className="bg-card border border-border rounded-lg shadow-xl overflow-hidden backdrop-blur-sm">
                    {/* Simplified header */}
                    <div className="px-4 py-2 border-b border-border bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          Switch Workspace
                        </span>
                      </div>
                    </div>
                    
                    {/* Workspace options */}
                    <div className="max-h-56 overflow-y-auto custom-scrollbar">
                      <div className="p-2 space-y-1">
                        {/* Personal Workspace Option */}
                        <motion.button
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0, duration: 0.15 }}
                          onClick={() => {
                            setSelectedTeamId(null);
                            setTeamMenuOpen(false);
                          }}
                          className={`group w-full text-left px-3 py-2.5 rounded-md text-sm transition-all duration-150 ${
                            !selectedTeamId 
                              ? "bg-primary text-primary-foreground shadow-sm" 
                              : "text-foreground hover:bg-muted/60"
                          }`}
                          role="option"
                          aria-selected={!selectedTeamId}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all ${
                              !selectedTeamId 
                                ? "bg-primary-foreground" 
                                : "bg-muted-foreground/50 group-hover:bg-foreground/70"
                            }`} />
                            <span className="font-medium">Personal Workspace</span>
                            {!selectedTeamId && (
                              <div className="ml-auto">
                                <div className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
                              </div>
                            )}
                          </div>
                        </motion.button>
                        
                        {/* Team separator */}
                        {teams.length > 0 && (
                          <div className="border-t border-border my-2" />
                        )}
                        
                        {/* Team list */}
                        {teams.map((t, index) => (
                          <motion.button
                            key={t.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: (index + 1) * 0.02, duration: 0.15 }}
                            onClick={() => {
                              setSelectedTeamId(t.id);
                              setTeamMenuOpen(false);
                            }}
                            className={`group w-full text-left px-3 py-2.5 rounded-md text-sm transition-all duration-150 ${
                              selectedTeamId === t.id 
                                ? "bg-primary text-primary-foreground shadow-sm" 
                                : "text-foreground hover:bg-muted/60"
                            }`}
                            role="option"
                            aria-selected={selectedTeamId === t.id}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all ${
                                selectedTeamId === t.id 
                                  ? "bg-primary-foreground" 
                                  : "bg-muted-foreground/50 group-hover:bg-foreground/70"
                              }`} />
                              
                              <span className="font-medium truncate flex-1">{t.name}</span>
                              
                              {selectedTeamId === t.id && (
                                <div className="ml-auto">
                                  <div className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
                                </div>
                              )}
                            </div>
                          </motion.button>
                        ))}
                        
                        {/* Quick create team action */}
                        {teams.length > 0 && (
                          <>
                            <div className="border-t border-border my-2" />
                            <motion.button
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: (teams.length + 1) * 0.02, duration: 0.15 }}
                              onClick={() => {
                                setTeamMenuOpen(false);
                                openModal("create-team", {
                                  onSubmit: async (name: string, description: string) => {
                                    // Handle team creation
                                    const response = await fetch("/api/teams", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ name, description })
                                    });
                                    if (response.ok) {
                                      // Refresh teams
                                      window.location.reload();
                                    }
                                  }
                                });
                              }}
                              className="group w-full text-left px-3 py-2.5 rounded-md text-sm transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-muted/40 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full border border-dashed border-current flex-shrink-0" />
                                <span className="font-medium">Create New Team</span>
                              </div>
                            </motion.button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
            onClick={() => openModal("feedback-studio", {
              onSubmit: submitFeedback
            })}
            className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10"
          >
            <MessageCircle className="h-5 w-5 shrink-0" />
            <span className="truncate">Feedback Studio</span>
          </button>

          {/* Idea Lab */}
          <button
            onClick={() => openModal("idea-lab", {
              onSubmit: submitIdea
            })}
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
              <UserMenu onFeedbackClick={() => openModal("feedback-studio", {
                onSubmit: submitFeedback
              })} />
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
    </div>
  );
}