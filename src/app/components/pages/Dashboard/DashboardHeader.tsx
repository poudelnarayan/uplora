"use client";

import { motion } from "framer-motion";
import styles from "./DashboardHeader.module.css";

const MotionDiv = motion.div as any;

interface DashboardHeaderProps {
  teamName?: string;
}

export default function DashboardHeader({ teamName }: DashboardHeaderProps) {
  return (
    <MotionDiv 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className={styles.container}
    >
      <div className={styles.content}>
        <h1 className={styles.title}>
          {teamName ? `${teamName} - Videos` : "Personal Videos"}
        </h1>
        <p className={styles.subtitle}>
          {teamName 
            ? `Manage videos for ${teamName} team` 
            : "Manage your personal YouTube content and track upload status"
          }
        </p>
      </div>
    </MotionDiv>
  );
}