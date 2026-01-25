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
        try { await refreshTeams(true); } catch {}
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-full"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Team Management</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Create teams, manage members, and control platform access
                </p>
              </div>

              <div className="flex gap-3">
                <CreateTeamDialog
                  onCreateTeam={handleCreateTeam}
                  isOpen={isCreateTeamOpen}
                  onOpenChange={setIsCreateTeamOpen}
                  isLoading={isCreatingTeam}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 lg:p-8">
            <div className="mx-auto w-full max-w-7xl">
            <div className={`relative grid gap-8 ${
        teams.length === 1 
          ? "grid-cols-1" 
          : teams.length === 2 
          ? "grid-cols-1 lg:grid-cols-2" 
          : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
      }`}>
        {/* Initial Loading State */}
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading teams...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Creating Team Overlay */}
            {isCreatingTeam && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex items-center gap-3 bg-background border border-border rounded-lg px-6 py-4 shadow-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">Creating team...</span>
                </div>
              </div>
            )}
            
            {teams.length === 0 ? (
              <EmptyState onCreateTeam={() => setIsCreateTeamOpen(true)} />
            ) : teams.length === 1 ? (
          // Special expanded layout for single team - Apple style
          <div className="col-span-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              <Card
                role="button"
                tabIndex={0}
                onClick={() => setViewingTeam(teams[0])}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setViewingTeam(teams[0]);
                  }
                }}
                className="bg-gradient-to-br from-card via-card/98 to-card/95 backdrop-blur-xl border border-border/60 hover:border-border shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden relative group"
              >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/3 group-hover:to-primary/5 transition-all duration-500 pointer-events-none" />
                
                <CardHeader className="pb-6 pt-8 px-8 relative z-10">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-start gap-6 flex-1 min-w-0">
                      <motion.div
                        whileHover={{ scale: 1.05, rotate: 2 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        className={`relative p-5 rounded-3xl bg-gradient-to-br ${teams[0].color} text-white shadow-xl group-hover:shadow-2xl transition-shadow duration-500 flex-shrink-0`}
                      >
                        <div className="absolute inset-0 bg-white/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Users className="h-10 w-10 relative z-10" />
                      </motion.div>
                      
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h2 className="text-3xl font-bold tracking-tight text-foreground">{teams[0].name}</h2>
                          {teams[0].isOwner && (
                            <Badge variant="outline" className="px-2.5 py-1 bg-primary/8 dark:bg-primary/12 text-primary border-primary/20 font-medium">
                              Owner
                            </Badge>
                          )}
                        </div>
                        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
                          {teams[0].description || "No description provided"}
                        </p>
                        <div className="flex items-center gap-6 pt-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span className="font-semibold text-foreground">{teams[0].members_data.length}</span>
                            <span>member{teams[0].members_data.length !== 1 ? 's' : ''}</span>
                          </div>
                          {teams[0].platforms.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Sparkles className="h-4 w-4" />
                              <span className="font-semibold text-foreground">{teams[0].platforms.length}</span>
                              <span>platform{teams[0].platforms.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 w-9 p-0 hover:bg-muted/80 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => setEditingTeam(teams[0])}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Team
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteTeam(teams[0].id)}
                            disabled={deletingTeamId === teams[0].id}
                          >
                            {deletingTeamId === teams[0].id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Delete Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="px-8 pb-8 space-y-6 relative z-10">
                  {teams[0].platforms.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          Platform Access
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {teams[0].platforms.map((platform) => {
                          const Icon = platformIcons[platform as keyof typeof platformIcons];
                          return (
                            <motion.div
                              key={platform}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex items-center gap-2 px-3 py-2 bg-green-50/80 dark:bg-green-950/30 border border-green-200/60 dark:border-green-800/60 rounded-xl backdrop-blur-sm shadow-sm"
                            >
                              {Icon && <Icon className="h-4 w-4 text-green-600 dark:text-green-400" />}
                              <span className="text-sm font-semibold capitalize text-green-700 dark:text-green-300">{platform}</span>
                              <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm" />
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-10">
            {createdTeams.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Created by you</h2>
                    <p className="text-sm text-muted-foreground mt-1">You can manage members, invites, and settings.</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {createdTeams.length} team{createdTeams.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <div className={`relative grid gap-8 ${
                  createdTeams.length === 1
                    ? "grid-cols-1"
                    : createdTeams.length === 2
                    ? "grid-cols-1 lg:grid-cols-2"
                    : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
                }`}>
                  {createdTeams.map((team, index) => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      index={index}
                      onEdit={(t) => setEditingTeam(t)}
                      onDelete={handleDeleteTeam}
                      onViewTeam={(t) => setViewingTeam(t)}
                      isDeleting={deletingTeamId === team.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {joinedTeams.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Joined teams</h2>
                    <p className="text-sm text-muted-foreground mt-1">Only the creator can edit/delete/remove members.</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {joinedTeams.length} team{joinedTeams.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <div className={`relative grid gap-8 ${
                  joinedTeams.length === 1
                    ? "grid-cols-1"
                    : joinedTeams.length === 2
                    ? "grid-cols-1 lg:grid-cols-2"
                    : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
                }`}>
                  {joinedTeams.map((team, index) => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      index={index}
                      onEdit={(t) => setEditingTeam(t)}
                      onDelete={handleDeleteTeam}
                      onViewTeam={(t) => setViewingTeam(t)}
                      isDeleting={deletingTeamId === team.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
            )}
          </>
        )}
            </div>
            </div>
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