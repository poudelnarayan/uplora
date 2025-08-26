"use client";

import { TrendingUp, Lightbulb } from "lucide-react";
import { Team } from "./TeamCard";

interface TeamsInsightsProps {
  teams: Team[];
}

export default function TeamsInsights({ teams }: TeamsInsightsProps) {
  const averageTeamSize = teams.length > 0 
    ? Math.round(teams.reduce((sum, team) => sum + team.members.length, 0) / teams.length)
    : 0;
  
  const mostActiveTeam = teams.sort((a, b) => b.members.length - a.members.length)[0];

  return (
    <div className="p-6 rounded-xl" style={{ backgroundColor: '#EEEEEE', border: `2px solid #00ADB5` }}>
      <h3 className="text-lg font-bold mb-4 flex items-center gap-3" style={{ color: '#222831' }}>
        <TrendingUp className="w-6 h-6" style={{ color: '#00ADB5' }} />
        Team Insights & Recommendations
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <h4 className="font-semibold" style={{ color: '#222831' }}>Team Performance</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span style={{ color: '#393E46' }}>Average team size</span>
              <span className="font-semibold" style={{ color: '#222831' }}>
                {averageTeamSize} members
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: '#393E46' }}>Most active team</span>
              <span className="font-semibold" style={{ color: '#222831' }}>
                {mostActiveTeam?.name || "N/A"}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2" style={{ color: '#222831' }}>
            <Lightbulb className="w-5 h-5" style={{ color: '#00ADB5' }} />
            Growth Tips
          </h4>
          <div className="space-y-2 text-sm" style={{ color: '#393E46' }}>
            {teams.length < 3 ? (
              <p>Consider creating specialized teams for different content types to improve collaboration and organization.</p>
            ) : (
              <p>Great job! Your teams are well organized. Consider inviting more members to scale your content production.</p>
            )}
            <p>Pro tip: Use role-based permissions to maintain quality control while enabling team growth.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
