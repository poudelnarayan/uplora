"use client";

import { Crown, Shield, Target, Edit3 } from "lucide-react";
import MemberActions from "./MemberActions";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "EDITOR";
  joinedAt: Date;
  status?: "ACTIVE" | "PAUSED";
}

interface TeamMembersListProps {
  members: TeamMember[];
  isOwner: boolean;
  teamId: string;
  teamName: string;
  onToggleMemberStatus: (teamId: string, memberId: string, memberName: string, currentStatus: string, teamName: string) => void;
  onRemoveMember: (teamId: string, memberId: string, teamName: string) => void;
}

export default function TeamMembersList({
  members,
  isOwner,
  teamId,
  teamName,
  onToggleMemberStatus,
  onRemoveMember
}: TeamMembersListProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "ADMIN":
        return <Shield className="w-4 h-4 text-blue-500" />;
      case "MANAGER":
        return <Target className="w-4 h-4 text-green-500" />;
      case "EDITOR":
        return <Edit3 className="w-4 h-4 text-purple-500" />;
      default:
        return <Edit3 className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="mb-6">
      <h4 className="text-sm lg:text-base font-semibold mb-3 lg:mb-4 text-foreground">
        Team Members ({members.length})
      </h4>
      <div className="space-y-2 lg:space-y-3">
        {members.map((member) => (
          <div 
            key={member.id} 
            className={`flex items-center justify-between p-2 lg:p-3 rounded-lg border ${
              member.role === "OWNER" 
                ? "bg-blue-500/10 border-blue-500/20" 
                : "bg-muted/50"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                <span className="text-sm font-medium text-white">
                  {member.name[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 max-w-full">
                <div className="min-w-0">
                  <p className="font-medium text-xs lg:text-sm text-foreground truncate">
                    {member.name}
                  </p>
                  <span className="text-[10px] lg:text-xs text-muted-foreground block truncate">
                    {member.email}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    member.role === "OWNER"
                      ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/20"
                      : member.role === "ADMIN"
                      ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20"
                      : member.role === "MANAGER"
                      ? "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/20"
                      : "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/20"
                  }`}>
                    {member.role === "OWNER" ? "Owner" : 
                     member.role === "ADMIN" ? "Admin" : 
                     member.role === "MANAGER" ? "Manager" : "Editor"}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    member.status === "PAUSED" 
                      ? "bg-gray-500/10 text-muted-foreground border-gray-400/20" 
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20"
                  }`}>
                    {member.status === "PAUSED" ? "Inactive" : "Active"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOwner && member.role !== "OWNER" && (
                <MemberActions
                  teamId={teamId}
                  memberId={member.id}
                  memberName={member.name}
                  currentStatus={member.status || "ACTIVE"}
                  teamName={teamName}
                  onToggleMemberStatus={onToggleMemberStatus}
                  onRemoveMember={onRemoveMember}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}