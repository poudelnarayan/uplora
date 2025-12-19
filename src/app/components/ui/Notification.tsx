"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div as any;
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

export interface NotificationProps {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  sticky?: boolean;
  stickyConditions?: {
    dismissOnRouteChange?: boolean;
    dismissAfterSeconds?: number;
  };
}

interface NotificationContextType {
  notifications: NotificationProps[];
  addNotification: (notification: Omit<NotificationProps, "id">) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);
  const pathname = usePathname();
  const { user } = useUser();

  const addNotification = useCallback((notification: Omit<NotificationProps, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const shouldSticky = notification.sticky ?? (notification.type === "error");
    const stickyConditions = shouldSticky
      ? (notification.stickyConditions || { dismissOnRouteChange: true })
      : notification.stickyConditions;
    const defaultDuration = shouldSticky ? 0 : (notification.duration || 3000);
    const newNotification = { ...notification, id, sticky: shouldSticky, stickyConditions, duration: defaultDuration } as NotificationProps;
    // Add to existing notifications instead of replacing
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Keep max 5 notifications
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Handle route changes for sticky notifications
  useEffect(() => {
    const notificationsToRemove = notifications.filter(notification => 
      notification.sticky && notification.stickyConditions?.dismissOnRouteChange
    );
    
    notificationsToRemove.forEach(notification => {
      removeNotification(notification.id);
    });
  }, [pathname, notifications, removeNotification]);

  // Auto-remove notifications after duration (including sticky conditions)
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    notifications.forEach(notification => {
      if (notification.sticky && notification.stickyConditions?.dismissAfterSeconds) {
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.stickyConditions.dismissAfterSeconds * 1000);
        timers.push(timer);
      } else if (notification.duration && notification.duration > 0) {
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, removeNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearNotifications }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();
  const { user } = useUser();
  // Avoid hydration mismatch by rendering after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !notifications.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      <AnimatePresence mode="sync" initial={false}>
        {notifications.map((notification, index) => (
          <MotionDiv
            key={notification.id}
            initial={{ opacity: 0, x: 400, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
            exit={{ opacity: 0, x: 400, scale: 0.9, height: 0, marginBottom: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 25,
              mass: 0.8
            }}
            className={`w-full glass-card text-foreground border-2 rounded-2xl shadow-strong p-4 relative overflow-hidden backdrop-blur-xl ${
              notification.type === "success" ? "border-success/30 bg-success-muted/80" :
              notification.type === "error" ? "border-destructive/30 bg-destructive-muted/80" :
              notification.type === "warning" ? "border-warning/30 bg-warning-muted/80" :
              "border-primary/30 bg-primary/5"
            }`}
          >
            {/* Luxury gradient accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${
              notification.type === "success" ? "bg-gradient-to-r from-success via-success/80 to-success" :
              notification.type === "error" ? "bg-gradient-to-r from-destructive via-destructive/80 to-destructive" :
              notification.type === "warning" ? "bg-gradient-to-r from-warning via-warning/80 to-warning" :
              "bg-gradient-primary"
            }`} />

            {/* Close button */}
            <button
              onClick={() => removeNotification(notification.id)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted/50 transition-luxury border border-border/30"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="flex items-start gap-3 pr-8">
              <div className={`p-2 rounded-xl ${
                notification.type === "success" ? "bg-success/20" :
                notification.type === "error" ? "bg-destructive/20" :
                notification.type === "warning" ? "bg-warning/20" :
                "bg-primary/20"
              }`}>
                {notification.type === "success" && <CheckCircle className="w-5 h-5 text-success" />}
                {notification.type === "error" && <AlertCircle className="w-5 h-5 text-destructive" />}
                {notification.type === "warning" && <AlertTriangle className="w-5 h-5 text-warning" />}
                {notification.type === "info" && <Info className="w-5 h-5 text-primary" />}
              </div>

              <div className="flex-1 pt-0.5">
                <div className="text-sm font-semibold text-foreground mb-0.5">{notification.title}</div>
                {notification.message && (
                  <div className="text-xs text-muted-foreground leading-relaxed">{notification.message}</div>
                )}
              </div>
            </div>
          </MotionDiv>
        ))}
      </AnimatePresence>
    </div>
  );
}
