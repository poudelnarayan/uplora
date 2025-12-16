"use client";

import React, { ReactNode, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, X, User, LogOut } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";

const MotionDiv = motion.div as any;

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

  const handleClose = () => {
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

  return (
    <>
      {/* Progress Bar at Very Top - Sticky */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 py-4">
        <div className={`max-w-4xl mx-auto px-6 flex items-center ${onBack ? 'justify-between' : 'justify-center'} pr-[30px]`}>
          {/* Back Button */}
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <React.Fragment key={i}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    i + 1 <= currentStep
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div
                    className={`w-8 h-0.5 transition-colors ${
                      i + 1 < currentStep ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Profile Dropdown */}
          <div className="relative ml-20" ref={dropdownRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-8 h-8 p-0 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center overflow-hidden"
            >
              {user?.imageUrl ? (
                <img 
                  src={user.imageUrl} 
                  alt={user.fullName || "Profile"} 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-4 h-4 text-gray-600" />
              )}
            </Button>
            
            {/* Dropdown Menu */}
            {showProfileDropdown && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px] z-50">
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50 pt-20">

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-6">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            {children}
          </MotionDiv>
        </div>
      </main>

      </div>
    </>
  );
}
