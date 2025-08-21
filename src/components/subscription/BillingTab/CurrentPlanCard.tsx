import { Calendar, CreditCard } from "lucide-react";
import styles from "./CurrentPlanCard.module.css";

interface CurrentPlanCardProps {
  plan: {
    name: string;
    price: string;
    cycle: string;
    status: string;
    trialEnds: string;
    nextBilling: string;
  };
  onChangePlan: () => void;
  onPauseSubscription: () => void;
  onCancelSubscription: () => void;
}

export default function CurrentPlanCard({
  plan,
  onChangePlan,
  onPauseSubscription,
  onCancelSubscription
}: CurrentPlanCardProps) {
  return (
    <div className={styles.card}>
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
          <span className={styles.statusBadge}>
            {plan.status}
          </span>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>
            <Calendar className={styles.detailIcon} />
            <span>Trial ends</span>
          </div>
          <p className={styles.detailValue}>{plan.trialEnds}</p>
        </div>
        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>
            <CreditCard className={styles.detailIcon} />
            <span>Amount</span>
          </div>
          <p className={styles.detailValue}>{plan.nextBilling}</p>
        </div>
      </div>

      <div className={styles.trialNotice}>
        <span className={styles.trialEmoji}>🎉</span>
        <p className={styles.trialText}>
          <strong>You're on a free trial!</strong> Your trial ends on {plan.trialEnds}. 
          After that, you'll be charged {plan.nextBilling}.
        </p>
      </div>

      <div className={styles.actionButtons}>
        <button onClick={onChangePlan} className={styles.btnPrimary}>
          Change Plan
        </button>
        <button onClick={onPauseSubscription} className={styles.btnSecondary}>
          Pause Subscription
        </button>
        <button onClick={onCancelSubscription} className={styles.btnDanger}>
          Cancel Subscription
        </button>
      </div>
    </div>
  );
}