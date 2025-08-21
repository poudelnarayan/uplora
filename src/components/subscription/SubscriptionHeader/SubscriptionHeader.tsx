import { CreditCard } from "lucide-react";
import styles from "./SubscriptionHeader.module.css";

interface SubscriptionHeaderProps {
  title: string;
  subtitle: string;
}

export default function SubscriptionHeader({ title, subtitle }: SubscriptionHeaderProps) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <div className={styles.icon}>
          <CreditCard className={styles.iconSvg} />
        </div>
      </div>
    </div>
  );
}