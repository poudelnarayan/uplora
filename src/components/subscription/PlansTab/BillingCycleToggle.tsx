import styles from "./BillingCycleToggle.module.css";

interface BillingCycleToggleProps {
  billingCycle: "monthly" | "yearly";
  onBillingCycleChange: (cycle: "monthly" | "yearly") => void;
  yearlyDiscount: number;
}

export default function BillingCycleToggle({
  billingCycle,
  onBillingCycleChange,
  yearlyDiscount
}: BillingCycleToggleProps) {
  return (
    <div className={styles.container}>
      <div className={styles.toggle}>
        <button
          onClick={() => onBillingCycleChange("monthly")}
          className={`${styles.toggleButton} ${
            billingCycle === "monthly" ? styles.toggleActive : styles.toggleInactive
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => onBillingCycleChange("yearly")}
          className={`${styles.toggleButton} ${
            billingCycle === "yearly" ? styles.toggleActive : styles.toggleInactive
          }`}
        >
          Yearly
          <span className={styles.discountBadge}>{yearlyDiscount}% OFF</span>
        </button>
        <div className={styles.freeTrialIndicator}>
          <span className={styles.freeTrialText}>Free trial</span>
          <div className={styles.toggleSwitch}>
            <div className={styles.toggleSwitchActive}></div>
          </div>
        </div>
      </div>
    </div>
  );
}