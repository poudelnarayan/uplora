"use client";

import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import styles from "./SettingsHeader.module.css";

const MotionDiv = motion.div as any;

export default function SettingsHeader() {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.container}
    >
      <div className={styles.content}>
        <div className={styles.textContent}>
          <h1 className={styles.title}>Account Settings</h1>
          <p className={styles.subtitle}>Manage your account, integrations, and preferences</p>
        </div>
        <div className={styles.iconContainer}>
          <Settings className={styles.icon} />
        </div>
      </div>
    </MotionDiv>
  );
}