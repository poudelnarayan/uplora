"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = MotionDiv as any;
import { Settings, Heart, LogOut, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import styles from "./UserMenu.module.css";

interface UserMenuProps {
  onFeedbackClick: () => void;
}

export default function UserMenu({ onFeedbackClick }: UserMenuProps) {
  const { data: session } = useSession();
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
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={styles.trigger}
      >
        <div className={styles.avatar}>
          <span className={styles.avatarText}>
            {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
          </span>
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className={styles.dropdown}
          >
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                <span className={styles.userAvatarText}>
                  {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
                </span>
              </div>
              <div className={styles.userDetails}>
                <div className={styles.userName}>{session?.user?.name}</div>
                <div className={styles.userEmail}>{session?.user?.email}</div>
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
                onClick={() => signOut({ callbackUrl: "/" })}
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