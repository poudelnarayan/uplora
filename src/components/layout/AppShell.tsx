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
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Workspace</div>
            <div className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {teams.length} {teams.length === 1 ? 'team' : 'teams'}
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setTeamMenuOpen((o) => !o)}
              className={`group w-full inline-flex items-center justify-between px-4 py-3 rounded-xl border border-border text-sm transition-all duration-200 ${
                "bg-gradient-to-r from-card/90 to-card/70 hover:from-card hover:to-card/90 hover:border-primary/50 hover:shadow-xl backdrop-blur-sm cursor-pointer"
              }`}
              aria-expanded={teamMenuOpen}
              aria-haspopup="listbox"
              role="combobox"
              aria-label={`Current team: ${selectedTeam?.name || "No team selected"}. Click to switch teams.`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Enhanced team indicator with pulse animation */}
                <div className="relative flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg animate-pulse" />
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-primary/30 animate-ping" />
                </div>
                <span className="font-medium text-foreground truncate">
                  {selectedTeam?.name || (teams.length === 0 ? "Personal Workspace" : teams[0]?.name)}
                </span>
                {/* Team role indicator */}
                {selectedTeam && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                    Owner
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ChevronDown className={`w-4 h-4 transition-all duration-300 ${
                    teamMenuOpen ? "rotate-180" : ""
                  } group-hover:text-primary group-hover:scale-110`} />
              </div>
            </button>
            
            <AnimatePresence>
              {teamMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute top-full left-0 right-0 mt-3 z-50"
              >
                {/* Glassmorphism Container */}
                <div className="relative">
                  {/* Backdrop blur effect */}
                  <div className="absolute inset-0 bg-background/40 backdrop-blur-md rounded-2xl border border-border/50 shadow-2xl" />
                  
                  {/* Content container */}
                  <div className="relative p-2 space-y-1">
                    {/* Header with team count */}
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 25,
                    duration: 0.2
                  }}
                  className="absolute top-full left-0 right-0 mt-2 z-50"
                  role="listbox"
                  aria-label="Team selection menu"
                        <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                  {/* Enhanced Glassmorphism Container */}
                        </span>
                    {/* Multi-layer backdrop for enhanced depth */}
                    <div className="absolute inset-0 bg-gradient-to-br from-background/30 via-background/20 to-background/30 backdrop-blur-xl rounded-2xl border border-border/40 shadow-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent rounded-2xl" />
                    
                    {/* Team options */}
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {teams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTeamId(t.id);
                      setTeamMenuOpen(false);
                    }}
                    className={`group w-full text-left px-3 py-3 rounded-xl text-sm transition-all duration-200 ${
                      selectedTeamId === t.id 
                        ? "bg-primary/20 text-primary border border-primary/30 shadow-sm" 
                        : "text-foreground/90 hover:bg-foreground/5 hover:text-foreground hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Team indicator dot */}
                      {/* Enhanced team options with better grouping */}
                      <div className="max-h-72 overflow-y-auto enhanced-scrollbar">
                        {/* Personal workspace option */}
                        <button
                          onClick={() => {
                            setSelectedTeamId(null);
                            setTeamMenuOpen(false);
                          }}
                          className={`group w-full text-left px-3 py-3 rounded-xl text-sm transition-all duration-200 mb-2 ${
                            !selectedTeamId 
                              ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border border-primary/30 shadow-sm" 
                              : "text-foreground/90 hover:bg-gradient-to-r hover:from-foreground/5 hover:to-foreground/10 hover:text-foreground hover:shadow-sm"
                          }`}
                          role="option"
                          aria-selected={!selectedTeamId}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                              !selectedTeamId 
                                ? "bg-gradient-to-br from-primary to-secondary shadow-sm" 
                                : "bg-muted-foreground/40 group-hover:bg-foreground/60"
                            }`} />
                            
                            <div className="min-w-0 flex-1">
                              <div className="font-medium">Personal Workspace</div>
                              <div className="text-xs text-muted-foreground/80 group-hover:text-muted-foreground">
                                Your individual content
                              </div>
                            </div>
                            
                            {!selectedTeamId && (
                              <div className="flex items-center gap-1">
                                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                </div>
                                <span className="text-xs font-medium text-primary">Active</span>
                              </div>
                            )}
                          </div>
                        </button>
                        
                        {/* Team separator */}
                        {teams.length > 0 && (
                          <div className="flex items-center gap-2 px-3 py-2">
                            <div className="flex-1 h-px bg-border/50" />
                            <span className="text-xs text-muted-foreground font-medium">Teams</span>
                            <div className="flex-1 h-px bg-border/50" />
                          </div>
                        )}
                        
                        {/* Team list with staggered animations */}
                        {teams.map((t, index) => (
                          : "bg-muted-foreground/40 group-hover:bg-foreground/60"
                      }`} />
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                      
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{t.name}</div>
                    {t.description && (
                    <div className="relative p-3 space-y-2">
                      {/* Enhanced header with search */}
                        ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border border-primary/30 shadow-sm" 
                        : "text-foreground/90 hover:bg-gradient-to-r hover:from-foreground/5 hover:to-foreground/10 hover:text-foreground hover:shadow-sm"
                          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    role="option"
                    aria-selected={selectedTeamId === t.id}
                            Switch Workspace
                      {/* Selected indicator */}
                      {/* Enhanced team indicator with gradient */}
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          ? "bg-gradient-to-br from-primary to-secondary shadow-sm" 
                        
                        {/* Search bar for 4+ teams */}
                        {teams.length >= 4 && (
                          <div className="relative">
                        <div className="font-medium truncate flex items-center gap-2">
                          {t.name}
                          {/* Team type indicator */}
                          <span className="text-xs px-1.5 py-0.5 rounded bg-secondary/20 text-secondary font-medium">
                            Team
                          </span>
                        </div>
                        {t.description && (
                          <div className="text-xs text-muted-foreground/80 truncate mt-1 group-hover:text-muted-foreground">
                              className="w-full pl-8 pr-3 py-2 text-xs bg-background/60 backdrop-blur-sm border border-border/50 rounded-lg focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                              autoComplete="off"
                        )}
                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {/* Enhanced selected indicator with animation */}
                              </svg>
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          </div>
                          <span className="text-xs font-medium text-primary">Active</span>
                        )}
                      )}
                    </div>
                  </button>
                ))}
                        
                        {/* Quick create team action */}
                        <div className="mt-3 pt-2 border-t border-border/30">
                          <button
                            onClick={() => {
                              setTeamMenuOpen(false);
                              openModal("create-team", {
                                onSubmit: async (name: string, description: string) => {
                                  // This would need to be connected to the actual create team handler
                                  console.log("Create team:", name, description);
                                }
                              });
                            }}
                            className="group w-full text-left px-3 py-3 rounded-xl text-sm transition-all duration-200 border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-current flex-shrink-0" />
                              <div className="font-medium">Create New Team</div>
                              <div className="ml-auto">
                                <Plus className="w-4 h-4" />
                              </div>
                            </div>
                          </button>
                        </div>
                    </div>
                  </div>
                </div>
              )}
            </AnimatePresence>
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