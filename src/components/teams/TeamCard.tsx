"use client";

import { motion } from 'framer-motion';
import { Users, Crown, Shield, Target, Edit, Mail, Settings, ChevronRight } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  description: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "EDITOR";
  owner: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
  memberCount: number;
  createdAt: string;
}

interface TeamCardProps {
  team: Team;
  viewMode: "grid" | "list";
  onInviteMember: () => void;
}

export default function TeamCard({ team, viewMode, onInviteMember }: TeamCardProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "ADMIN":
        return <Shield className="w-4 h-4 text-blue-500" />;
      case "MANAGER":
        return <Target className="w-4 h-4 text-green-500" />;
      case "EDITOR":
        return <Edit className="w-4 h-4 text-purple-500" />;
      default:
        return <Users className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className={`card p-6 hover:glow transition-all duration-300 ${viewMode === "list" ? "flex items-center justify-between" : ""}`}
    >
      <div className={viewMode === "list" ? "flex items-center gap-4" : ""}>
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div className={viewMode === "list" ? "flex-1" : ""}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="font-semibold mb-1 text-foreground">{team.name}</h4>
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {team.description}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {getRoleIcon(team.role)}
                  <span className="text-xs text-muted-foreground capitalize">{team.role.toLowerCase()}</span>
                </div>
              </div>
            </div>
            {viewMode === "grid" && (
              <div className="flex gap-2">
                <button
                  onClick={onInviteMember}
                  className="btn btn-ghost p-2"
                  title="Invite member"
                >
                  <Mail className="w-4 h-4" />
                </button>
                <button
                  className="btn btn-ghost p-2"
                  title="Team settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {viewMode === "list" && (
        <div className="flex items-center gap-2">
          <button
            onClick={onInviteMember}
            className="btn btn-ghost p-2"
            title="Invite member"
          >
            <Mail className="w-4 h-4" />
          </button>
          <button
            className="btn btn-ghost p-2"
            title="Team settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </motion.div>
  );
}
