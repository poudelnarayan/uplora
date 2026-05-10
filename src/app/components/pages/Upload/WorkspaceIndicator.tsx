"use client";

import { Users, User } from "lucide-react";
import styles from "./WorkspaceIndicator.module.css";
import { isPersonalTeamName, PERSONAL_SPACE_LABEL } from "@/lib/teamDisplay";

interface WorkspaceIndicatorProps {
  selectedTeam?: { name: string } | null;
  selectedTeamId: string | null;
}

export default function WorkspaceIndicator({ selectedTeam, selectedTeamId }: WorkspaceIndicatorProps) {
  const isPersonal = !selectedTeam || isPersonalTeamName(selectedTeam.name);
  return (
    <div className={`${styles.indicator} ${selectedTeamId && !isPersonal ? styles.team : styles.personal}`}>
      {!isPersonal ? (
        <>
          <Users className={styles.icon} />
          <span className={styles.text}>Team: {selectedTeam!.name}</span>
        </>
      ) : (
        <>
          <User className={styles.icon} />
          <span className={styles.text}>{PERSONAL_SPACE_LABEL}</span>
        </>
      )}
    </div>
  );
}