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
  CreditCard,
  ChevronDown,
  Menu,
  X,
  MessageCircle,
  Lightbulb,
  Plus,
} from "lucide-react";
import { useTeam } from "@/context/TeamContext";
import NotificationCenter from "@/components/ui/NotificationCenter/NotificationCenter";
import FeedbackStudio from "@/components/ui/FeedbackStudio/FeedbackStudio";
import IdeaLab from "@/components/ui/IdeaLab/IdeaLab";
import UserMenu from "@/components/ui/UserMenu/UserMenu";
import ThemeToggle from "@/components/ui/ThemeToggle/ThemeToggle";
import NotificationBell from "@/components/ui/NotificationBell/NotificationBell";
import TrialBanner from "@/components/ui/TrialBanner/TrialBanner";
import { usePathname as usePathnameForFeedback } from "next/navigation";
import { useModalManager } from "@/components/ui/Modal";
import { useSubscription } from "@/hooks/useSubscription";

const routes = [
  { href: "/dashboard", label: "Dashboard", icon: Video },
  { href: "/upload", label: "Make Post", icon: Upload },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/subscription", label: "Subscription", icon: CreditCard },
  { href: "/social", label: "Social", icon: Plus },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const pathForFeedback = usePathnameForFeedback();
  const { teams, selectedTeam, selectedTeamId, setSelectedTeamId } = useTeam();
  const { isTrialActive, isTrialExpired, trialDaysRemaining } = useSubscription();

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
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-border">
        {/* Header */}
        <div className="flex items-center h-16 px-4 bg-card border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground" style={{ fontFamily: 'Inter, Open Sans, sans-serif' }}>Uplora</span>
          </div>
        </div>

        {/* Team Selector */}
        <div className="p-4">
         {/* Conditional workspace selector based on user scenario */}
         {teams.length === 0 ? (
           /* Scenario 1: Personal-only user - No switcher needed */
           <div className="px-4 py-3 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
             <div className="flex items-center gap-3">
               <div className="w-3 h-3 rounded-full bg-gradient-to-br from-primary to-secondary animate-pulse shadow-sm" />
               <div>
                 <span className="font-semibold text-foreground block" style={{ fontFamily: 'Inter, Open Sans, sans-serif' }}>Personal Workspace</span>
                 <span className="text-xs text-muted-foreground" style={{ fontFamily: 'Inter, Open Sans, sans-serif' }}>Your private video space</span>
               </div>
             </div>
           </div>
         ) : (
           /* Scenario 2 & 3: Users with teams - Show full switcher */
           <>
             <div className="text-xs font-medium text-muted-foreground mb-3 flex items-center justify-between">
               <span style={{ fontFamily: 'Inter, Open Sans, sans-serif' }}>Workspace</span>
               <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold" style={{ fontFamily: 'Inter, Open Sans, sans-serif' }}>
                 {teams.length + 1} spaces
               </span>
             </div>
             <div className="relative">
               <button
                 onClick={() => setTeamMenuOpen((o) => !o)}
                 className="group w-full inline-flex items-center justify-between px-4 py-3 rounded-lg border bg-card border-border hover:border-primary/50 hover:shadow-md cursor-pointer transition-all duration-200"
                 aria-expanded={teamMenuOpen}
                 aria-haspopup="listbox"
                 role="combobox"
                 aria-label={`Current workspace: ${selectedTeam?.name || "Personal Workspace"}`}
               >
                 <div className="flex items-center gap-3 min-w-0">
                   <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-all ${
                     selectedTeam 
                       ? "bg-gradient-to-br from-blue-400 to-blue-500 shadow-sm animate-pulse" 
                       : "bg-gradient-to-br from-primary to-secondary shadow-sm animate-pulse"
                   }`} />
                   <span className="font-semibold text-foreground truncate">
                     {selectedTeam?.name || "Personal Workspace"}
                   </span>
                 </div>
                 <ChevronDown className={`w-4 h-4 transition-all duration-200 text-muted-foreground group-hover:text-primary group-hover:scale-110 ${
                   teamMenuOpen ? "rotate-180" : ""
                 }`} />
               </button>
               
               <AnimatePresence>
                 {teamMenuOpen && (
                   <MotionDiv
                     initial={{ opacity: 1, y: -8, scale: 0.98 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: -8, scale: 0.98 }}
                     transition={{ duration: 0.12, ease: "easeOut" }}
                     className="absolute top-full left-0 right-0 mt-2 z-50"
                   >
                     <div className="bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-2xl overflow-hidden">
                       {/* Enhanced header with workspace count */}
                       <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-muted/20 to-muted/10">
                         <div className="flex items-center justify-between">
                           <span className="text-sm font-semibold text-foreground">
                             Switch Workspace
                           </span>
                           <div className="flex items-center gap-2">
                             <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                               {teams.length + 1} spaces
                             </span>
                           </div>
                         </div>
                         
                         {/* Smart search for 4+ total spaces (including personal) */}
                         {teams.length >= 3 && (
                           <div className="mt-3">
                             <div className="relative">
                               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                 <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                 </svg>
                               </div>
                               <input
                                 type="text"
                                 placeholder="Search workspaces..."
                                 className="w-full pl-10 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                               />
                             </div>
                           </div>
                         )}
                       </div>
                       
                       {/* Workspace options with clear hierarchy */}
                       <div className="max-h-72 overflow-y-auto enhanced-scrollbar">
                         <div className="p-2 space-y-1">
                           {/* Personal Workspace - Always first */}
                           <MotionDiv
                             initial={{ opacity: 1, x: 0 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: 0, duration: 0.15 }}
                             onClick={() => {
                               setSelectedTeamId(null);
                               setTeamMenuOpen(false);
                             }}
                             className={`group w-full text-left px-3 py-3 rounded-lg text-sm transition-all duration-200 ${
                               !selectedTeamId 
                                 ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md" 
                                 : "text-foreground hover:bg-muted/80 hover:shadow-sm"
                             }`}
                             role="option"
                             aria-selected={!selectedTeamId}
                           >
                             <div className="flex items-center gap-3">
                               <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all ${
                                 !selectedTeamId 
                                   ? "bg-primary-foreground animate-pulse shadow-sm" 
                                   : "bg-gradient-to-br from-primary to-secondary group-hover:scale-110"
                               }`} />
                               <div className="flex-1 min-w-0">
                                 <span className="font-semibold">Personal Workspace</span>
                               </div>
                               {!selectedTeamId && (
                                 <div className="flex items-center gap-1">
                                   <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-ping" />
                                   <span className="text-xs font-medium opacity-90">Active</span>
                                 </div>
                               )}
                             </div>
                           </MotionDiv>
                           
                           {/* Team separator with label */}
                           <div className="flex items-center gap-2 px-3 py-2">
                             <div className="flex-1 border-t border-border" />
                             <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                               Teams ({teams.length})
                             </span>
                             <div className="flex-1 border-t border-border" />
                           </div>
                           
                           {/* Team list with enhanced styling */}
                           {teams.map((t, index) => (
                             <MotionDiv
                               key={t.id}
                               initial={{ opacity: 1, x: 0 }}
                               animate={{ opacity: 1, x: 0 }}
                               transition={{ delay: (index + 1) * 0.02, duration: 0.15 }}
                               onClick={() => {
                                 setSelectedTeamId(t.id);
                                 setTeamMenuOpen(false);
                               }}
                               className={`group w-full text-left px-3 py-3 rounded-lg text-sm transition-all duration-200 ${
                                 selectedTeamId === t.id 
                                   ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md" 
                                   : "text-foreground hover:bg-muted/80 hover:shadow-sm"
                               }`}
                               role="option"
                               aria-selected={selectedTeamId === t.id}
                             >
                               <div className="flex items-center gap-3">
                                 <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all ${
                                   selectedTeamId === t.id 
                                     ? "bg-white animate-pulse shadow-sm" 
                                     : "bg-blue-400/60 group-hover:bg-blue-500 group-hover:scale-110"
                                 }`} />
                                 
                                 <span className="font-semibold truncate flex-1">{t.name}</span>
                                 
                                 {selectedTeamId === t.id && (
                                   <div className="flex items-center gap-1">
                                     <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                     <span className="text-xs font-medium opacity-90">Active</span>
                                   </div>
                                 )}
                               </div>
                             </MotionDiv>
                           ))}
                           
                           {/* Quick create team action */}
                           <div className="border-t border-border my-2" />
                           <MotionDiv
                             initial={{ opacity: 1, x: 0 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: (teams.length + 2) * 0.02, duration: 0.15 }}
                             onClick={() => {
                               setTeamMenuOpen(false);
                               openModal("create-team", {
                                 onSubmit: async (name: string, description: string) => {
                                   try {
                                     const response = await fetch("/api/teams", {
                                       method: "POST",
                                       headers: { "Content-Type": "application/json" },
                                       body: JSON.stringify({ name, description })
                                     });
                                     if (response.ok) {
                                       // Refresh teams context instead of full page reload
                                       window.location.reload();
                                     } else {
                                       const error = await response.json();
                                       throw new Error(error.error || "Failed to create team");
                                     }
                                   } catch (error) {
                                     console.error("Team creation error:", error);
                                     throw error;
                                   }
                                 }
                               });
                             }}
                             className="group w-full text-left px-3 py-3 rounded-lg text-sm transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10 border-2 border-dashed border-muted-foreground/30 hover:border-green-500/50"
                           >
                             <div className="flex items-center gap-3">
                               <div className="w-2.5 h-2.5 rounded-full border border-dashed border-current flex-shrink-0 group-hover:border-green-500" />
                               <span className="font-medium">Create New Team</span>
                               <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Plus className="w-4 h-4" />
                               </div>
                             </div>
                           </MotionDiv>
                         </div>
                       </div>
                     </div>
                   </MotionDiv>
                 )}
               </AnimatePresence>
             </div>
           </>
         )}
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
      <main className="flex-1 lg:ml-64 ml-0">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-card backdrop-blur-none lg:bg-card/95 lg:backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 py-3">
            {/* Left side - Icons and Mobile Menu */}
            <div className="flex items-center gap-3">
              {/* Perfect Circle Icons - Always Visible */}
              <div className="hidden lg:flex items-center gap-2">
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
              className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-card border-r border-border shadow-2xl z-50 lg:hidden flex flex-col"
              style={{ backgroundColor: 'rgb(var(--card))' }}
            >
              <header className="h-auto flex items-center justify-between p-4 border-b border-border bg-card" style={{ backgroundColor: 'rgb(var(--card))' }}>
                <Image src="/text-logo.png" alt="Uplora" width={120} height={30} className="rounded-md block" />
                <button onClick={() => setMobileNavOpen(false)} className="btn btn-ghost btn-sm">
                  <X className="w-4 h-4" />
                </button>
              </header>
              
              <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto bg-card" style={{ backgroundColor: 'rgb(var(--card))' }}>
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
                      style={{ fontFamily: 'Inter, "Open Sans", sans-serif' }}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </Link>
                  );
                })}
              </nav>
              {/* Mobile Footer Links */}
              <div className="border-t border-border px-4 py-4 bg-card" style={{ backgroundColor: 'rgb(var(--card))' }}>
                <div className="text-[11px] text-muted-foreground space-y-2">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <Link href="/about" className="hover:text-foreground transition-colors" onClick={() => setMobileNavOpen(false)}>About</Link>
                    <Link href="/copyright" className="hover:text-foreground transition-colors" onClick={() => setMobileNavOpen(false)}>Copyright</Link>
                    <Link href="/contact" className="hover:text-foreground transition-colors" onClick={() => setMobileNavOpen(false)}>Contact</Link>
                    <Link href="/terms" className="hover:text-foreground transition-colors" onClick={() => setMobileNavOpen(false)}>Terms</Link>
                    <Link href="/privacy" className="hover:text-foreground transition-colors" onClick={() => setMobileNavOpen(false)}>Privacy</Link>
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