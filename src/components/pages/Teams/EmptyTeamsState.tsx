"use client";

import { motion } from "framer-motion";
import { Users, Plus } from "lucide-react";
import styles from "./EmptyTeamsState.module.css";

const MotionDiv = motion.div as any;

interface EmptyTeamsStateProps {
  onCreateTeam: () => void;
}

export default function EmptyTeamsState({ onCreateTeam }: EmptyTeamsStateProps) {
  return (
    <MotionDiv 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className={styles.container}
    >
      <div className={styles.content}>
        <div className={styles.iconContainer}>
          <Users className={styles.icon} />
        </div>
        <h2 className={styles.title}>Create Your First Team</h2>
        <p className={styles.description}>
          Start collaborating with others by creating a team workspace where you can upload, 
          review, and publish content together.
        </p>
        <button 
          onClick={onCreateTeam} 
          className={styles.createButton}
        >
          <Plus className={styles.buttonIcon} />
          Add New Team
        </button>
      </div>
    </MotionDiv>
  );
}