"use client";

import styles from "./FeedbackTypeSelector.module.css";

interface FeedbackTypeSelectorProps {
  selectedType: "bug" | "improvement" | "praise";
  onTypeChange: (type: "bug" | "improvement" | "praise") => void;
}

const feedbackTypes = [
  { type: "bug", label: "Bug Report", icon: "🐛", color: "from-red-500/20 to-pink-500/20" },
  { type: "improvement", label: "Improvement", icon: "✨", color: "from-blue-500/20 to-indigo-500/20" },
  { type: "praise", label: "Praise", icon: "❤️", color: "from-green-500/20 to-emerald-500/20" }
] as const;

export default function FeedbackTypeSelector({ selectedType, onTypeChange }: FeedbackTypeSelectorProps) {
  return (
    <div className={styles.container}>
      <label className={styles.label}>What's on your mind?</label>
      <div className={styles.grid}>
        {feedbackTypes.map(({ type, label, icon, color }) => (
          <button
            key={type}
            onClick={() => onTypeChange(type as any)}
            className={`${styles.typeButton} ${
              selectedType === type
                ? `${styles.selected} bg-gradient-to-br ${color} border-primary text-foreground`
                : styles.unselected
            }`}
          >
            <div className={styles.icon}>{icon}</div>
            <div className={styles.typeLabel}>{label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}