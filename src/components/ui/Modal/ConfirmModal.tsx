"use client";

import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = MotionDiv as any;
import { X, AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import styles from "./ConfirmModal.module.css";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "success" | "info";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger"
}: ConfirmModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

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
            <div className={styles.header}>
              <div className={`${styles.iconContainer} ${styles[type]}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className={styles.content}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.message}>{message}</p>
              </div>
            </div>
            
            <div className={styles.actions}>
              <button onClick={onClose} className={styles.cancelButton}>
                {cancelText}
              </button>
              <button onClick={onConfirm} className={`${styles.confirmButton} ${styles[type]}`}>
                {confirmText}
              </button>
            </div>
          </MotionDiv>
        </>
      )}
    </AnimatePresence>
  );
}