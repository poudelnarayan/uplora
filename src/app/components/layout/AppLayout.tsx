"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";

const MotionDiv = motion.div as any;
const MotionAside = motion.aside as any;
import {
  Video,
  Upload,
  Users,
  Settings,
  ChevronsUpDown,
  Menu,
  X,
  MessageCircle,
  Lightbulb,
  Plus,
  Clock,
  Calendar,
  CheckCircle,
  Check,
  FileText,
  ShieldCheck,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { useTeam } from "@/context/TeamContext";
import NotificationCenter from "@/app/components/ui/NotificationCenter/NotificationCenter";
import FeedbackStudio from "@/app/components/ui/FeedbackStudio/FeedbackStudio";
import IdeaLab from "@/app/components/ui/IdeaLab/IdeaLab";
import UserMenu from "@/app/components/ui/UserMenu/UserMenu";
import NotificationBell from "@/app/components/ui/NotificationBell/NotificationBell";
import TrialBanner from "@/app/components/ui/TrialBanner/TrialBanner";
import SubscriptionBadge from "@/app/components/ui/SubscriptionBadge";
import { usePathname as usePathnameForFeedback } from "next/navigation";
import { useModalManager } from "@/app/components/ui/Modal";
import { useSubscription } from "@/hooks/useSubscription";
import { useNotifications } from "@/app/components/ui/Notification";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { getTeamDisplayName, PERSONAL_SPACE_LABEL } from "@/lib/teamDisplay";

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
  const { user } = useUser();
  const { signOut } = useClerk();
  const showWorkspaceSwitcher = (teams?.length ?? 0) > 0;
  const { isTrialActive, isTrialExpired, trialDaysRemaining } = useSubscription();
  const notifications = useNotifications();

  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showFeedbackStudio, setShowFeedbackStudio] = useState(false);
  const [showIdeaLab, setShowIdeaLab] = useState(false);
  const { openModal } = useModalManager();

  const [switchingWorkspace, setSwitchingWorkspace] = useState(false);
  const [switchTargetId, setSwitchTargetId] = useState<string | null>(null);

  const workspaces = useMemo(() => {
    const list: Array<{ id: string; name: string }> = [];
    if (personalTeam?.id) list.push({ id: personalTeam.id, name: PERSONAL_SPACE_LABEL });
    for (const t of teams || []) list.push({ id: t.id, name: getTeamDisplayName(t, personalTeam?.id) });
    return list;
  }, [teams, personalTeam]);

  const switchTargetName = useMemo(() => {
    const id = switchTargetId || selectedTeamId;
    const w = workspaces.find((x) => x.id === id);
    return w?.name || "workspace";
  }, [switchTargetId, selectedTeamId, workspaces]);

  const startWorkspaceSwitch = (nextId: string) => {
    if (!nextId || nextId === selectedTeamId) return;
    setSwitchTargetId(nextId);
    setSwitchingWorkspace(true);
    // Intentional delay for premium UX + prevents accidental rapid switching
    window.setTimeout(() => {
      setSelectedTeamId(nextId);
    }, 2000);
  };

  // Hide the switching overlay once the selection is applied
  useEffect(() => {
    if (!switchingWorkspace) return;
    if (!switchTargetId) return;
    if (selectedTeamId !== switchTargetId) return;
    const t = window.setTimeout(() => {
      setSwitchingWorkspace(false);
      setSwitchTargetId(null);
    }, 150);
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

  // Combined account + workspace switcher. Trigger is the avatar/name row;
  // the dropdown lists workspaces (with active checkmark) plus settings/sign-out.
  // One-tap switching, no Dialog needed.
  const accountSwitcher = (variant: "sidebar" | "drawer") => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
            "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          )}
        >
          <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center overflow-hidden shrink-0">
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.imageUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm">
              {user?.fullName || user?.primaryEmailAddress?.emailAddress || "Account"}
            </div>
            <div className="text-[11px] text-sidebar-foreground/60 truncate">
              {getTeamDisplayName(selectedTeam, personalTeam?.id)}
            </div>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-[--radix-dropdown-menu-trigger-width] min-w-[240px] max-w-[320px] p-0 overflow-hidden"
      >
        {workspaces.length > 0 && (
          <div className="bg-sidebar-accent/40 dark:bg-sidebar-accent/30 px-1 pt-1 pb-1 border-b border-border">
            <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Workspaces
            </DropdownMenuLabel>
            {workspaces.map((w) => {
              const active = selectedTeamId === w.id;
              return (
                <DropdownMenuItem
                  key={w.id}
                  className={cn(
                    "gap-2 cursor-pointer",
                    active && "bg-sidebar-primary/15 text-sidebar-primary focus:bg-sidebar-primary/20 focus:text-sidebar-primary",
                  )}
                  onSelect={() => {
                    if (variant === "drawer") setMobileNavOpen(false);
                    if (!active) startWorkspaceSwitch(w.id);
                  }}
                >
                  <span className="flex-1 truncate">{w.name}</span>
                  {active && <Check className="h-4 w-4 shrink-0" />}
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
        <div className="p-1">
          <DropdownMenuItem asChild>
            <Link
              href="/settings"
              onClick={() => variant === "drawer" && setMobileNavOpen(false)}
              className="gap-2 cursor-pointer"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
            onSelect={() => {
              if (variant === "drawer") setMobileNavOpen(false);
              signOut();
            }}
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-sidebar border-r border-sidebar-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-sidebar-border bg-sidebar">
          <div className="flex items-center">
            <Image src="/text-logo.png" alt="Uplora" width={240} height={60} className="h-16 w-auto" />
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-3 bg-sidebar">
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
          <div className="my-5 mx-3 border-t border-sidebar-border pt-4" />
          
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

        {/* Bottom area (no divider under Feedback; keep footer always visible on small heights) */}
        <div className="mt-auto bg-sidebar">
          <div className="px-4 pt-3 pb-2">
            <SubscriptionBadge />
          </div>

          {/* Combined account + workspace switcher (replaces the old workspace
              card at the top + profile link at the bottom). One row, one tap. */}
          <div className="px-3 pb-3">{accountSwitcher("sidebar")}</div>

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
        </div>
      </aside>

      {/* Main Content. min-w-0 + overflow-x-hidden are critical: without
          them, any child wider than the viewport (e.g. an unwrapped button
          row) widens the body and triggers mobile auto-zoom-out. */}
      <main className="flex-1 lg:ml-64 ml-0 min-w-0 overflow-x-hidden">
        {/* Mobile Top Bar — slim, just the menu trigger. The Uplora logo
            lives inside the drawer header (and the desktop sidebar), so
            we don't repeat it here. Keeps content space maximized. */}
        <div className="lg:hidden sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-border">
          <div className="px-2 py-2 flex items-center">
            <button
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>


        {/* Switching overlay */}
        <AnimatePresence>
          {switchingWorkspace && (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md"
            >
              <MotionDiv
                initial={{ scale: 0.98, opacity: 0, y: 6 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.98, opacity: 0, y: 6 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-border bg-card shadow-strong p-6"
              >
                <div className="flex items-center gap-4">
                  {/* Spinner ring outside the settings icon */}
                  <div className="relative h-14 w-14 shrink-0">
                    <div className="absolute inset-0 rounded-full border-4 border-muted" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Settings className="h-6 w-6 text-foreground" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-foreground">Switching workspace</div>
                    <div className="mt-0.5 text-sm text-muted-foreground truncate">
                      Changing to <span className="font-medium text-foreground">{switchTargetName}</span>
                    </div>
                  </div>
                </div>
              </MotionDiv>
            </MotionDiv>
          )}
        </AnimatePresence>

        {/* Page content */}
        <div className="flex flex-col min-h-screen">
          {/* Trial Banner - Hide on make-post flow to keep creation UI clean */}
          {(isTrialActive || isTrialExpired) && path !== "/subscription" && !path.startsWith("/make-post") && (
            <div className="px-4 lg:px-8 pt-6">
              <div className="max-w-6xl mx-auto">
                <TrialBanner onUpgrade={() => window.location.href = "/subscription?tab=plans"} />
              </div>
            </div>
          )}

          {/* make-post pages: no padding/max-width constraints, page owns its layout */}
          {path.startsWith("/make-post") ? (
            <div className="flex-1">{children}</div>
          ) : (
            <div className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
              <div className="max-w-6xl mx-auto w-full">{children}</div>
            </div>
          )}
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
              
              <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto no-scrollbar bg-sidebar">
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

                {/* Mobile: Feedback (modal contains both Feedback + Feature request tabs) */}
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
              </nav>
              {/* Mobile account + workspace switcher (above the legal links) */}
              <div className="border-t border-sidebar-border px-3 py-3 bg-sidebar">
                {accountSwitcher("drawer")}
              </div>
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