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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center py-16">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-2xl"></div>
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-muted to-card border border-border flex items-center justify-center mb-8 shadow-lg">
            <Users className="w-12 h-12 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-2xl font-semibold text-foreground mb-3">No Teams Yet</h3>
        <p className="text-muted-foreground mb-8 max-w-md">Create your first team to start collaborating with others and streamline your content workflow.</p>
        <button onClick={onCreateTeam} className="btn btn-primary btn-lg">
          <Plus className="w-4 h-4 mr-2" /> Create Team
        </button>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
          <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Invite collaborators</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <Shield className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Role-based permissions</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Target className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Streamlined workflow</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
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