"use client";

import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  Users, 
  BarChart3, 
  Calendar 
} from 'lucide-react';
import { useNotifications } from '@/components/ui/Notification';

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

interface QuickActionsProps {
  teams: Team[];
}

export default function QuickActions({ teams }: QuickActionsProps) {
  const router = useRouter();
  const notifications = useNotifications();

  const quickActions = [
    {
      id: "upload",
      title: "Upload Video",
      description: "Share your latest content",
      icon: <Upload className="w-5 h-5" />,
      action: () => router.push('/upload'),
      color: "from-blue-500 to-purple-600"
    },
    {
      id: "invite",
      title: "Invite Member",
      description: "Grow your team",
      icon: <Users className="w-5 h-5" />,
      action: () => {
        if (teams.length > 0) {
          router.push('/teams');
        } else {
          router.push('/teams/create');
        }
      },
      color: "from-green-500 to-emerald-600"
    },
    {
      id: "analytics",
      title: "View Analytics",
      description: "Track your performance",
      icon: <BarChart3 className="w-5 h-5" />,
      action: () => router.push('/analytics'),
      color: "from-orange-500 to-red-600"
    },
    {
      id: "schedule",
      title: "Schedule Upload",
      description: "Plan your content",
      icon: <Calendar className="w-5 h-5" />,
      action: () => {
        notifications.addNotification({
          type: "info",
          title: "Coming Soon!",
          message: "Content scheduling will be available soon"
        });
      },
      color: "from-purple-500 to-pink-600"
    }
  ];

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
    >
      {quickActions.map((action) => (
        <motion.button
          key={action.id}
          onClick={action.action}
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="card p-4 text-center hover:glow transition-all duration-300"
        >
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${action.color} mx-auto mb-3 flex items-center justify-center`}>
            {action.icon}
          </div>
          <h4 className="font-semibold text-sm mb-1">{action.title}</h4>
          <p className="text-xs text-muted-foreground">{action.description}</p>
        </motion.button>
      ))}
    </MotionDiv>
  );
}
