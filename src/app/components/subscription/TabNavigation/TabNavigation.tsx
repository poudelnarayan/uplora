import styles from "./TabNavigation.module.css";

interface TabNavigationProps {
  activeTab: "billing" | "plans";
  onTabChange: (tab: "billing" | "plans") => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className={styles.navigation}>
      <div className={styles.border}>
        <nav className={styles.nav}>
          <button
            onClick={() => onTabChange("billing")}
            className={`${styles.button} ${
              activeTab === "billing" ? styles.active : styles.inactive
            }`}
          >
            Billing
          </button>
          <button
            onClick={() => onTabChange("plans")}
            className={`${styles.button} ${
              activeTab === "plans" ? styles.active : styles.inactive
            }`}
          >
            Plans
          </button>
        </nav>
      </div>
    </div>
  );
}