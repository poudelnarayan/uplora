"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";
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
  isLoading = false
}: ConfirmationModalProps) {
  
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
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
  }, [isOpen, onClose, isLoading]);

  // Handle Enter key
  useEffect(() => {
    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isLoading) {
        onConfirm();
      }
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEnter);
    }
    
    return () => {
      document.removeEventListener("keydown", handleEnter);
    };
  }, [isOpen, onConfirm, isLoading]);

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: "text-orange-500",
          confirmBtn: "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white transition-all duration-200 hover:shadow-md",
          iconBg: "bg-orange-100 dark:bg-orange-900/20"
        };
      case "warning":
        return {
          icon: "text-yellow-500",
          confirmBtn: "bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white transition-all duration-200 hover:shadow-md",
          iconBg: "bg-yellow-100 dark:bg-yellow-900/20"
        };
      case "info":
        return {
          icon: "text-blue-500",
          confirmBtn: "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white transition-all duration-200 hover:shadow-md",
          iconBg: "bg-blue-100 dark:bg-blue-900/20"
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 dark:bg-black/50"
            onClick={() => !isLoading && onClose()}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-border"
          >
            {/* Header */}
            <div className="flex items-start p-6 pb-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-card border border-border`}>
                <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-foreground">
                  {title}
                </h3>
                {itemName && (
                  <div className="mt-2 p-2 bg-muted/50 rounded-md">
                    <p className="text-sm font-medium text-foreground truncate" title={itemName}>
                      "{itemName.length > 40 ? itemName.slice(0, 40) + '...' : itemName}"
                    </p>
                  </div>
                )}
                <p className="mt-3 text-sm text-muted-foreground">
                  {message}
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="btn btn-ghost flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${styles.confirmBtn}`}
              >
                {isLoading ? "Processing..." : confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
