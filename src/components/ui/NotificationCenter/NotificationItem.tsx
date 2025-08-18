"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useNotifications } from "@/components/ui/Notification";
import type { NotificationProps } from "@/components/ui/Notification";
import styles from "./NotificationItem.module.css";

interface NotificationItemProps {
  notification: NotificationProps;
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  const { removeNotification } = useNotifications();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`${styles.container} group`}
    >
      <div className={`${styles.indicator} ${styles[notification.type]}`} />
      <div className={styles.content}>
        <div className={styles.title}>{notification.title}</div>
        {notification.message && (
          <div className={styles.message}>{notification.message}</div>
        )}
      </div>
      <button
        onClick={() => removeNotification(notification.id)}
        className={styles.removeButton}
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}