"use client";

import { Users, User } from "lucide-react";
import styles from "./WorkspaceIndicator.module.css";

interface WorkspaceIndicatorProps {
  selectedTeam?: { name: string } | null;
  selectedTeamId: string | null;
}

export default function WorkspaceIndicator({ selectedTeam, selectedTeamId }: WorkspaceIndicatorProps) {
  return (
    <div className={`${styles.indicator} ${selectedTeamId ? styles.team : styles.personal}`}>
      {selectedTeam ? (
        <>
          <Users className={styles.icon} />
          <span className={styles.text}>Team: {selectedTeam.name}</span>
        </>
      ) : (
        <>
          <User className={styles.icon} />
          <span className={styles.text}>Personal Workspace</span>
        </>
      )}
    </div>
  );
}