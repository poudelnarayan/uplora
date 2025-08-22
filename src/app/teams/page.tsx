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
  LogOut
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
            <div className="h-full overflow-y-auto px-4 lg:px-0 space-y-6">
              {/* Clean Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: '#222831' }}>Teams</h1>
                  <p className="text-sm" style={{ color: '#393E46' }}>Manage your collaborative workspaces</p>
                </div>
                <button
                  onClick={() => {
                    openModal("create-team", {
                      onSubmit: handleCreateTeam
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: '#00ADB5', 
                    color: 'white'
                  }}
                >
                  <Plus className="w-4 h-4" />
                  New Team
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00ADB5', borderTopColor: 'transparent' }} />
                </div>
              ) : actualTeams.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: '#EEEEEE' }}>
                    <Users className="w-8 h-8" style={{ color: '#00ADB5' }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: '#222831' }}>Create your first team</h3>
                  <p className="mb-6" style={{ color: '#393E46' }}>Start collaborating with your team members</p>
                  <button
                    onClick={() => {
                      openModal("create-team", {
                        onSubmit: handleCreateTeam
                      });
                    }}
                    className="px-6 py-3 rounded-lg font-medium transition-all hover:scale-105"
                    style={{ 
                      backgroundColor: '#00ADB5', 
                      color: 'white'
                    }}
                  >
                    Create Team
                  </button>
                </div>
              ) : (
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
                        className="rounded-lg p-6 transition-all hover:scale-[1.02] cursor-pointer"
                        style={{ 
                          backgroundColor: '#EEEEEE',
                          border: `1px solid #393E46`
                        }}
                      >
                        {/* Team Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
                              <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold" style={{ color: '#222831' }}>{team.name}</h3>
                              <p className="text-sm" style={{ color: '#393E46' }}>{activeMembers.length} members</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isOwner && (
                              <button
                                onClick={() => {
                                  openModal("invite-member", {
                                    teamName: team.name,
                                    onSubmit: createInviteHandler(team)
                                  });
                                }}
                                className="p-2 rounded-lg transition-all hover:scale-110"
                                style={{ backgroundColor: '#00ADB5' }}
                                title="Invite member"
                              >
                                <UserPlus className="w-4 h-4 text-white" />
                              </button>
                            )}
                            <button className="p-2 rounded-lg transition-all hover:scale-110" style={{ backgroundColor: '#393E46' }}>
                              <MoreVertical className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>

                        {/* Members Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                          {activeMembers.slice(0, 6).map((member) => (
                            <div 
                              key={member.id}
                              className="flex items-center gap-3 p-3 rounded-lg"
                              style={{ backgroundColor: 'white', border: `1px solid #393E46` }}
                            >
                              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#222831' }}>
                                <span className="text-sm font-medium text-white">
                                  {member.name[0]?.toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: '#222831' }}>
                                  {member.name}
                                </p>
                                <div className="flex items-center gap-1">
                                  {getRoleIcon(member.role)}
                                  <span className="text-xs" style={{ color: '#393E46' }}>
                                    {member.role.toLowerCase()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {activeMembers.length > 6 && (
                            <div 
                              className="flex items-center justify-center p-3 rounded-lg border-2 border-dashed"
                              style={{ borderColor: '#393E46' }}
                            >
                              <span className="text-sm font-medium" style={{ color: '#393E46' }}>
                                +{activeMembers.length - 6} more
                              </span>
                            </div>
                          )}
                        {/* Pending Invites */}
                        {pendingInvites.length > 0 && (
                          <div className="flex items-center gap-2 text-sm" style={{ color: '#393E46' }}>
                            <Mail className="w-4 h-4" style={{ color: '#00ADB5' }} />
                            <span>{pendingInvites.length} pending invite{pendingInvites.length > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </MotionDiv>
                    );
                  })}
                </div>
              )}
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
            </div>
          </div>
        </AppShell>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/teams" />
      </SignedOut>
    </>
  );
}