"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  Users, 
  Plus, 
  Mail, 
  Crown, 
  Shield, 
  Target, 
  Edit, 
  Trash2,
  X,
  UserPlus
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useNotifications } from "@/components/ui/Notification";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { TextField, SelectField } from "@/components/ui/TextField";
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
  // rename + confirmations
  const [renamingTeamId, setRenamingTeamId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    action: "delete" | "leave" | "remove-member" | "toggle-status" | null;
    teamId: string | null;
    teamName: string;
    memberId?: string;
    memberName?: string;
    memberRole?: string;
    nextStatus?: "ACTIVE" | "PAUSED";
  }>({ open: false, action: null, teamId: null, teamName: "" });
  // invite loading states
  const [inviting, setInviting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  
  // Form states
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [invitation, setInvitation] = useState({
    email: "",
    role: "EDITOR" as "ADMIN" | "MANAGER" | "EDITOR"
  });

  // Initialize from server
  const loadTeams = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/teams", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.addNotification({ type: "error", title: "Failed to load teams", message: err.error || "Try again" });
        setLoading(false);
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      // Dedupe by name to avoid duplicate default teams
      const seen = new Set<string>();
      const unique = list.filter((t: any) => {
        const key = (t.name || "").toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Fetch real details (members + invites) for each team
      const detailed: Team[] = await Promise.all(
        unique.map(async (t: any) => {
          try {
            const dRes = await fetch(`/api/teams/${t.id}/details`, { cache: "no-store" });
            if (dRes.ok) {
              const details = await dRes.json();
              // map members
              const mappedMembers: TeamMember[] = (details.members || []).map((m: any) => ({
                id: m.id,
                name: m.user?.name || m.user?.email?.split("@")[0] || "Member",
                email: m.user?.email || "",
                role: m.role,
                joinedAt: new Date(m.joinedAt),
                status: (m.status || "ACTIVE") as any,
              }));
              // include owner as a member row
              const ownerUser = details.team?.owner;
              if (ownerUser) {
                const ownerExists = mappedMembers.some(mm => mm.email.toLowerCase() === (ownerUser.email || "").toLowerCase());
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
                createdAt: details.team.createdAt ? new Date(details.team.createdAt) : (t.createdAt ? new Date(t.createdAt) : new Date()),
                ownerEmail: ownerUser?.email || "",
              } as Team;
            }
          } catch {}
          // Fallback to minimal team if details fetch fails
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
      notifications.addNotification({ type: "error", title: "Failed to load teams", message: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const startRename = (teamId: string, currentName: string) => {
    setRenamingTeamId(teamId);
    setRenameValue(currentName);
  };

  const saveRename = async (teamId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.addNotification({ type: "error", title: "Rename failed", message: err.error || "Try again" });
        return;
      }
      const updated = await res.json();
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, name: updated.name } : t));
      setRenamingTeamId(null);
      notifications.addNotification({ type: "success", title: "Team renamed" });
    } catch {
      notifications.addNotification({ type: "error", title: "Network error" });
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.addNotification({ type: "error", title: "Delete failed", message: err.error || "Try again" });
        return;
      }
      setTeams(prev => prev.filter(t => t.id !== teamId));
      notifications.addNotification({ type: "success", title: "Team deleted" });
    } catch {
      notifications.addNotification({ type: "error", title: "Network error" });
    }
  };

  const handleLeaveTeam = async (teamId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members/self`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.addNotification({ type: "error", title: "Failed to leave", message: err.error || "Try again" });
        return;
      }
      setTeams(prev => prev.filter(t => t.id !== teamId));
      notifications.addNotification({ type: "success", title: "Left team" });
    } catch {
      notifications.addNotification({ type: "error", title: "Network error" });
    }
  };

  useEffect(() => {
    if (session) {
      loadTeams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.name, session?.user?.email]);

  // Handle team creation via API
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeam.name.trim()) return;

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeam.name.trim(), description: newTeam.description })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.addNotification({ type: "error", title: "Failed to create team", message: err.error || "Try again" });
        return;
      }
      notifications.addNotification({ type: "success", title: "Team created!" });
      setShowCreateTeam(false);
      setNewTeam({ name: "", description: "" });
      await loadTeams();
    } catch (e) {
      notifications.addNotification({ type: "error", title: "Failed to create team", message: "Network error" });
    }
  };

  // Prevent duplicate pending invitations; allow resend from pending list
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation.email.trim() || !selectedTeam) return;

    const email = invitation.email.trim().toLowerCase();
    // Frontend email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      notifications.addNotification({ type: "error", title: "Invalid email", message: "Please enter a valid email address" });
      return;
    }
    const team = selectedTeam;
    const hasPending = team.invitations.some(
      (inv) => inv.status === "pending" && inv.email.toLowerCase() === email
    );

    if (hasPending) {
      notifications.addNotification({
        type: "warning",
        title: "Already invited",
        message: "This email already has a pending invitation. You can resend from the pending list."
      });
      return;
    }

    try {
      setInviting(true);
      const res = await fetch(`/api/teams/${team.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: invitation.email.trim(), role: invitation.role })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.addNotification({ type: "error", title: "Failed to send invitation", message: err.error || "Please try again" });
        return;
      }

      const result = await res.json();
      const inviteUrl = result?.token ? `${window.location.origin}/invite/${result.token}` : "";

      // Update local UI list
      const newInvitation: TeamInvitation = {
        id: result?.id || result?.token || Date.now().toString(),
        email: invitation.email.trim(),
        role: invitation.role,
        status: "pending",
        invitedAt: new Date(),
        invitedBy: session?.user?.name || "You"
      };

      setTeams(prev => prev.map(t => t.id === team.id ? { ...t, invitations: [newInvitation, ...t.invitations] } : t));

      // Notify
      if (result?.emailSent) {
        notifications.addNotification({ type: "success", title: "Invitation sent!", message: `Email sent to ${invitation.email}` });
      } else {
        notifications.addNotification({ type: "warning", title: "Email not sent", message: "Copied invite link to clipboard" });
        if (inviteUrl) {
          try { await navigator.clipboard.writeText(inviteUrl); } catch {}
        }
      }

      setInvitation({ email: "", role: "EDITOR" });
      setShowInviteModal(false);
    } catch (err) {
      notifications.addNotification({ type: "error", title: "Failed to send invitation", message: "Network error" });
    } finally {
      setInviting(false);
    }
  };

  const handleResendInvitation = async (teamId: string, invitationId: string) => {
    const team = teams.find(t => t.id === teamId);
    const inv = team?.invitations.find(i => i.id === invitationId);
    if (!team || !inv) return;
    try {
      setResendingId(invitationId);
      await fetch(`/api/teams/${team.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inv.email, role: inv.role, resend: true })
      });
    } catch {}
    setTeams(prev => prev.map(t => t.id !== teamId ? t : ({...t, invitations: t.invitations.map(i => i.id === invitationId ? { ...i, invitedAt: new Date() } : i)})));
    notifications.addNotification({ type: "info", title: "Invitation resent" });
    setResendingId(null);
  };

  // Removed simulated acceptance. Acceptance occurs via invite link.

  const handleCancelInvitation = async (teamId: string, invitationId: string) => {
    // Find invite token/id and call server
    const team = teams.find(t => t.id === teamId);
    const inv = team?.invitations.find(i => i.id === invitationId);
    if (!team || !inv) return;
    try {
      const res = await fetch(`/api/teams/${teamId}/invite/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invitationId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.addNotification({ type: "error", title: "Failed", message: err.error || "Could not cancel invitation" });
        return;
      }
      setTeams(prev => prev.map(t => 
        t.id === teamId 
          ? { ...t, invitations: t.invitations.filter(iv => iv.id !== invitationId) }
          : t
      ));
      notifications.addNotification({ type: "success", title: "Invitation cancelled" });
    } catch {
      notifications.addNotification({ type: "error", title: "Network error" });
    }
  };

  const handleMemberStatus = async (teamId: string, memberId: string, next: "ACTIVE" | "PAUSED") => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.addNotification({ type: "error", title: "Failed", message: err.error || "Could not update member" });
        return;
      }
      setTeams(prev => prev.map(t => t.id !== teamId ? t : ({
        ...t,
        members: t.members.map(m => m.id === memberId ? { ...m, status: next } : m)
      })));
      notifications.addNotification({ type: "success", title: next === "PAUSED" ? "Member paused" : "Member unpaused" });
    } catch {
      notifications.addNotification({ type: "error", title: "Network error" });
    }
  };

  const handleRemoveMemberServer = async (teamId: string, memberId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notifications.addNotification({ type: "error", title: "Failed", message: err.error || "Could not remove member" });
        return;
      }
      setTeams(prev => prev.map(t => t.id !== teamId ? t : ({
        ...t,
        members: t.members.filter(m => m.id !== memberId)
      })));
      notifications.addNotification({ type: "success", title: "Member removed" });
    } catch {
      notifications.addNotification({ type: "error", title: "Network error" });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "ADMIN":
        return <Shield className="w-4 h-4 text-blue-500" />;
      case "MANAGER":
        return <Target className="w-4 h-4 text-green-500" />;
      case "EDITOR":
        return <Edit className="w-4 h-4 text-purple-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };



  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading-2 mb-2">Team Management</h1>
              <p className="text-muted-foreground">Manage your team members and invitations</p>
            </div>
            <button onClick={() => setShowCreateTeam(true)} className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </button>
          </div>
        </motion.div>

        {/* Search removed as requested */}

        {/* Teams Display */}
        {loading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <div className="spinner-lg mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your teams...</p>
          </motion.div>
        ) : (
          teams.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No team created</h3>
              <p className="text-sm text-muted-foreground mb-6">Create a team and start growing.</p>
              <button onClick={() => setShowCreateTeam(true)} className="btn btn-primary">
                <Plus className="w-4 h-4 mr-2" /> Create Team
              </button>
            </motion.div>
          ) : (
          <div className="space-y-6">
            {teams.map((team) => {
              const membersToShow = team.members;
              const invitationsToShow = team.invitations;
              const isOwner = (session?.user?.email || "").toLowerCase() === (team.ownerEmail || "").toLowerCase();

              return (
                <motion.div key={team.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
                  {/* Team Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="min-w-0">
                      {renamingTeamId === team.id ? (
                        <div className="flex items-center gap-2">
                          <input value={renameValue} onChange={(e) => setRenameValue((e.target as HTMLInputElement).value)} className="input w-64" maxLength={80} />
                          <button onClick={() => saveRename(team.id)} className="btn btn-primary btn-sm">Save</button>
                          <button onClick={() => setRenamingTeamId(null)} className="btn btn-ghost btn-sm">Cancel</button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-semibold text-foreground truncate">{team.name}</h3>
                            {isOwner && (
                              <div className="flex items-center gap-1 ml-1">
                                <button
                                  title="Rename team"
                                  onClick={() => startRename(team.id, team.name)}
                                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                                  aria-label="Rename team"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  title="Delete team"
                                  onClick={() => setConfirmState({ open: true, action: "delete", teamId: team.id, teamName: team.name })}
                                  className="p-1.5 rounded-md hover:bg-muted transition-colors text-red-600 hover:text-red-700"
                                  aria-label="Delete team"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          {team.description && team.description.trim().length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {team.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    {isOwner ? (
                      <button onClick={() => { setSelectedTeam(team); setShowInviteModal(true); }} className="btn btn-primary">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite Member
                      </button>
                    ) : (
                      <button onClick={() => setConfirmState({ open: true, action: "leave", teamId: team.id, teamName: team.name })} className="btn btn-ghost text-red-600 hover:text-red-700">
                        Leave team
                      </button>
                    )}
                  </div>

                  {/* Team Members */}
                  <div className="mb-6">
                    <h4 className="text-base font-semibold mb-4 text-foreground">Team Members ({membersToShow.length})</h4>
                    <div className="space-y-3">
                      {membersToShow.map((member) => (
                        <div key={member.id} className={`flex items-center justify-between p-3 rounded-lg border ${member.role === "OWNER" ? "bg-blue-500/10 border-blue-500/20" : "bg-muted/50"}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                              <span className="text-sm font-medium text-white">{member.name[0].toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              {/* Top row: name + email */}
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm text-foreground truncate max-w-[180px]">{member.name}</p>
                                <span className="text-xs text-muted-foreground truncate">{member.email}</span>
                              </div>
                              {/* Second row: role + status chips below username */}
                              <div className="mt-1 flex items-center gap-2 flex-wrap">
                                <span
                                  className={
                                    `text-xs px-2 py-0.5 rounded-full border ` +
                                    (member.role === "OWNER"
                                      ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/20"
                                      : member.role === "ADMIN"
                                      ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20"
                                      : member.role === "MANAGER"
                                      ? "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/20"
                                      : "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/20")
                                  }
                                >
                                  {member.role === "OWNER" ? "Owner" : member.role === "ADMIN" ? "Admin" : member.role === "MANAGER" ? "Manager" : "Editor"}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${member.status === "PAUSED" ? "bg-gray-500/10 text-muted-foreground border-gray-400/20" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20"}`}>
                                  {member.status === "PAUSED" ? "Inactive" : "Active"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isOwner && member.role !== "OWNER" && (
                              <>
                                <button
                                  onClick={() =>
                                    setConfirmState({
                                      open: true,
                                      action: "toggle-status",
                                      teamId: team.id,
                                      teamName: team.name,
                                      memberId: member.id,
                                      memberName: member.name,
                                      memberRole: member.role,
                                      nextStatus: member.status === "PAUSED" ? "ACTIVE" : "PAUSED",
                                    })
                                  }
                                  className="btn btn-ghost btn-sm"
                                >
                                  {member.status === "PAUSED" ? "Set active" : "Set inactive"}
                                </button>
                                <button onClick={() => setConfirmState({ open: true, action: "remove-member", teamId: team.id, teamName: team.name, memberId: member.id })} className="btn btn-ghost btn-sm text-red-600 hover:text-red-700">
                                  Remove
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pending Invitations */}
                  {isOwner && invitationsToShow.filter(inv => inv.status === "pending").length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-4 text-foreground">Pending Invitations ({invitationsToShow.filter(inv => inv.status === "pending").length})</h4>
                      <div className="space-y-3">
                        {invitationsToShow.filter(inv => inv.status === "pending").map((invitation) => (
                          <div key={invitation.id} className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Mail className="w-5 h-5 text-yellow-500" />
                              <div>
                                <p className="font-medium text-foreground">{invitation.email}</p>
                                <p className="text-sm text-muted-foreground">Invited as {invitation.role.toLowerCase()} • {invitation.invitedAt.toLocaleString()}</p>
                              </div>
                            </div>
                            {isOwner && (
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleResendInvitation(team.id, invitation.id)} className="btn btn-ghost btn-sm" disabled={resendingId === invitation.id}>
                                  {resendingId === invitation.id ? <div className="spinner mr-2" /> : null}
                                  {resendingId === invitation.id ? "Resending..." : "Resend"}
                                </button>
                                <button onClick={() => handleCancelInvitation(team.id, invitation.id)} className="btn btn-ghost btn-sm text-red-600 hover:text-red-700">
                                  Cancel Invitation
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          )
        )}
      </div>

      {/* Create Team Modal */}
      <Modal isOpen={showCreateTeam} onClose={() => setShowCreateTeam(false)} title="Create New Team" size="lg">
        <form onSubmit={handleCreateTeam} className="space-y-6">
          <TextField
            label="Team Name"
            icon={<Users className="w-4 h-4" />}
            placeholder="Content Creators"
            value={newTeam.name}
            onChange={(e) => setNewTeam({ ...newTeam, name: (e.target as HTMLInputElement).value })}
            required
          />

          <TextField
            label="Description"
            value={newTeam.description}
            onChange={(e) => setNewTeam({ ...newTeam, description: (e.target as HTMLTextAreaElement).value })}
            placeholder="Describe your team's purpose and goals..."
            multiline
          />

          <div className="flex gap-3">
            <button type="button" onClick={() => setShowCreateTeam(false)} className="btn btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={!newTeam.name.trim()} className="btn btn-primary flex-1">Create Team</button>
          </div>
        </form>
      </Modal>

      {/* Confirmations */}
      <ConfirmModal
        isOpen={confirmState.open}
        onClose={() => setConfirmState(prev => ({ ...prev, open: false }))}
        onConfirm={() => {
          if (confirmState.action === "delete" && confirmState.teamId) handleDeleteTeam(confirmState.teamId);
          if (confirmState.action === "leave" && confirmState.teamId) handleLeaveTeam(confirmState.teamId);
          if (confirmState.action === "remove-member" && confirmState.teamId && confirmState.memberId) {
            (async () => {
              try {
                const res = await fetch(`/api/teams/${confirmState.teamId}/members/${confirmState.memberId}`, { method: "DELETE" });
                if (!res.ok) throw new Error();
                setTeams(prev => prev.map(t => t.id !== confirmState.teamId ? t : ({
                  ...t,
                  members: t.members.filter(m => m.id !== confirmState.memberId)
                })));
                notifications.addNotification({ type: "success", title: "Member removed" });
              } catch {
                notifications.addNotification({ type: "error", title: "Failed", message: "Could not remove member" });
              }
            })();
          }
          if (confirmState.action === "toggle-status" && confirmState.teamId && confirmState.memberId && confirmState.nextStatus) {
            handleMemberStatus(confirmState.teamId, confirmState.memberId, confirmState.nextStatus);
          }
        }}
        title={
          confirmState.action === "delete" ? "Delete team" :
          confirmState.action === "leave" ? "Leave team" :
          confirmState.action === "remove-member" ? "Remove member" :
          confirmState.nextStatus === "PAUSED" ? "Set inactive" : "Set active"
        }
        message={
          confirmState.action === "delete"
            ? `Are you sure you want to permanently delete "${confirmState.teamName}"? This removes all members and invitations.`
            : confirmState.action === "leave"
            ? `Are you sure you want to leave "${confirmState.teamName}"? You will lose access to this workspace.`
            : confirmState.action === "remove-member"
            ? `Are you sure you want to remove ${confirmState.memberName || "this member"} from "${confirmState.teamName}"?`
            : confirmState.nextStatus === "PAUSED"
            ? `${confirmState.memberName || "This member"} will be set inactive. They will remain in the team but all actions available to a ${
                (confirmState.memberRole || "member").toLowerCase()
              } (like uploads and team tasks) will be disabled until re-activated.`
            : `${confirmState.memberName || "This member"} will be set active again and regain their ${
                (confirmState.memberRole || "member").toLowerCase()
              } permissions (uploads and team tasks).`
        }
        confirmText={
          confirmState.action === "delete"
            ? "Delete"
            : confirmState.action === "leave"
            ? "Leave"
            : confirmState.action === "remove-member"
            ? "Remove"
            : confirmState.nextStatus === "PAUSED" ? "Set inactive" : "Set active"
        }
        cancelText="Cancel"
        type={
          confirmState.action === "delete"
            ? "danger"
            : confirmState.action === "leave"
            ? "warning"
            : confirmState.action === "remove-member"
            ? "danger"
            : confirmState.nextStatus === "PAUSED" ? "warning" : "success"
        }
      />

      {/* Invite Member Modal - Enhanced Design */}
      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="" size="md">
        <div className="relative">
          {/* Header with gradient background */}
          <div className="relative mb-6 -mx-6 -mt-6 p-6 rounded-t-lg bg-white dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center border border-primary/20 dark:border-primary/30">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Invite Team Member</h3>
                  <p className="text-sm text-muted-foreground">Add someone to collaborate with your team</p>
                </div>
              </div>
            </div>
            {inviting && <div className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-gradient-to-r from-primary via-secondary to-primary animate-pulse" />}
          </div>

          <form onSubmit={handleInviteMember} className="space-y-6">
            {/* Info banner */}
            <div className="rounded-xl p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Email Invitation</p>
                  <p className="text-xs text-muted-foreground">
                    They'll receive a secure invitation link to join your team. The link expires in 7 days.
                  </p>
                </div>
              </div>
            </div>

            {/* Form fields with enhanced styling */}
            <div className="space-y-5">
              <div className="space-y-2">
                <TextField
                  label="Email Address"
                  icon={<Mail className="w-4 h-4" />}
                  type="email"
                  placeholder="colleague@example.com"
                  value={invitation.email}
                  onChange={(e) => setInvitation({ ...invitation, email: (e.target as HTMLInputElement).value })}
                  required
                />
                <p className="text-xs text-muted-foreground ml-1">Make sure this email address is correct</p>
              </div>

              <div className="space-y-3">
                <SelectField
                  label="Team Role"
                  icon={<Shield className="w-4 h-4" />}
                  value={invitation.role}
                  onChange={(e) => setInvitation({ ...invitation, role: (e.target as HTMLSelectElement).value as any })}
                >
                  <option value="EDITOR">Editor</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </SelectField>

                {/* Role descriptions */}
                <div className="grid grid-cols-1 gap-2 p-3 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Role Permissions:</span>
                    {invitation.role === "EDITOR" && " Can upload videos and collaborate on content creation."}
                    {invitation.role === "MANAGER" && " Can manage team members, approve content, and oversee projects."}
                    {invitation.role === "ADMIN" && " Has full access to team settings, billing, and member management."}
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons with enhanced styling */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-600">
              <button 
                type="button" 
                onClick={() => setShowInviteModal(false)} 
                className="btn btn-ghost flex-1 hover:bg-muted/60 transition-colors"
                disabled={inviting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={inviting || !invitation.email.trim()} 
                className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-200"
              >
                {inviting ? (
                  <>
                    <div className="spinner mr-2" /> Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" /> Send Invitation
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </AppShell>
  );
}

