"use client";

import { motion } from "framer-motion";
import { Edit, Trash2, UserPlus } from "lucide-react";
import TeamMembersList from "./TeamMembersList";
import TeamInvitationsList from "./TeamInvitationsList";

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

interface TeamCardProps {
  team: Team;
  onInviteMember: () => void;
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

export default function TeamCard({
  team,
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
}: TeamCardProps) {
  const isOwner = currentUserEmail.toLowerCase() === (team.ownerEmail || "").toLowerCase();

  return (
    <motion.div 
      key={team.id} 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="card p-4 lg:p-6 hover:shadow-lg transition-all duration-200"
    >
      {/* Team Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          {renamingTeamId === team.id ? (
            <div className="flex items-center gap-2">
              <input 
                value={renameValue} 
                onChange={(e) => onRenameValueChange(e.target.value)} 
                className="input w-48 lg:w-64" 
                maxLength={80} 
              />
              <button onClick={() => onSaveRename(team.id)} className="btn btn-primary btn-sm text-xs lg:text-sm">
                Save
              </button>
              <button onClick={onCancelRename} className="btn btn-ghost btn-sm text-xs lg:text-sm">
                Cancel
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold text-foreground truncate">{team.name}</h3>
                {isOwner && (
                  <div className="hidden lg:flex items-center gap-1 ml-1">
                    <button
                      title="Rename team"
                      onClick={() => onStartRename(team.id, team.name)}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                      aria-label="Rename team"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      title="Delete team"
                      onClick={() => onDeleteTeam(team.id, team.name)}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors text-red-600 hover:text-red-700"
                      aria-label="Delete team"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {team.description && team.description.trim().length > 0 && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {team.description}
                </p>
              )}
            </div>
          )}
        </div>
        {isOwner ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onInviteMember}
              className="btn btn-primary btn-sm text-xs lg:text-sm"
              aria-label="Invite member"
              title="Invite member"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => onLeaveTeam(team.id, team.name)} 
            className="btn btn-ghost text-red-600 hover:text-red-700 btn-sm text-xs lg:text-sm"
          >
            Leave team
          </button>
        )}
      </div>

      {/* Team Members */}
      <TeamMembersList
        members={team.members}
        isOwner={isOwner}
        teamId={team.id}
        teamName={team.name}
        onToggleMemberStatus={onToggleMemberStatus}
        onRemoveMember={onRemoveMember}
      />

      {/* Pending Invitations */}
      <TeamInvitationsList
        invitations={team.invitations}
        isOwner={isOwner}
        teamId={team.id}
        onResendInvitation={onResendInvitation}
        onCancelInvitation={onCancelInvitation}
        resendingId={resendingId}
      />
    </motion.div>
  );
}