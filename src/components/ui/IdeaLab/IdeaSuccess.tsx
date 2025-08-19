"use client";

import { motion } from "framer-motion";

const MotionDiv = motion.div as any;
import { Lightbulb } from "lucide-react";
import styles from "./IdeaSuccess.module.css";

export default function IdeaSuccess() {
  return (
    <div className={styles.container}>
      <MotionDiv
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={styles.iconContainer}
      >
        <Lightbulb className="w-10 h-10 text-white" />
      </MotionDiv>
      <h3 className={styles.title}>Idea submitted!</h3>
      <p className={styles.message}>We'll review your suggestion and get back to you</p>
    </div>
  );
}