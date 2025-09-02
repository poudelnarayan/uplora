import { motion } from "framer-motion";
import { 
  Users, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  UserPlus
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { PlatformIcon } from "./PlatformIcon";

interface Team {
  id: number;
  backendId?: string;
  name: string;
  description: string;
  platforms: string[];
  members_data: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    avatar: string;
    platforms: string[];
  }>;
  color: string;
}

interface TeamCardProps {
  team: Team;
  index: number;
  onEdit: (team: Team) => void;
  onDelete: (teamId: number) => void;
  onInviteMember: (teamId: number) => void;
  onViewTeam: (team: Team) => void;
}

export const TeamCard = ({ team, index, onEdit, onDelete, onInviteMember, onViewTeam }: TeamCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300 group">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${team.color} text-white shadow-lg`}>
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {team.name}
                </CardTitle>
                <CardDescription className="text-sm">
                  {team.members_data.length} member{team.members_data.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(team)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Team
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onInviteMember(team.id)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(team.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Team
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {team.description}
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Platform Access</span>
              <Badge variant="outline" className="text-xs">
                {team.platforms.length} platform{team.platforms.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {team.platforms.map((platform) => (
                <PlatformIcon key={platform} platform={platform} />
              ))}
            </div>
          </div>
          
          {team.members_data && team.members_data.length > 0 && (
            <div className="space-y-3">
              <span className="text-sm font-medium">Team Members</span>
              <div className="flex -space-x-2">
                {team.members_data.slice(0, 4).map((member) => (
                  <Avatar key={member.id} className="border-2 border-background h-8 w-8">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="text-xs bg-muted">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {team.members_data.length > 4 && (
                  <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                    <span className="text-xs font-medium">+{team.members_data.length - 4}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <Separator />
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 gap-2" onClick={() => onViewTeam(team)}>
              <Eye className="h-4 w-4" />
              View Team
            </Button>
            <Button size="sm" className="flex-1 gap-2" onClick={() => onInviteMember(team.id)}>
              <UserPlus className="h-4 w-4" />
              Add Member
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};