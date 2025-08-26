"use client";

import { useState, useEffect } from "react";
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import AppShell from "@/components/layout/AppShell";
import { useNotifications } from "@/components/ui/Notification";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { useModalManager } from "@/components/ui/Modal";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";

// Import our new components
import TeamCard, { Team, TeamMember, TeamInvitation } from "@/components/teams/TeamCard";
import TeamsHeader from "@/components/teams/TeamsHeader";
import TeamsStats from "@/components/teams/TeamsStats";
import EmptyTeamsState from "@/components/teams/EmptyTeamsState";
import LoadingSpinner from "@/components/teams/LoadingSpinner";

export const dynamic = "force-dynamic";

export default function TeamsPage() {
  const { user } = useUser();
  const notifications = useNotifications();
  
  // State management
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const { openModal } = useModalManager();
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<{ id: string; name: string } | null>(null);
  const [teamToLeave, setTeamToLeave] = useState<{ id: string; name: string } | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  const [leavingTeamId, setLeavingTeamId] = useState<string | null>(null);

  // Filter out personal workspaces from team display
  const actualTeams = teams.filter(team => !team.isPersonal);
  const currentUserEmail = user?.emailAddresses?.[0]?.emailAddress || "";

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
      const result = await res.json();
      // Handle wrapped response format from API
      const list = Array.isArray(result) ? result : (result.data || []);

      // Filter to only include non-personal teams for the teams page
      const nonPersonalTeams = list.filter((t: any) => !t.isPersonal);

      // Fetch detailed team information
      const detailed: Team[] = await Promise.all(
        nonPersonalTeams.map(async (t: any) => {
          try {
            const dRes = await fetch(`/api/teams/${t.id}/details`, { cache: "no-store" });
            if (dRes.ok) {
              const result = await dRes.json();
              const details = result.ok ? result : { team: result.team, members: result.members, invites: result.invites };
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
                isOwner: t.isOwner || false,
                role: t.role || "MEMBER"
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
            isOwner: t.isOwner || false,
            role: t.role || "MEMBER"
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

  const handleLeaveTeam = async (teamId: string, teamName: string) => {
    setTeamToLeave({ id: teamId, name: teamName });
    setLeaveModalOpen(true);
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
      notifications.addNotification({ 
        type: "success", 
        title: "Team deleted!", 
        message: "All team members have been removed and team data has been deleted."
      });
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

  const confirmLeaveTeam = async () => {
    if (!teamToLeave) return;
    
    if (leavingTeamId) return;
    
    setLeavingTeamId(teamToLeave.id);
    try {
      const res = await fetch(`/api/teams/${teamToLeave.id}/leave`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.addNotification({ 
          type: "error", 
          title: "Failed to leave team", 
          message: err.error || "Try again" 
        });
        return;
      }
      notifications.addNotification({ 
        type: "success", 
        title: "Left team successfully!", 
        message: `You are no longer a member of ${teamToLeave.name}`
      });
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

  const handleResendInvitation = async (invitationId: string) => {
    setResendingId(invitationId);
    try {
      // Find which team this invitation belongs to
      const team = actualTeams.find(t => 
        t.invitations.some(inv => inv.id === invitationId)
      );
      
      if (!team) {
        notifications.addNotification({ 
          type: "error", 
          title: "Failed to resend invitation", 
          message: "Team not found" 
        });
        return;
      }

      const res = await fetch(`/api/teams/${team.id}/invite/${invitationId}`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      const result = await res.json();
      
      if (res.ok) {
        if (result.emailSent) {
          notifications.addNotification({ 
            type: "success", 
            title: "Invitation resent!", 
            message: "Email delivered successfully" 
          });
        } else {
          notifications.addNotification({ 
            type: "warning", 
            title: "Resend failed", 
            message: "Could not deliver email" 
          });
        }
        await loadTeams();
      } else {
        notifications.addNotification({ 
          type: "error", 
          title: "Failed to resend invitation", 
          message: result.error || "Try again" 
        });
      }
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

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      // Find which team this invitation belongs to
      const team = actualTeams.find(t => 
        t.invitations.some(inv => inv.id === invitationId)
      );
      
      if (!team) {
        notifications.addNotification({ 
          type: "error", 
          title: "Failed to cancel invitation", 
          message: "Team not found" 
        });
        return;
      }

      const res = await fetch(`/api/teams/${team.id}/invite/${invitationId}`, { 
        method: "DELETE"
      });
      
      if (res.ok) {
        notifications.addNotification({ 
          type: "success", 
          title: "Invitation canceled!", 
          message: "The invitation has been removed" 
        });
        await loadTeams();
      } else {
        const err = await res.json().catch(() => ({}));
        notifications.addNotification({ 
          type: "error", 
          title: "Failed to cancel invitation", 
          message: err.error || "Try again" 
        });
      }
    } catch (e) {
      notifications.addNotification({ 
        type: "error", 
        title: "Failed to cancel invitation", 
        message: "Network error" 
      });
    }
  };

  const openCreateTeamModal = () => {
    openModal("create-team", {
      onSubmit: handleCreateTeam
    });
  };

  const openInviteMemberModal = (team: Team) => {
    openModal("invite-member", {
      teamName: team.name,
      onSubmit: createInviteHandler(team)
    });
  };

  return (
    <>
      <SignedIn>
        <AppShell>
          <NextSeoNoSSR title="Teams" noindex nofollow />
          
          <div className="h-[calc(100vh-8rem)] overflow-hidden">
            <div className="h-full overflow-y-auto px-4 lg:px-0">
              <div className="space-y-4 py-4">
                
                <TeamsHeader 
                  teams={actualTeams} 
                  onCreateTeam={openCreateTeamModal}
                />

                {loading ? (
                  <LoadingSpinner />
                ) : actualTeams.length === 0 ? (
                  <EmptyTeamsState onCreateTeam={openCreateTeamModal} />
                ) : (
                  <div className="space-y-6">
                    <TeamsStats 
                      teams={actualTeams} 
                      currentUserEmail={currentUserEmail}
                    />

                    {/* Teams Grid */}
                    <div className="grid gap-4">
                      {actualTeams.map((team) => (
                        <TeamCard
                          key={team.id}
                          team={team}
                          currentUserEmail={currentUserEmail}
                          onInviteMember={openInviteMemberModal}
                          onDeleteTeam={handleDeleteTeam}
                          onLeaveTeam={handleLeaveTeam}
                          onResendInvitation={handleResendInvitation}
                          onCancelInvitation={handleCancelInvitation}
                          resendingId={resendingId}
                        />
                      ))}
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
            message="This action cannot be undone. The team and all its data will be permanently deleted. All team members will be removed."
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
            message="You will no longer have access to this team's content and will need to be re-invited to rejoin."
            itemName={teamToLeave?.name}
            confirmText={leavingTeamId ? "Leaving..." : "Leave Team"}
            cancelText="Cancel"
            variant="warning"
            icon="logout"
            isLoading={!!leavingTeamId}
          />
        </AppShell>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/teams" />
      </SignedOut>
    </>
  );
}