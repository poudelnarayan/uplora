import { motion } from "framer-motion";
import {
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import { Separator } from "@/app/components/ui/separator";
import { PlatformIcon } from "./PlatformIcon";

interface Team {
  id: number;
  backendId?: string;
  name: string;
  description: string;
  platforms: string[];
  members_data: Array<{
    id: string;
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
  onViewTeam: (team: Team) => void;
  isDeleting?: boolean;
}

export const TeamCard = ({ team, index, onEdit, onDelete, onViewTeam, isDeleting = false }: TeamCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative"
    >
      {isDeleting && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-3 bg-background border border-border rounded-lg px-6 py-4 shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Deleting team...</span>
          </div>
        </div>
      )}
      <Card
        role="button"
        tabIndex={0}
        onClick={() => onViewTeam(team)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onViewTeam(team);
          }
        }}
        className="h-full bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300 group cursor-pointer"
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${team.color} text-white shadow-lg`}>
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onEdit(team)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Team
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(team.id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
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

          <Separator />
        </CardContent>
      </Card>
    </motion.div>
  );
};