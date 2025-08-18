"use client";

import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useNotifications } from "@/components/ui/Notification";
import styles from "./NotificationBell.module.css";

interface NotificationBellProps {
  onClick: () => void;
}

export default function NotificationBell({ onClick }: NotificationBellProps) {
  const { notifications } = useNotifications();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={styles.button}
      title="Notification Center"
    >
      <Bell className="w-5 h-5 text-blue-600" />
      {notifications.length > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={styles.badge}
        >
          {notifications.length}
        </motion.span>
      )}
    </motion.button>
  );
}