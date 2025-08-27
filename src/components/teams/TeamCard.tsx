"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Crown, 
  Shield, 
  Target, 
  Edit3, 
  Mail, 
  MoreVertical,
  UserPlus,
  Settings,
  Trash2,
  LogOut,
  UserCheck,
  Clock
} from "lucide-react";

const MotionDiv = motion.div as any;

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "EDITOR";
  joinedAt: Date;
  avatar?: string;
  status?: "ACTIVE" | "PAUSED";
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "EDITOR";
  status: "pending" | "accepted" | "expired";
  invitedAt: Date;
  invitedBy: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  invitations: TeamInvitation[];
  createdAt: Date;
  ownerEmail?: string;
  isPersonal?: boolean;
  isOwner?: boolean;
  role?: string;
}

interface TeamCardProps {
  team: Team;
  currentUserEmail: string;
  onInviteMember: (team: Team) => void;
  onDeleteTeam: (teamId: string, teamName: string) => void;
  onLeaveTeam: (teamId: string, teamName: string) => void;
  onResendInvitation: (invitationId: string) => void;
  onCancelInvitation: (invitationId: string) => void;
  resendingId?: string | null;
  onRemoveMember: (teamId: string, memberId: string, teamName: string) => void;
}

export default function TeamCard({
  team,
  currentUserEmail,
  onInviteMember,
  onDeleteTeam,
  onLeaveTeam,
  onResendInvitation,
  onCancelInvitation,
  resendingId,
  onRemoveMember
}: TeamCardProps) {
  const [showActions, setShowActions] = useState(false);
  
  // Add null checks and default values to prevent filter errors
  const safeMembers = team.members || [];
  const safeInvitations = team.invitations || [];
  
  const isOwner = currentUserEmail?.toLowerCase() === team.ownerEmail?.toLowerCase();
  const isAdmin = (team.role || "").toUpperCase() === "ADMIN";
  const canManageMembers = isOwner || isAdmin;
  const canInvite = isOwner || isAdmin || (team.role || "").toUpperCase() === "MANAGER";
  const activeMembers = safeMembers.filter(m => m.status !== "PAUSED");
  const pendingInvites = safeInvitations.filter(inv => inv.status === "pending");

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER": return <Crown className="w-4 h-4" style={{ color: '#00ADB5' }} />;
      case "ADMIN": return <Shield className="w-4 h-4" style={{ color: '#00ADB5' }} />;
      case "MANAGER": return <Target className="w-4 h-4" style={{ color: '#00ADB5' }} />;
      case "EDITOR": return <Edit3 className="w-4 h-4" style={{ color: '#00ADB5' }} />;
      default: return <Edit3 className="w-4 h-4" style={{ color: '#00ADB5' }} />;
    }
  };

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-6 transition-all hover:scale-[1.01] shadow-lg"
      style={{ 
        backgroundColor: '#EEEEEE',
        border: `2px solid #393E46`
      }}
    >
      {/* Team Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-bold" style={{ color: '#222831' }}>{team.name}</h3>
              {isOwner && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full" style={{ backgroundColor: '#00ADB5' }}>
                  <Crown className="w-4 h-4 text-white" />
                  <span className="text-sm font-medium text-white">Owner</span>
                </div>
              )}
            </div>
            <p className="text-base" style={{ color: '#393E46' }}>{team.description || "No description"}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm" style={{ color: '#393E46' }}>
                {activeMembers.length} active members
              </span>
              {pendingInvites.length > 0 && (
                <span className="text-sm flex items-center gap-1" style={{ color: '#00ADB5' }}>
                  <Clock className="w-4 h-4" />
                  {pendingInvites.length} pending invites
                </span>
              )}
              <span className="text-sm" style={{ color: '#393E46' }}>
                Created {new Date(team.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {canInvite && (
            <button
              onClick={() => onInviteMember(team)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-110 shadow-md"
              style={{ backgroundColor: '#00ADB5' }}
              title="Invite member"
            >
              <UserPlus className="w-5 h-5 text-white" />
              <span className="text-white font-medium">Invite</span>
            </button>
          )}
          <div className="relative">
            <button 
              onClick={() => setShowActions(!showActions)}
              className="p-3 rounded-lg transition-all hover:scale-110 shadow-md" 
              style={{ backgroundColor: '#393E46' }}
            >
              <MoreVertical className="w-5 h-5 text-white" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border-2 border-gray-200 z-10 min-w-48">
                <button 
                  className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50"
                  style={{ color: '#222831' }}
                >
                  <Settings className="w-4 h-4" />
                  Team Settings
                </button>
                
                {isOwner ? (
                  <button 
                    onClick={() => {
                      onDeleteTeam(team.id, team.name);
                      setShowActions(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-red-50 rounded-b-lg text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Team
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      onLeaveTeam(team.id, team.name);
                      setShowActions(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-red-50 rounded-b-lg text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    Leave Team
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Members Section */}
      {activeMembers.length > 0 && (
        <div className="mb-4">
          <h4 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: '#222831' }}>
            <UserCheck className="w-5 h-5" style={{ color: '#00ADB5' }} />
            Active Members ({activeMembers.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeMembers.slice(0, 6).map((member) => (
              <div 
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-lg transition-all hover:scale-105"
                style={{ backgroundColor: 'white', border: `2px solid #393E46` }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#222831' }}>
                  <span className="text-sm font-bold text-white">
                    {member.name[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: '#222831' }}>
                    {member.name}
                  </p>
                  <p className="text-sm truncate" style={{ color: '#393E46' }}>
                    {member.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleIcon(member.role)}
                    <span className="text-sm font-medium" style={{ color: '#393E46' }}>
                      {member.role.toLowerCase()}
                    </span>
                  </div>
                </div>
                {canManageMembers && member.role !== "OWNER" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRemoveMember(team.id, member.id, team.name)}
                      className="btn btn-outline btn-xs text-red-600"
                      title="Remove member"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {activeMembers.length > 6 && (
              <div 
                className="flex items-center justify-center p-4 rounded-lg border-2 border-dashed"
                style={{ borderColor: '#393E46', backgroundColor: 'white' }}
              >
                <span className="text-lg font-semibold" style={{ color: '#393E46' }}>
                  +{activeMembers.length - 6} more members
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending Invitations Section */}
      {isOwner && pendingInvites.length > 0 && (
        <div className="mb-4">
          <h4 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: '#222831' }}>
            <Mail className="w-5 h-5" style={{ color: '#00ADB5' }} />
            Pending Invitations ({pendingInvites.length})
          </h4>
          <div className="space-y-2">
            {pendingInvites.map((invitation) => (
              <div 
                key={invitation.id} 
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ 
                  backgroundColor: 'white', 
                  border: `2px solid #00ADB5`
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: '#222831' }}>{invitation.email}</p>
                    <p className="text-sm" style={{ color: '#393E46' }}>
                      Invited as {invitation.role.toLowerCase()} • {new Date(invitation.invitedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onResendInvitation(invitation.id)} 
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                    style={{ 
                      backgroundColor: '#00ADB5', 
                      color: 'white'
                    }}
                    disabled={resendingId === invitation.id}
                  >
                    {resendingId === invitation.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block" />
                        Resending...
                      </>
                    ) : (
                      "Resend"
                    )}
                  </button>
                  <button 
                    onClick={() => onCancelInvitation(invitation.id)} 
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                    style={{ 
                      backgroundColor: 'transparent', 
                      color: '#222831',
                      border: '1px solid #393E46'
                    }}
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
}