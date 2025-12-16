"use client";

import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;
import { Users, Video, Eye } from 'lucide-react';

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

interface VideoAnalytics {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  averageWatchTime: number;
  uploadFrequency: number;
}

interface StatsCardsProps {
  teams: Team[];
  analytics: VideoAnalytics;
}

export default function StatsCards({ teams, analytics }: StatsCardsProps) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
    >
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active Teams</p>
            <p className="text-2xl font-bold text-foreground">{teams.length}</p>
          </div>
        </div>
      </div>
      
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Video className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Videos Uploaded</p>
            <p className="text-2xl font-bold text-foreground">{analytics.totalVideos}</p>
          </div>
        </div>
      </div>
      
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Eye className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Views</p>
            <p className="text-2xl font-bold text-foreground">{analytics.totalViews.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </MotionDiv>
  );
}
