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
  teams?: Team[];
}

export default function TeamInsights({ teams }: TeamInsightsProps) {
  const list = Array.isArray(teams) ? teams : [];
  const totalMembers = list.reduce((sum, team) => sum + team.memberCount, 0);
  const ownedTeams = list.filter(team => team.role === "OWNER").length;

  return (
    <div 
      className="p-6 mt-6 rounded-lg border"
      style={{ 
        backgroundColor: 'rgb(238, 238, 238)', 
        borderColor: 'rgb(57, 62, 70)',
        color: 'rgb(34, 40, 49)'
      }}
    >
      <h4 className="font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" style={{ color: 'rgb(0, 173, 181)' }} />
        Team Insights
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: 'rgb(238, 238, 238)', 
            borderColor: 'rgb(0, 173, 181)'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4" style={{ color: 'rgb(0, 173, 181)' }} />
            <span className="text-sm font-medium" style={{ color: 'rgb(0, 173, 181)' }}>Total Members</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'rgb(0, 173, 181)' }}>
            {totalMembers}
          </p>
        </div>
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: 'rgb(238, 238, 238)', 
            borderColor: 'rgb(57, 62, 70)'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4" style={{ color: 'rgb(57, 62, 70)' }} />
            <span className="text-sm font-medium" style={{ color: 'rgb(57, 62, 70)' }}>Teams You Own</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'rgb(57, 62, 70)' }}>
            {ownedTeams}
          </p>
        </div>
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: 'rgb(238, 238, 238)', 
            borderColor: 'rgb(34, 40, 49)'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4" style={{ color: 'rgb(34, 40, 49)' }} />
            <span className="text-sm font-medium" style={{ color: 'rgb(34, 40, 49)' }}>Active Teams</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'rgb(34, 40, 49)' }}>
            {list.length}
          </p>
        </div>
      </div>
      
      {/* Team Recommendations */}
      <div 
        className="mt-6 p-4 rounded-lg border"
        style={{ 
          backgroundColor: 'rgb(238, 238, 238)', 
          borderColor: 'rgb(0, 173, 181)'
        }}
      >
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 mt-0.5" style={{ color: 'rgb(0, 173, 181)' }} />
          <div>
            <h5 className="font-medium mb-1" style={{ color: 'rgb(0, 173, 181)' }}>Team Growth Tip</h5>
            <p className="text-sm" style={{ color: 'rgb(57, 62, 70)' }}>
              {list.length < 3 
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
