"use client";

import { motion } from "framer-motion";
import { Users, Plus } from "lucide-react";
import TeamCard from "./TeamCard";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "EDITOR";
  joinedAt: Date;
  status?: "ACTIVE" | "PAUSED";
}

interface TeamInvitation {
  id: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "EDITOR";
  status: "pending" | "accepted" | "expired";
  invitedAt: Date;
  invitedBy: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  invitations: TeamInvitation[];
  createdAt: Date;
  ownerEmail?: string;
}

interface TeamListProps {
  teams: Team[];
  loading: boolean;
  onCreateTeam: () => void;
  onInviteMember: (team: Team) => void;
  onStartRename: (teamId: string, currentName: string) => void;
  onDeleteTeam: (teamId: string, teamName: string) => void;
  onLeaveTeam: (teamId: string, teamName: string) => void;
  onResendInvitation: (teamId: string, invitationId: string) => void;
  onCancelInvitation: (teamId: string, invitationId: string) => void;
  onToggleMemberStatus: (teamId: string, memberId: string, memberName: string, currentStatus: string, teamName: string) => void;
  onRemoveMember: (teamId: string, memberId: string, teamName: string) => void;
  renamingTeamId: string | null;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onSaveRename: (teamId: string) => void;
  onCancelRename: () => void;
  resendingId: string | null;
  currentUserEmail: string;
}

export default function TeamList({
  teams,
  loading,
  onCreateTeam,
  onInviteMember,
  onStartRename,
  onDeleteTeam,
  onLeaveTeam,
  onResendInvitation,
  onCancelInvitation,
  onToggleMemberStatus,
  onRemoveMember,
  renamingTeamId,
  renameValue,
  onRenameValueChange,
  onSaveRename,
  onCancelRename,
  resendingId,
  currentUserEmail
}: TeamListProps) {
  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center">
        <div className="spinner-lg mx-auto mb-4" />
        <p className="text-muted-foreground">Loading your teams...</p>
      </motion.div>
    );
  }

  if (teams.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
          <Users className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No team created</h3>
        <p className="text-sm text-muted-foreground mb-6">Create a team and start growing.</p>
        <button onClick={onCreateTeam} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Create Team
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex-1 space-y-4 lg:space-y-6">
      {teams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          onInviteMember={() => onInviteMember(team)}
          onStartRename={onStartRename}
          onDeleteTeam={onDeleteTeam}
          onLeaveTeam={onLeaveTeam}
          onResendInvitation={onResendInvitation}
          onCancelInvitation={onCancelInvitation}
          onToggleMemberStatus={onToggleMemberStatus}
          onRemoveMember={onRemoveMember}
          renamingTeamId={renamingTeamId}
          renameValue={renameValue}
          onRenameValueChange={onRenameValueChange}
          onSaveRename={onSaveRename}
          onCancelRename={onCancelRename}
          resendingId={resendingId}
          currentUserEmail={currentUserEmail}
        />
      ))}
    </div>
  );
}