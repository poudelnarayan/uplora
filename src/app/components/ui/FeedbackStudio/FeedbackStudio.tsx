"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div as any;
import { MessageCircle, X } from "lucide-react";
import FeedbackForm from "./FeedbackForm";
import FeedbackSuccess from "./FeedbackSuccess";
import styles from "./FeedbackStudio.module.css";

interface FeedbackStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: string, message: string) => Promise<void>;
}

export default function FeedbackStudio({ isOpen, onClose, onSubmit }: FeedbackStudioProps) {
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (type: string, message: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(type, message);
      setFeedbackSent(true);
      setTimeout(() => {
        onClose();
        setFeedbackSent(false);
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send feedback");
    } finally {
      setSubmitting(false);
    }
  };

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
            {feedbackSent ? (
              <FeedbackSuccess />
            ) : (
              <>
                {/* Header */}
                <div className={styles.header}>
                  <div className={styles.headerContent}>
                    <div className={styles.iconContainer}>
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className={styles.title}>Feedback Studio</h3>
                      <p className={styles.subtitle}>Help us improve Uplora</p>
                    </div>
                  </div>
                  <button onClick={onClose} className={styles.closeButton}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                  {error && (
                    <div className="mb-3 p-2 rounded text-sm" style={{ background: '#fee2e2', color: '#991b1b' }}>
                      {error}
                    </div>
                  )}
                  <FeedbackForm onSubmit={handleSubmit} />
                </div>
              </>
            )}
          </MotionDiv>
        </>
      )}
    </AnimatePresence>
  );
}