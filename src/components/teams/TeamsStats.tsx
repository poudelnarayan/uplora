"use client";

import { Users, UserCheck, Crown, Mail } from "lucide-react";
import { Team } from "./TeamCard";

interface TeamsStatsProps {
  teams: Team[];
  currentUserEmail: string;
}

export default function TeamsStats({ teams, currentUserEmail }: TeamsStatsProps) {
  const totalActiveMembers = teams.reduce(
    (sum, team) => sum + team.members.filter(m => m.status !== "PAUSED").length, 
    0
  );
  
  const ownedTeamsCount = teams.filter(
    team => currentUserEmail?.toLowerCase() === team.ownerEmail?.toLowerCase()
  ).length;
  
  const pendingInvitesCount = teams.reduce(
    (sum, team) => sum + team.invitations.filter(inv => inv.status === "pending").length, 
    0
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="text-center p-6 rounded-lg" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
        <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
          <Users className="w-6 h-6 text-white" />
        </div>
        <div className="text-2xl font-bold" style={{ color: '#222831' }}>{teams.length}</div>
        <div className="text-sm" style={{ color: '#393E46' }}>Active Teams</div>
      </div>
      
      <div className="text-center p-6 rounded-lg" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
        <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#393E46' }}>
          <UserCheck className="w-6 h-6 text-white" />
        </div>
        <div className="text-2xl font-bold" style={{ color: '#222831' }}>
          {totalActiveMembers}
        </div>
        <div className="text-sm" style={{ color: '#393E46' }}>Total Members</div>
      </div>
      
      <div className="text-center p-6 rounded-lg" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
        <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#222831' }}>
          <Crown className="w-6 h-6 text-white" />
        </div>
        <div className="text-2xl font-bold" style={{ color: '#222831' }}>
          {ownedTeamsCount}
        </div>
        <div className="text-sm" style={{ color: '#393E46' }}>Teams You Own</div>
      </div>
      
      <div className="text-center p-6 rounded-lg" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
        <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
          <Mail className="w-6 h-6 text-white" />
        </div>
        <div className="text-2xl font-bold" style={{ color: '#222831' }}>
          {pendingInvitesCount}
        </div>
        <div className="text-sm" style={{ color: '#393E46' }}>Pending Invites</div>
      </div>
    </div>
  );
}
