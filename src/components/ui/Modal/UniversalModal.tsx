"use client";

import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div as any;
import { X, Users, MessageCircle, Lightbulb, Plus } from "lucide-react";
import { useEffect, useRef, ReactNode } from "react";

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
    iconColor: "bg-[#3F72AF]",
    maxWidth: "max-w-md",
    headerGradient: "bg-[#DBE2EF]"
  },
  "create-team": {
    title: "Create New Team",
    subtitle: "Start collaborating with your team",
    icon: <Plus className="w-6 h-6 text-white" />,
    iconColor: "bg-[#3F72AF]",
    maxWidth: "max-w-lg",
    headerGradient: "bg-[#DBE2EF]"
  },
  "feedback-studio": {
    title: "Feedback Studio",
    subtitle: "Help us improve Uplora",
    icon: <MessageCircle className="w-6 h-6 text-white" />,
    iconColor: "bg-[#3F72AF]",
    maxWidth: "max-w-lg",
    headerGradient: "bg-[#DBE2EF]"
  },
  "idea-lab": {
    title: "Idea Lab",
    subtitle: "Share your brilliant ideas",
    icon: <Lightbulb className="w-6 h-6 text-white" />,
    iconColor: "bg-[#3F72AF]",
    maxWidth: "max-w-xl",
    headerGradient: "bg-[#DBE2EF]"
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(4px)"
            }}
            onClick={(e) => {
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
                bg-[#F9F7F7] border border-[#DBE2EF] rounded-2xl 
                shadow-2xl overflow-hidden
                max-h-[90vh] flex flex-col
              `}
              style={{
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                backgroundColor: "#F9F7F7"
              }}
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
                  border-b border-[#DBE2EF] p-6
                `}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Icon with gradient background */}
                      <div className={`
                        w-12 h-12 rounded-xl 
                        ${config.iconColor}
                        flex items-center justify-center
                        shadow-lg
                      `}>
                        {config.icon}
                      </div>
                      
                      {/* Title and subtitle */}
                      <div>
                        <h2 
                          id="modal-title"
                          className="text-xl font-bold text-[#112D4E]"
                        >
                          {customTitle || config.title}
                        </h2>
                        {(customSubtitle || config.subtitle) && (
                          <p 
                            id="modal-description"
                            className="text-sm text-[#3F72AF] mt-1"
                          >
                            {customSubtitle || config.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Close button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      className="
                        p-2 rounded-lg hover:bg-[#DBE2EF] 
                        transition-colors duration-200
                        focus:outline-none focus:ring-2 focus:ring-[#3F72AF]/50
                      "
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5 text-[#3F72AF]" />
                    </motion.button>
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