"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Mail, X } from "lucide-react";
import styles from "./EmailVerificationBanner.module.css";

const MotionDiv = motion.div as any;

interface EmailVerificationBannerProps {
  show: boolean;
  onResend: () => void;
  onDismiss: () => void;
  isResending: boolean;
}

export default function EmailVerificationBanner({
  show,
  onResend,
  onDismiss,
  isResending
}: EmailVerificationBannerProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {show && (
        <MotionDiv
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={styles.banner}
        >
          <div className={styles.content}>
            <div className={styles.messageSection}>
              <AlertCircle className={styles.icon} />
              <div className={styles.textContent}>
                <span className={styles.title}>
                  Please verify your email address
                </span>
                <span className={styles.subtitle}>
                  to access all features
                </span>
              </div>
            </div>
            <div className={styles.actions}>
              <button
                onClick={onResend}
                disabled={isResending}
                className={styles.resendButton}
              >
                {isResending ? (
                  <div className={styles.loadingContent}>
                    <div className={styles.spinner} />
                    Sending...
                  </div>
                ) : (
                  <div className={styles.buttonContent}>
                    <Mail className={styles.buttonIcon} />
                    Resend Email
                  </div>
                )}
              </button>
              <button
                onClick={onDismiss}
                className={styles.dismissButton}
              >
                <X className={styles.dismissIcon} />
              </button>
            </div>
          </div>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
}