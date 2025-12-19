"use client";

import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div as any;
import { X, Users, MessageCircle, Lightbulb, Plus } from "lucide-react";
import { useEffect, useRef, ReactNode, MouseEvent as ReactMouseEvent } from "react";

// Typed motion button alias
const MotionButton = motion.button as React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement> & any>;

// Modal content type definitions
export type ModalType = "invite-member" | "create-team" | "feedback-studio" | "idea-lab";

interface ModalConfig {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  iconColor: string;
  maxWidth: string;
  headerGradient: string;
}

// Configuration for each modal type
const modalConfigs: Record<ModalType, ModalConfig> = {
  "invite-member": {
    title: "Invite Team Member",
    subtitle: "Add someone to collaborate with your team",
    icon: <Users className="w-6 h-6 text-white" />,
    iconColor: "bg-primary",
    maxWidth: "max-w-md",
    headerGradient: "bg-accent/20"
  },
  "create-team": {
    title: "Create New Team",
    subtitle: "Start collaborating with your team",
    icon: <Plus className="w-6 h-6 text-white" />,
    iconColor: "bg-primary",
    maxWidth: "max-w-lg",
    headerGradient: "bg-accent/20"
  },
  "feedback-studio": {
    title: "Feedback Studio",
    subtitle: "Help us improve Uplora",
    icon: <MessageCircle className="w-6 h-6 text-white" />,
    iconColor: "bg-primary",
    maxWidth: "max-w-lg",
    headerGradient: "bg-accent/20"
  },
  "idea-lab": {
    title: "Idea Lab",
    subtitle: "Share your brilliant ideas",
    icon: <Lightbulb className="w-6 h-6 text-white" />,
    iconColor: "bg-primary",
    maxWidth: "max-w-xl",
    headerGradient: "bg-accent/20"
  }
};

interface UniversalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ModalType;
  children: ReactNode;
  showHeader?: boolean;
  customTitle?: string;
  customSubtitle?: string;
}

export default function UniversalModal({
  isOpen,
  onClose,
  type,
  children,
  showHeader = true,
  customTitle,
  customSubtitle
}: UniversalModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const config = modalConfigs[type];

  // Focus management and keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    // Focus the modal when it opens
    const focusModal = () => {
      if (modalRef.current) {
        modalRef.current.focus();
      }
    };

    // Trap focus within modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const modal = modalRef.current;
        if (!modal) return;

        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    
    // Focus after animation completes
    setTimeout(focusModal, 150);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with perfect centering */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm"
            onClick={(e: ReactMouseEvent<HTMLDivElement>) => {
              // Only close if clicking the backdrop, not the modal content
              if (e.target === e.currentTarget) {
                onClose();
              }
            }}
          >
            {/* Modal Container - Perfectly Centered */}
            <MotionDiv
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                duration: 0.3 
              }}
              className={`
                relative w-full ${config.maxWidth} 
                bg-card border border-border rounded-2xl 
                shadow-2xl overflow-hidden
                max-h-[90vh] flex flex-col
              `}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              aria-describedby="modal-description"
            >
              {/* Header Section */}
              {showHeader && (
                <div className={`
                  ${config.headerGradient}
                  border-b border-border p-6
                `}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Icon with gradient background */}
                      <div className={`
                        w-12 h-12 rounded-xl 
                        ${config.iconColor} shadow-lg
                        flex items-center justify-center
                      `}>
                        {config.icon}
                      </div>
                      
                      {/* Title and subtitle */}
                      <div>
                        <h2 
                          id="modal-title"
                          className="text-xl font-bold text-foreground"
                        >
                          {customTitle || config.title}
                        </h2>
                        {(customSubtitle || config.subtitle) && (
                          <p 
                            id="modal-description"
                            className="text-sm mt-1 text-muted-foreground"
                          >
                            {customSubtitle || config.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Close button */}
                    <MotionButton
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      className="
                        p-2 rounded-lg hover:bg-muted 
                        transition-colors duration-200
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30
                      "
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5 text-foreground" />
                    </MotionButton>
                  </div>
                </div>
              )}

              {/* Content Section - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {children}
                </div>
              </div>
            </MotionDiv>
          </MotionDiv>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook for easier modal management
export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>("invite-member");

  const openModal = (type: ModalType) => {
    setModalType(type);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    modalType,
    openModal,
    closeModal
  };
}

// Import React for useState
import { useState } from "react";