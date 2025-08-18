"use client";

import { Mail } from "lucide-react";

interface TeamInvitation {
  id: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "EDITOR";
  status: "pending" | "accepted" | "expired";
  invitedAt: Date;
  invitedBy: string;
}

interface TeamInvitationsListProps {
  invitations: TeamInvitation[];
  isOwner: boolean;
  teamId: string;
  onResendInvitation: (teamId: string, invitationId: string) => void;
  onCancelInvitation: (teamId: string, invitationId: string) => void;
  resendingId: string | null;
}

export default function TeamInvitationsList({
  invitations,
  isOwner,
  teamId,
  onResendInvitation,
  onCancelInvitation,
  resendingId
}: TeamInvitationsListProps) {
  const pendingInvitations = invitations.filter(inv => inv.status === "pending");

  if (!isOwner || pendingInvitations.length === 0) {
    return null;
  }

  return (
    <div>
      <h4 className="text-sm lg:text-base font-semibold mb-3 lg:mb-4 text-foreground">
        Pending Invitations ({pendingInvitations.length})
      </h4>
      <div className="space-y-2 lg:space-y-3">
        {pendingInvitations.map((invitation) => (
          <div 
            key={invitation.id} 
            className="flex items-center justify-between gap-2 lg:gap-3 p-2 lg:p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Mail className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-500" />
              <div className="min-w-0">
                <p className="font-medium text-xs lg:text-sm text-foreground truncate max-w-[40vw] lg:max-w-[360px]">
                  {invitation.email}
                </p>
                <p className="text-[10px] lg:text-xs text-muted-foreground">
                  Invited as {invitation.role.toLowerCase()}
                </p>
              </div>
            </div>
            {isOwner && (
              <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-2">
                <button 
                  onClick={() => onResendInvitation(teamId, invitation.id)} 
                  className="btn btn-ghost btn-sm text-xs" 
                  disabled={resendingId === invitation.id}
                >
                  {resendingId === invitation.id ? (
                    <>
                      <div className="spinner mr-2" />
                      Resending...
                    </>
                  ) : (
                    "Resend"
                  )}
                </button>
                <button 
                  onClick={() => onCancelInvitation(teamId, invitation.id)} 
                  className="btn btn-ghost btn-sm text-red-600 hover:text-red-700 text-xs"
                >
                  Cancel Invitation
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}