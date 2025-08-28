"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div as any;
import { Settings, Heart, LogOut, X } from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import styles from "./UserMenu.module.css";

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

  return (
    <div className={styles.container} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.trigger}
      >
        {user?.imageUrl ? (
          <img 
            src={user.imageUrl} 
            alt={user?.firstName || "User"} 
            className="w-20 h-10 rounded-full object-cover border-2 border-white shadow-sm"
          />
        ) : (
          <div className={styles.avatar}>
            <span className={styles.avatarText}>
              {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || "U"}
            </span>
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className={styles.dropdown}
          >
            <div className={styles.userInfo}>
              {user?.imageUrl ? (
                <img 
                  src={user.imageUrl} 
                  alt={user?.firstName || "User"} 
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className={styles.userAvatar}>
                  <span className={styles.userAvatarText}>
                    {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || "U"}
                  </span>
                </div>
              )}
              <div className={styles.userDetails}>
                <div className={styles.userName}>
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.firstName || user?.emailAddresses?.[0]?.emailAddress}
                </div>
                <div className={styles.userEmail}>
                  {user?.emailAddresses?.[0]?.emailAddress}
                </div>
              </div>
            </div>
            
            <div className={styles.menuItems}>
              <Link
                href="/settings"
                className={styles.menuItem}
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-4 h-4" />
                <span>Account Settings</span>
              </Link>
              <Link
                href="/subscription"
                className={styles.menuItem}
                onClick={() => setIsOpen(false)}
              >
                <span className="w-4 h-4 inline-block" />
                <span>Subscription</span>
              </Link>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  onFeedbackClick();
                }}
                className={styles.menuItem}
              >
                <Heart className="w-4 h-4 text-red-500" />
                <span>Share Feedback</span>
              </button>
              
              <div className={styles.divider} />
              
              <button
                onClick={() => signOut({ redirectUrl: "/" })}
                className={styles.signOutButton}
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}