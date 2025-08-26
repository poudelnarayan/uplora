"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import UniversalModal, { ModalType } from "./UniversalModal";
import { 
  InviteMemberContent, 
  CreateTeamContent, 
  FeedbackContent, 
  IdeaLabContent 
} from "./ModalContent";

// Simple toast notification component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div className={`fixed top-4 right-4 z-[9999] p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${
      type === 'success' 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 text-white/80 hover:text-white">
          ×
        </button>
      </div>
    </div>
  );
}

// Modal context for global state management
interface ModalContextType {
  openModal: (type: ModalType, props?: any) => void;
  closeModal: () => void;
  isOpen: boolean;
  currentType: ModalType | null;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function useModalManager() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModalManager must be used within ModalProvider");
  }
  return context;
}

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentType, setCurrentType] = useState<ModalType | null>(null);
  const [modalProps, setModalProps] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const openModal = (type: ModalType, props: any = {}) => {
    setCurrentType(type);
    setModalProps(props);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setIsLoading(false);
    // Clear props after animation completes
    setTimeout(() => {
      setCurrentType(null);
      setModalProps({});
    }, 300);
  };

  // Generic handlers that can be customized per modal type
  const handleSubmit = async (...args: any[]) => {
    setIsLoading(true);
    try {
      if (modalProps.onSubmit) {
        const result = await modalProps.onSubmit(...args);
        
        // Handle different response types
        if (result && typeof result === 'object') {
          if (result.success) {
            // Show success message
            showToast(result.message || "Success!", 'success');
            closeModal();
          } else if (result.error) {
            showToast(result.error, 'error');
            throw new Error(result.error);
          }
        } else {
          // If no result object returned, assume success and close modal
          showToast("Success!", 'success');
          closeModal();
        }
      }
    } catch (error) {
      console.error("Modal submission error:", error);
      showToast(error instanceof Error ? error.message : "Something went wrong", 'error');
      // Don't close modal on error - let user try again
    } finally {
      setIsLoading(false);
    }
  };

  const renderModalContent = () => {
    if (!currentType) return null;

    switch (currentType) {
      case "invite-member":
        return (
          <InviteMemberContent
            teamName={modalProps.teamName}
            onSubmit={handleSubmit}
            onCancel={closeModal}
            isLoading={isLoading}
          />
        );

      case "create-team":
        return (
          <CreateTeamContent
            onSubmit={handleSubmit}
            onCancel={closeModal}
            isLoading={isLoading}
          />
        );

      case "feedback-studio":
        return (
          <FeedbackContent
            onSubmit={handleSubmit}
            onCancel={closeModal}
            isLoading={isLoading}
          />
        );

      case "idea-lab":
        return (
          <IdeaLabContent
            onSubmit={handleSubmit}
            onCancel={closeModal}
            isLoading={isLoading}
          />
        );

      default:
        return <div>Unknown modal type</div>;
    }
  };

  const contextValue: ModalContextType = {
    openModal,
    closeModal,
    isOpen,
    currentType
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      
      {/* Universal Modal */}
      {currentType && (
        <UniversalModal
          isOpen={isOpen}
          onClose={closeModal}
          type={currentType}
          customTitle={modalProps.customTitle}
          customSubtitle={modalProps.customSubtitle}
        >
          {renderModalContent()}
        </UniversalModal>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </ModalContext.Provider>
  );
}