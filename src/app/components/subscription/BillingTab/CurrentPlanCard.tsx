import { Calendar, CreditCard, Clock } from "lucide-react";
import { TrialInfo } from "@/types/subscription";
import styles from "./CurrentPlanCard.module.css";

interface CurrentPlanCardProps {
  plan: {
    name: string;
    price: string;
    cycle: string;
    status: string;
    trialEnds: string;
    nextBilling: string;
    daysRemaining: number;
  };
  trialInfo: TrialInfo | null;
  onChangePlan: () => void;
  onPauseSubscription: () => void;
  onCancelSubscription: () => void;
}

export default function CurrentPlanCard({
  plan,
  trialInfo,
  onChangePlan,
  onPauseSubscription,
  onCancelSubscription
}: CurrentPlanCardProps) {
  const isTrialActive = trialInfo?.isActive || false;
  const isTrialExpired = trialInfo?.isExpired || false;

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.planInfo}>
          <div className={styles.planLabel}>
            <Calendar className={styles.icon} />
            <span>Current Plan</span>
          </div>
          <h2 className={styles.planTitle}>{plan.name}</h2>
          <p className={styles.planPrice}>{plan.price} / {plan.cycle}</p>
        </div>
        <div className={styles.statusContainer}>
          <span className={`${styles.statusBadge} ${
            isTrialActive ? styles.statusTrial : 
            isTrialExpired ? styles.statusExpired : 
            styles.statusActive
          }`}>
            {plan.status}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>
            <Clock className={styles.detailIcon} />
            <span>{isTrialActive ? "Trial ends" : "Next billing"}</span>
          </div>
          <p className={styles.detailValue}>
            {isTrialActive ? plan.trialEnds : plan.trialEnds}
          </p>
        </div>
        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>
            <CreditCard className={styles.detailIcon} />
            <span>Amount</span>
          </div>
          <p className={styles.detailValue}>{plan.nextBilling}</p>
        </div>
      </div>

      {/* Trial Notice */}
      {isTrialActive && (
        <div className={styles.trialNotice}>
          <span className={styles.trialEmoji}>🎉</span>
          <p className={styles.trialText}>
            <span className={styles.trialTextStrong}>You're on a free trial!</span> Your trial ends on {plan.trialEnds}. 
            After that, you'll be charged {plan.nextBilling}.
          </p>
        </div>
      )}

      {/* Expired Trial Notice */}
      {isTrialExpired && (
        <div className={styles.expiredNotice}>
          <span className={styles.expiredEmoji}>⏰</span>
          <p className={styles.expiredText}>
            <span className={styles.expiredTextStrong}>Your trial has expired.</span> Please choose a plan to continue using Uplora.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <button onClick={onChangePlan} className={styles.btnPrimary}>
          Change Plan
        </button>
        {!isTrialActive && (
          <>
            <button onClick={onPauseSubscription} className={styles.btnSecondary}>
              Pause Subscription
            </button>
            <button onClick={onCancelSubscription} className={styles.btnDanger}>
              Cancel Subscription
            </button>
          </>
        )}
      </div>
    </div>
  );
}