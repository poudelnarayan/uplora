"use client";

import { motion } from "framer-motion";

const MotionDiv = motion.div as any;
import { Users, Plus, Crown, Shield, Target, Edit3, Mail, Clock, UserCheck } from "lucide-react";
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
      <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="spinner-lg mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your teams...</p>
        </div>
      </MotionDiv>
    );
  }

  if (teams.length === 0) {
    return (
      <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-primary/20">
            <Users className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Create Your First Team</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Start collaborating with others by creating a team workspace where you can upload, review, and publish content together.
          </p>
          <button 
            onClick={() => {
              // Use the modal system from the parent component
              if (typeof window !== 'undefined' && (window as any).openCreateTeamModal) {
                (window as any).openCreateTeamModal();
              } else {
                onCreateTeam();
              }
            }} 
            className="btn btn-primary btn-lg"
          >
            <Plus className="w-6 h-6 mr-3" />
            Add New Team
          </button>
        </div>
      </MotionDiv>
    );
  }

  return (
    <div className="space-y-6">
      {teams.map((team) => {
        const isOwner = currentUserEmail.toLowerCase() === (team.ownerEmail || "").toLowerCase();
        const activeMembers = team.members.filter(m => m.status !== "PAUSED");
        const pendingInvites = team.invitations.filter(inv => inv.status === "pending");

        return (
          <MotionDiv
            key={team.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 space-y-6"
          >
            {/* Team Header with Status */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {renamingTeamId === team.id ? (
                  <div className="flex items-center gap-2">
                    <input 
                      value={renameValue} 
                      onChange={(e) => onRenameValueChange(e.target.value)} 
                      className="text-xl font-bold bg-transparent border-b-2 border-primary focus:outline-none text-foreground"
                      maxLength={80} 
                    />
                    <button 
                      onClick={() => onSaveRename(team.id)} 
                      className="btn btn-primary btn-sm"
                    >
                      Save
                    </button>
                    <button 
                      onClick={onCancelRename} 
                      className="btn btn-ghost btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-foreground">{team.name}</h3>
                    {isOwner && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                        <Crown className="w-3 h-3" />
                        <span className="text-xs font-medium">Owner</span>
                      </div>
                    )}
                  </div>
                )}
                {team.description && (
                  <p className="text-muted-foreground mt-1">{team.description}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {isOwner && (
                  <button
                    onClick={() => onInviteMember(team)}
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Invite Member
                  </button>
                )}
                {!isOwner && (
                  <button 
                    onClick={() => onLeaveTeam(team.id, team.name)} 
                    className="btn btn-outline text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Leave Team
                  </button>
                )}
              </div>
            </div>

            {/* Active Members - Prominent Display */}
            {activeMembers.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Active Members ({activeMembers.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeMembers.map((member) => (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {member.name[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{member.name}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium border ${
                              member.role === "OWNER"
                                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700"
                                : member.role === "ADMIN"
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                                : member.role === "MANAGER"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                                : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700"
                            }`}>
                              {member.role === "OWNER" ? (
                                <><Crown className="w-3 h-3 inline mr-1" />Owner</>
                              ) : member.role === "ADMIN" ? (
                                <><Shield className="w-3 h-3 inline mr-1" />Admin</>
                              ) : member.role === "MANAGER" ? (
                                <><Target className="w-3 h-3 inline mr-1" />Manager</>
                              ) : (
                                <><Edit3 className="w-3 h-3 inline mr-1" />Editor</>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {isOwner && member.role !== "OWNER" && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onToggleMemberStatus(team.id, member.id, member.name, member.status || "ACTIVE", team.name)}
                            className="btn btn-ghost btn-sm"
                          >
                            {member.status === "PAUSED" ? "Activate" : "Pause"}
                          </button>
                          <button 
                            onClick={() => onRemoveMember(team.id, member.id, team.name)} 
                            className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Invitations - Visible When Present */}
            {isOwner && pendingInvites.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Mail className="w-5 h-5 text-warning" />
                  Pending Invitations ({pendingInvites.length})
                </h4>
                <div className="space-y-2">
                  {pendingInvites.map((invitation) => (
                    <div 
                      key={invitation.id} 
                      className="flex items-center justify-between p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{invitation.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Invited as {invitation.role.toLowerCase()} • {new Date(invitation.invitedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => onResendInvitation(team.id, invitation.id)} 
                          className="btn btn-ghost btn-sm"
                          disabled={resendingId === invitation.id}
                        >
                          {resendingId === invitation.id ? (
                            <>
                              <div className="spinner w-3 h-3 mr-1" />
                              Resending...
                            </>
                          ) : (
                            "Resend"
                          )}
                        </button>
                        <button 
                          onClick={() => onCancelInvitation(team.id, invitation.id)} 
                          className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </MotionDiv>
        );
      })}
    </div>
  );
}