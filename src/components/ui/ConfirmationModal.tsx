"use client";

import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = MotionDiv as any;
import { X, AlertTriangle, Trash2 } from "lucide-react";
import { useEffect } from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string; // For displaying the item being deleted (e.g., video title)
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  icon?: "trash" | "warning" | "info";
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
  icon = "warning"
}: ConfirmationModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose, isLoading]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  const getIcon = () => {
    switch (icon) {
      case "trash":
        return <Trash2 className="w-6 h-6" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6" />;
      default:
        return <AlertTriangle className="w-6 h-6" />;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: "text-red-500",
          confirmButton: "bg-red-500 hover:bg-red-600 text-white",
          cancelButton: "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        };
      case "warning":
        return {
          icon: "text-yellow-500",
          confirmButton: "bg-yellow-500 hover:bg-yellow-600 text-white",
          cancelButton: "text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
        };
      default:
        return {
          icon: "text-blue-500",
          confirmButton: "bg-blue-500 hover:bg-blue-600 text-white",
          cancelButton: "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={!isLoading ? onClose : undefined}
          />
          
          {/* Modal */}
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-background rounded-lg shadow-xl border"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className={styles.icon}>
                  {getIcon()}
                </div>
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              </div>
              {!isLoading && (
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-muted rounded-md transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-muted-foreground mb-4">
                {message}
                {itemName && (
                  <span className="font-semibold text-foreground block mt-2">
                    "{itemName}"
                  </span>
                )}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 p-6 border-t">
              <button
                onClick={onClose}
                disabled={isLoading}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${styles.cancelButton} disabled:opacity-50`}
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${styles.confirmButton} disabled:opacity-50 flex items-center gap-2`}
              >
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                {confirmText}
              </button>
            </div>
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
}
