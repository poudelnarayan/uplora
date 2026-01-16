import { motion } from "framer-motion";
import {
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  ChevronRight,
  Sparkles,
  User,
  Shield
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import { Separator } from "@/app/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { PlatformIcon, platformIcons } from "./PlatformIcon";

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
  role?: string;
  isOwner?: boolean;
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
      transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
      className="relative group"
    >
      {isDeleting && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-md z-20 flex items-center justify-center rounded-2xl">
          <div className="flex items-center gap-3 bg-card border border-border/50 rounded-xl px-6 py-4 shadow-2xl">
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
        className="h-full bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl border border-border/60 hover:border-border shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden relative group/card"
      >
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover/card:from-primary/5 group-hover/card:via-primary/3 group-hover/card:to-primary/5 transition-all duration-500 pointer-events-none" />
        
        {/* Glass morphism effect */}
        <div className="absolute inset-0 bg-white/0 dark:bg-white/0 group-hover/card:bg-white/[0.02] dark:group-hover/card:bg-white/[0.01] transition-all duration-500 pointer-events-none rounded-lg" />
        
        <CardHeader className="pb-6 pt-6 px-6 relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Icon with refined styling */}
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={`relative p-4 rounded-2xl bg-gradient-to-br ${team.color} text-white shadow-lg group-hover/card:shadow-xl transition-shadow duration-500 flex-shrink-0`}
              >
                <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                <Users className="h-6 w-6 relative z-10" />
              </motion.div>
              
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <CardTitle className="text-xl font-semibold tracking-tight text-foreground group-hover/card:text-foreground transition-colors duration-300">
                    {team.name}
                  </CardTitle>
                  {team.isOwner ? (
                    <Badge 
                      variant="outline" 
                      className="text-[10px] px-2 py-0.5 bg-primary/8 dark:bg-primary/12 text-primary border-primary/20 font-medium"
                    >
                      Owner
                    </Badge>
                  ) : (
                    <Badge 
                      variant="outline" 
                      className="text-[10px] px-2 py-0.5 bg-muted/50 text-muted-foreground border-border/50 font-medium"
                    >
                      Member
                    </Badge>
                  )}
                </div>
                
                <CardDescription className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {team.description || "No description"}
                </CardDescription>
                
                {/* Stats row */}
                <div className="flex items-center gap-4 pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span className="font-medium">{team.members_data.length}</span>
                    <span className="text-muted-foreground/70">members</span>
                  </div>
                  {team.platforms.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span className="font-medium">{team.platforms.length}</span>
                      <span className="text-muted-foreground/70">platforms</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {team.isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-muted/80 rounded-lg"
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
              )}
              
              {/* Chevron indicator */}
              <motion.div
                initial={{ x: -4, opacity: 0 }}
                whileHover={{ x: 0, opacity: 1 }}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </motion.div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-6 pb-6 space-y-5 relative z-10">
          {/* Platform Access Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Platform Access
              </span>
              {team.platforms.length > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-auto">
                  {team.platforms.length}
                </Badge>
              )}
            </div>
            
            {team.platforms.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {team.platforms.map((platform) => {
                  const Icon = platformIcons[platform as keyof typeof platformIcons];
                  return (
                    <motion.div
                      key={platform}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50/80 dark:bg-green-950/30 border border-green-200/60 dark:border-green-800/60 rounded-lg backdrop-blur-sm"
                    >
                      {Icon && <Icon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />}
                      <span className="text-xs font-medium text-green-700 dark:text-green-300 capitalize">
                        {platform}
                      </span>
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No platforms connected</p>
            )}
          </div>

          <Separator className="my-4" />

          {/* Team Members Preview */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Team Members
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-auto">
                {team.members_data.length}
              </Badge>
            </div>
            
            {team.members_data.length > 0 ? (
              <div className="space-y-2">
                {/* Show first 3 members */}
                {team.members_data.slice(0, 3).map((member) => (
                  <div key={member.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <Avatar className="h-7 w-7 border border-border/50">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate text-foreground">
                        {member.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {member.role}
                      </p>
                    </div>
                  </div>
                ))}
                {team.members_data.length > 3 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-dashed border-border/50">
                    <div className="flex -space-x-2">
                      {team.members_data.slice(3, 6).map((member) => (
                        <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground ml-2">
                      +{team.members_data.length - 3} more
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No members yet</p>
            )}
          </div>
          
          {/* View details hint */}
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Tap to view full details</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};