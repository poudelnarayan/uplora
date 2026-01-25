"use client";

import React, { ReactNode, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, User, LogOut, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { useOnboarding } from "@/hooks/useOnboarding";

const MotionDiv = motion.div;

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  showClose?: boolean;
}

export default function OnboardingLayout({ 
  children, 
  currentStep, 
  totalSteps, 
  onBack,
  showClose = true
}: OnboardingLayoutProps) {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { markOnboardingSeen, skipOnboarding } = useOnboarding();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Mark onboarding as "seen" as soon as user lands anywhere in onboarding.
  useEffect(() => {
    markOnboardingSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    skipOnboarding();
    router.push('/dashboard');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Modern Header with Progress */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            {onBack && (
              <Button
                variant="ghost"
                onClick={onBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            {!onBack && <div />}

            {/* Progress Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Step {currentStep} of {totalSteps}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary rounded-full"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="w-9 h-9 p-0 rounded-full bg-muted/50 hover:bg-muted border border-border/50 flex items-center justify-center overflow-hidden"
                >
                  {user?.imageUrl ? (
                    <img 
                      src={user.imageUrl} 
                      alt={user.fullName || "Profile"} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
                
                {showProfileDropdown && (
                  <div className="absolute right-0 top-12 bg-popover border border-border/50 rounded-xl shadow-2xl py-2 min-w-[160px] z-50 backdrop-blur-xl">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted/50 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Close Button */}
              {showClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="w-9 h-9 p-0 rounded-lg hover:bg-muted/50"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-20 pb-8">
        <div className="max-w-5xl mx-auto px-6">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full"
          >
            {children}
          </MotionDiv>
        </div>
      </main>
    </div>
  );
}
