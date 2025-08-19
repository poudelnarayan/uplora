"use client";

import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div as any;
import { X } from "lucide-react";
import { useEffect } from "react";
import styles from "./Modal.module.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
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
            className={`${styles.container} ${styles[size]}`}
          >
            {title && (
              <div className={styles.header}>
                <h3 className={styles.title}>{title}</h3>
                <button onClick={onClose} className={styles.closeButton}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className={styles.content}>
              {children}
            </div>
          </MotionDiv>
        </>
      )}
    </AnimatePresence>
  );
}