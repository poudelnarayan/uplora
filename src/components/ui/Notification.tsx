"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useSession } from "next-auth/react";
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

  const addNotification = (notification: Omit<NotificationProps, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const defaultDuration = notification.sticky ? 0 : (notification.duration || 3000);
    const newNotification = { ...notification, id, duration: defaultDuration };
    // Replace existing notifications; show only the latest
    setNotifications([newNotification]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Handle route changes for sticky notifications
  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.sticky && notification.stickyConditions?.dismissOnRouteChange) {
        removeNotification(notification.id);
      }
    });
  }, [pathname]);

  // Auto-remove notifications after duration (including sticky conditions)
  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.sticky && notification.stickyConditions?.dismissAfterSeconds) {
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.stickyConditions.dismissAfterSeconds * 1000);
        return () => clearTimeout(timer);
      } else if (notification.duration && notification.duration > 0) {
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
        return () => clearTimeout(timer);
      }
    });
  }, [notifications]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearNotifications }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();
  const { data: session } = useSession();
  // Avoid hydration mismatch by rendering after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Decide position only on client after mount
  const [useRight, setUseRight] = useState(false);
  useEffect(() => {
    if (!mounted) return;
    setUseRight(!session?.user);
  }, [mounted, session?.user]);

  if (!mounted) return null;

  return (
    <div className={`fixed top-4 ${useRight ? "right-4" : "left-4 lg:left-72"} z-50 space-y-2`}>
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: useRight ? 300 : -300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: useRight ? 300 : -300, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`max-w-sm w-full bg-white dark:bg-slate-900 text-foreground border rounded-lg shadow-lg p-4 relative ${
              notification.type === "success" ? "border-green-500/20" :
              notification.type === "error" ? "border-red-500/20" :
              notification.type === "warning" ? "border-yellow-500/20" :
              "border-blue-500/20"
            }`}
          >
            <button
              onClick={() => removeNotification(notification.id)}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
            
            <div className="flex items-start gap-3 pr-6">
              {notification.type === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
              {notification.type === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
              {notification.type === "warning" && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
              {notification.type === "info" && <Info className="w-5 h-5 text-blue-500" />}

              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">{notification.title}</div>
                {notification.message && (
                  <div className="text-xs text-muted-foreground mt-0.5">{notification.message}</div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Import React for the context
import React from 'react';
