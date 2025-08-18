"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Sun,
  Moon,
  MessageSquare,
  Lightbulb,
  Heart,
  Bug,
  Sparkles,
  Send,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useNotifications } from "@/components/ui/Notification";
import { useTeam } from "@/context/TeamContext";
import Sidebar from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { data: session } = useSession();
  const notifications = useNotifications();
  const { selectedTeam } = useTeam();
  
  // State management
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showFeatureRequest, setShowFeatureRequest] = useState(false);
  
  // Feedback form state
  const [feedbackType, setFeedbackType] = useState<"bug" | "improvement" | "praise">("improvement");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  
  // Feature request state
  const [featureTitle, setFeatureTitle] = useState("");
  const [featureDescription, setFeatureDescription] = useState("");
  const [featurePriority, setFeaturePriority] = useState<"low" | "medium" | "high">("medium");
  const [featureSubmitted, setFeatureSubmitted] = useState(false);
  const [featureLoading, setFeatureLoading] = useState(false);

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme("light");
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
      if (!target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle feedback submission
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;

    setFeedbackLoading(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: feedbackMessage,
          category: feedbackType,
          includeEmail: true,
          path: window.location.pathname,
          teamId: selectedTeam?.id,
          teamName: selectedTeam?.name
        })
      });

      setFeedbackSubmitted(true);
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackSubmitted(false);
        setFeedbackMessage("");
        setFeedbackType("improvement");
      }, 2000);
    } catch (error) {
      notifications.addNotification({
        type: "error",
        title: "Failed to send feedback",
        message: "Please try again later"
      });
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Handle feature request submission
  const handleFeatureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureTitle.trim() || !featureDescription.trim()) return;

    setFeatureLoading(true);
    try {
      const message = `Feature Request: ${featureTitle}\n\nPriority: ${featurePriority.toUpperCase()}\n\nDescription:\n${featureDescription}`;
      
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          category: "Feature Request",
          includeEmail: true,
          path: window.location.pathname
        })
      });

      setFeatureSubmitted(true);
      setTimeout(() => {
        setShowFeatureRequest(false);
        setFeatureSubmitted(false);
        setFeatureTitle("");
        setFeatureDescription("");
        setFeaturePriority("medium");
      }, 2000);
    } catch (error) {
      notifications.addNotification({
        type: "error",
        title: "Failed to submit request",
        message: "Please try again later"
      });
    } finally {
      setFeatureLoading(false);
    }
  };

  const getFeedbackTypeConfig = (type: "bug" | "improvement" | "praise") => {
    switch (type) {
      case "bug":
        return {
          emoji: "🐛",
          label: "Bug Report",
          color: "text-red-500",
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border-red-200 dark:border-red-800"
        };
      case "improvement":
        return {
          emoji: "✨",
          label: "Improvement",
          color: "text-blue-500",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-200 dark:border-blue-800"
        };
      case "praise":
        return {
          emoji: "❤️",
          label: "Praise",
          color: "text-green-500",
          bg: "bg-green-50 dark:bg-green-900/20",
          border: "border-green-200 dark:border-green-800"
        };
    }
  };

  const getPriorityConfig = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "low":
        return {
          label: "Low Priority",
          color: "text-gray-500",
          bg: "bg-gray-50 dark:bg-gray-900/20",
          border: "border-gray-200 dark:border-gray-800"
        };
      case "medium":
        return {
          label: "Medium Priority",
          color: "text-yellow-500",
          bg: "bg-yellow-50 dark:bg-yellow-900/20",
          border: "border-yellow-200 dark:border-yellow-800"
        };
      case "high":
        return {
          label: "High Priority",
          color: "text-red-500",
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border-red-200 dark:border-red-800"
        };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 lg:ml-80 min-h-screen flex flex-col">
          {/* Top Bar */}
          <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
            <div className="flex items-center justify-between px-6 py-4">
              {/* Team Selector */}
              <div className="flex items-center gap-3">
                {selectedTeam && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm font-medium text-primary">{selectedTeam.name}</span>
                  </div>
                )}
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                >
                  {theme === "dark" ? (
                    <Sun className="w-5 h-5 text-foreground" />
                  ) : (
                    <Moon className="w-5 h-5 text-foreground" />
                  )}
                </button>

                {/* Notifications */}
                <div className="notification-container relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors relative"
                  >
                    <Bell className="w-5 h-5 text-foreground" />
                    {notifications.notifications.length > 0 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                    )}
                  </button>

                  {/* Notification Center */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Bell className="w-5 h-5 text-white" />
                              <h3 className="font-semibold text-white">Notifications</h3>
                            </div>
                            <button
                              onClick={() => setShowNotifications(false)}
                              className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          {notifications.notifications.length === 0 ? (
                            <div className="text-center py-8">
                              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                                <Bell className="w-6 h-6 text-muted-foreground" />
                              </div>
                              <p className="text-sm text-muted-foreground">No notifications yet</p>
                              <p className="text-xs text-muted-foreground mt-1">We'll notify you of important updates</p>
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                              {notifications.notifications.map((notification) => (
                                <div
                                  key={notification.id}
                                  className="p-3 bg-muted/50 rounded-lg border border-border"
                                >
                                  <div className="flex items-start gap-3">
                                    {notification.type === "success" && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />}
                                    {notification.type === "error" && <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />}
                                    {notification.type === "warning" && <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />}
                                    {notification.type === "info" && <Info className="w-4 h-4 text-blue-500 mt-0.5" />}
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-foreground">{notification.title}</p>
                                      {notification.message && (
                                        <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => notifications.removeNotification(notification.id)}
                                      className="p-1 rounded-lg hover:bg-muted transition-colors"
                                    >
                                      <X className="w-3 h-3 text-muted-foreground" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User Menu */}
                <div className="user-menu-container relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-foreground" />
                  </button>

                  {/* User Dropdown */}
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-12 w-72 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        {/* User Profile Header */}
                        <div className="bg-gradient-to-r from-primary to-secondary p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                              <span className="text-lg font-bold text-white">
                                {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">
                                {session?.user?.name || "User"}
                              </p>
                              <p className="text-sm text-white/80 truncate">
                                {session?.user?.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              setShowFeedback(true);
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                          >
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">Send Feedback</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              setShowFeatureRequest(true);
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                          >
                            <Lightbulb className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">Request Feature</span>
                          </button>

                          <div className="border-t border-border my-2"></div>

                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              window.location.href = "/settings";
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                          >
                            <Settings className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">Settings</span>
                          </button>

                          <button
                            onClick={() => signOut()}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left text-red-600"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Feedback Studio Modal */}
      <AnimatePresence>
        {showFeedback && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowFeedback(false)}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {feedbackSubmitted ? (
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Heart className="w-8 h-8 text-green-500" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Thank You!</h3>
                  <p className="text-muted-foreground">Your feedback helps us improve Uplora</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">Feedback Studio</h3>
                          <p className="text-sm text-white/80">Help us improve your experience</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowFeedback(false)}
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <form onSubmit={handleFeedbackSubmit} className="p-6 space-y-6">
                    {/* Feedback Type Selector */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">
                        What type of feedback do you have?
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["bug", "improvement", "praise"] as const).map((type) => {
                          const config = getFeedbackTypeConfig(type);
                          const isSelected = feedbackType === type;
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setFeedbackType(type)}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                isSelected 
                                  ? `${config.bg} ${config.border} ${config.color}` 
                                  : "border-border hover:border-primary/30"
                              }`}
                            >
                              <div className="text-lg mb-1">{config.emoji}</div>
                              <div className="text-xs font-medium">{config.label}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Tell us more
                      </label>
                      <textarea
                        value={feedbackMessage}
                        onChange={(e) => setFeedbackMessage(e.target.value)}
                        placeholder="Share your thoughts, report a bug, or suggest an improvement..."
                        className="w-full h-24 p-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        required
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowFeedback(false)}
                        className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={feedbackLoading || !feedbackMessage.trim()}
                        className="flex-1 px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {feedbackLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2 inline-block" />
                            Send Feedback
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Feature Request Modal */}
      <AnimatePresence>
        {showFeatureRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowFeatureRequest(false)}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {featureSubmitted ? (
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Lightbulb className="w-8 h-8 text-yellow-500" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Idea Received!</h3>
                  <p className="text-muted-foreground">We'll review your feature request and get back to you</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <Lightbulb className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">Idea Lab</h3>
                          <p className="text-sm text-white/80">Share your feature ideas</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowFeatureRequest(false)}
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <form onSubmit={handleFeatureSubmit} className="p-6 space-y-6">
                    {/* Feature Title */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Feature Title
                      </label>
                      <input
                        type="text"
                        value={featureTitle}
                        onChange={(e) => setFeatureTitle(e.target.value)}
                        placeholder="What feature would you like to see?"
                        className="w-full p-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        required
                      />
                    </div>

                    {/* Priority Selector */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">
                        Priority Level
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["low", "medium", "high"] as const).map((priority) => {
                          const config = getPriorityConfig(priority);
                          const isSelected = featurePriority === priority;
                          return (
                            <button
                              key={priority}
                              type="button"
                              onClick={() => setFeaturePriority(priority)}
                              className={`p-3 rounded-lg border-2 transition-all text-center ${
                                isSelected 
                                  ? `${config.bg} ${config.border} ${config.color}` 
                                  : "border-border hover:border-primary/30"
                              }`}
                            >
                              <div className="text-xs font-medium">{config.label}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Description
                      </label>
                      <textarea
                        value={featureDescription}
                        onChange={(e) => setFeatureDescription(e.target.value)}
                        placeholder="Describe your feature idea in detail..."
                        className="w-full h-24 p-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        required
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowFeatureRequest(false)}
                        className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={featureLoading || !featureTitle.trim() || !featureDescription.trim()}
                        className="flex-1 px-4 py-2 text-sm font-medium bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {featureLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2 inline-block" />
                            Submit Idea
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}