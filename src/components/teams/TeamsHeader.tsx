"use client";

import { Users, UserCheck, Plus } from "lucide-react";
import { Team } from "./TeamCard";

interface TeamsHeaderProps {
  teams: Team[];
  onCreateTeam: () => void;
}

export default function TeamsHeader({ teams, onCreateTeam }: TeamsHeaderProps) {
  const totalMembers = teams.reduce((sum, team) => sum + team.members.length, 0);

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#222831' }}>Team Management</h1>
        <p className="text-lg" style={{ color: '#393E46' }}>
          Manage your collaborative workspaces and team members
        </p>
        <div className="flex items-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: '#00ADB5' }} />
            <span className="text-sm font-medium" style={{ color: '#393E46' }}>
              {teams.length} Teams
            </span>
          </div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" style={{ color: '#00ADB5' }} />
            <span className="text-sm font-medium" style={{ color: '#393E46' }}>
              {totalMembers} Total Members
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onCreateTeam}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-lg transition-all hover:scale-105 shadow-lg"
          style={{ 
            backgroundColor: '#00ADB5', 
            color: 'white'
          }}
        >
          <Plus className="w-5 h-5" />
          Create New Team
        </button>
      </div>
    </div>
  );
}
