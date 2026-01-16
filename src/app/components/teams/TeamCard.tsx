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
  Shield,
  Calendar,
  Activity,
  TrendingUp,
  CheckCircle2
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
        
        <CardContent className="px-6 pb-6 space-y-6 relative z-10">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 border border-blue-200/50 dark:border-blue-800/30">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                  Members
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {team.members_data.length}
              </p>
            </div>
            
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10 border border-green-200/50 dark:border-green-800/30">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">
                  Platforms
                </span>
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {team.platforms.length}
              </p>
            </div>
          </div>

          {/* Platform Access Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Connected Platforms
              </span>
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
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50/80 dark:bg-green-950/30 border border-green-200/60 dark:border-green-800/60 rounded-lg backdrop-blur-sm shadow-sm"
                    >
                      {Icon && <Icon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />}
                      <span className="text-xs font-medium text-green-700 dark:text-green-300 capitalize">
                        {platform}
                      </span>
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-muted/30 border border-dashed border-border/50 text-center">
                <p className="text-xs text-muted-foreground">No platforms connected yet</p>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Team Members Preview */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Team Members
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-auto">
                {team.members_data.length}
              </Badge>
            </div>
            
            {team.members_data.length > 0 ? (
              <div className="space-y-2">
                {/* Show first 4 members with more details */}
                {team.members_data.slice(0, 4).map((member) => (
                  <motion.div
                    key={member.id}
                    whileHover={{ x: 2 }}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all border border-transparent hover:border-border/30"
                  >
                    <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate text-foreground">
                          {member.name}
                        </p>
                        {member.role === "OWNER" && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                            Owner
                          </Badge>
                        )}
                        {member.role === "ADMIN" && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate capitalize">
                        {member.role.toLowerCase()}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {team.members_data.length > 4 && (
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border border-dashed border-border/50">
                    <div className="flex -space-x-2">
                      {team.members_data.slice(4, 8).map((member) => (
                        <Avatar key={member.id} className="h-7 w-7 border-2 border-background shadow-sm">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground ml-2">
                      +{team.members_data.length - 4} more members
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-muted/30 border border-dashed border-border/50 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">No members yet</p>
              </div>
            )}
          </div>
          
          {/* View details hint */}
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Activity className="h-3.5 w-3.5" />
                <span>Tap to view full details</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};