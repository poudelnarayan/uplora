"use client";

import { Users, Crown, TrendingUp, Lightbulb } from 'lucide-react';

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

interface TeamInsightsProps {
  teams: Team[];
}

export default function TeamInsights({ teams }: TeamInsightsProps) {
  const totalMembers = teams.reduce((sum, team) => sum + team.memberCount, 0);
  const ownedTeams = teams.filter(team => team.role === "OWNER").length;

  return (
    <div className="card p-6 mt-6">
      <h4 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        Team Insights
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-600">Total Members</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {totalMembers}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-green-600">Teams You Own</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {ownedTeams}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-600">Active Teams</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {teams.length}
          </p>
        </div>
      </div>
      
      {/* Team Recommendations */}
      <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
          <div>
            <h5 className="font-medium text-yellow-600 mb-1">Team Growth Tip</h5>
            <p className="text-sm text-muted-foreground">
              {teams.length < 3 
                ? "Consider creating specialized teams for different content types to improve collaboration."
                : "Great job! Your teams are well organized. Consider inviting more members to scale your content production."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
