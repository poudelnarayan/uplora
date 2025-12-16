"use client";

import { Plus } from "lucide-react";
import styles from "./TeamsHeader.module.css";

interface TeamsHeaderProps {
  hasTeams: boolean;
  onCreateTeam: () => void;
}

export default function TeamsHeader({ hasTeams, onCreateTeam }: TeamsHeaderProps) {
  if (!hasTeams) {
    return (
      <div className={styles.emptyHeader}>
        <h1 className={styles.title}>Team Management</h1>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Team Management</h1>
        <button
          onClick={onCreateTeam}
          className={styles.createButton}
        >
          <Plus className={styles.buttonIcon} />
          Add Team
        </button>
      </div>
    </div>
  );
}