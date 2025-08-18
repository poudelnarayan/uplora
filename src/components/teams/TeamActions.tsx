"use client";

import { Edit, Trash2, LogOut } from "lucide-react";
import styles from "./TeamActions.module.css";

interface TeamActionsProps {
  isOwner: boolean;
  teamId: string;
  teamName: string;
  onStartRename: (teamId: string, currentName: string) => void;
  onDeleteTeam: (teamId: string, teamName: string) => void;
  onLeaveTeam: (teamId: string, teamName: string) => void;
}

export default function TeamActions({
  isOwner,
  teamId,
  teamName,
  onStartRename,
  onDeleteTeam,
  onLeaveTeam
}: TeamActionsProps) {
  if (isOwner) {
    return (
      <div className={styles.ownerActions}>
        <button
          title="Rename team"
          onClick={() => onStartRename(teamId, teamName)}
          className={styles.actionButton}
          aria-label="Rename team"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          title="Delete team"
          onClick={() => onDeleteTeam(teamId, teamName)}
          className={`${styles.actionButton} ${styles.deleteButton}`}
          aria-label="Delete team"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={() => onLeaveTeam(teamId, teamName)} 
      className={styles.leaveButton}
    >
      <LogOut className="w-4 h-4" />
      Leave team
    </button>
  );
}