"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, X, CreditCard } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import styles from "./TrialBanner.module.css";

const MotionDiv = motion.div as any;

interface TrialBannerProps {
  onUpgrade?: () => void;
  dismissible?: boolean;
}

export default function TrialBanner({ onUpgrade, dismissible = true }: TrialBannerProps) {
  const { trialInfo, isTrialActive, trialDaysRemaining, isTrialExpired } = useSubscription();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if dismissed or no trial info
  if (isDismissed || !trialInfo) return null;

  // Don't show if trial is not active and not expired
  if (!isTrialActive && !isTrialExpired) return null;

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.location.href = "/subscription?tab=plans";
    }
  };

  return (
    <AnimatePresence>
      <MotionDiv
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`${styles.banner} ${
          isTrialExpired ? styles.bannerExpired : styles.bannerActive
        }`}
      >
        <div className={styles.content}>
          <div className={styles.iconContainer}>
            <Clock className={styles.icon} />
          </div>
          
          <div className={styles.textContent}>
            {isTrialActive ? (
              <>
                <span className={styles.title}>
                  {trialDaysRemaining === 1 
                    ? "Last day of your free trial!" 
                    : `${trialDaysRemaining} days left in your free trial`
                  }
                </span>
                <span className={styles.subtitle}>
                  Upgrade now to continue using all features after {trialInfo.endDate.toLocaleDateString()}
                </span>
              </>
            ) : (
              <>
                <span className={styles.title}>Your free trial has expired</span>
                <span className={styles.subtitle}>
                  {trialInfo.isInGracePeriod 
                    ? "You have limited access. Upgrade to restore full functionality."
                    : "Please upgrade to continue using Uplora."
                  }
                </span>
              </>
            )}
          </div>

          <div className={styles.actions}>
            <button onClick={handleUpgrade} className={styles.upgradeButton}>
              <CreditCard className={styles.buttonIcon} />
              {isTrialExpired ? "Upgrade Now" : "Choose Plan"}
            </button>
            
            {dismissible && (
              <button 
                onClick={() => setIsDismissed(true)}
                className={styles.dismissButton}
                aria-label="Dismiss trial banner"
              >
                <X className={styles.dismissIcon} />
              </button>
            )}
          </div>
        </div>
      </MotionDiv>
    </AnimatePresence>
  );
}