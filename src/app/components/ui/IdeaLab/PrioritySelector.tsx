"use client";

import styles from "./PrioritySelector.module.css";

interface PrioritySelectorProps {
  selectedPriority: "low" | "medium" | "high";
  onPriorityChange: (priority: "low" | "medium" | "high") => void;
}

const priorities = [
  { priority: "low", label: "Nice to have", color: "from-gray-500/20 to-slate-500/20" },
  { priority: "medium", label: "Would help", color: "from-blue-500/20 to-indigo-500/20" },
  { priority: "high", label: "Game changer", color: "from-amber-500/20 to-orange-500/20" }
] as const;

export default function PrioritySelector({ selectedPriority, onPriorityChange }: PrioritySelectorProps) {
  return (
    <div className={styles.container}>
      <label className={styles.label}>Priority Level</label>
      <div className={styles.grid}>
        {priorities.map(({ priority, label, color }) => (
          <button
            key={priority}
            onClick={() => onPriorityChange(priority as any)}
            className={`${styles.priorityButton} ${
              selectedPriority === priority
                ? `${styles.selected} bg-gradient-to-br ${color} border-primary text-foreground`
                : styles.unselected
            }`}
          >
            <div className={styles.priorityName}>{priority}</div>
            <div className={styles.priorityLabel}>{label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}