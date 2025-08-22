"use client";

import { useState, useEffect } from "react";
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import AppShell from "@/components/layout/AppShell";
import { useNotifications } from "@/components/ui/Notification";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { motion } from "framer-motion";
import { useModalManager } from "@/components/ui/Modal";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import { 
  Users, 
  Plus, 
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
  Clock,
  UserCheck,
  TrendingUp,
  Lightbulb
} from "lucide-react";

const MotionDiv = motion.div as any;

export const dynamic = "force-dynamic";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "EDITOR";
  joinedAt: Date;
  avatar?: string;
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
  isPersonal?: boolean;
}

export default function TeamsPage() {
  const { user } = useUser();
  const notifications = useNotifications();
  
  // State management
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const { openModal } = useModalManager();
  const [renamingTeamId, setRenamingTeamId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<{ id: string; name: string } | null>(null);
  const [teamToLeave, setTeamToLeave] = useState<{ id: string; name: string } | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  const [leavingTeamId, setLeavingTeamId] = useState<string | null>(null);

  // Filter out personal workspaces from team display
  const actualTeams = teams.filter(team => !team.isPersonal);

  // Load teams from server
  const loadTeams = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/teams", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.addNotification({ 
          type: "error", 
          title: "Failed to load teams", 
          message: err.error || "Try again" 
        });
        setLoading(false);
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      // Filter to only include non-personal teams for the teams page
      const nonPersonalTeams = list.filter((t: any) => !t.isPersonal);

      // Fetch detailed team information
      const detailed: Team[] = await Promise.all(
        nonPersonalTeams.map(async (t: any) => {
          try {
            const dRes = await fetch(`/api/teams/${t.id}/details`, { cache: "no-store" });
            if (dRes.ok) {
              const details = await dRes.json();
              const mappedMembers: TeamMember[] = (details.members || []).map((m: any) => ({
                id: m.id,
                name: m.user?.name || m.user?.email?.split("@")[0] || "Member",
                email: m.user?.email || "",
                role: m.role,
                joinedAt: new Date(m.joinedAt),
                status: (m.status || "ACTIVE") as any,
              }));
              
              const ownerUser = details.team?.owner;
              if (ownerUser) {
                const ownerExists = mappedMembers.some(mm => 
                  mm.email.toLowerCase() === (ownerUser.email || "").toLowerCase()
                );
                if (!ownerExists) {
                  mappedMembers.unshift({
                    id: ownerUser.id,
                    name: ownerUser.name || ownerUser.email?.split("@")[0] || "Owner",
                    email: ownerUser.email || "",
                    role: "OWNER",
                    joinedAt: new Date(details.team.createdAt || Date.now()),
                  } as TeamMember);
                }
              }
              
              return {
                id: details.team.id,
                name: details.team.name,
                description: details.team.description || "",
                members: mappedMembers,
                invitations: (details.invites || []).map((inv: any) => ({
                  id: inv.id || inv.token,
                  email: inv.email,
                  role: inv.role,
                  status: (inv.status || "PENDING").toLowerCase(),
                  invitedAt: new Date(inv.createdAt || inv.invitedAt || Date.now()),
                  invitedBy: user?.fullName || user?.firstName || "",
                })),
                createdAt: details.team.createdAt ? new Date(details.team.createdAt) : new Date(),
                ownerEmail: ownerUser?.email || "",
              } as Team;
            }
          } catch {}
          return {
            id: t.id,
            name: t.name,
            description: t.description || "",
            members: [],
            invitations: [],
            createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
            ownerEmail: "",
          } as Team;
        })
      );

      setTeams(detailed);
    } catch (e) {
      notifications.addNotification({ 
        type: "error", 
        title: "Failed to load teams", 
        message: "Network error" 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadTeams();
    }
  }, [user?.fullName, user?.emailAddresses?.[0]?.emailAddress]);

  // Team management handlers
  const handleCreateTeam = async (name: string, description: string) => {
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.addNotification({ 
          type: "error", 
          title: "Failed to create team", 
          message: err.error || "Try again" 
        });
        return;
      }
      notifications.addNotification({ type: "success", title: "Team created!" });
      await loadTeams();
    } catch (e) {
      notifications.addNotification({ 
        type: "error", 
        title: "Failed to create team", 
        message: "Network error" 
      });
    }
  };

  const handleInviteMember = async (email: string, role: string, team?: Team) => {
    const targetTeam = team;
    
    if (!targetTeam) {
      throw new Error("No team selected");
    }
    
    try {
      const res = await fetch(`/api/teams/${targetTeam.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role })
      });

      const result = await res.json();
      
      if (res.ok) {
        if (result.emailSent) {
          notifications.addNotification({ 
            type: "success", 
            title: "Invitation sent successfully!", 
            message: `Email delivered to ${email}` 
          });
        } else {
          notifications.addNotification({ 
            type: "warning", 
            title: "Invitation created but email failed", 
            message: `Invitation saved but email to ${email} could not be delivered` 
          });
        }
        await loadTeams();
        return { success: true, message: "Invitation sent successfully" };
      } else {
        const errorMessage = result.error || "Please try again";
        notifications.addNotification({ 
          type: "error", 
          title: "Failed to send invitation", 
          message: errorMessage
        });
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error - please check your connection";
      notifications.addNotification({ 
        type: "error", 
        title: "Failed to send invitation", 
        message: errorMessage
      });
      throw err;
    }
  };

  // Create a wrapper function that captures the team
  const createInviteHandler = (team: Team) => {
    return async (email: string, role: string) => {
      return handleInviteMember(email, role, team);
    };
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    setTeamToDelete({ id: teamId, name: teamName });
    setDeleteModalOpen(true);
  };

  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    
    if (deletingTeamId) return;
    
    setDeletingTeamId(teamToDelete.id);
    try {
      const res = await fetch(`/api/teams/${teamToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.addNotification({ 
          type: "error", 
          title: "Failed to delete team", 
          message: err.error || "Try again" 
        });
        return;
      }
      notifications.addNotification({ type: "success", title: "Team deleted!" });
      await loadTeams();
    } catch (e) {
      notifications.addNotification({ 
        type: "error", 
        title: "Failed to delete team", 
        message: "Network error" 
      });
    } finally {
      setDeletingTeamId(null);
      setDeleteModalOpen(false);
      setTeamToDelete(null);
    }
  };

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
    <>
      <SignedIn>
        <AppShell>
          <NextSeoNoSSR title="Teams" noindex nofollow />
          
          <div className="h-[calc(100vh-8rem)] overflow-hidden">
            <div className="h-full overflow-y-auto px-4 lg:px-0">
              <div className="space-y-4 py-4">
              {/* Comprehensive Header with Stats */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold" style={{ color: '#222831' }}>Team Management</h1>
                  <p className="text-lg" style={{ color: '#393E46' }}>
                    Manage your collaborative workspaces and team members
                  </p>
                  <div className="flex items-center gap-6 mt-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" style={{ color: '#00ADB5' }} />
                      <span className="text-sm font-medium" style={{ color: '#393E46' }}>
                        {actualTeams.length} Teams
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" style={{ color: '#00ADB5' }} />
                      <span className="text-sm font-medium" style={{ color: '#393E46' }}>
                        {actualTeams.reduce((sum, team) => sum + team.members.length, 0)} Total Members
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      openModal("create-team", {
                        onSubmit: handleCreateTeam
                      });
                    }}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-lg transition-all hover:scale-105 shadow-lg"
                    style={{ 
                      backgroundColor: '#00ADB5', 
                      color: 'white'
                    }}
                  >
                    <Plus className="w-5 h-5" />
                    Create New Team
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#00ADB5', borderTopColor: 'transparent' }} />
                    <h3 className="text-xl font-semibold mb-2" style={{ color: '#222831' }}>Loading Teams</h3>
                    <p style={{ color: '#393E46' }}>Fetching your team information...</p>
                  </div>
                </div>
              ) : actualTeams.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center" style={{ backgroundColor: '#EEEEEE', border: '2px solid #00ADB5' }}>
                    <Users className="w-12 h-12" style={{ color: '#00ADB5' }} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: '#222831' }}>Create Your First Team</h3>
                  <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: '#393E46' }}>
                    Start collaborating with your team members by creating a shared workspace for video content management.
                  </p>
                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        openModal("create-team", {
                          onSubmit: handleCreateTeam
                        });
                      }}
                      className="px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-105 shadow-lg"
                      style={{ 
                        backgroundColor: '#00ADB5', 
                        color: 'white'
                      }}
                    >
                      <Plus className="w-6 h-6 mr-3 inline" />
                      Create Your First Team
                    </button>
                    
                    {/* Team Benefits */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-4xl mx-auto">
                      <div className="text-center p-6 rounded-lg" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
                        <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-semibold mb-2" style={{ color: '#222831' }}>Collaborate</h4>
                        <p className="text-sm" style={{ color: '#393E46' }}>Work together on video content with role-based permissions</p>
                      </div>
                      <div className="text-center p-6 rounded-lg" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
                        <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-semibold mb-2" style={{ color: '#222831' }}>Secure</h4>
                        <p className="text-sm" style={{ color: '#393E46' }}>Control who can upload, review, and publish content</p>
                      </div>
                      <div className="text-center p-6 rounded-lg" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
                        <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-semibold mb-2" style={{ color: '#222831' }}>Scale</h4>
                        <p className="text-sm" style={{ color: '#393E46' }}>Grow your team and manage multiple projects efficiently</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Team Statistics Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-6 rounded-lg" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
                      <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold" style={{ color: '#222831' }}>{actualTeams.length}</div>
                      <div className="text-sm" style={{ color: '#393E46' }}>Active Teams</div>
                    </div>
                    <div className="text-center p-6 rounded-lg" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
                      <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#393E46' }}>
                        <UserCheck className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold" style={{ color: '#222831' }}>
                        {actualTeams.reduce((sum, team) => sum + team.members.filter(m => m.status !== "PAUSED").length, 0)}
                      </div>
                      <div className="text-sm" style={{ color: '#393E46' }}>Total Members</div>
                    </div>
                    <div className="text-center p-6 rounded-lg" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
                      <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#222831' }}>
                        <Crown className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold" style={{ color: '#222831' }}>
                        {actualTeams.filter(team => user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() === team.ownerEmail?.toLowerCase()).length}
                      </div>
                      <div className="text-sm" style={{ color: '#393E46' }}>Teams You Own</div>
                    </div>
                    <div className="text-center p-6 rounded-lg" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
                      <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold" style={{ color: '#222831' }}>
                        {actualTeams.reduce((sum, team) => sum + team.invitations.filter(inv => inv.status === "pending").length, 0)}
                      </div>
                      <div className="text-sm" style={{ color: '#393E46' }}>Pending Invites</div>
                    </div>
                  </div>

                  {/* Teams Grid */}
                  <div className="grid gap-4">
                    {actualTeams.map((team) => {
                      const isOwner = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() === team.ownerEmail?.toLowerCase();
                      const activeMembers = team.members.filter(m => m.status !== "PAUSED");
                      const pendingInvites = team.invitations.filter(inv => inv.status === "pending");

                      return (
                        <MotionDiv
                          key={team.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl p-6 transition-all hover:scale-[1.01] shadow-lg"
                          style={{ 
                            backgroundColor: '#EEEEEE',
                            border: `2px solid #393E46`
                          }}
                        >
                          {/* Team Header with Enhanced Info */}
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
                                    <span className="text-sm" style={{ color: '#00ADB5' }}>
                                      {pendingInvites.length} pending invites
                                    </span>
                                  )}
                                  <span className="text-sm" style={{ color: '#393E46' }}>
                                    Created {team.createdAt.toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {isOwner && (
                                <button
                                  onClick={() => {
                                    openModal("invite-member", {
                                      teamName: team.name,
                                      onSubmit: createInviteHandler(team)
                                    });
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-110 shadow-md"
                                  style={{ backgroundColor: '#00ADB5' }}
                                  title="Invite member"
                                >
                                  <UserPlus className="w-5 h-5 text-white" />
                                  <span className="text-white font-medium">Invite</span>
                                </button>
                              )}
                              <button className="p-3 rounded-lg transition-all hover:scale-110 shadow-md" style={{ backgroundColor: '#393E46' }}>
                                <MoreVertical className="w-5 h-5 text-white" />
                              </button>
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
                                        onClick={() => {/* resend logic */}} 
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
                                        onClick={() => {/* cancel logic */}} 
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

                          {/* Team Actions */}
                          <div className="flex items-center justify-between pt-4 border-t-2" style={{ borderColor: '#393E46' }}>
                            <div className="flex items-center gap-4">
                              <button className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-105" style={{ backgroundColor: '#393E46', color: 'white' }}>
                                <Settings className="w-4 h-4" />
                                Team Settings
                              </button>
                              {!isOwner && (
                                <button className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-105" style={{ backgroundColor: 'transparent', color: '#222831', border: '1px solid #393E46' }}>
                                  <LogOut className="w-4 h-4" />
                                  Leave Team
                                </button>
                              )}
                            </div>
                            
                            {isOwner && (
                              <button 
                                onClick={() => handleDeleteTeam(team.id, team.name)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-105" 
                                style={{ backgroundColor: 'transparent', color: '#222831', border: '1px solid #393E46' }}
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Team
                              </button>
                            )}
                          </div>
                        </MotionDiv>
                      );
                    })}
                  </div>

                  {/* Team Insights */}
                  <div className="p-6 rounded-xl" style={{ backgroundColor: '#EEEEEE', border: `2px solid #00ADB5` }}>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-3" style={{ color: '#222831' }}>
                      <TrendingUp className="w-6 h-6" style={{ color: '#00ADB5' }} />
                      Team Insights & Recommendations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <h4 className="font-semibold" style={{ color: '#222831' }}>Team Performance</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span style={{ color: '#393E46' }}>Average team size</span>
                            <span className="font-semibold" style={{ color: '#222831' }}>
                              {Math.round(actualTeams.reduce((sum, team) => sum + team.members.length, 0) / Math.max(actualTeams.length, 1))} members
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span style={{ color: '#393E46' }}>Most active team</span>
                            <span className="font-semibold" style={{ color: '#222831' }}>
                              {actualTeams.sort((a, b) => b.members.length - a.members.length)[0]?.name || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2" style={{ color: '#222831' }}>
                          <Lightbulb className="w-5 h-5" style={{ color: '#00ADB5' }} />
                          Growth Tips
                        </h4>
                        <div className="space-y-2 text-sm" style={{ color: '#393E46' }}>
                          {actualTeams.length < 3 ? (
                            <p>Consider creating specialized teams for different content types to improve collaboration and organization.</p>
                          ) : (
                            <p>Great job! Your teams are well organized. Consider inviting more members to scale your content production.</p>
                          )}
                          <p>Pro tip: Use role-based permissions to maintain quality control while enabling team growth.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Delete Team Confirmation Modal */}
          <ConfirmationModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onConfirm={confirmDeleteTeam}
            title="Delete Team?"
            message="This action cannot be undone. The team and all its videos will be permanently deleted."
            itemName={teamToDelete?.name}
            confirmText={deletingTeamId ? "Deleting..." : "Delete Permanently"}
            cancelText="Cancel"
            variant="danger"
            icon="trash"
            isLoading={!!deletingTeamId}
          />
        </AppShell>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/teams" />
      </SignedOut>
    </>
  );
}