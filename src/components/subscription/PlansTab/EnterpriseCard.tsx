import { Crown } from "lucide-react";
import styles from "./EnterpriseCard.module.css";

export default function EnterpriseCard() {
  const handleContactSales = () => {
    // Navigate to contact page or open contact modal
    window.location.href = "/contact";
  };

  const handleScheduleDemo = () => {
    // Open scheduling tool or contact form
    window.open("https://calendly.com/uplora-demo", "_blank");
  };

  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <Crown className={styles.crownIcon} />
        </div>
        <h3 className={styles.title}>Enterprise</h3>
        <p className={styles.description}>
          Custom solutions for large organizations with advanced needs
        </p>
        <div className={styles.actions}>
          <button onClick={handleContactSales} className={styles.btnPrimary}>
            Contact Sales
          </button>
          <button onClick={handleScheduleDemo} className={styles.btnOutline}>
            Schedule Demo
          </button>
        </div>
      </div>
    </div>
  );
}