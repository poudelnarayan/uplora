"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div as any;
import { Settings, Heart, LogOut, CreditCard, ChevronDown } from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

interface UserMenuProps {
  onFeedbackClick: () => void;
  dropdownPosition?: 'top' | 'bottom';
}

export default function UserMenu({ onFeedbackClick, dropdownPosition = 'bottom' }: UserMenuProps) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBeforeSignOut = () => {
    setIsOpen(false);
  };

  const userInitials = user?.fullName?.split(' ').map(n => n[0]).join('') || 
                      user?.firstName?.[0] || 
                      user?.emailAddresses?.[0]?.emailAddress?.[0] || "U";
  const userName = user?.fullName || user?.firstName || "User";

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card hover:border-border transition-all duration-200 hover:shadow-sm"
      >
        {/* User Avatar - Real from Clerk */}
        {user?.imageUrl ? (
          <img 
            src={user.imageUrl} 
            alt={userName} 
            className="w-8 h-8 rounded-full object-cover border-2 border-border/20"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-semibold">
            {userInitials}
          </div>
        )}

        {/* User Name - Hidden on mobile */}
        <span className="hidden sm:block text-sm font-medium text-foreground truncate max-w-32">
          {userName}
        </span>

        {/* Chevron */}
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {/* Menu Items */}
            <div className="p-2">
              <Link
                href="/settings"
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-all duration-150"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span>Settings</span>
              </Link>
              
              <Link
                href="/subscription"
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-all duration-150"
                onClick={() => setIsOpen(false)}
              >
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span>Billing</span>
              </Link>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  onFeedbackClick();
                }}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-all duration-150"
              >
                <Heart className="w-4 h-4 text-muted-foreground" />
                <span>Feedback</span>
              </button>
              
              {/* Divider */}
              <div className="my-2 border-t border-border"></div>
              
              <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
                <button 
                  onClick={handleBeforeSignOut}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-150"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </SignOutButton>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}