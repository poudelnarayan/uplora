"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div as any;
const MotionAside = motion.aside as any;
import {
  Video,
  Upload,
  Users,
  Settings,
  ChevronDown,
  Menu,
  X,
  MessageCircle,
  Lightbulb,
  Plus,
  Clock,
  Calendar,
  CheckCircle,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { useTeam } from "@/context/TeamContext";
import NotificationCenter from "@/app/components/ui/NotificationCenter/NotificationCenter";
import FeedbackStudio from "@/app/components/ui/FeedbackStudio/FeedbackStudio";
import IdeaLab from "@/app/components/ui/IdeaLab/IdeaLab";
import UserMenu from "@/app/components/ui/UserMenu/UserMenu";
import ThemeToggle from "@/app/components/ui/ThemeToggle/ThemeToggle";
import NotificationBell from "@/app/components/ui/NotificationBell/NotificationBell";
import TrialBanner from "@/app/components/ui/TrialBanner/TrialBanner";
import SubscriptionBadge from "@/app/components/ui/SubscriptionBadge";
import { usePathname as usePathnameForFeedback } from "next/navigation";
import { useModalManager } from "@/app/components/ui/Modal";
import { useSubscription } from "@/hooks/useSubscription";
import { useNotifications } from "@/app/components/ui/Notification";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";

const routes = [
  { href: "/dashboard", label: "Dashboard", icon: Video },
  { href: "/make-post", label: "Make Post", icon: Upload },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/social", label: "Social", icon: Plus },
];

const postRoutes = [
  { href: "/posts/all", label: "All", icon: FileText },
  { href: "/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/posts/posted", label: "Posted", icon: CheckCircle },
  { href: "/posts/scheduled", label: "Scheduled", icon: Calendar },
  { href: "/posts/timeline", label: "Timeline", icon: Clock },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const pathForFeedback = usePathnameForFeedback();
  const { teams, personalTeam, selectedTeam, selectedTeamId, setSelectedTeamId } = useTeam();
  const { isTrialActive, isTrialExpired, trialDaysRemaining } = useSubscription();
  const notifications = useNotifications();

  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showFeedbackStudio, setShowFeedbackStudio] = useState(false);
  const [showIdeaLab, setShowIdeaLab] = useState(false);
  const { openModal } = useModalManager();

  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);
  const [switchingWorkspace, setSwitchingWorkspace] = useState(false);
  const [switchTargetId, setSwitchTargetId] = useState<string | null>(null);

  const workspaces = useMemo(() => {
    const list: Array<{ id: string; name: string }> = [];
    if (personalTeam?.id) list.push({ id: personalTeam.id, name: personalTeam.name || "Personal Workspace" });
    for (const t of teams || []) list.push({ id: t.id, name: t.name });
    return list;
  }, [teams, personalTeam]);

  const switchTargetName = useMemo(() => {
    const id = switchTargetId || selectedTeamId;
    const w = workspaces.find((x) => x.id === id);
    return w?.name || "workspace";
  }, [switchTargetId, selectedTeamId, workspaces]);

  const startWorkspaceSwitch = (nextId: string) => {
    if (!nextId || nextId === selectedTeamId) {
      setWorkspaceDialogOpen(false);
      return;
    }
    setSwitchTargetId(nextId);
    setSwitchingWorkspace(true);
    setWorkspaceDialogOpen(false);
    setSelectedTeamId(nextId);
  };

  // Hide the switching overlay once the selection is applied (small delay for nicer UX)
  useEffect(() => {
    if (!switchingWorkspace) return;
    if (!switchTargetId) return;
    if (selectedTeamId !== switchTargetId) return;
    const t = window.setTimeout(() => {
      setSwitchingWorkspace(false);
      setSwitchTargetId(null);
    }, 450);
    return () => window.clearTimeout(t);
  }, [switchingWorkspace, switchTargetId, selectedTeamId]);

  // Feedback handlers with proper notifications
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
          notifications.addNotification({
            type: "success",
            title: "Feedback Sent!",
            message: "Your feedback has been sent successfully."
          });
          return { success: true, message: "Feedback submitted and email sent successfully!" };
        } else {
          notifications.addNotification({
            type: "warning",
            title: "Feedback Submitted",
            message: "Your feedback was submitted, but email delivery failed. We've logged it for review."
          });
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
      notifications.addNotification({
        type: "error",
        title: "Submission Failed",
        message: error instanceof Error ? error.message : "Failed to submit feedback"
      });
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
          notifications.addNotification({
            type: "success",
            title: "Idea Submitted!",
            message: "Your idea has been brainstormed successfully."
          });
          return { success: true, message: "Idea submitted and email sent successfully!" };
        } else {
          notifications.addNotification({
            type: "warning",
            title: "Idea Submitted",
            message: "Your idea was submitted, but email delivery failed. We've logged it for review."
          });
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
      notifications.addNotification({
        type: "error",
        title: "Submission Failed",
        message: error instanceof Error ? error.message : "Failed to submit idea"
      });
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
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-sidebar border-r border-sidebar-border">
        {/* Header */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-sidebar-border bg-sidebar">
          <div className="flex items-center">
            <Image src="/text-logo.png" alt="Uplora" width={240} height={60} className="h-16 w-auto" />
          </div>
        </div>

        {/* Workspace switcher (team/personal) */}
        <div className="px-3 py-4 border-b border-sidebar-border bg-sidebar">
          <div className="text-[11px] font-semibold text-sidebar-foreground/60 uppercase tracking-wider px-1 mb-2">
            Workspace
          </div>
          <Button
            variant="outline"
            className="w-full justify-between bg-sidebar-accent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/80"
            onClick={() => setWorkspaceDialogOpen(true)}
          >
            <span className="truncate">{selectedTeam?.name?.includes("Personal") ? "Personal Workspace" : selectedTeam?.name || "Select workspace"}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
          </Button>
           
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 bg-sidebar">
          {/* Main Navigation */}
          {routes.map(({ href, label, icon: Icon }) => {
            const active = path === href || path.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sage border border-sidebar-border"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}

          {/* Post Navigation Section */}
          <div className="my-6 mx-3 border-t border-sidebar-border pt-4" />
          <div className="px-3 pb-2">
            <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">Posts</h3>
          </div>
          {postRoutes.map(({ href, label, icon: Icon }) => {
            const active = path === href || path.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sage border border-sidebar-border"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}

          {/* Creative Action Buttons */}
          <div className="my-6 mx-3 border-t border-sidebar-border pt-4" />
          
          {/* Feedback / Feature Requests */}
          <button
            onClick={() =>
              openModal("feedback-hub", {
                onSubmitFeedback: submitFeedback,
                onSubmitIdea: submitIdea,
                defaultTab: "feedback",
              })
            }
            className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <MessageCircle className="h-5 w-5 shrink-0" />
            <span className="truncate">Feedback</span>
          </button>
        </nav>

        {/* User Profile Menu */}
        <div className="border-t border-sidebar-border p-4 bg-sidebar/60" style={{ position: 'relative' }}>
          {/* Subscription Badge */}
          <div className="mb-3">
            <SubscriptionBadge />
          </div>
          
          <div style={{ position: 'relative', zIndex: 50 }}>
            <UserMenu
              dropdownPosition="top"
              onFeedbackClick={() =>
                openModal("feedback-hub", {
                  onSubmitFeedback: submitFeedback,
                  onSubmitIdea: submitIdea,
                  defaultTab: "feedback",
                })
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-sidebar-border px-4 py-3 bg-sidebar">
          <div className="text-[11px] text-sidebar-foreground/60 space-y-2">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <Link href="/about" className="hover:text-sidebar-foreground transition-colors">About</Link>
              <Link href="/copyright" className="hover:text-sidebar-foreground transition-colors">Copyright</Link>
              <Link href="/contact" className="hover:text-sidebar-foreground transition-colors">Contact</Link>
              <Link href="/terms" className="hover:text-sidebar-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-sidebar-foreground transition-colors">Privacy</Link>
            </div>
            <div>© {new Date().getFullYear()} Uplora</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 ml-0">
        {/* Mobile Top Bar - Only for mobile */}
        <div className="lg:hidden sticky top-0 z-30 bg-card backdrop-blur-sm border-b border-border">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              {/* Mobile menu button */}
              <button
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Mobile logo */}
              <div className="flex-1 flex justify-center">
                <Image src="/text-logo.png" alt="Uplora" width={160} height={40} className="h-10 w-auto" />
              </div>

              {/* spacer to balance center logo */}
              <div className="w-9" />
            </div>

            {/* Mobile workspace switcher */}
            <div className="mt-3">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Workspace
              </div>
              <Button variant="outline" className="w-full justify-between" onClick={() => setWorkspaceDialogOpen(true)}>
                <span className="truncate">{selectedTeam?.name || "Select workspace"}</span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
              </Button>
            </div>
          </div>
        </div>

        {/* Workspace selection dialog */}
        <Dialog open={workspaceDialogOpen} onOpenChange={setWorkspaceDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Switch workspace</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {workspaces.map((w) => (
                <button
                  key={w.id}
                  className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                    selectedTeamId === w.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                  }`}
                  onClick={() => startWorkspaceSwitch(w.id)}
                >
                  <div className="font-medium text-foreground truncate">{w.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedTeamId === w.id ? "Current workspace" : "Tap to switch"}
                  </div>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Switching overlay */}
        <AnimatePresence>
          {switchingWorkspace && (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-background/60 backdrop-blur-sm"
            >
              <MotionDiv
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0 }}
                className="w-[calc(100vw-2rem)] max-w-sm rounded-2xl border bg-card p-6 shadow-2xl text-center"
              >
                <div className="flex justify-center">
                  <LoadingSpinner size="lg" />
                </div>
                <div className="mt-4 text-base font-semibold text-foreground">Changing workspace…</div>
                <div className="mt-1 text-sm text-muted-foreground truncate">
                  Switching to <span className="font-medium text-foreground">{switchTargetName}</span>
                </div>
              </MotionDiv>
            </MotionDiv>
          )}
        </AnimatePresence>

        {/* Page content */}
        <div className="flex flex-col">
          {/* Trial Banner - Hide on make-post flow to keep creation UI clean */}
          {(isTrialActive || isTrialExpired) && path !== "/subscription" && !path.startsWith("/make-post") && (
            <div className="px-4 lg:px-8 pt-6">
              <div className="max-w-6xl mx-auto">
                <TrialBanner onUpgrade={() => window.location.href = "/subscription?tab=plans"} />
              </div>
            </div>
          )}
          
          <div className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
            <div className="max-w-6xl mx-auto w-full">{children}</div>
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-50 lg:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <MotionAside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 w-72 max-w-[85vw] border-r border-sidebar-border shadow-2xl z-50 lg:hidden flex flex-col bg-sidebar"
            >
              <header className="h-auto flex items-center justify-center p-4 border-b border-sidebar-border bg-sidebar">
                <Image src="/text-logo.png" alt="Uplora" width={200} height={50} className="h-14 w-auto rounded-md block" />
                <button onClick={() => setMobileNavOpen(false)} className="absolute right-4 text-sidebar-foreground hover:text-sidebar-foreground p-2">
                  <X className="w-4 h-4" />
                </button>
              </header>
              
              <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto bg-sidebar">
                {/* Main Navigation */}
                {routes.map(({ href, label, icon: Icon }) => {
                  const active = path === href || path.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground border border-sidebar-border"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      }`}
                      style={{ fontFamily: 'Inter, "Open Sans", sans-serif' }}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </Link>
                  );
                })}

                {/* Post Navigation Section */}
                <div className="my-6 mx-3 border-t border-sidebar-border pt-4" />
                <div className="px-3 pb-2">
                  <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">Posts</h3>
                </div>
                {postRoutes.map(({ href, label, icon: Icon }) => {
                  const active = path === href || path.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground border border-sidebar-border"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      }`}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </Link>
                  );
                })}

                {/* Mobile: Feedback / Feature Requests */}
                <div className="my-4 border-t border-sidebar-border pt-3" />
                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    openModal("feedback-hub", { onSubmitFeedback: submitFeedback, onSubmitIdea: submitIdea, defaultTab: "feedback" });
                  }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <MessageCircle className="h-5 w-5 shrink-0" />
                  <span className="truncate">Feedback</span>
                </button>
                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    openModal("feedback-hub", { onSubmitFeedback: submitFeedback, onSubmitIdea: submitIdea, defaultTab: "idea" });
                  }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <Lightbulb className="h-5 w-5 shrink-0" />
                  <span className="truncate">Feature request</span>
                </button>
              </nav>
              {/* Mobile Footer Links */}
              <div className="border-t border-sidebar-border px-4 py-4 bg-sidebar">
                <div className="text-[11px] text-sidebar-foreground/60 space-y-2">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <Link href="/about" className="hover:text-sidebar-foreground transition-colors" onClick={() => setMobileNavOpen(false)}>About</Link>
                    <Link href="/copyright" className="hover:text-sidebar-foreground transition-colors" onClick={() => setMobileNavOpen(false)}>Copyright</Link>
                    <Link href="/contact" className="hover:text-sidebar-foreground transition-colors" onClick={() => setMobileNavOpen(false)}>Contact</Link>
                    <Link href="/terms" className="hover:text-sidebar-foreground transition-colors" onClick={() => setMobileNavOpen(false)}>Terms</Link>
                    <Link href="/privacy" className="hover:text-sidebar-foreground transition-colors" onClick={() => setMobileNavOpen(false)}>Privacy</Link>
                  </div>
                  <div>© {new Date().getFullYear()} Uplora</div>
                </div>
              </div>
            </MotionAside>
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