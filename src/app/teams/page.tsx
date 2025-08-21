"use client";

import { useState, useEffect } from "react";
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import AppShell from "@/components/layout/AppShell";
import { useNotifications } from "@/components/ui/Notification";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import TeamList from "@/components/teams/TeamList";
import CreateTeamModal from "@/components/teams/CreateTeamModal";
import InviteMemberModal from "@/components/teams/InviteMemberModal";
import { motion } from "framer-motion";

const MotionDiv = motion.div as any;
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
  const { user } = useUser();
  const notifications = useNotifications();
  
  // State management
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
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

  // Realtime: auto-refresh teams on team events
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      const url = `/api/events`;
      es = new EventSource(url);
      const handler = (ev: MessageEvent) => {
        try {
          const evt = JSON.parse(ev.data || '{}');
          if (evt?.type?.startsWith('team.')) {
            // Reload teams for any team-related events
            loadTeams();
            
            // Show notifications for specific events
            if (evt.type === 'team.member.added') {
              notifications.addNotification({
                type: "success",
                title: "New team member",
                message: "A new member has joined the team"
              });
            } else if (evt.type === 'team.member.updated') {
              notifications.addNotification({
                type: "info",
                title: "Member status updated",
                message: `Member status changed to ${evt.payload.status}`
              });
            } else if (evt.type === 'team.member.removed') {
              notifications.addNotification({
                type: "info",
                title: "Member removed",
                message: "A member has been removed from the team"
              });
            } else if (evt.type === 'team.invite') {
              notifications.addNotification({
                type: "info",
                title: "Invitation sent",
                message: `Invitation sent to ${evt.payload.email}`
              });
            } else if (evt.type === 'team.invite.cancelled') {
              notifications.addNotification({
                type: "info",
                title: "Invitation cancelled",
                message: "Team invitation has been cancelled"
              });
            } else if (evt.type === 'team.deleted') {
              notifications.addNotification({
                type: "info",
                title: "Team deleted",
                message: "A team has been deleted"
              });
            }
          }
        } catch {}
      };
      es.onmessage = handler;
      es.onerror = () => { try { es?.close(); } catch {}; es = null; };
    } catch {}
    return () => { try { es?.close(); } catch {} };
  }, [notifications]);

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
    const targetTeam = team || selectedTeam;
    
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
    // Set the team to delete and open modal
    setTeamToDelete({ id: teamId, name: teamName });
    setDeleteModalOpen(true);
  };

  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    
    // Prevent multiple clicks
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

  const handleLeaveTeam = async (teamId: string, teamName: string) => {
    // Set the team to leave and open modal
    setTeamToLeave({ id: teamId, name: teamName });
    setLeaveModalOpen(true);
  };

  const confirmLeaveTeam = async () => {
    if (!teamToLeave) return;
    
    // Prevent multiple clicks
    if (leavingTeamId) return;
    
    setLeavingTeamId(teamToLeave.id);
    try {
      const res = await fetch(`/api/teams/${teamToLeave.id}/members/self`, { method: "DELETE" });
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
    } finally {
      setLeavingTeamId(null);
      setLeaveModalOpen(false);
      setTeamToLeave(null);
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
  const totalMembers = actualTeams.reduce((sum, team) => sum + team.members.length, 0);
  const ownedTeams = actualTeams.filter(team => 
    team.ownerEmail?.toLowerCase() === (user?.emailAddresses?.[0]?.emailAddress || "").toLowerCase()
  ).length;
  const pendingInvitations = actualTeams.reduce((sum, team) => 
    sum + team.invitations.filter(inv => inv.status === "pending").length, 0
  );

  return (
    <>
    <SignedIn>
    <AppShell>
      <div className="min-h-full space-y-6">
        {/* Conditional Header Based on Team Count */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center sm:text-left"
        >
          {actualTeams.length === 0 ? (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
              <button
                onClick={() => {
                  openModal("create-team", {
                    onSubmit: handleCreateTeam
                  });
                }}
                className="btn btn-primary btn-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Team
              </button>
            </div>
          )}
        </MotionDiv>


        {/* Teams List - Core Functionality */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <TeamList
            teams={actualTeams}
            loading={loading}
            onCreateTeam={() => {
              openModal("create-team", {
                onSubmit: handleCreateTeam
              });
            }}
            onInviteMember={(team) => {
              openModal("invite-member", {
                teamName: team.name,
                onSubmit: createInviteHandler(team)
              });
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
            currentUserEmail={user?.emailAddresses?.[0]?.emailAddress || ""}
          />
        </MotionDiv>

        {/* Modals */}
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

        {/* Leave Team Confirmation Modal */}
        <ConfirmationModal
          isOpen={leaveModalOpen}
          onClose={() => setLeaveModalOpen(false)}
          onConfirm={confirmLeaveTeam}
          title="Leave Team?"
          message="You will no longer have access to this team's videos and content."
          itemName={teamToLeave?.name}
          confirmText={leavingTeamId ? "Leaving..." : "Leave Team"}
          cancelText="Cancel"
          variant="warning"
          icon="warning"
          isLoading={!!leavingTeamId}
        />
      </div>
    </AppShell>
    </SignedIn>
    <SignedOut>
      <RedirectToSignIn redirectUrl="/teams" />
    </SignedOut>
    </>
  );
}