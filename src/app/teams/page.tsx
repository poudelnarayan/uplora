"use client";
import { useEffect, useState } from "react";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { UserPlus, Users, Shield, Settings, MoreVertical, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { TeamCard } from "@/components/teams/TeamCard";
import { CreateTeamDialog } from "@/components/teams/CreateTeamDialog";
import { InviteMemberDialog } from "@/components/teams/InviteMemberDialog";
import { EditTeamDialog } from "@/components/teams/EditTeamDialog";
import { EmptyState } from "@/components/teams/EmptyState";
import { TeamDetailsDialog } from "@/components/teams/TeamDetailsDialog";
import { platformIcons } from "@/components/teams/PlatformIcon";
import AppShell from "@/components/layout/AppLayout";

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
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-pink-500",
  "from-green-500 to-emerald-500",
  "from-orange-500 to-red-500",
  "from-indigo-500 to-purple-500",
  "from-pink-500 to-rose-500"
];

const Teams = () => {
  const { user, isLoaded } = useUser();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedTeamForInvite, setSelectedTeamForInvite] = useState<number | undefined>();
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);
  const { toast } = useToast();

  const loadTeams = async () => {
    try {
      const res = await fetch('/api/teams', { cache: 'no-store' });
      const js = await res.json();
      const data = (js?.data || js?.data?.data || []) as any[];
      const filtered = data.filter((t: any) => !t.isPersonal);
      const mapped: Team[] = filtered.map((t: any, i: number) => ({
        id: i + 1,
        backendId: t.id,
        name: t.name,
        description: t.description || '',
        platforms: [],
        members_data: [],
        color: teamColors[i % teamColors.length],
      }));
      setTeams(mapped);
    } catch {}
  };

  useEffect(() => {
    void loadTeams();
  }, []);

  const handleCreateTeam = async (teamData: { name: string; description: string; platforms: string[] }) => {
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamData.name, description: teamData.description })
      });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || 'Failed to create team');
      toast({ title: 'Team Created', description: `${teamData.name} has been created successfully` });
      await loadTeams();
    } catch (e) {
      toast({ title: 'Failed to create team', description: e instanceof Error ? e.message : 'Try again', variant: 'destructive' as any });
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    try {
      const res = await fetch(`/api/teams/${team.backendId}`, { method: 'DELETE' });
      const js = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(js?.error || 'Failed to delete team');
      await loadTeams();
      toast({ title: 'Team Deleted', description: `${team.name} has been deleted` });
    } catch (e) {
      toast({ title: 'Delete failed', description: e instanceof Error ? e.message : 'Try again', variant: 'destructive' as any });
    }
  };

  const handleInviteMember = async (memberData: { email: string; teamId: number; role: string }) => {
    const email = memberData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address", variant: "destructive" as any });
      return;
    }
    const team = teams.find(t => t.id === memberData.teamId);
    if (!team || !team.backendId) {
      toast({ title: "Team not found", description: "Please select a valid team", variant: "destructive" as any });
      return;
    }

    try {
      const res = await fetch(`/api/teams/${team.backendId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: memberData.role.toUpperCase() })
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        toast({
          title: result?.emailSent ? "Invitation sent" : "Invitation created",
          description: result?.emailSent ? `Email delivered to ${email}` : `Invite saved; email delivery failed for ${email}`
        });
      } else {
        const msg = result?.message || result?.error || "Failed to send invitation";
        toast({ title: "Invite failed", description: msg, variant: "destructive" as any });
      }
    } catch (e) {
      toast({ title: "Invite failed", description: e instanceof Error ? e.message : 'Network error', variant: "destructive" as any });
    }
  };

  const handleUpdateTeam = (teamId: number, updates: Partial<Team>) => {
    setTeams(prev => prev.map(team => 
      team.id === teamId ? { ...team, ...updates } : team
    ));
    toast({
      title: "Team Updated",
      description: "Team information has been updated successfully"
    });
  };

  const handleRemoveMember = (teamId: number, memberId: number) => {
    setTeams(prev => prev.map(team => 
      team.id === teamId 
        ? { ...team, members_data: team.members_data.filter(m => m.id !== memberId) }
        : team
    ));
    toast({
      title: "Member Removed",
      description: "Member has been removed from the team"
    });
  };

  const openInviteDialog = (teamId?: number) => {
    setSelectedTeamForInvite(teamId);
    setIsInviteOpen(true);
  };

  const totalMembers = teams.reduce((acc, team) => acc + team.members_data.length, 0);

  if (!isLoaded) return null;
  if (!user) return <RedirectToSignIn redirectUrl="/teams" />;

  return (
    <AppShell>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen w-full p-6 lg:p-8 space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-2">
            Team Management
          </h1>
          <p className="text-muted-foreground text-lg">
            Create teams, manage members, and control platform access
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={() => openInviteDialog()}
            disabled={teams.length === 0}
          >
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
          
          <CreateTeamDialog 
            onCreateTeam={handleCreateTeam} 
            isOpen={isCreateTeamOpen}
            onOpenChange={setIsCreateTeamOpen}
          />
        </div>
      </div>

      {/* Teams Grid */}
      <div className={`grid gap-6 ${
        teams.length === 1 
          ? "grid-cols-1" 
          : teams.length === 2 
          ? "grid-cols-1 lg:grid-cols-2" 
          : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
      }`}>
        {teams.length === 0 ? (
          <EmptyState onCreateTeam={() => setIsCreateTeamOpen(true)} />
        ) : teams.length === 1 ? (
          // Special expanded layout for single team
          <div className="col-span-full">
            <Card className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border-border/50 hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl bg-gradient-to-r ${teams[0].color} text-white shadow-2xl`}>
                      <Users className="h-8 w-8" />
                    </div>
                    <div>
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
                      <DropdownMenuItem onClick={() => openInviteDialog(teams[0].id)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Member
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeleteTeam(teams[0].id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
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
                        {teams[0].members_data.slice(0, 3).map((member) => (
                          <div key={member.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-md">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="text-xs">
                                {member.name.split(' ').map(n => n[0]).join('')}
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
                
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => setViewingTeam(teams[0])}>
                    <Eye className="h-4 w-4" />
                    View Team Details
                  </Button>
                  <Button className="flex-1 gap-2" onClick={() => openInviteDialog(teams[0].id)}>
                    <UserPlus className="h-4 w-4" />
                    Invite Member
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
            />
          ))
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
    </AppShell>
  );
};

export default Teams;