"use client";

import { Bell } from "lucide-react";
import styles from "./EmptyNotifications.module.css";

export default function EmptyNotifications() {
  return (
    <div className={styles.container}>
      <div className={styles.iconContainer}>
        <Bell className="w-8 h-8 text-blue-500" />
      </div>
      <h4 className={styles.title}>All caught up!</h4>
      <p className={styles.message}>No new notifications right now</p>
    </div>
  );
}