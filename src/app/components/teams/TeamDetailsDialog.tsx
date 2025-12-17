import {
  Users,
  UserX,
  Settings,
  Edit,
  UserPlus,
  X,
  Shield,
  Clock,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Plus,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Separator } from "@/app/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { PlatformIcon, platformIcons } from "./PlatformIcon";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
  platforms: string[];
}

interface Team {
  id: number;
  name: string;
  description: string;
  platforms: string[];
  members_data: TeamMember[];
  color: string;
}

interface TeamDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  onRemoveMember: (teamId: number, memberId: number) => void;
  onEditTeam: (team: Team) => void;
  onInviteMember: (teamId: number) => void;
  onUpdateTeam: (teamId: number, updates: Partial<Team>) => void;
}

const roleColors = {
  admin: "bg-red-100 text-red-800 border-red-200",
  manager: "bg-blue-100 text-blue-800 border-blue-200", 
  editor: "bg-green-100 text-green-800 border-green-200",
  viewer: "bg-gray-100 text-gray-800 border-gray-200"
};

export const TeamDetailsDialog = ({ 
  isOpen, 
  onClose, 
  team, 
  onRemoveMember,
  onEditTeam,
  onInviteMember,
  onUpdateTeam
}: TeamDetailsDialogProps) => {
  const { toast } = useToast();

  const handleRemoveMember = (memberId: number, memberName: string) => {
    if (team) {
      onRemoveMember(team.id, memberId);
      toast({
        title: "Member Removed",
        description: `${memberName} has been removed from ${team.name}`
      });
    }
  };

  const handleRemovePlatform = (platform: string) => {
    if (team) {
      const updatedPlatforms = team.platforms.filter(p => p !== platform);
      onUpdateTeam(team.id, { platforms: updatedPlatforms });
      toast({
        title: "Platform Removed ✨",
        description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} access removed from ${team.name}`,
        variant: "default"
      });
    }
  };

  const handleAddPlatform = (platform: string) => {
    if (team && !team.platforms.includes(platform)) {
      const updatedPlatforms = [...team.platforms, platform];
      onUpdateTeam(team.id, { platforms: updatedPlatforms });
      toast({
        title: "Platform Added! 🚀",
        description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} access granted to ${team.name}`,
        variant: "default"
      });
    }
  };

  if (!team) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-xl border border-border/50">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl bg-gradient-to-r ${team.color} text-white shadow-2xl ring-4 ring-white/20`}>
                <Users className="h-7 w-7" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {team.name}
                </DialogTitle>
                <DialogDescription className="text-lg mt-2 text-muted-foreground">
                  {team.description}
                </DialogDescription>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="gap-2 hover:scale-105 transition-transform" onClick={() => onEditTeam(team)}>
                <Edit className="h-4 w-4" />
                Edit Team
              </Button>
              <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-transform shadow-lg" onClick={() => onInviteMember(team.id)}>
                <UserPlus className="h-4 w-4" />
                Invite Member
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8 py-6">

          {/* Platform Access */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Platform Access</h3>
              <Link href="/social">
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <LinkIcon className="h-3 w-3" />
                  Connect Platforms
                </Button>
              </Link>
            </div>

            {/* Connected Platforms */}
            {team.platforms.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Team has access to these platforms</p>
                <div className="flex flex-wrap gap-1.5">
                  {team.platforms.map((platform) => (
                    <div key={platform} className="relative group">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md text-xs font-medium text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                        {(() => {
                          const Icon = platformIcons[platform as keyof typeof platformIcons];
                          return <Icon className="h-3.5 w-3.5" />;
                        })()}
                        <span className="capitalize">{platform}</span>
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -top-1.5 -right-1.5 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full"
                        onClick={() => handleRemovePlatform(platform)}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="text-center py-8 border-dashed">
                <CardContent>
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-muted">
                      <LinkIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">No platforms added yet</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Connect your social media accounts to give this team access
                      </p>
                      <Link href="/social">
                        <Button size="sm" className="gap-2">
                          <LinkIcon className="h-3 w-3" />
                          Connect Platforms
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Add - Show available platforms */}
            {team.platforms.length > 0 && Object.keys(platformIcons).filter(platform => !team.platforms.includes(platform)).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Add More Platforms</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(platformIcons).filter(platform => !team.platforms.includes(platform)).slice(0, 6).map((platform) => (
                    <div
                      key={platform}
                      className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 hover:bg-muted border border-dashed border-muted-foreground/30 hover:border-primary/50 rounded-md cursor-pointer transition-colors text-xs font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => handleAddPlatform(platform)}
                    >
                      {(() => {
                        const Icon = platformIcons[platform as keyof typeof platformIcons];
                        return <Icon className="h-3 w-3" />;
                      })()}
                      <span className="capitalize">{platform}</span>
                      <Plus className="h-2.5 w-2.5 opacity-50" />
                    </div>
                  ))}
                  {Object.keys(platformIcons).filter(platform => !team.platforms.includes(platform)).length > 6 && (
                    <div className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground">
                      +{Object.keys(platformIcons).filter(platform => !team.platforms.includes(platform)).length - 6} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Team Members */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Team Members</h3>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-medium">
                {team.members_data.length} members
              </Badge>
            </div>

            {team.members_data.length === 0 ? (
              <Card className="text-center py-4 border-dashed">
                <CardContent>
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <h4 className="text-sm font-medium">No members yet</h4>
                      <p className="text-xs text-muted-foreground">Invite team members to get started</p>
                    </div>
                    <Button onClick={() => onInviteMember(team.id)} size="sm" className="mt-1">
                      <UserPlus className="h-3 w-3 mr-1" />
                      Invite Member
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {team.members_data.map((member) => (
                  <Card key={member.id} className="group hover:shadow-sm transition-shadow border-border/50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-muted text-xs">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{member.name}</span>
                              <Badge variant="outline" className="text-xs px-1.5 py-0">
                                {member.role}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {member.platforms.slice(0, 3).map((platform) => {
                                const Icon = platformIcons[platform as keyof typeof platformIcons] || Users;
                                return (
                                  <div key={platform} className="h-4 w-4 rounded-sm bg-muted flex items-center justify-center">
                                    <Icon className="h-2.5 w-2.5 text-muted-foreground" />
                                  </div>
                                );
                              })}
                              {member.platforms.length > 3 && (
                                <div className="h-4 w-4 rounded-sm bg-muted flex items-center justify-center">
                                  <span className="text-xs">+{member.platforms.length - 3}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={() => handleRemoveMember(member.id, member.name)}
                        >
                          <UserX className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};