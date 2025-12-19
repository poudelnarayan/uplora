"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { UserPlus, Users, Shield, Settings, MoreVertical, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
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
  id: number;
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

  // Transform context teams to local Team format - newest first
  const teams = contextTeams.slice().reverse().map((t, i) => ({
    id: i + 1,
    backendId: t.id,
    name: t.name,
    description: t.description || '',
    platforms: (t as any).platforms || [],
    members_data: ((t as any).members_data || []).map((m: any, idx: number) => ({
      id: idx + 1,
      name: m?.name || '',
      email: m?.email || '',
      role: m?.role || 'MEMBER',
      avatar: m?.avatar || '',
      platforms: [],
    })),
    color: teamColors[i % teamColors.length],
  }));

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
    } catch (e) {
      setIsCreatingTeam(false);
      toast({ title: 'Failed to create team', description: e instanceof Error ? e.message : 'Try again', variant: 'destructive' as any });
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
      await refreshTeams();
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
        // Success - let the dialog handle the success toast
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
    // Note: This is for local updates only. For server updates, use refreshTeams()
    toast({
      title: "Team Updated",
      description: "Team information has been updated successfully"
    });
  };


  const handleRemoveMember = useCallback((teamId: number, memberId: number) => {
    // Note: This is for local updates only. For server updates, use refreshTeams()
    toast({
      title: "Member Removed",
      description: "Member has been removed from the team"
    });
  }, [toast]);

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
          <div className="p-6">
            <div className={`relative grid gap-6 ${
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
          // Special expanded layout for single team
          <div className="col-span-full">
            <Card className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border-border/50 hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-4 rounded-2xl bg-gradient-to-r ${teams[0].color} text-white shadow-2xl`}>
                      <Users className="h-8 w-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-bold text-foreground">{teams[0].name}</h2>
                      <p className="text-muted-foreground mt-1">{teams[0].description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {teams[0].members_data.length} member{teams[0].members_data.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {teams[0].platforms.length} platform{teams[0].platforms.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      {teams[0].members_data && teams[0].members_data.length > 0 && (
                        <div className="flex -space-x-2 mt-3">
                          {teams[0].members_data.slice(0, 6).map((member: TeamMember) => (
                            <Avatar key={member.id} className="border-2 border-background h-8 w-8" title={member.name}>
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="text-xs bg-muted">
                                {member.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {teams[0].members_data.length > 6 && (
                            <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center" title={`+${teams[0].members_data.length - 6} more`}>
                              <span className="text-xs font-medium">+{teams[0].members_data.length - 6}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
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
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Platform Access */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Platform Access
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {teams[0].platforms.map((platform) => {
                        const Icon = platformIcons[platform as keyof typeof platformIcons];
                        return (
                          <div
                            key={platform}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md"
                          >
                            <Icon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium capitalize text-green-700 dark:text-green-300">{platform}</span>
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          </div>
                        );
                      })}
                      {teams[0].platforms.length === 0 && (
                        <p className="text-sm text-muted-foreground">No platforms connected</p>
                      )}
                    </div>
                  </div>

                  {/* Team Members */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Team Members
                    </h3>
                    {teams[0].members_data.length > 0 ? (
                      <div className="space-y-2">
                        {teams[0].members_data.slice(0, 3).map((member: TeamMember) => (
                          <div key={member.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-md">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="text-xs">
                                {member.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.role}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {member.platforms.length} platforms
                            </Badge>
                          </div>
                        ))}
                        {teams[0].members_data.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{teams[0].members_data.length - 3} more members
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No members yet</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex justify-center">
                  <Button variant="outline" className="gap-2" onClick={() => setViewingTeam(teams[0])}>
                    <Eye className="h-4 w-4" />
                    View Team Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          teams.map((team, index) => (
            <TeamCard
              key={team.id}
              team={team}
              index={index}
              onEdit={(t) => setEditingTeam(t)}
              onDelete={handleDeleteTeam}
              onInviteMember={openInviteDialog}
              onViewTeam={(t) => setViewingTeam(t)}
              isDeleting={deletingTeamId === team.id}
            />
          ))
        )}
          </>
        )}
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