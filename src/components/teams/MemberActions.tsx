"use client";

import styles from "./MemberActions.module.css";

interface MemberActionsProps {
  teamId: string;
  memberId: string;
  memberName: string;
  currentStatus: string;
  teamName: string;
  onToggleMemberStatus: (teamId: string, memberId: string, memberName: string, currentStatus: string, teamName: string) => void;
  onRemoveMember: (teamId: string, memberId: string, teamName: string) => void;
}

export default function MemberActions({
  teamId,
  memberId,
  memberName,
  currentStatus,
  teamName,
  onToggleMemberStatus,
  onRemoveMember
}: MemberActionsProps) {
  return (
    <div className={styles.container}>
      <button
        onClick={() => onToggleMemberStatus(teamId, memberId, memberName, currentStatus, teamName)}
        className={styles.statusButton}
      >
        {currentStatus === "PAUSED" ? "Set active" : "Set inactive"}
      </button>
      <button 
        onClick={() => onRemoveMember(teamId, memberId, teamName)} 
        className={styles.removeButton}
      >
        Remove
      </button>
    </div>
  );
}