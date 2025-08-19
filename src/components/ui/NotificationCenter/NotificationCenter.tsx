"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = MotionDiv as any;
import { Bell, X } from "lucide-react";
import { useNotifications } from "@/components/ui/Notification";
import NotificationItem from "./NotificationItem";
import EmptyNotifications from "./EmptyNotifications";
import styles from "./NotificationCenter.module.css";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { notifications, clearNotifications } = useNotifications();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.backdrop}
            onClick={onClose}
          />
          <MotionDiv
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={styles.container}
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerContent}>
                <div className={styles.iconContainer}>
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={styles.title}>Notification Center</h3>
                  <p className={styles.subtitle}>Stay updated with your team</p>
                </div>
              </div>
              <button onClick={onClose} className={styles.closeButton}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className={styles.content}>
              {notifications.length === 0 ? (
                <EmptyNotifications />
              ) : (
                <div className={styles.notificationList}>
                  {notifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                  
                  {notifications.length > 0 && (
                    <button onClick={clearNotifications} className={styles.clearButton}>
                      Clear all notifications
                    </button>
                  )}
                </div>
              )}
            </div>
          </MotionDiv>
        </>
      )}
    </AnimatePresence>
  );
}