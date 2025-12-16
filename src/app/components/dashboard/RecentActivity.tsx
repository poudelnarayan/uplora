"use client";

import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;
import { Users, Video, Mail } from 'lucide-react';

interface Activity {
  id: number;
  type: string;
  message: string;
  timestamp: Date;
  icon: React.ReactNode;
  color: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="mb-8"
    >
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <button className="btn btn-ghost text-sm">
            View All
          </button>
        </div>
        <div className="space-y-3">
          {activities.map((activity) => (
            <MotionDiv
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center ${activity.color}`}>
                {activity.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{activity.message}</p>
                <p className="text-xs text-muted-foreground">
                  {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </MotionDiv>
          ))}
        </div>
      </div>
    </MotionDiv>
  );
}
