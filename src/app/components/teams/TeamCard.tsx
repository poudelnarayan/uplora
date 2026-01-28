import { motion } from "framer-motion";
import {
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  ChevronRight,
  Sparkles,
  Shield,
  Activity,
  CheckCircle2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Separator } from "@/app/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { platformIcons } from "./PlatformIcon";

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

export const TeamCard = ({
  team,
  index,
  onEdit,
  onDelete,
  onViewTeam,
  isDeleting = false,
}: TeamCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="relative h-full"
    >
      {isDeleting && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/90 backdrop-blur rounded-xl">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      <Card
        role="button"
        tabIndex={0}
        onClick={() => onViewTeam(team)}
        className="
          h-full flex flex-col
          bg-gradient-to-br from-card via-card/95 to-card/90
          border border-border/60
          hover:shadow-xl transition-shadow
          cursor-pointer
        "
      >
        {/* HEADER */}
        <CardHeader className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4 min-w-0">
              <div
                className={`p-4 rounded-2xl bg-gradient-to-br ${team.color} text-white`}
              >
                <Users className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="truncate">{team.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {team.isOwner ? "Owner" : "Member"}
                  </Badge>
                </div>

                <CardDescription className="line-clamp-2">
                  {team.description || "No description"}
                </CardDescription>
              </div>
            </div>

            {team.isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(team)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(team.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        {/* CONTENT */}
        <CardContent className="px-6 pb-6 flex-1 flex flex-col gap-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Members" value={team.members_data.length} />
            <Stat label="Platforms" value={team.platforms.length} />
          </div>

          {/* Platforms */}
          <div className="flex flex-wrap gap-2">
            {team.platforms.slice(0, 4).map((p) => {
              const Icon = platformIcons[p as keyof typeof platformIcons];
              return (
                <span
                  key={p}
                  className="inline-flex items-center gap-2 px-3 py-1.5
                  text-xs rounded-full bg-primary/10 text-primary"
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  {p}
                  <CheckCircle2 className="h-3 w-3" />
                </span>
              );
            })}
          </div>

          <Separator />

          {/* Members preview */}
          <div className="space-y-2">
            {team.members_data.slice(0, 3).map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={m.avatar} />
                  <AvatarFallback>{m.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.role.toLowerCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Button variant="secondary" className="mt-auto w-full">
            View Team
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg bg-muted/40 p-4">
    <p className="text-2xl font-semibold">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);
