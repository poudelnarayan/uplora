"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div as any;
import { Settings, Heart, LogOut, User, CreditCard, ChevronDown, Bell, Shield } from "lucide-react";
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
        className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[#E0E0E0] bg-white hover:bg-[#EEEEEE] hover:border-[#00ADB5] transition-all duration-200 hover:shadow-sm"
      >
        {/* User Avatar */}
        <div className="relative">
          {user?.imageUrl ? (
            <div className="w-9 h-9 rounded-lg overflow-hidden border-2 border-[#EEEEEE] shadow-sm">
              <img 
                src={user.imageUrl} 
                alt={userName || "User"} 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00ADB5] to-[#393E46] flex items-center justify-center border-2 border-[#EEEEEE] shadow-sm">
              <span className="text-sm font-bold text-white">
                {userInitials}
              </span>
            </div>
          )}
          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#4CAF50] border-2 border-white rounded-full shadow-sm"></div>
        </div>

        {/* User Info - Hidden on mobile */}
        <div className="hidden sm:block text-left min-w-0">
          <div className="text-sm font-semibold text-[#222831] truncate max-w-32">
            {user?.firstName || "User"}
          </div>
          <div className="text-xs text-[#393E46] truncate max-w-32">
            {user?.emailAddresses?.[0]?.emailAddress}
          </div>
        </div>

        {/* Chevron */}
        <ChevronDown className={`w-4 h-4 text-[#393E46] transition-transform duration-200 ${
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
            className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#E0E0E0] rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header with user info */}
            <div className="p-5 border-b border-[#EEEEEE] bg-gradient-to-r from-[#FEFEFB] to-[#EEEEEE]/30">
              <div className="flex items-center gap-4">
                {/* Larger avatar for header */}
                {user?.imageUrl ? (
                  <div className="w-14 h-14 rounded-xl overflow-hidden border-3 border-white shadow-lg ring-2 ring-[#00ADB5]/20">
                    <img 
                      src={user.imageUrl} 
                      alt={userName || "User"} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00ADB5] to-[#393E46] flex items-center justify-center border-3 border-white shadow-lg ring-2 ring-[#00ADB5]/20">
                    <span className="text-xl font-bold text-white">
                      {userInitials}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-[#222831] truncate">
                    {userName}
                  </div>
                  <div className="text-sm text-[#393E46] truncate">
                    {user?.emailAddresses?.[0]?.emailAddress}
                  </div>
                  {/* Status badge */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-[#4CAF50]/10 border border-[#4CAF50]/20 rounded-full">
                      <div className="w-2 h-2 bg-[#4CAF50] rounded-full"></div>
                      <span className="text-xs text-[#4CAF50] font-semibold">Online</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Menu Items */}
            <div className="p-3">
              <Link
                href="/settings"
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-[#222831] hover:bg-[#EEEEEE] hover:text-[#00ADB5] transition-all duration-150 group"
                onClick={() => setIsOpen(false)}
              >
                <div className="w-10 h-10 rounded-lg bg-[#00ADB5]/10 flex items-center justify-center group-hover:bg-[#00ADB5]/20 transition-colors">
                  <Settings className="w-5 h-5 text-[#00ADB5]" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Account Settings</div>
                  <div className="text-xs text-[#393E46] group-hover:text-[#00ADB5]/80">Manage your profile and preferences</div>
                </div>
              </Link>
              
              <Link
                href="/subscription"
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-[#222831] hover:bg-[#EEEEEE] hover:text-[#00ADB5] transition-all duration-150 group"
                onClick={() => setIsOpen(false)}
              >
                <div className="w-10 h-10 rounded-lg bg-[#393E46]/10 flex items-center justify-center group-hover:bg-[#393E46]/20 transition-colors">
                  <CreditCard className="w-5 h-5 text-[#393E46]" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Subscription & Billing</div>
                  <div className="text-xs text-[#393E46] group-hover:text-[#00ADB5]/80">Manage your plan and payments</div>
                </div>
              </Link>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  onFeedbackClick();
                }}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-[#222831] hover:bg-[#EEEEEE] hover:text-[#00ADB5] transition-all duration-150 group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#F44336]/10 flex items-center justify-center group-hover:bg-[#F44336]/20 transition-colors">
                  <Heart className="w-5 h-5 text-[#F44336]" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Share Feedback</div>
                  <div className="text-xs text-[#393E46] group-hover:text-[#00ADB5]/80">Help us improve Uplora</div>
                </div>
              </button>
              
              {/* Divider */}
              <div className="my-3 border-t border-[#EEEEEE]"></div>
              
              <button
                onClick={() => signOut({ redirectUrl: "/" })}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-[#F44336] hover:bg-[#F44336]/5 hover:text-[#F44336] transition-all duration-150 group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#F44336]/10 flex items-center justify-center group-hover:bg-[#F44336]/20 transition-colors">
                  <LogOut className="w-5 h-5 text-[#F44336]" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Sign Out</div>
                  <div className="text-xs text-[#F44336]/70 group-hover:text-[#F44336]/80">End your current session</div>
                </div>
              </button>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}