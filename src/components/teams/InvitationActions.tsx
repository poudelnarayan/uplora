"use client";

import styles from "./InvitationActions.module.css";

interface InvitationActionsProps {
  teamId: string;
  invitationId: string;
  resendingId: string | null;
  onResendInvitation: (teamId: string, invitationId: string) => void;
  onCancelInvitation: (teamId: string, invitationId: string) => void;
}

export default function InvitationActions({
  teamId,
  invitationId,
  resendingId,
  onResendInvitation,
  onCancelInvitation
}: InvitationActionsProps) {
  return (
    <div className={styles.container}>
      <button 
        onClick={() => onResendInvitation(teamId, invitationId)} 
        className={styles.resendButton}
        disabled={resendingId === invitationId}
      >
        {resendingId === invitationId ? (
          <>
            <div className={styles.spinner} />
            Resending...
          </>
        ) : (
          "Resend"
        )}
      </button>
      <button 
        onClick={() => onCancelInvitation(teamId, invitationId)} 
        className={styles.cancelButton}
      >
        Cancel Invitation
      </button>
    </div>
  );
}