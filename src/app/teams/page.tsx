"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import AppShell from "@/components/layout/AppShell";
import { useNotifications } from "@/components/ui/Notification";
import TeamList from "@/components/teams/TeamList";
import CreateTeamModal from "@/components/teams/CreateTeamModal";
import InviteMemberModal from "@/components/teams/InviteMemberModal";
import { motion } from "framer-motion";
import { Users, Plus, Crown, Target, TrendingUp, Sparkles } from "lucide-react";

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
}

export default function TeamsPage() {
  const { data: session } = useSession();
  const notifications = useNotifications();
  
  // State management
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [renamingTeamId, setRenamingTeamId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  const [inviting, setInviting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

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

      // Fetch detailed team information
      const detailed: Team[] = await Promise.all(
        list.map(async (t: any) => {
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
                  invitedBy: session?.user?.name || "",
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
    if (session) {
      loadTeams();
    }
  }, [session?.user?.name, session?.user?.email]);

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
      setShowCreateTeam(false);
      await loadTeams();
    } catch (e) {
      notifications.addNotification({ 
        type: "error", 
        title: "Failed to create team", 
        message: "Network error" 
      });
    }
  };

  const handleInviteMember = async (email: string, role: string) => {
    if (!selectedTeam) return;
    
    setInviting(true);
    try {
      const res = await fetch(`/api/teams/${selectedTeam.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.addNotification({ 
          type: "error", 
          title: "Failed to send invitation", 
          message: err.error || "Please try again"
        });
        return;
      }

      notifications.addNotification({ 
        type: "success", 
        title: "Invitation sent!", 
        message: `Email sent to ${email}` 
      });
      setShowInviteModal(false);
      await loadTeams();
    } catch (err) {
      notifications.addNotification({ 
        type: "error", 
        title: "Failed to send invitation", 
        message: "Network error"
      });
    } finally {
      setInviting(false);
    }
  };

  const handleSaveRename = async (teamId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.addNotification({ 
          type: "error", 
          title: "Failed to rename team", 
          message: err.error || "Try again" 
        });
        return;
      }
      notifications.addNotification({ type: "success", title: "Team renamed!" });
      setRenamingTeamId(null);
      await loadTeams();
    } catch (e) {
      notifications.addNotification({ 
        type: "error", 
        title: "Failed to rename team", 
        message: "Network error" 
      });
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete "${teamName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
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
    }
  };

  const handleLeaveTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to leave "${teamName}"?`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/teams/${teamId}/members/self`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.addNotification({ 
          type: "error", 
          title: "Failed to leave team", 
          message: err.error || "Try again" 
        });
        return;
      }
      notifications.addNotification({ type: "success", title: "Left team successfully!" });
      await loadTeams();
    } catch (e) {
      notifications.addNotification({ 
        type: "error", 
        title: "Failed to leave team", 
        message: "Network error" 
      });
    }
  };

  const handleResendInvitation = async (teamId: string, invitationId: string) => {
    setResendingId(invitationId);
    try {
      const invitation = teams.find(t => t.id === teamId)?.invitations.find(i => i.id === invitationId);
      if (!invitation) return;
      
      const res = await fetch(`/api/teams/${teamId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: invitation.email, 
          role: invitation.role, 
          resend: true 
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.addNotification({ 
          type: "error", 
          title: "Failed to resend invitation", 
          message: err.error || "Try again" 
        });
        return;
      }
      notifications.addNotification({ type: "success", title: "Invitation resent!" });
      await loadTeams();
    } catch (e) {
      notifications.addNotification({ 
        type: "error", 
        title: "Failed to resend invitation", 
        message: "Network error" 
      });
    } finally {
      setResendingId(null);
    }
  };

  const handleCancelInvitation = async (teamId: string, invitationId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/invite/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invitationId })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.addNotification({ 
          type: "error", 
          title: "Failed to cancel invitation", 
          message: err.error || "Try again" 
        });
        return;
      }
      notifications.addNotification({ type: "success", title: "Invitation cancelled!" });
      await loadTeams();
    } catch (e) {
      notifications.addNotification({ 
        type: "error", 
        title: "Failed to cancel invitation", 
        message: "Network error" 
      });
    }
  };

  const handleToggleMemberStatus = async (teamId: string, memberId: string, memberName: string, currentStatus: string, teamName: string) => {
    const newStatus = currentStatus === "PAUSED" ? "ACTIVE" : "PAUSED";
    const action = newStatus === "ACTIVE" ? "activate" : "pause";
    
    if (!confirm(`Are you sure you want to ${action} ${memberName}?`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.addNotification({ 
          type: "error", 
          title: `Failed to ${action} member`, 
          message: err.error || "Try again" 
        });
        return;
      }
      notifications.addNotification({ 
        type: "success", 
        title: `Member ${action}d!`, 
        message: `${memberName} has been ${action}d` 
      });
      await loadTeams();
    } catch (e) {
      notifications.addNotification({ 
        type: "error", 
        title: `Failed to ${action} member`, 
        message: "Network error" 
      });
    }
  };

  const handleRemoveMember = async (teamId: string, memberId: string, teamName: string) => {
    const member = teams.find(t => t.id === teamId)?.members.find(m => m.id === memberId);
    if (!member) return;
    
    if (!confirm(`Are you sure you want to remove ${member.name} from "${teamName}"?`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.addNotification({ 
          type: "error", 
          title: "Failed to remove member", 
          message: err.error || "Try again" 
        });
        return;
      }
      notifications.addNotification({ 
        type: "success", 
        title: "Member removed!", 
        message: `${member.name} has been removed from the team` 
      });
      await loadTeams();
    } catch (e) {
      notifications.addNotification({ 
        type: "error", 
        title: "Failed to remove member", 
        message: "Network error" 
      });
    }
  };

  // Calculate stats
  const totalMembers = teams.reduce((sum, team) => sum + team.members.length, 0);
  const ownedTeams = teams.filter(team => 
    team.ownerEmail?.toLowerCase() === session?.user?.email?.toLowerCase()
  ).length;
  const pendingInvitations = teams.reduce((sum, team) => 
    sum + team.invitations.filter(inv => inv.status === "pending").length, 0
  );

  return (
    <AppShell>
      <div className="min-h-full">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-3xl blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-card to-muted/30 rounded-2xl p-8 border border-border/50">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h1 className="heading-2 mb-3">Team Management</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Build and manage your content creation teams. Invite collaborators, assign roles, and streamline your workflow.
              </p>
              
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setShowCreateTeam(true)}
                  className="btn btn-primary btn-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Team
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="card p-6 text-center hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">{teams.length}</div>
            <div className="text-sm text-muted-foreground">Active Teams</div>
          </div>
          
          <div className="card p-6 text-center hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">{totalMembers}</div>
            <div className="text-sm text-muted-foreground">Total Members</div>
          </div>
          
          <div className="card p-6 text-center hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Crown className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">{ownedTeams}</div>
            <div className="text-sm text-muted-foreground">Teams You Own</div>
          </div>
          
          <div className="card p-6 text-center hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">{pendingInvitations}</div>
            <div className="text-sm text-muted-foreground">Pending Invites</div>
          </div>
        </motion.div>

        {/* Teams List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Your Teams</h2>
                <p className="text-muted-foreground">Manage your team collaborations and member permissions</p>
              </div>
              
              {teams.length > 0 && (
                <button
                  onClick={() => setShowCreateTeam(true)}
                  className="btn btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Team
                </button>
              )}
            </div>
          </div>
          
          <TeamList
            teams={teams}
            loading={loading}
            onCreateTeam={() => setShowCreateTeam(true)}
            onInviteMember={(team) => {
              setSelectedTeam(team);
              setShowInviteModal(true);
            }}
            onStartRename={(teamId, currentName) => {
              setRenamingTeamId(teamId);
              setRenameValue(currentName);
            }}
            onDeleteTeam={handleDeleteTeam}
            onLeaveTeam={handleLeaveTeam}
            onResendInvitation={handleResendInvitation}
            onCancelInvitation={handleCancelInvitation}
            onToggleMemberStatus={handleToggleMemberStatus}
            onRemoveMember={handleRemoveMember}
            renamingTeamId={renamingTeamId}
            renameValue={renameValue}
            onRenameValueChange={setRenameValue}
            onSaveRename={handleSaveRename}
            onCancelRename={() => setRenamingTeamId(null)}
            resendingId={resendingId}
            currentUserEmail={session?.user?.email || ""}
          />
        </motion.div>

        {/* Team Growth Tips */}
        {teams.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <div className="card p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">Team Growth Tips</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>Assign clear roles to team members for better workflow organization</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                      <span>Use team descriptions to clarify purpose and goals</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                      <span>Regularly review member permissions and access levels</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-warning rounded-full mt-2 flex-shrink-0"></div>
                      <span>Create specialized teams for different content types</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Modals */}
        <CreateTeamModal
          isOpen={showCreateTeam}
          onClose={() => setShowCreateTeam(false)}
          onSubmit={handleCreateTeam}
        />

        <InviteMemberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          team={selectedTeam}
          onSubmit={handleInviteMember}
          inviting={inviting}
        />
      </div>
    </AppShell>
  );
}