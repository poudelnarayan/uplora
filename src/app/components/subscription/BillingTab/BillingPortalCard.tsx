import { ExternalLink } from "lucide-react";
import styles from "./BillingPortalCard.module.css";

interface BillingPortalCardProps {
  onOpenBillingPortal: () => void;
}

export default function BillingPortalCard({ onOpenBillingPortal }: BillingPortalCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div className={styles.info}>
          <h3 className={styles.title}>Stripe Billing Portal</h3>
          <p className={styles.description}>
            Access billing history, payment methods, and invoices
          </p>
        </div>
        <button onClick={onOpenBillingPortal} className={styles.button}>
          <ExternalLink className={styles.icon} />
          Open Portal
        </button>
      </div>
    </div>
  );
}