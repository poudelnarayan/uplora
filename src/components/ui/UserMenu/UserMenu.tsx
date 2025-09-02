"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div as any;
import { Settings, Heart, LogOut, User, CreditCard, ChevronDown } from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";

interface UserMenuProps {
  onFeedbackClick: () => void;
}

export default function UserMenu({ onFeedbackClick }: UserMenuProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
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

  const userInitials = user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || "U";
  const userName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.firstName || user?.emailAddresses?.[0]?.emailAddress;

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card hover:border-border transition-all duration-200 hover:shadow-sm"
      >
        {/* User Avatar */}
        <div className="relative">
          {user?.imageUrl ? (
            <img 
              src={user.imageUrl} 
              alt={userName || "User"} 
              className="w-8 h-8 rounded-lg object-cover border border-border/30"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center border border-border/30">
              <span className="text-sm font-semibold text-primary-foreground">
                {userInitials}
              </span>
            </div>
          )}
          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
        </div>

        {/* User Info - Hidden on mobile */}
        <div className="hidden sm:block text-left min-w-0">
          <div className="text-sm font-medium text-foreground truncate max-w-32">
            {user?.firstName || "User"}
          </div>
          <div className="text-xs text-muted-foreground truncate max-w-32">
            {user?.emailAddresses?.[0]?.emailAddress}
          </div>
        </div>

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
            className="absolute right-0 top-full mt-2 w-72 bg-card border border-border/50 rounded-xl shadow-xl backdrop-blur-sm z-50 overflow-hidden"
          >
            {/* Header with user info */}
            <div className="p-4 border-b border-border/50 bg-gradient-to-r from-muted/30 to-muted/10">
              <div className="flex items-center gap-3">
                {/* Larger avatar for header */}
                {user?.imageUrl ? (
                  <img 
                    src={user.imageUrl} 
                    alt={userName || "User"} 
                    className="w-12 h-12 rounded-xl object-cover border-2 border-background shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center border-2 border-background shadow-sm">
                    <span className="text-lg font-bold text-primary-foreground">
                      {userInitials}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">
                    {userName}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user?.emailAddresses?.[0]?.emailAddress}
                  </div>
                  {/* Status badge */}
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600 font-medium">Online</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Menu Items */}
            <div className="p-2">
              <Link
                href="/settings"
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors duration-150"
                onClick={() => setIsOpen(false)}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Account Settings</div>
                  <div className="text-xs text-muted-foreground">Manage your profile</div>
                </div>
              </Link>
              
              <Link
                href="/subscription"
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors duration-150"
                onClick={() => setIsOpen(false)}
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Subscription</div>
                  <div className="text-xs text-muted-foreground">Billing & plans</div>
                </div>
              </Link>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  onFeedbackClick();
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors duration-150"
              >
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-pink-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Share Feedback</div>
                  <div className="text-xs text-muted-foreground">Help us improve</div>
                </div>
              </button>
              
              {/* Divider */}
              <div className="my-2 border-t border-border/50"></div>
              
              <button
                onClick={() => signOut({ redirectUrl: "/" })}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors duration-150"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Sign Out</div>
                  <div className="text-xs text-red-500/70">End your session</div>
                </div>
              </button>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}