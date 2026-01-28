"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { UserPlus, Users, Shield, Settings, MoreVertical, Edit, Trash2, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { TeamCard } from "@/app/components/teams/TeamCard";
import { CreateTeamDialog } from "@/app/components/teams/CreateTeamDialog";
import { InviteMemberDialog } from "@/app/components/teams/InviteMemberDialog";
import { EditTeamDialog } from "@/app/components/teams/EditTeamDialog";
import { EmptyState } from "@/app/components/teams/EmptyState";
import { TeamDetailsDialog } from "@/app/components/teams/TeamDetailsDialog";
import { platformIcons } from "@/app/components/teams/PlatformIcon";
import { LoadingSpinner, PageLoader } from "@/app/components/ui/loading-spinner";
import { useTeam } from "@/context/TeamContext";
import AppShell from "@/app/components/layout/AppLayout";

interface TeamMember {
  id: string; // userId
  name: string;
  email: string;
  role: string;
  avatar: string;
  platforms: string[];
}

interface Team {
  id: number; // local display id
  backendId?: string; // real team id from API
  name: string;
  description: string;
  platforms: string[];
  members_data: TeamMember[];
  color: string;
  role?: string;
  isOwner?: boolean;
}

const teamColors = [
  "from-primary to-accent",
  "from-accent to-primary",
  "from-primary via-accent to-warning",
  "from-warning to-primary",
  "from-accent to-warning",
  "from-primary to-warning"
];

const Teams = () => {
  const { teams: contextTeams, refreshTeams } = useTeam();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedTeamForInvite, setSelectedTeamForInvite] = useState<number | undefined>();
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingTeamId, setDeletingTeamId] = useState<number | null>(null);
  const { toast } = useToast();

  // Support deep-linking into the Create Team dialog (e.g. /teams?create=1)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "1") {
      setIsCreateTeamOpen(true);
      // Clean the URL so refreshes/bookmarks don't keep re-opening the modal
      params.delete("create");
      const next = params.toString();
      const newUrl = `${window.location.pathname}${next ? `?${next}` : ""}`;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  // Transform context teams to local Team format - newest first
  const teams = contextTeams.slice().reverse().map((t, i) => ({
    id: i + 1,
    backendId: t.id,
    name: t.name,
    description: t.description || '',
    platforms: (t as any).platforms || [],
    members_data: ((t as any).members_data || []).map((m: any, idx: number) => ({
      id: String(m?.id || ''),
      name: m?.name || '',
      email: m?.email || '',
      role: m?.role || 'MEMBER',
      avatar: m?.avatar || '',
      platforms: [],
    })),
    color: teamColors[i % teamColors.length],
    role: (t as any).role || undefined,
    isOwner: Boolean((t as any).isOwner) || (t as any).role === "OWNER",
  }));

  const createdTeams = useMemo(() => teams.filter((t) => t.isOwner), [teams]);
  const joinedTeams = useMemo(() => teams.filter((t) => !t.isOwner), [teams]);

  // Load teams data on mount
  useEffect(() => {
    const loadTeamsData = async () => {
      setIsLoading(true);
      try {
        await refreshTeams();
      } catch (error) {
        console.error('Failed to load teams:', error);
        toast({
          title: 'Failed to load teams',
          description: 'Please try refreshing the page',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamsData();
  }, []); // Remove dependencies to prevent infinite loop

  const handleCreateTeam = useCallback(async (teamData: { name: string; description: string; platforms: string[] }) => {
    setIsCreatingTeam(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamData.name, description: teamData.description, platforms: teamData.platforms })
      });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || 'Failed to create team');

      // Show success message immediately
      toast({ title: 'Team Created', description: `${teamData.name} has been created successfully` });

      // Force refresh teams so the newly created team appears immediately (bypass cache TTL)
      await refreshTeams(true);

      // Hide loading and close dialog after teams are refreshed
      setIsCreatingTeam(false);
      setIsCreateTeamOpen(false);
      return js;
    } catch (e) {
      setIsCreatingTeam(false);
      toast({ title: 'Failed to create team', description: e instanceof Error ? e.message : 'Try again', variant: 'destructive' as any });
      throw e;
    }
  }, [refreshTeams, toast]);

  const handleDeleteTeam = useCallback(async (teamId: number) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    setDeletingTeamId(teamId);
    try {
      const res = await fetch(`/api/teams/${team.backendId}`, { method: 'DELETE' });
      const js = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(js?.error || 'Failed to delete team');
      await refreshTeams(true);
      toast({ title: 'Team Deleted', description: `${team.name} has been deleted` });
    } catch (e) {
      toast({ title: 'Delete failed', description: e instanceof Error ? e.message : 'Try again', variant: 'destructive' as any });
    } finally {
      setDeletingTeamId(null);
    }
  }, [teams, refreshTeams, toast]);

  const handleInviteMember = async (memberData: { email: string; teamId: number; role: string }) => {
    const email = memberData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Please enter a valid email address");
    }
    const team = teams.find(t => t.id === memberData.teamId);
    if (!team || !team.backendId) {
      throw new Error("Please select a valid team");
    }

    try {
      const res = await fetch(`/api/teams/${team.backendId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: memberData.role.toUpperCase() })
      });

      const result = await res.json().catch(() => ({}));

      if (res.ok) {
        // Success - refresh UI (do NOT close Team Details; only the invite dialog should close)
        try { await refreshTeams(true); } catch { }
        setIsInviteOpen(false);
        setSelectedTeamForInvite(undefined);
        return result;
      } else {
        const msg = result?.message || result?.error || "Failed to send invitation";
        throw new Error(msg);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Network error occurred';
      throw new Error(errorMessage);
    }
  };

  const handleUpdateTeam = (teamId: number, updates: Partial<Team>) => {
    // Optimistic local update for the open dialogs
    setViewingTeam((prev) => (prev && prev.id === teamId ? ({ ...prev, ...updates } as any) : prev));
    setEditingTeam((prev) => (prev && prev.id === teamId ? ({ ...prev, ...updates } as any) : prev));

    (async () => {
      const t = teams.find((x) => x.id === teamId);
      if (!t?.backendId) {
        toast({ title: "Update failed", description: "Team ID missing. Please refresh.", variant: "destructive" });
        return;
      }

      try {
        const res = await fetch(`/api/teams/${t.backendId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: updates.name,
            description: updates.description,
            platforms: updates.platforms,
          }),
        });
        const js = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(js?.error || "Failed to update team");

        toast({
          title: "Team Updated",
          description: "Team information has been updated successfully",
        });

        // Refresh so UI + team selector stays consistent (bypass cache)
        await refreshTeams(true);
      } catch (e) {
        toast({
          title: "Update failed",
          description: e instanceof Error ? e.message : "Please try again",
          variant: "destructive",
        });
        // Re-sync from server on failure
        await refreshTeams(true);
      }
    })();
  };


  const handleRemoveMember = useCallback(async (teamId: number, memberUserId: string) => {
    const t = teams.find((x) => x.id === teamId);
    if (!t?.backendId) {
      toast({ title: "Remove failed", description: "Team ID missing. Please refresh.", variant: "destructive" });
      return;
    }
    if (!memberUserId) {
      toast({ title: "Remove failed", description: "Member ID missing.", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`/api/teams/${encodeURIComponent(String(t.backendId))}/members/${encodeURIComponent(String(memberUserId))}`, {
        method: "DELETE",
      });
      const js = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(js?.message || js?.error || "Failed to remove member");
      toast({ title: "Member removed", description: "User has been removed from the team." });
      await refreshTeams(true);
    } catch (e) {
      toast({
        title: "Remove failed",
        description: e instanceof Error ? e.message : "Please try again",
        variant: "destructive",
      });
      await refreshTeams(true);
    }
  }, [teams, toast, refreshTeams]);

  // If a team is being viewed while data refreshes, keep the dialog in sync with the latest team object.
  useEffect(() => {
    if (!viewingTeam?.backendId) return;
    const next = teams.find((t) => t.backendId === viewingTeam.backendId);
    if (next && next !== viewingTeam) setViewingTeam(next);
  }, [contextTeams, viewingTeam?.backendId]);

  const openInviteDialog = (teamId?: number) => {
    setSelectedTeamForInvite(teamId);
    setIsInviteOpen(true);
  };

  const totalMembers = teams.reduce((acc, team) => acc + team.members_data.length, 0);

  return (
    <AppShell>
      <div className="fixed inset-0 lg:left-64 bg-background overflow-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold">Team Management</h1>
                <p className="text-sm text-muted-foreground">
                  Create teams, manage members, and control platform access
                </p>
              </div>

              <CreateTeamDialog
                onCreateTeam={handleCreateTeam} isOpen={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen} isLoading={isCreatingTeam}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">

            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : teams.length === 0 ? (
              <EmptyState onCreateTeam={() => setIsCreateTeamOpen(true)} />
            ) : (
              <div className="space-y-12">

                {createdTeams.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="font-semibold">Created by you</h2>
                      <Badge variant="outline">{createdTeams.length}</Badge>
                    </div>

                    <div className="
                      relative grid gap-6
                      grid-cols-1
                      sm:grid-cols-2
                      lg:grid-cols-3
                      xl:grid-cols-4
                    ">
                      {createdTeams.map((team, index) => (
                        <TeamCard
                          key={team.id}
                          team={team}
                          index={index}
                          onEdit={setEditingTeam}
                          onDelete={handleDeleteTeam}
                          onViewTeam={setViewingTeam}
                          isDeleting={deletingTeamId === team.id}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {joinedTeams.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="font-semibold">Joined teams</h2>
                      <Badge variant="outline">{joinedTeams.length}</Badge>
                    </div>

                    <div className="
                      relative grid gap-6
                      grid-cols-1
                      sm:grid-cols-2
                      lg:grid-cols-3
                      xl:grid-cols-4
                    ">
                      {joinedTeams.map((team, index) => (
                        <TeamCard
                          key={team.id}
                          team={team}
                          index={index}
                          onEdit={setEditingTeam}
                          onDelete={handleDeleteTeam}
                          onViewTeam={setViewingTeam}
                          isDeleting={deletingTeamId === team.id}
                        />
                      ))}
                    </div>
                  </section>
                )}

              </div>
            )}
          </div>

          {/* Dialogs */}
          <InviteMemberDialog
            isOpen={isInviteOpen}
            onClose={() => {
              setIsInviteOpen(false);
              setSelectedTeamForInvite(undefined);
            }}
            teams={teams}
            selectedTeamId={selectedTeamForInvite}
            onInviteMember={handleInviteMember}
          />

          <EditTeamDialog
            isOpen={!!editingTeam}
            onClose={() => setEditingTeam(null)}
            team={editingTeam}
            onUpdateTeam={handleUpdateTeam}
          />

          <TeamDetailsDialog
            isOpen={!!viewingTeam}
            onClose={() => setViewingTeam(null)}
            team={viewingTeam}
            onRemoveMember={handleRemoveMember}
            onEditTeam={setEditingTeam}
            onInviteMember={openInviteDialog}
            onUpdateTeam={handleUpdateTeam}
          />
        </motion.div>
      </div>
    </AppShell>
  );
};

export default Teams;