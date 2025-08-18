"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import AppShell from "@/components/layout/AppShell";
import { useNotifications } from "@/components/ui/Notification";
import TeamHeader from "@/components/teams/TeamHeader";
import TeamList from "@/components/teams/TeamList";
import CreateTeamModal from "@/components/teams/CreateTeamModal";
import InviteMemberModal from "@/components/teams/InviteMemberModal";

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

      const result = await res.json();
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

  return (
    <AppShell>
      <div className="h-full flex flex-col">
        <TeamHeader onCreateTeam={() => setShowCreateTeam(true)} />
        
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
          onDeleteTeam={(teamId, teamName) => {
            // Handle delete team logic here
            console.log("Delete team:", teamId, teamName);
          }}
          onLeaveTeam={(teamId, teamName) => {
            // Handle leave team logic here
            console.log("Leave team:", teamId, teamName);
          }}
          onResendInvitation={async (teamId, invitationId) => {
            setResendingId(invitationId);
            // Implementation here
            setResendingId(null);
          }}
          onCancelInvitation={async (teamId, invitationId) => {
            // Implementation here
          }}
          onToggleMemberStatus={(teamId, memberId, memberName, currentStatus, teamName) => {
            // Handle toggle member status logic here
            console.log("Toggle member status:", teamId, memberId, currentStatus);
          }}
          onRemoveMember={(teamId, memberId, teamName) => {
            // Handle remove member logic here
            console.log("Remove member:", teamId, memberId, teamName);
          }}
          renamingTeamId={renamingTeamId}
          renameValue={renameValue}
          onRenameValueChange={setRenameValue}
          onSaveRename={async (teamId) => {
            // Implementation here
            setRenamingTeamId(null);
          }}
          onCancelRename={() => setRenamingTeamId(null)}
          resendingId={resendingId}
          currentUserEmail={session?.user?.email || ""}
        />
      </div>

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
    </AppShell>
  );
}