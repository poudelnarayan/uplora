"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div as any;
import { Lightbulb, X } from "lucide-react";
import IdeaForm from "./IdeaForm";
import IdeaSuccess from "./IdeaSuccess";
import styles from "./IdeaLab.module.css";

interface IdeaLabProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string, priority: string) => Promise<void>;
}

export default function IdeaLab({ isOpen, onClose, onSubmit }: IdeaLabProps) {
  const [ideaSent, setIdeaSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (title: string, description: string, priority: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(title, description, priority);
      setIdeaSent(true);
      setTimeout(() => {
        onClose();
        setIdeaSent(false);
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit idea");
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
            {ideaSent ? (
              <IdeaSuccess />
            ) : (
              <>
                {/* Header */}
                <div className={styles.header}>
                  <div className={styles.headerContent}>
                    <div className={styles.iconContainer}>
                      <Lightbulb className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className={styles.title}>Idea Lab</h3>
                      <p className={styles.subtitle}>Share your brilliant ideas</p>
                    </div>
                  </div>
                  <button onClick={onClose} className={styles.closeButton}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                  {error && (
                    <div className="mb-3 p-2 rounded text-sm bg-destructive-muted text-destructive">
                      {error}
                    </div>
                  )}
                  <IdeaForm onSubmit={handleSubmit} />
                </div>
              </>
            )}
          </MotionDiv>
        </>
      )}
    </AnimatePresence>
  );
}