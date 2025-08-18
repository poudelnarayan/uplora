"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import AppShell from "@/components/layout/AppShell";
import { useNotifications } from "@/components/ui/Notification";
import TeamList from "@/components/teams/TeamList";
import CreateTeamModal from "@/components/teams/CreateTeamModal";
import InviteMemberModal from "@/components/teams/InviteMemberModal";
import { motion } from "framer-motion";
import { Users, Plus, Crown, Mail, UserCheck, Clock } from "lucide-react";
import { useModalManager } from "@/components/ui/Modal";

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
  const { openModal } = useModalManager();
  const [renamingTeamId, setRenamingTeamId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  const [inviting, setInviting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Expose modal function globally for TeamList component
  useEffect(() => {
    (window as any).openCreateTeamModal = () => {
      openModal("create-team", {
        onSubmit: handleCreateTeam
      });
    };
    return () => {
      delete (window as any).openCreateTeamModal;
    };
  }, [openModal]);

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
        setShowInviteModal(false);
        await loadTeams();
      } else {
        notifications.addNotification({ 
          type: "error", 
          title: "Failed to send invitation", 
          message: result.error || "Please try again"
        });
      }
    } catch (err) {
      notifications.addNotification({ 
        type: "error", 
        title: "Failed to send invitation", 
        message: "Network error - please check your connection"
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
      <div className="min-h-full space-y-6">
        {/* Header with Primary Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center sm:text-left"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Team Management</h1>
            <p className="text-muted-foreground">Manage your teams, members, and invitations</p>
          </div>
        </motion.div>


        {/* Teams List - Core Functionality */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <TeamList
            teams={teams}
            loading={loading}
            onCreateTeam={() => {
              openModal("create-team", {
                onSubmit: handleCreateTeam
              });
            }}
            onInviteMember={(team) => openModal("invite-member", {
              teamName: team.name,
              onSubmit: handleInviteMember
            })}
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

        {/* Modals */}
      </div>
    </AppShell>
  );
}