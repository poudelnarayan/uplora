"use client";

import { useState, useEffect } from "react";
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import AppShell from "@/components/layout/AppShell";
import { useNotifications } from "@/components/ui/Notification";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import TeamsHeader from "@/components/teams/TeamHeader";
import TeamsList from "@/components/teams/TeamList";
import EmptyTeamsState from "@/components/teams/TeamInsights";
import { motion } from "framer-motion";
import { useModalManager } from "@/components/ui/Modal";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import styles from "./Teams.module.css";

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

  return (
    <>
      <SignedIn>
        <AppShell>
          <NextSeoNoSSR title="Teams" noindex nofollow />
          
          <div className={styles.container}>
            <div className={styles.content}>
              {/* Header */}
              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.headerSection}
              >
                <TeamsHeader 
                  hasTeams={actualTeams.length > 0}
                  onCreateTeam={() => {
                    openModal("create-team", {
                      onSubmit: handleCreateTeam
                    });
                  }}
                />
              </MotionDiv>

              {/* Teams Content */}
              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={styles.teamsSection}
              >
                {actualTeams.length === 0 ? (
                  <EmptyTeamsState
                    onCreateTeam={() => {
                      openModal("create-team", {
                        onSubmit: handleCreateTeam
                      });
                    }}
                  />
                ) : (
                  <TeamsList
                    teams={actualTeams}
                    loading={loading}
                    onInviteMember={(team) => {
                      openModal("invite-member", {
                        teamName: team.name,
                        onSubmit: createInviteHandler(team)
                      });
                    }}
                    onDeleteTeam={handleDeleteTeam}
                    currentUserEmail={user?.emailAddresses?.[0]?.emailAddress || ""}
                  />
                )}
              </MotionDiv>

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