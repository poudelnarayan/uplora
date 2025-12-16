"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
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

const routes = [
  { href: "/dashboard", label: "Dashboard", icon: Video },
  { href: "/make-post", label: "Make Post", icon: Upload },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/social", label: "Social", icon: Plus },
];

const postRoutes = [
  { href: "/posts/timeline", label: "Timeline", icon: Clock },
  { href: "/posts/all", label: "All", icon: FileText },
  { href: "/posts/scheduled", label: "Scheduled", icon: Calendar },
  { href: "/posts/posted", label: "Posted", icon: CheckCircle },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const pathForFeedback = usePathnameForFeedback();
  const { teams, selectedTeam, selectedTeamId, setSelectedTeamId } = useTeam();
  const { isTrialActive, isTrialExpired, trialDaysRemaining } = useSubscription();
  const notifications = useNotifications();

  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showFeedbackStudio, setShowFeedbackStudio] = useState(false);
  const [showIdeaLab, setShowIdeaLab] = useState(false);
  const { openModal } = useModalManager();

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
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-border" style={{ backgroundColor: '#213130' }}>
        {/* Header */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-white/20" style={{ backgroundColor: '#213130' }}>
          <div className="flex items-center">
            <Image src="/text-logo.png" alt="Uplora" width={240} height={60} className="h-16 w-auto" />
          </div>
        </div>

        {/* Team Selector removed in sidebar; using top-bar compact switcher */}

        <nav className="flex-1 space-y-1 px-3 py-4" style={{ backgroundColor: '#213130' }}>
          {/* Main Navigation */}
          {routes.map(({ href, label, icon: Icon }) => {
            const active = path === href || path.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30 shadow-sm"
                    : "text-white/70 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}

          {/* Post Navigation Section */}
          <div className="my-6 mx-3 border-t border-white/20 pt-4" />
          <div className="px-3 pb-2">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Posts</h3>
          </div>
          {postRoutes.map(({ href, label, icon: Icon }) => {
            const active = path === href || path.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30 shadow-sm"
                    : "text-white/70 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}

          {/* Creative Action Buttons */}
          <div className="my-6 mx-3 border-t border-white/20 pt-4" />
          
          {/* Feedback Studio */}
          <button
            onClick={() => openModal("feedback-studio", {
              onSubmit: submitFeedback
            })}
            className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-white/70 hover:text-[#00E5FF] hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10"
          >
            <MessageCircle className="h-5 w-5 shrink-0" />
            <span className="truncate">Feedback Studio</span>
          </button>

          {/* Idea Lab */}
          <button
            onClick={() => openModal("idea-lab", {
              onSubmit: submitIdea
            })}
            className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-white/70 hover:text-[#00E5FF] hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-orange-500/10"
          >
            <Lightbulb className="h-5 w-5 shrink-0" />
            <span className="truncate">Idea Lab</span>
          </button>
        </nav>

        {/* User Profile Menu */}
        <div className="border-t border-white/20 p-4 bg-black/30" style={{ position: 'relative' }}>
          {/* Subscription Badge */}
          <div className="mb-3">
            <SubscriptionBadge />
          </div>
          
          <div style={{ position: 'relative', zIndex: 50 }}>
            <UserMenu 
              dropdownPosition="top"
              onFeedbackClick={() => openModal("feedback-studio", {
                onSubmit: submitFeedback
              })} 
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/20 px-4 py-3" style={{ backgroundColor: '#213130' }}>
          <div className="text-[11px] text-white/50 space-y-2">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <Link href="/about" className="hover:text-white/80 transition-colors">About</Link>
              <Link href="/copyright" className="hover:text-white/80 transition-colors">Copyright</Link>
              <Link href="/contact" className="hover:text-white/80 transition-colors">Contact</Link>
              <Link href="/terms" className="hover:text-white/80 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white/80 transition-colors">Privacy</Link>
            </div>
            <div>© {new Date().getFullYear()} Uplora</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 ml-0">
        {/* Mobile Top Bar - Only for mobile */}
        <div className="lg:hidden sticky top-0 z-30 bg-card backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Mobile menu button */}
            <button
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile logo */}
            <div>
              <Image src="/text-logo.png" alt="Uplora" width={180} height={45} className="h-14 w-auto" />
            </div>

            {/* Empty right side */}
            <div className="w-10"></div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex flex-col">
          {/* Trial Banner - Show on all pages except subscription */}
          {(isTrialActive || isTrialExpired) && path !== "/subscription" && (
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
              className="fixed inset-y-0 left-0 w-72 max-w-[85vw] border-r border-border shadow-2xl z-50 lg:hidden flex flex-col"
              style={{ backgroundColor: '#213130' }}
            >
              <header className="h-auto flex items-center justify-center p-4 border-b border-white/20" style={{ backgroundColor: '#213130' }}>
                <Image src="/text-logo.png" alt="Uplora" width={200} height={50} className="h-14 w-auto rounded-md block" />
                <button onClick={() => setMobileNavOpen(false)} className="absolute right-4 text-white hover:text-[#00E5FF] p-2">
                  <X className="w-4 h-4" />
                </button>
              </header>
              
              <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto" style={{ backgroundColor: '#213130' }}>
                {/* Main Navigation */}
                {routes.map(({ href, label, icon: Icon }) => {
                  const active = path === href || path.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? "bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30" 
                          : "text-white/70 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10"
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
                <div className="my-6 mx-3 border-t border-white/20 pt-4" />
                <div className="px-3 pb-2">
                  <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Posts</h3>
                </div>
                {postRoutes.map(({ href, label, icon: Icon }) => {
                  const active = path === href || path.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? "bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30"
                          : "text-white/70 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10"
                      }`}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </Link>
                  );
                })}

                {/* Mobile: Feedback Studio & Idea Lab */}
                <div className="my-4 border-t border-white/20 pt-3" />
                <button
                  onClick={() => { setMobileNavOpen(false); openModal("feedback-studio", { onSubmit: submitFeedback }); }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-white/70 hover:text-[#00E5FF] hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10"
                >
                  <MessageCircle className="h-5 w-5 shrink-0" />
                  <span className="truncate">Feedback Studio</span>
                </button>
                <button
                  onClick={() => { setMobileNavOpen(false); openModal("idea-lab", { onSubmit: submitIdea }); }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-white/70 hover:text-[#00E5FF] hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-orange-500/10"
                >
                  <Lightbulb className="h-5 w-5 shrink-0" />
                  <span className="truncate">Idea Lab</span>
                </button>
              </nav>
              {/* Mobile Footer Links */}
              <div className="border-t border-white/20 px-4 py-4" style={{ backgroundColor: '#213130' }}>
                <div className="text-[11px] text-white/50 space-y-2">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <Link href="/about" className="hover:text-white/80 transition-colors" onClick={() => setMobileNavOpen(false)}>About</Link>
                    <Link href="/copyright" className="hover:text-white/80 transition-colors" onClick={() => setMobileNavOpen(false)}>Copyright</Link>
                    <Link href="/contact" className="hover:text-white/80 transition-colors" onClick={() => setMobileNavOpen(false)}>Contact</Link>
                    <Link href="/terms" className="hover:text-white/80 transition-colors" onClick={() => setMobileNavOpen(false)}>Terms</Link>
                    <Link href="/privacy" className="hover:text-white/80 transition-colors" onClick={() => setMobileNavOpen(false)}>Privacy</Link>
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