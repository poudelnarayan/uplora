"use client";

import { motion } from "framer-motion";

const MotionDiv = MotionDiv as any;
import { Heart } from "lucide-react";
import styles from "./FeedbackSuccess.module.css";

export default function FeedbackSuccess() {
  return (
    <div className={styles.container}>
      <MotionDiv
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={styles.iconContainer}
      >
        <Heart className="w-10 h-10 text-white" />
      </MotionDiv>
      <h3 className={styles.title}>Thank you!</h3>
      <p className={styles.message}>Your feedback helps us build better experiences</p>
    </div>
  );
}